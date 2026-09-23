import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    {
      status: 'running',
      message: 'Driver Info Hub Backend API is running successfully',
      timestamp: new Date().toISOString(),
      endpoints: {
        root: '/',
        contact: '/api/contact'
      }
    },
    { status: 200 }
  );
}

export default function Home() {
  return null;
}
