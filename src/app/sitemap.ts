// File: src/app/sitemap.ts
// Purpose: Sitemap generated from the project list, so every feature page is
// listed. Replaces the hand-written public/sitemap.xml, which named only the
// home page and was last dated January 2025.

import type { MetadataRoute } from 'next';
import { projects } from '@/data/projects';

const SITE = 'https://seanmun.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: SITE, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE}/ecosystem`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    ...projects.map((project) => ({
      url: `${SITE}/projects/${project.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ];
}
