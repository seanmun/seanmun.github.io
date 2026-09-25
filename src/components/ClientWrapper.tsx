// Create a new file: /src/components/ClientWrapper.tsx
'use client';
import { Suspense } from 'react';
import PersonalWebsite from './personal-website';
import type { GitStatsSnapshot } from '@/lib/github-stats';

interface ClientWrapperProps {
  galleryImages: string[];
  gitStats: GitStatsSnapshot | null;
}

function PersonalWebsiteWithSuspense({ galleryImages, gitStats }: ClientWrapperProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PersonalWebsite galleryImages={galleryImages} gitStats={gitStats} />
    </Suspense>
  );
}

export default PersonalWebsiteWithSuspense;
