import type { Metadata } from 'next';
import ConceptClientWrapper from '@/components/ConceptClientWrapper';

export const metadata: Metadata = {
  title: 'Project Ecosystem | Sean Munley',
  description: 'Interactive 3D visualization of interconnected projects',
};

export default function ConceptPage() {
  return <ConceptClientWrapper />;
}
