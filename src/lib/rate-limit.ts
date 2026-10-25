// File: src/lib/rate-limit.ts
// Purpose: Fixed-window rate limiting per hashed client IP, stored in
// Firestore because serverless instances share no memory. Each attempt is
// counted inside a transaction BEFORE the caller does its work, so a burst of
// parallel requests can't all read the same count and slip past the limit.

import { createHash } from 'crypto';
import { db } from '@/lib/firebase-admin';

export interface RateLimit {
  collection: string; // Firestore collection holding the counters
  max: number; // attempts allowed per window
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryMinutes: number; // minutes until the window resets, when not allowed
  key: string; // pass to clearRateLimit() to reset after a success
}

// Keyed by a hash of the IP: enough to count attempts, never the address itself
export function clientKey(request: Request, scope: string) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';
  return createHash('sha256').update(`${scope}:${ip}`).digest('hex').slice(0, 32);
}

// A database hiccup lets the request through rather than locking everyone
// out; it never skips the caller's own checks (a password is still compared).
export async function takeRateLimit(request: Request, limit: RateLimit): Promise<RateLimitResult> {
  const key = clientKey(request, limit.collection);
  const ref = db.collection(limit.collection).doc(key);
  try {
    return await db.runTransaction(async (tx) => {
      const record = (await tx.get(ref)).data();
      const now = Date.now();
      const inWindow = record?.windowStart && now - record.windowStart < limit.windowMs;
      const count: number = inWindow ? record?.count ?? 0 : 0;
      const windowStart: number = inWindow ? record!.windowStart : now;

      if (count >= limit.max) {
        const retryMinutes = Math.max(1, Math.ceil((limit.windowMs - (now - windowStart)) / 60000));
        return { allowed: false, retryMinutes, key };
      }
      tx.set(ref, { count: count + 1, windowStart });
      return { allowed: true, retryMinutes: 0, key };
    });
  } catch (err) {
    console.error(`Rate limit check failed (${limit.collection}):`, err);
    return { allowed: true, retryMinutes: 0, key };
  }
}

export async function clearRateLimit(limit: RateLimit, key: string) {
  await db.collection(limit.collection).doc(key).delete().catch(() => {});
}
