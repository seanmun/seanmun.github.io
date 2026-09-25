// File: src/app/api/dashboard/data/route.ts
// Purpose: Serves analytics events to the dashboard. Reads run through the
// Admin SDK on the server, so Firestore can deny all browser access and the
// data is no longer fetchable with the public web API key.

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { hasDashboardSession } from '@/lib/dashboard-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_EVENTS = 5000;

export async function GET(request: Request) {
  if (!(await hasDashboardSession())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const days = Number(url.searchParams.get('days') ?? '45');
  const visitorId = url.searchParams.get('visitorId');

  try {
    // Whoever opens the dashboard is an admin — remember them so their own
    // visits stay out of the numbers
    if (visitorId && /^[a-z0-9]{1,64}$/i.test(visitorId)) {
      await db
        .collection('admin_visitors')
        .doc(visitorId)
        .set({ visitorId, lastSeen: new Date() }, { merge: true });
    }

    const adminSnapshot = await db.collection('admin_visitors').get();
    const adminIds = new Set(adminSnapshot.docs.map((doc) => doc.data().visitorId));

    let query = db.collection('pageviews').orderBy('timestamp', 'desc').limit(MAX_EVENTS);
    if (Number.isFinite(days) && days > 0) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      query = db
        .collection('pageviews')
        .where('timestamp', '>=', startDate)
        .orderBy('timestamp', 'desc')
        .limit(MAX_EVENTS);
    }

    const snapshot = await query.get();
    const events = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        const timestamp = data.timestamp?.toDate?.() ?? data.createdAt?.toDate?.() ?? null;
        return {
          id: doc.id,
          cookieId: data.cookieId ?? '',
          timestamp: (timestamp instanceof Date ? timestamp : new Date()).toISOString(),
          eventType: data.eventType ?? 'pageview',
          path: data.path ?? null,
          projectName: data.projectName ?? null,
          modalName: data.modalName ?? null,
          linkName: data.linkName ?? null,
          linkUrl: data.linkUrl ?? null,
          label: data.label ?? null,
          elementKind: data.elementKind ?? null,
          section: data.section ?? null,
          href: data.href ?? null,
          deviceType: data.deviceType ?? null,
          userAgent: data.userAgent ?? null,
          referrer: data.referrer ?? null,
          timeOnSite: data.timeOnSite ?? null,
          country: data.country ?? null,
          region: data.region ?? null,
          city: data.city ?? null,
          isBot: data.isBot ?? false,
        };
      })
      .filter((event) => !adminIds.has(event.cookieId));

    return NextResponse.json({ events });
  } catch (err) {
    console.error('Dashboard data query failed:', err);
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 });
  }
}
