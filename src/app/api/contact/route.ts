// File: src/app/api/contact/route.ts
// Purpose: Receives Work-with-me inquiries and forwards them via Resend

import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { takeRateLimit, type RateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

// Enough for a real person to resend or follow up, not enough to flood the inbox
const SEND_LIMIT: RateLimit = { collection: 'contact_attempts', max: 5, windowMs: 60 * 60 * 1000 };

const MAX_LENGTHS = { name: 100, email: 200, projectType: 50, message: 5000 };

const INQUIRY_RECIPIENT = 'sean.munley@protonmail.com';

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const text = (value: unknown) => (typeof value === 'string' ? value : '');
  const name = text(body.name);
  const email = text(body.email);
  const projectType = text(body.projectType);
  const message = text(body.message);
  const company = text(body.company);

  // Honeypot: real visitors never fill the hidden "company" field
  if (company) {
    return NextResponse.json({ ok: true });
  }

  if (!name.trim() || !email.trim() || !message.trim()) {
    return NextResponse.json({ error: 'Name, email, and message are required' }, { status: 400 });
  }
  if (
    name.length > MAX_LENGTHS.name ||
    email.length > MAX_LENGTHS.email ||
    projectType.length > MAX_LENGTHS.projectType ||
    message.length > MAX_LENGTHS.message
  ) {
    return NextResponse.json({ error: 'Message too long' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  // Counted only once the form is valid, so fixing a typo doesn't use up a send
  const limit = await takeRateLimit(request, SEND_LIMIT);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many messages. Try again in ${limit.retryMinutes} minutes, or email me directly.` },
      { status: 429 }
    );
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not configured');
    return NextResponse.json({ error: 'Contact form is not configured' }, { status: 500 });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: 'Portfolio Inquiry <inquiries@seanmun.com>',
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
