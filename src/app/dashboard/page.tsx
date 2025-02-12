import { Suspense } from 'react';
import DashboardView from '../../components/DashboardView';
import PasswordProtected from '../../components/PasswordProtected';

export const dynamic = 'force-static';
export const revalidate = false;

export default function DashboardPage() {
  return (
    <PasswordProtected>
      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={<div>Loading analytics...</div>}>
          <DashboardView />
        </Suspense>
      </div>
    </PasswordProtected>
  );
}