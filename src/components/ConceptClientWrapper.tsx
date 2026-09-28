'use client';
import dynamic from 'next/dynamic';
import type { ProjectGitStats } from '@/lib/github-stats';

const ConceptGraph = dynamic(() => import('@/components/ConceptGraph'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen w-screen bg-slate-900">
      <div className="text-white/60 text-lg">Loading graph...</div>
    </div>
  ),
});

export default function ConceptClientWrapper({ activity }: { activity: Record<string, ProjectGitStats> }) {
  return <ConceptGraph activity={activity} />;
}
