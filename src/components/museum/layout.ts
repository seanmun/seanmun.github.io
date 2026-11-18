// File: src/components/museum/layout.ts
// Purpose: The museum floor plan and the camera's route through it. Shared
// by the 3D engine (to build walls and fly the camera) and the HTML overlay
// (captions and the room map), so the two can never disagree.
//
// World units are meters. The visitor walks toward -Z: lobby, then the
// gallery, then one room per project, each opening onto the next.

export type V3 = [number, number, number];

export interface MuseumProject {
  slug: string;
  title: string;
  description: string;
  status: string;
  techStack: string[];
  link: string;
}

export interface Station {
  id: string;
  label: string; // shown in the caption and the room map
  sub: string;
  group: string; // room map heading this station belongs to
  slug?: string; // project rooms: opens that project's placard
  pos: V3;
  look: V3;
}

export const LOBBY = { x0: -9, x1: 9, z0: 6, z1: -14, h: 12 };
export const GALLERY = { x0: -6, x1: 6, z0: -14, z1: -48, h: 8 };
export const ROOM = { width: 14, depth: 14, h: 6, doorX: 1.8, doorW: 3.2, doorH: 3.6 };

// Room order follows the project grid on the home page
export const ROOM_SLUGS = [
  'kinetic-email',
  'money-never-sleeps',
  'outlooksucks',
  'buddy-cup',
  'rocket-pool-tour',
  'human-diet',
] as const;

export function roomBounds(index: number) {
  const z0 = GALLERY.z1 - ROOM.depth * index;
  const z1 = z0 - ROOM.depth;
  return { x0: -ROOM.width / 2, x1: ROOM.width / 2, z0, z1, zc: (z0 + z1) / 2, h: ROOM.h };
}

// Wall pieces in the gallery. side -1 hangs on the left wall, 1 on the right.
export interface GalleryPiece {
  id: string;
  kind: 'model' | 'photo';
  src: string;
  side: -1 | 1;
  z: number;
  title: string;
  note: string;
  y?: number; // bottom edge for models, center for photos
  size?: number; // photos: the longer edge, meters
}

export const GALLERY_PIECES: GalleryPiece[] = [
  { id: 'allnet', kind: 'model', src: '/models/museum/allnet.glb', side: -1, z: -18.5, y: 0.6, title: 'All Net', note: 'Thirteen nets hung from a brass rod' },
  { id: 'love', kind: 'photo', src: '/media/museum/photos/love.jpg', side: 1, z: -17.6, y: 2.0, size: 1.6, title: 'Love', note: 'Mural on a city wall' },
  { id: 'flatball', kind: 'model', src: '/models/museum/flatball.glb', side: 1, z: -21.8, y: 1.15, title: 'Flat Ball', note: 'Twenty-four deflated balls on walnut' },
  { id: 'aj1', kind: 'photo', src: '/media/museum/photos/aj1hanging.jpg', side: -1, z: -22.4, y: 2.0, size: 1.5, title: 'Hung Up', note: 'Jordan 1s on a sconce' },
  { id: 'hoopgarden', kind: 'model', src: '/models/museum/hoopgarden.glb', side: -1, z: -26.6, y: 0.3, title: 'Hoop Garden', note: 'A painted backboard over floating shelves of plants' },
  { id: 'moto', kind: 'photo', src: '/media/museum/photos/motoDeath.jpg', side: 1, z: -25.8, y: 2.0, size: 1.6, title: 'Last Ride', note: 'Wall mural' },
  { id: 'hoody', kind: 'photo', src: '/media/museum/photos/hoody.jpg', side: -1, z: -30.6, y: 2.0, size: 1.6, title: 'Hoody', note: 'Hoodie and flag, in paint' },
  { id: 'bronzehoop', kind: 'model', src: '/models/museum/bronzehoop.glb', side: 1, z: -30.0, y: 1.1, title: 'Bronze Hoop', note: 'A rim rising out of forty-six bronze rods' },
  { id: 'framehoop', kind: 'photo', src: '/media/museum/photos/framehoop.jpg', side: -1, z: -34.2, y: 2.0, size: 1.5, title: 'Frame Hoop', note: 'A hoop through the print' },
  { id: 'surfing', kind: 'photo', src: '/media/museum/photos/surfingEvolution.jpg', side: 1, z: -34.2, y: 2.0, size: 1.9, title: 'Surfing Evolution', note: 'A painted wall by the beach' },
  { id: 'chandelier', kind: 'photo', src: '/media/museum/photos/chandelier.jpg', side: -1, z: -38.0, y: 2.0, size: 1.6, title: 'Chandelier', note: 'Shoes hung from crystal' },
  { id: 'vibe', kind: 'photo', src: '/media/museum/photos/vibe.jpg', side: 1, z: -38.2, y: 2.0, size: 1.9, title: 'Vibe', note: 'Building mural' },
  { id: 'helmet', kind: 'photo', src: '/media/museum/photos/daHelmet.jpg', side: -1, z: -41.8, y: 2.0, size: 1.5, title: 'Helmet', note: 'One helmet, one wall' },
  { id: 'balance', kind: 'photo', src: '/media/museum/photos/balance.jpg', side: 1, z: -41.8, y: 2.0, size: 1.6, title: 'Balance', note: 'Stacked stones in fog' },
  { id: 'beached', kind: 'photo', src: '/media/museum/photos/beachedhoop.jpg', side: -1, z: -45.4, y: 2.0, size: 1.5, title: 'Beached Hoop', note: 'Framed print' },
  { id: 'hang11', kind: 'photo', src: '/media/museum/photos/hang11.jpg', side: 1, z: -45.4, y: 2.0, size: 1.5, title: 'Hang 11', note: 'A sneaker on the line' },
];

export const STACK = { x: 0, z: -40.5, plinth: 0.55, src: '/models/museum/stack.glb' };

const EYE = 1.7;

function wallLook(p: GalleryPiece, y = 1.9): Pick<Station, 'pos' | 'look'> {
  const wallX = p.side * 6;
  return { pos: [p.side * 2.6, EYE, p.z], look: [wallX, y, p.z] };
}

function piece(id: string) {
  return GALLERY_PIECES.find((p) => p.id === id)!;
}

export function buildStations(projects: MuseumProject[]): Station[] {
  const stations: Station[] = [
    { id: 'entrance', group: 'Lobby', label: 'Sean Munley', sub: 'Selected works. Scroll to walk in.', pos: [0, EYE, 4.5], look: [0, 4.2, -14] },
    { id: 'mark', group: 'Lobby', label: 'The S', sub: 'Porcelain and gold leaf, on a marble plinth', pos: [0, 2.0, -4.2], look: [0, 1.9, -8.5] },
    { id: 'gallery', group: 'Gallery', label: 'The Gallery', sub: 'Basketball art from the mood board, recreated in Blender', pos: [0, EYE, -11.5], look: [0, 2.2, -32] },
  ];
  for (const id of ['allnet', 'flatball', 'hoopgarden', 'bronzehoop']) {
    const p = piece(id);
    stations.push({ id, group: 'Gallery', label: p.title, sub: p.note, ...wallLook(p, p.kind === 'model' ? 1.75 : 2.0) });
  }
  stations.push(
    { id: 'stack', group: 'Gallery', label: 'Stack', sub: 'Five navy balls, balanced', pos: [-1.2, 1.55, -36.8], look: [STACK.x, 1.4, STACK.z] },
    { id: 'prints', group: 'Gallery', label: 'Prints', sub: 'Photographs from the mood board', pos: [-1.4, EYE, -43.4], look: [6, 1.9, -43.4] },
  );

  ROOM_SLUGS.forEach((slug, i) => {
    const p = projects.find((x) => x.slug === slug);
    if (!p) return;
    const r = roomBounds(i);
    stations.push(
      { id: `${slug}-enter`, group: p.title, label: p.title, sub: ROOM_NOTES[slug] ?? '', slug, pos: [ROOM.doorX, 1.75, r.z0 - 1.5], look: enterLook(slug, r.zc) },
      { id: `${slug}-screen`, group: p.title, label: p.title, sub: 'Open the placard to read about it', slug, pos: [-2.2, 1.8, r.zc + 0.8], look: [-7, 2.35, r.zc + 0.4] },
    );
  });
  return stations;
}

// Where each room's entrance view points: at the thing that makes the room
function enterLook(slug: string, zc: number): V3 {
  switch (slug) {
    case 'kinetic-email': return [6, 1.7, zc - 0.5]; // the pigeonhole wall
    case 'money-never-sleeps': return [-3, 2.4, zc - 4]; // the hoop and ribbon board
    case 'outlooksucks': return [3.6, 1.1, zc - 2.2]; // into the cubicle
    case 'buddy-cup': return [-6, 2.2, zc]; // the sim screen
    case 'rocket-pool-tour': return [3.2, 0.9, zc - 1]; // the table
    case 'human-diet': return [3.6, 1.0, zc - 1.2]; // the diorama
    default: return [-3, 2.0, zc - 2];
  }
}

export const ROOM_NOTES: Record<string, string> = {
  'kinetic-email': 'The mailroom: interactive email, built by AI',
  'money-never-sleeps': 'Center court, with the market on the ribbon board',
  outlooksucks: 'A cubicle, circa 2007. Outlook is still rendering.',
  'buddy-cup': 'The simulator bay. Match play, scored live.',
  'rocket-pool-tour': 'The pool hall: a pro billiards league, start to finish',
  'human-diet': 'A natural history diorama, 300,000 years of eating',
};
