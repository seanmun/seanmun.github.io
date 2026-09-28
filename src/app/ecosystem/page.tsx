import type { Metadata } from 'next';
import ConceptClientWrapper from '@/components/ConceptClientWrapper';
import { getGitStats } from '@/lib/github-stats';

export const metadata: Metadata = {
  title: 'Project Ecosystem | Sean Munley',
  description: 'Interactive 3D visualization of interconnected projects',
};

// Commit activity drives the glow and particle flow; refresh hourly
export const revalidate = 3600;

export default async function ConceptPage() {
  const stats = await getGitStats();
  return <ConceptClientWrapper activity={stats?.byProject ?? {}} />;
}
