// File: src/app/dashboard/page.tsx
// Purpose: Analytics dashboard, gated server-side. Without a valid session
// cookie the page renders only the login form — the data never leaves the
// server, so there is nothing to unlock in the browser.

import { Suspense } from 'react';
import DashboardView from '@/components/DashboardView';
import PasswordProtected from '@/components/PasswordProtected';
import { hasDashboardSession } from '@/lib/dashboard-auth';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const isAuthenticated = await hasDashboardSession();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen relative">
        <PasswordProtected />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<div>Loading analytics...</div>}>
        <DashboardView />
      </Suspense>
    </div>
  );
}
