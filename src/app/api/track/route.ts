// File: src/app/api/track/route.ts
// Purpose: Records visitor events. Writes moved off the browser so Firestore
// can refuse all client access; this also lets us enrich each event with
// things only the server sees — approximate location from Vercel's edge
// headers (no IP is ever stored) and crawler detection.

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EVENT_TYPES = ['pageview', 'project_click', 'modal_open', 'link_click'] as const;
const DEVICE_TYPES = ['mobile', 'tablet', 'desktop'] as const;
const BOT_PATTERN =
  /bot|crawler|spider|crawling|slurp|bingpreview|headlesschrome|lighthouse|pingdom|curl|wget|python-requests|facebookexternalhit|preview/i;

const str = (value: unknown, max: number) =>
  typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null;

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const eventType = EVENT_TYPES.includes(body.eventType as (typeof EVENT_TYPES)[number])
    ? (body.eventType as string)
    : null;
  const cookieId = str(body.cookieId, 64);
  if (!eventType || !cookieId) {
    return NextResponse.json({ error: 'Invalid event' }, { status: 400 });
  }

  const headers = request.headers;
  const userAgent = headers.get('user-agent') ?? '';
  const decodeHeader = (name: string) => {
    const value = headers.get(name);
    if (!value) return null;
    try {
      return decodeURIComponent(value).slice(0, 80);
    } catch {
      return value.slice(0, 80);
    }
  };

  const timeOnSite =
    typeof body.timeOnSite === 'number' && body.timeOnSite > 0 && body.timeOnSite < 86400
      ? Math.floor(body.timeOnSite)
      : null;

  try {
    await db.collection('pageviews').add({
      cookieId,
      eventType,
      timestamp: new Date(),
      createdAt: new Date(),
      path: str(body.path, 200),
      projectName: str(body.projectName, 120),
      modalName: str(body.modalName, 120),
      linkName: str(body.linkName, 120),
      linkUrl: str(body.linkUrl, 300),
      deviceType: DEVICE_TYPES.includes(body.deviceType as (typeof DEVICE_TYPES)[number])
        ? (body.deviceType as string)
        : null,
      referrer: str(body.referrer, 300),
      timeOnSite,
      userAgent: userAgent.slice(0, 300),
      isBot: BOT_PATTERN.test(userAgent),
      // Approximate location from Vercel's edge headers — the raw IP is
      // deliberately not stored
      country: headers.get('x-vercel-ip-country'),
      region: headers.get('x-vercel-ip-country-region'),
      city: decodeHeader('x-vercel-ip-city'),
      timezone: headers.get('x-vercel-ip-timezone'),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Failed to record event:', err);
    // Analytics must never break the page for a visitor
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
