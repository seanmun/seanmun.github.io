// File: src/app/api/dashboard/admin-visitors/route.ts
// Purpose: Mark a browser as Sean's (or unmark it) so his own visits stay
// out of the numbers. Registering happens automatically when a browser
// opens the dashboard; this is for the browsers that never do — an old
// phone, a cleared profile — which can only be recognised after the fact.

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { hasDashboardSession } from '@/lib/dashboard-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VISITOR_ID = /^[a-z0-9]{1,64}$/i;

async function readVisitorId(request: Request) {
  try {
    const body = await request.json();
    const visitorId = body?.visitorId;
    return typeof visitorId === 'string' && VISITOR_ID.test(visitorId) ? visitorId : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  if (!(await hasDashboardSession())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const visitorId = await readVisitorId(request);
  if (!visitorId) return NextResponse.json({ error: 'Invalid visitor id' }, { status: 400 });

  await db
    .collection('admin_visitors')
    .doc(visitorId)
    .set({ visitorId, markedManually: true, lastSeen: new Date() }, { merge: true });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!(await hasDashboardSession())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const visitorId = await readVisitorId(request);
  if (!visitorId) return NextResponse.json({ error: 'Invalid visitor id' }, { status: 400 });

  await db.collection('admin_visitors').doc(visitorId).delete();
  return NextResponse.json({ ok: true });
}
