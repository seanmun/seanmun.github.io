// File: src/app/api/vault/route.ts
// Purpose: The doorman. Answers are checked here, never in the browser.
//   POST { step: 'password', answer }          → { next: 'wine', ticket } | { slam }
//   POST { step: 'wine', answer, ticket }      → { ok } + pass cookie     | { slam }
//   DELETE                                     → lock up (clear the pass)
// Wrong answers are counted per hashed IP in Firestore (serverless instances
// share no memory); too many and the doorman stops answering for a while.

import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import {
  VAULT_COOKIE, checkPassword, checkWine, issueTicket, passCookie, vaultConfigured, verifyTicket,
} from '@/lib/vault';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FAILURES = 8;
const WINDOW_MS = 15 * 60 * 1000;

function clientKey(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? 'unknown';
  return createHash('sha256').update(`vault:${ip}`).digest('hex').slice(0, 32);
}

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

  const attempts = db.collection('vault_attempts').doc(clientKey(request));
  let failures = 0;
  let windowStart = 0;
  try {
    const record = (await attempts.get()).data();
    windowStart = record?.windowStart ?? 0;
    failures = Date.now() - windowStart < WINDOW_MS ? record?.failures ?? 0 : 0;
  } catch (err) {
    console.error('Vault attempt lookup failed:', err);
  }
  if (failures >= MAX_FAILURES) {
    const minutes = Math.max(1, Math.ceil((WINDOW_MS - (Date.now() - windowStart)) / 60000));
    return NextResponse.json({ tired: minutes }, { status: 429 });
  }

  const slam = async (reason: 'password' | 'wine') => {
    await attempts
      .set({ failures: failures + 1, windowStart: failures === 0 ? Date.now() : windowStart }, { merge: true })
      .catch(() => {});
    return NextResponse.json({ slam: reason });
  };

  if (body.step === 'password') {
    if (!checkPassword(body.answer)) return slam('password');
    return NextResponse.json({ next: 'wine', ticket: issueTicket() });
  }

  if (body.step === 'wine') {
    // The wine only counts straight after the right password
    if (!verifyTicket(body.ticket)) return slam('password');
    if (!checkWine(body.answer)) return slam('wine');
    await attempts.delete().catch(() => {});
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
