import { NextResponse } from 'next/server';

// Allowed origins
const ALLOWED_ORIGINS = [
  'https://driverinfohub.com',
  'https://www.driverinfohub.com'
];

// Get CORS headers based on request origin
function getCorsHeaders(origin: string | null) {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// Handle CORS preflight request
export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      ...getCorsHeaders(origin),
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function POST(request: Request) {
  try {
    let body: Record<string, unknown>;

    const origin = request.headers.get('origin');
    const corsHeaders = getCorsHeaders(origin);

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload.' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (typeof body !== 'object' || body === null) {
      return NextResponse.json(
        { error: 'Invalid request body.' },
        { status: 400, headers: corsHeaders }
      );
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
        { status: 400, headers: corsHeaders }
      );
    }

    const clean = (s: string) => String(s).replace(/<[^>]*>/g, '').trim();
    const safeName = clean(String(name));
    const safeEmail = clean(String(email));
    const safeSubject = clean(String(subject || 'General Inquiry'));
    const safeMessage = clean(String(message));

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(safeEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address.' },
        { status: 400, headers: corsHeaders }
      );
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
      return NextResponse.json(
        { message: 'Message received. SMTP not configured.' },
        { status: 200, headers: corsHeaders }
      );
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

    return NextResponse.json(
      { message: 'Message sent successfully.' },
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error('[Contact API] Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    const origin = request.headers.get('origin');
    
    return NextResponse.json(
      { error: 'Something went wrong while sending the message.', details: message },
      {
        status: 500,
        headers: getCorsHeaders(origin),
      }
    );
  }
}
