'use client';
import dynamic from 'next/dynamic';

const ConceptGraph = dynamic(() => import('@/components/ConceptGraph'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen w-screen bg-slate-900">
      <div className="text-white/60 text-lg">Loading graph...</div>
    </div>
  ),
});

export default function ConceptClientWrapper() {
  return <ConceptGraph />;
}
