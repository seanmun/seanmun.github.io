// File: src/app/api/vault/route.ts
// Purpose: The doorman. Answers are checked here, never in the browser.
//   POST { step: 'password', answer }          → { next: 'wine', ticket } | { slam }
//   POST { step: 'wine', answer, ticket }      → { ok } + pass cookie     | { slam }
//   DELETE                                     → lock up (clear the pass)
// Every knock is counted per hashed IP (see lib/rate-limit) and getting all
// the way in resets the count; too many and the doorman stops answering for a
// while.

import { NextResponse } from 'next/server';
import { clearRateLimit, takeRateLimit, type RateLimit } from '@/lib/rate-limit';
import {
  VAULT_COOKIE, checkPassword, checkWine, issueTicket, passCookie, vaultConfigured, verifyTicket,
} from '@/lib/vault';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DOOR_LIMIT: RateLimit = { collection: 'vault_attempts', max: 8, windowMs: 15 * 60 * 1000 };

export async function POST(request: Request) {
  if (!vaultConfigured()) {
    console.error('VAULT_PASSWORD is not configured');
    return NextResponse.json({ error: 'The door is not set up yet' }, { status: 500 });
  }

  let body: { step?: unknown; answer?: unknown; ticket?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const limit = await takeRateLimit(request, DOOR_LIMIT);
  if (!limit.allowed) {
    return NextResponse.json({ tired: limit.retryMinutes }, { status: 429 });
  }

  const slam = (reason: 'password' | 'wine') => NextResponse.json({ slam: reason });

  if (body.step === 'password') {
    if (!checkPassword(body.answer)) return slam('password');
    return NextResponse.json({ next: 'wine', ticket: issueTicket() });
  }

  if (body.step === 'wine') {
    // The wine only counts straight after the right password
    if (!verifyTicket(body.ticket)) return slam('password');
    if (!checkWine(body.answer)) return slam('wine');
    await clearRateLimit(DOOR_LIMIT, limit.key);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(passCookie());
    return response;
  }

  return NextResponse.json({ error: 'Invalid step' }, { status: 400 });
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({ name: VAULT_COOKIE, value: '', path: '/', maxAge: 0 });
  return response;
}
