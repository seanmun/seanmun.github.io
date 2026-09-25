// File: src/app/api/dashboard/auth/route.ts
// Purpose: Log in to / out of the analytics dashboard. The password is
// compared on the server, so it never reaches the browser bundle.

import { NextResponse } from 'next/server';
import { checkPassword, createSessionCookie, DASHBOARD_COOKIE } from '@/lib/dashboard-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

  if (!checkPassword(body.password)) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(createSessionCookie());
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({ name: DASHBOARD_COOKIE, value: '', path: '/', maxAge: 0 });
  return response;
}
