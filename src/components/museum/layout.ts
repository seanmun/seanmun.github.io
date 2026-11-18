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

// OrdinalFrame hangs in the dark pool room, where its screen glows best.
// It sits on the right wall, beside the near end of the table.
export const ORDINAL = { slug: 'ordinalframe', room: 'rocket-pool-tour', dz: 1.2, y: 1.95, src: '/models/museum/ordinalframe.glb' };

// Every project the museum shows a placard for
export const PLACARD_SLUGS: readonly string[] = [...ROOM_SLUGS, ORDINAL.slug];

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

// Hung in bays: each sculpture flanked by two photos, so one stop takes in
// a whole bay. Bays alternate walls down the hall, and the walk views each
// one at a slight angle, so turning from wall to wall sweeps through
// "looking ahead" instead of spinning around.
export const GALLERY_PIECES: GalleryPiece[] = [
  // Bay A, left
  { id: 'aj1', kind: 'photo', src: '/media/museum/photos/aj1hanging.jpg', side: -1, z: -16.8, y: 2.0, size: 1.5, title: 'Hung Up', note: 'Jordan 1s on a sconce' },
  { id: 'nets', kind: 'model', src: '/models/museum/tangled-nets.glb', side: -1, z: -19.2, y: 0.72, title: 'Tangled Nets', note: 'Frayed nets in red, white and blue, hung from a brass rod' },
  { id: 'love', kind: 'photo', src: '/media/museum/photos/love.jpg', side: -1, z: -21.6, y: 2.0, size: 1.6, title: 'Love', note: 'Mural on a city wall' },
  // Bay B, right
  { id: 'moto', kind: 'photo', src: '/media/museum/photos/motoDeath.jpg', side: 1, z: -22.1, y: 2.0, size: 1.6, title: 'Last Ride', note: 'Wall mural' },
  { id: 'flatball', kind: 'model', src: '/models/museum/flatball.glb', side: 1, z: -24.5, y: 1.15, title: 'Flat Ball', note: 'Twenty-four deflated balls on walnut' },
  { id: 'hoody', kind: 'photo', src: '/media/museum/photos/hoody.jpg', side: 1, z: -26.9, y: 2.0, size: 1.6, title: 'Hoody', note: 'Hoodie and flag, in paint' },
  // Bay C, left
  { id: 'framehoop', kind: 'photo', src: '/media/museum/photos/framehoop.jpg', side: -1, z: -27.6, y: 2.0, size: 1.5, title: 'Frame Hoop', note: 'A hoop through the print' },
  { id: 'hoopgarden', kind: 'model', src: '/models/museum/hoop-garden.glb', side: -1, z: -30.0, y: 0.22, title: 'Hoop Garden', note: 'A backboard over four shelves of potted plants' },
  { id: 'chandelier', kind: 'photo', src: '/media/museum/photos/chandelier.jpg', side: -1, z: -32.4, y: 2.0, size: 1.6, title: 'Chandelier', note: 'Shoes hung from crystal' },
  // Bay D, right
  { id: 'surfing', kind: 'photo', src: '/media/museum/photos/surfingEvolution.jpg', side: 1, z: -32.6, y: 2.0, size: 1.7, title: 'Surfing Evolution', note: 'A painted wall by the beach' },
  { id: 'scars', kind: 'model', src: '/models/museum/scars-of-the-game.glb', side: 1, z: -35.5, y: 0.78, title: 'Scars of the Game', note: 'A chain net hung from a field of weathered rods' },
  { id: 'vibe', kind: 'photo', src: '/media/museum/photos/vibe.jpg', side: 1, z: -38.4, y: 2.0, size: 1.7, title: 'Vibe', note: 'Building mural' },
  // Bays E and F: prints at the end of the hall
  { id: 'helmet', kind: 'photo', src: '/media/museum/photos/daHelmet.jpg', side: -1, z: -43.2, y: 2.0, size: 1.5, title: 'Helmet', note: 'One helmet, one wall' },
  { id: 'beached', kind: 'photo', src: '/media/museum/photos/beachedhoop.jpg', side: -1, z: -45.8, y: 2.0, size: 1.5, title: 'Beached Hoop', note: 'Framed print' },
  { id: 'balance', kind: 'photo', src: '/media/museum/photos/balance.jpg', side: 1, z: -43.2, y: 2.0, size: 1.6, title: 'Balance', note: 'Stacked stones in fog' },
  { id: 'hang11', kind: 'photo', src: '/media/museum/photos/hang11.jpg', side: 1, z: -45.8, y: 2.0, size: 1.5, title: 'Hang 11', note: 'A sneaker on the line' },
];

export const STACK = { x: 0, z: -40, plinth: 0.55, src: '/models/museum/stack.glb' };

// Scroll per stop, in screen heights: room to linger at each piece
export const STEP = 1.35;

const EYE = 1.7;

// A bay seen from the middle of the hall, a little before it, so the view
// angles down the hall rather than square onto the wall.
function bayView(side: -1 | 1, z: number, y = 1.8): Pick<Station, 'pos' | 'look'> {
  return { pos: [side * 2.0, EYE, z + 1.9], look: [side * 6, y, z] };
}

function piece(id: string) {
  return GALLERY_PIECES.find((p) => p.id === id)!;
}

function bay(id: string, left: string, right: string): Station {
  const p = piece(id);
  return {
    id, group: 'Gallery', label: p.title,
    sub: `${p.note}. Flanked by ${piece(left).title} and ${piece(right).title}.`,
    ...bayView(p.side, p.z, p.kind === 'model' ? 1.75 : 1.9),
  };
}

export function buildStations(projects: MuseumProject[]): Station[] {
  const stations: Station[] = [
    { id: 'entrance', group: 'Lobby', label: 'Sean Munley', sub: 'Selected works. Scroll to walk in.', pos: [0, EYE, 4.5], look: [0, 4.2, -14] },
    { id: 'mark', group: 'Lobby', label: 'The S', sub: 'Porcelain and gold leaf, on a marble plinth', pos: [0, 2.0, -4.2], look: [0, 1.9, -8.5] },
    { id: 'gallery', group: 'Gallery', label: 'The Gallery', sub: 'Basketball art from the mood board, recreated in Blender', pos: [0, EYE, -11.5], look: [0, 2.2, -32] },
  ];
  stations.push(
    bay('nets', 'aj1', 'love'),
    bay('flatball', 'moto', 'hoody'),
    bay('hoopgarden', 'framehoop', 'chandelier'),
    bay('scars', 'surfing', 'vibe'),
    { id: 'stack', group: 'Gallery', label: 'Stack', sub: 'Five navy balls, balanced', pos: [-1.3, 1.55, -36.6], look: [STACK.x, 1.3, STACK.z] },
    { id: 'prints-left', group: 'Gallery', label: 'Prints', sub: 'Helmet, and Beached Hoop', ...bayView(-1, -44.5, 1.95) },
    { id: 'prints-right', group: 'Gallery', label: 'Prints', sub: 'Balance, and Hang 11', ...bayView(1, -44.5, 1.95) },
  );

  ROOM_SLUGS.forEach((slug, i) => {
    const p = projects.find((x) => x.slug === slug);
    if (!p) return;
    const r = roomBounds(i);
    stations.push(
      { id: `${slug}-enter`, group: p.title, label: p.title, sub: ROOM_NOTES[slug] ?? '', slug, pos: [ROOM.doorX, 1.75, r.z0 - 1.5], look: enterLook(slug, r.zc) },
      ...ordinalStop(slug, r.zc, projects),
      { id: `${slug}-screen`, group: p.title, label: p.title, sub: 'Open the placard to read about it', slug, pos: [-2.2, 1.8, r.zc + 0.8], look: [-7, 2.35, r.zc + 0.4] },
    );
  });
  return stations;
}

function ordinalStop(slug: string, zc: number, projects: MuseumProject[]): Station[] {
  const p = projects.find((x) => x.slug === ORDINAL.slug);
  if (slug !== ORDINAL.room || !p) return [];
  const z = zc + ORDINAL.dz;
  return [{
    id: 'ordinalframe', group: p.title, label: p.title, slug: p.slug,
    sub: 'Bitcoin Ordinals on a Raspberry Pi, in a gold frame',
    pos: [4.2, 1.75, z], look: [ROOM.width / 2, ORDINAL.y - 0.05, z],
  }];
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
