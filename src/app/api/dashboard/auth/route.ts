// File: src/app/api/dashboard/auth/route.ts
// Purpose: Log in to / out of the analytics dashboard. The password is
// compared on the server, so it never reaches the browser bundle, and
// attempts are rate limited per IP (see lib/rate-limit).

import { NextResponse } from 'next/server';
import { clearRateLimit, takeRateLimit, type RateLimit } from '@/lib/rate-limit';
import { checkPassword, createSessionCookie, DASHBOARD_COOKIE } from '@/lib/dashboard-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LOGIN_LIMIT: RateLimit = { collection: 'dashboard_attempts', max: 8, windowMs: 15 * 60 * 1000 };

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

  // Every attempt is counted BEFORE the password is checked, and a correct
  // password resets the count. If the right password still worked during a
  // lockout, an attacker could keep guessing straight through it. The cost:
  // eight typos in 15 minutes means waiting out the window.
  const limit = await takeRateLimit(request, LOGIN_LIMIT);
  if (!limit.allowed) {
    const minutes = limit.retryMinutes;
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.` },
      { status: 429 }
    );
  }

  if (checkPassword(body.password)) {
    await clearRateLimit(LOGIN_LIMIT, limit.key);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(createSessionCookie());
    return response;
  }

  return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({ name: DASHBOARD_COOKIE, value: '', path: '/', maxAge: 0 });
  return response;
}
