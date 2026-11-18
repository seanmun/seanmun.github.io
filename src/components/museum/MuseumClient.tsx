'use client';
import dynamic from 'next/dynamic';
import type { MuseumProject, PanelContent } from './layout';

const Museum = dynamic(() => import('./Museum'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-[#d9d5ce]" />,
});

export default function MuseumClient({ projects, ordinals, tours }: { projects: MuseumProject[]; ordinals: string[]; tours: Record<string, PanelContent[]> }) {
  return <Museum projects={projects} ordinals={ordinals} tours={tours} />;
}
