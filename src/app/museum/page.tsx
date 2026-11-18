// File: src/app/museum/page.tsx
// Purpose: The 3D museum. Work in progress on seanmun/update, kept out of
// search results until it replaces the home page.

import type { Metadata } from 'next';
import { projects } from '@/data/projects';
import { ROOM_SLUGS, type MuseumProject } from '@/components/museum/layout';
import MuseumClient from '@/components/museum/MuseumClient';

export const metadata: Metadata = {
  title: 'The Museum | Sean Munley',
  description: 'Walk through a 3D museum of my work: a gallery of basketball art, then a room for every project.',
  robots: { index: false, follow: true },
};

export default function MuseumPage() {
  // Only what the placards show, so the client bundle doesn't carry projects.ts
  const rooms: MuseumProject[] = projects
    .filter((p) => (ROOM_SLUGS as readonly string[]).includes(p.slug))
    .map(({ slug, title, description, status, techStack, link }) => ({ slug, title, description, status, techStack, link }));
  return <MuseumClient projects={rooms} />;
}
