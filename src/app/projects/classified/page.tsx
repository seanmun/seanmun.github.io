// File: src/app/projects/classified/page.tsx
// Purpose: The door or the room. Rendered per request: without a valid pass
// the visitor gets only the door, and the classified projects are never
// fetched, let alone sent.

import type { Metadata } from 'next';
import { SpeakeasyDoor } from '@/components/vault/SpeakeasyDoor';
import { VaultRoom } from '@/components/vault/VaultRoom';
import { getVaultProjects, hasVaultPass } from '@/lib/vault';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Classified | Sean Munley',
  description: 'Knock first.',
  robots: { index: false, follow: false },
};

export default async function ClassifiedPage() {
  if (await hasVaultPass()) {
    const projects = await getVaultProjects().catch((err) => {
      console.error('Could not load vault projects:', err);
      return [];
    });
    return <VaultRoom projects={projects} />;
  }
  return <SpeakeasyDoor />;
}
