// File: src/app/museum/page.tsx
// Purpose: The 3D museum. Work in progress on seanmun/update, kept out of
// search results until it replaces the home page.

import type { Metadata } from 'next';
import { readdirSync } from 'fs';
import path from 'path';
import { projects } from '@/data/projects';
import { PLACARD_SLUGS, type MuseumProject } from '@/components/museum/layout';
import MuseumClient from '@/components/museum/MuseumClient';

export const metadata: Metadata = {
  title: 'The Museum | Sean Munley',
  description: 'Walk through a 3D museum of my work: a gallery of basketball art, then a room for every project.',
  robots: { index: false, follow: true },
};

// OrdinalFrame's screen shows every image in this folder, in filename
// order. Drop inscriptions in and redeploy; with none, it shows stand-ins.
function ordinalImages() {
  try {
    return readdirSync(path.join(process.cwd(), 'public/media/museum/ordinals'))
      .filter((f) => /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(f))
      .sort()
      .map((f) => `/media/museum/ordinals/${encodeURIComponent(f)}`);
  } catch {
    return [];
  }
}

export default function MuseumPage() {
  // Only what the placards show, so the client bundle doesn't carry projects.ts
  const rooms: MuseumProject[] = projects
    .filter((p) => PLACARD_SLUGS.includes(p.slug))
    .map(({ slug, title, description, status, techStack, link }) => ({ slug, title, description, status, techStack, link }));
  return <MuseumClient projects={rooms} ordinals={ordinalImages()} />;
}
