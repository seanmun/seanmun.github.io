// src/components/MySpaceClientWrapper.tsx
'use client';
import { Suspense } from 'react';
import MySpaceWebsite from './myspace-website';

interface MySpaceClientWrapperProps {
  galleryImages: string[];
}

function MySpaceWebsiteWithSuspense({ galleryImages }: MySpaceClientWrapperProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MySpaceWebsite galleryImages={galleryImages} />
    </Suspense>
  );
}

export default MySpaceWebsiteWithSuspense;
