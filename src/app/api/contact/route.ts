// File: src/app/api/contact/route.ts
// Purpose: Receives Work-with-me inquiries and forwards them via Resend

import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const MAX_LENGTHS = { name: 100, email: 200, projectType: 50, message: 5000 };

// Resend testing mode only delivers to the account owner's address. To route
// inquiries elsewhere (e.g. protonmail), verify seanmun.com at
// resend.com/domains and switch `from` to that domain.
const INQUIRY_RECIPIENT = 'smunley13@gmail.com';

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { name, email, projectType, message, company } = body as Record<string, string>;

  // Honeypot: real visitors never fill the hidden "company" field
  if (company) {
    return NextResponse.json({ ok: true });
  }

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'Name, email, and message are required' }, { status: 400 });
  }
  if (
    name.length > MAX_LENGTHS.name ||
    email.length > MAX_LENGTHS.email ||
    (projectType?.length ?? 0) > MAX_LENGTHS.projectType ||
    message.length > MAX_LENGTHS.message
  ) {
    return NextResponse.json({ error: 'Message too long' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not configured');
    return NextResponse.json({ error: 'Contact form is not configured' }, { status: 500 });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      // Swap for a verified seanmun.com sender once the domain is set up in Resend
      from: 'Portfolio Inquiry <onboarding@resend.dev>',
      to: INQUIRY_RECIPIENT,
      replyTo: email,
      subject: `New project inquiry from ${name}${projectType ? ` — ${projectType}` : ''}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        projectType ? `Project type: ${projectType}` : null,
        '',
        message,
      ]
        .filter((line) => line !== null)
        .join('\n'),
    });
    if (error) {
      console.error('Resend rejected the send:', error);
      return NextResponse.json(
        { error: 'Failed to send. Please email me directly.' },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Failed to send contact email:', err);
    return NextResponse.json({ error: 'Failed to send. Please email me directly.' }, { status: 500 });
  }
}
