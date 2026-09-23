import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    let body: Record<string, unknown>;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
    }

    if (typeof body !== 'object' || body === null) {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const { name, email, subject, message } = body as {
      name?: unknown;
      email?: unknown;
      subject?: unknown;
      message?: unknown;
    };

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required.' },
        { status: 400 }
      );
    }

    const clean = (s: string) => String(s).replace(/<[^>]*>/g, '').trim();
    const safeName = clean(String(name));
    const safeEmail = clean(String(email));
    const safeSubject = clean(String(subject || 'General Inquiry'));
    const safeMessage = clean(String(message));

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(safeEmail)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }

    const smtpHost = process.env.SMTP_HOST?.trim();
    const smtpUser = process.env.SMTP_USER?.trim();
    const smtpPass = process.env.SMTP_PASS?.trim();
    const smtpPort = Number(process.env.SMTP_PORT) || 465;

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.info('[Contact Form] SMTP not configured. Message received:', {
        name: safeName,
        email: safeEmail,
        subject: safeSubject,
        message: safeMessage,
      });
      return NextResponse.json({ message: 'Message received. SMTP not configured.' }, { status: 200 });
    }

    const nodemailer = (await import('nodemailer')).default;
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      requireTLS: true,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    await transporter.verify();

    await transporter.sendMail({
      from: `"Driver Info Hub" <${smtpUser}>`,
      replyTo: safeEmail,
      to: process.env.CONTACT_TO || smtpUser,
      subject: `Contact Form: ${safeSubject}`,
      text: `Name: ${safeName}\nEmail: ${safeEmail}\nSubject: ${safeSubject}\n\nMessage:\n${safeMessage}`,
      html: `
        <h2 style="font-family:sans-serif">New Contact Form Submission</h2>
        <table style="font-family:sans-serif;font-size:15px;border-collapse:collapse">
          <tr><td style="padding:6px 16px 6px 0;font-weight:700">Name</td><td>${safeName}</td></tr>
          <tr><td style="padding:6px 16px 6px 0;font-weight:700">Email</td><td>${safeEmail}</td></tr>
          <tr><td style="padding:6px 16px 6px 0;font-weight:700">Subject</td><td>${safeSubject}</td></tr>
        </table>
        <hr/>
        <p style="font-family:sans-serif;white-space:pre-wrap">${safeMessage}</p>
      `,
    });

    return NextResponse.json({ message: 'Message sent successfully.' }, { status: 200 });
  } catch (error) {
    console.error('[Contact API] Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Something went wrong while sending the message.', details: message },
      { status: 500 }
    );
  }
}
