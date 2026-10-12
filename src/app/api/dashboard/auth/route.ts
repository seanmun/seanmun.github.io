// File: src/app/api/dashboard/auth/route.ts
// Purpose: Log in to / out of the analytics dashboard. The password is
// compared on the server, so it never reaches the browser bundle, and
// failed attempts are rate limited per IP — serverless instances don't
// share memory, so the counter lives in Firestore.

import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { checkPassword, createSessionCookie, DASHBOARD_COOKIE } from '@/lib/dashboard-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_ATTEMPTS = 8;
const WINDOW_MS = 15 * 60 * 1000;

// Keyed by a hash of the IP: enough to count attempts, never the address itself
function clientKey(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';
  return createHash('sha256').update(ip).digest('hex').slice(0, 32);
}

export async function POST(request: Request) {
  if (!process.env.DASHBOARD_PASSWORD) {
    console.error('DASHBOARD_PASSWORD is not configured');
    return NextResponse.json({ error: 'Dashboard is not configured' }, { status: 500 });
  }

  let body: { password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const attemptRef = db.collection('dashboard_attempts').doc(clientKey(request));

  // The lockout is checked BEFORE the password. If the right password still
  // worked during a lockout, an attacker could keep guessing straight through
  // it — wrong guesses would get "too many attempts", the right one would get
  // in, and the lockout would only change the error message. The cost: eight
  // typos in 15 minutes means waiting out the window. A database hiccup skips
  // the lockout check rather than locking everyone out — it never lets a wrong
  // password in.
  let failures = 0;
  let windowStart = 0;
  try {
    const record = (await attemptRef.get()).data();
    windowStart = record?.windowStart ?? 0;
    failures = Date.now() - windowStart < WINDOW_MS ? record?.failures ?? 0 : 0;
  } catch (err) {
    console.error('Login rate-limit lookup failed:', err);
  }

  if (failures >= MAX_ATTEMPTS) {
    const minutes = Math.max(1, Math.ceil((WINDOW_MS - (Date.now() - windowStart)) / 60000));
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.` },
      { status: 429 }
    );
  }

  if (checkPassword(body.password)) {
    await attemptRef.delete().catch(() => {});
    const response = NextResponse.json({ ok: true });
    response.cookies.set(createSessionCookie());
    return response;
  }

  await attemptRef
    .set({ failures: failures + 1, windowStart: failures === 0 ? Date.now() : windowStart }, { merge: true })
    .catch((err) => console.error('Login rate-limit bookkeeping failed:', err));

  return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({ name: DASHBOARD_COOKIE, value: '', path: '/', maxAge: 0 });
  return response;
}
