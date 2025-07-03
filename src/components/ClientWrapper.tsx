// Create a new file: /src/components/ClientWrapper.tsx
'use client';
import { Suspense } from 'react';
import PersonalWebsite from './personal-website';

interface ClientWrapperProps {
  galleryImages: string[];
}

function PersonalWebsiteWithSuspense({ galleryImages }: ClientWrapperProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PersonalWebsite galleryImages={galleryImages} />
    </Suspense>
  );
}

export default PersonalWebsiteWithSuspense;