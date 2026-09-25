// File: src/app/api/track/route.ts
// Purpose: Records visitor events. Writes moved off the browser so Firestore
// can refuse all client access; this also lets us enrich each event with
// things only the server sees — approximate location from Vercel's edge
// headers (no IP is ever stored) and crawler detection.

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EVENT_TYPES = ['pageview', 'project_click', 'modal_open', 'link_click', 'click'] as const;
const MAX_BATCH = 30;
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

  // One event, or a batch from the click tracker
  const incoming = Array.isArray(body.events)
    ? (body.events as Record<string, unknown>[]).slice(0, MAX_BATCH)
    : [body];

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

  // Shared by every event in the request: things only the server sees. The
  // raw IP is deliberately not stored.
  const context = {
    userAgent: userAgent.slice(0, 300),
    isBot: BOT_PATTERN.test(userAgent),
    country: headers.get('x-vercel-ip-country'),
    region: headers.get('x-vercel-ip-country-region'),
    city: decodeHeader('x-vercel-ip-city'),
    timezone: headers.get('x-vercel-ip-timezone'),
  };

  const percent = (value: unknown) =>
    typeof value === 'number' && value >= 0 && value <= 100 ? Math.round(value) : null;

  const documents = incoming.flatMap((event) => {
    const eventType = EVENT_TYPES.includes(event.eventType as (typeof EVENT_TYPES)[number])
      ? (event.eventType as string)
      : null;
    const cookieId = str(event.cookieId, 64);
    if (!eventType || !cookieId) return [];

    const timeOnSite =
      typeof event.timeOnSite === 'number' && event.timeOnSite > 0 && event.timeOnSite < 86400
        ? Math.floor(event.timeOnSite)
        : null;

    return [{
      cookieId,
      eventType,
      timestamp: new Date(),
      createdAt: new Date(),
      path: str(event.path, 200),
      projectName: str(event.projectName, 120),
      modalName: str(event.modalName, 120),
      linkName: str(event.linkName, 120),
      linkUrl: str(event.linkUrl, 300),
      label: str(event.label, 60),
      elementKind: str(event.elementKind, 20),
      section: str(event.section, 60),
      href: str(event.href, 300),
      xPercent: percent(event.xPercent),
      yPercent: percent(event.yPercent),
      deviceType: DEVICE_TYPES.includes(event.deviceType as (typeof DEVICE_TYPES)[number])
        ? (event.deviceType as string)
        : null,
      referrer: str(event.referrer, 300),
      timeOnSite,
      ...context,
    }];
  });

  if (documents.length === 0) {
    return NextResponse.json({ error: 'Invalid event' }, { status: 400 });
  }

  try {
    const collection = db.collection('pageviews');
    if (documents.length === 1) {
      await collection.add(documents[0]);
    } else {
      const batch = db.batch();
      documents.forEach((doc) => batch.set(collection.doc(), doc));
      await batch.commit();
    }
    return NextResponse.json({ ok: true, recorded: documents.length });
  } catch (err) {
    console.error('Failed to record events:', err);
    // Analytics must never break the page for a visitor
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
