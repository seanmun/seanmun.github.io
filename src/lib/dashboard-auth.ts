// File: src/lib/dashboard-auth.ts
// Purpose: Server-side gate for /dashboard. The password lives in
// DASHBOARD_PASSWORD (server-only — never NEXT_PUBLIC, which would ship it
// to every visitor's browser). A successful login gets an HMAC-signed,
// httpOnly cookie that the browser can read back but cannot forge.

import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

export const DASHBOARD_COOKIE = 'dash_auth';
const SESSION_MS = 7 * 24 * 60 * 60 * 1000;

function sign(expiresAt: number, secret: string) {
  return createHmac('sha256', secret).update(String(expiresAt)).digest('hex');
}

function safeEquals(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function checkPassword(candidate: unknown): boolean {
  const secret = process.env.DASHBOARD_PASSWORD;
  if (!secret || typeof candidate !== 'string' || candidate.length === 0) return false;
  return safeEquals(candidate, secret);
}

export function createSessionCookie() {
  const secret = process.env.DASHBOARD_PASSWORD!;
  const expiresAt = Date.now() + SESSION_MS;
  return {
    name: DASHBOARD_COOKIE,
    value: `${expiresAt}.${sign(expiresAt, secret)}`,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_MS / 1000,
  };
}

// Valid, unexpired, correctly signed session cookie?
export async function hasDashboardSession(): Promise<boolean> {
  const secret = process.env.DASHBOARD_PASSWORD;
  if (!secret) return false;

  const raw = (await cookies()).get(DASHBOARD_COOKIE)?.value;
  if (!raw) return false;

  const [expiresAt, signature] = raw.split('.');
  const expiry = Number(expiresAt);
  if (!expiry || !signature || Date.now() > expiry) return false;

  return safeEquals(signature, sign(expiry, secret));
}
