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
  artist?: string; // credit for a recreated artwork
  panel?: number; // tour stops: index into that room's hologram panels
  place?: V3; // where the panel floats: [right, up, distance] from the camera
  group: string; // room map heading this station belongs to
  slug?: string; // project rooms: opens that project's placard
  pos: V3;
  look: V3;
}

// ---------- room tours ----------
// A room with a tour walks the visitor through its project in a few stops,
// each with a hologram panel tied to something in the room. Panel content
// is built on the server from the project's case study (see museum/page).

export interface PanelContent {
  kicker: string;
  title: string;
  body: string;
  bullets: string[];
  chips: string[];
  stats: { label: string; value: string }[];
  links: { label: string; href: string; external?: boolean }[];
}

export type TourPanel =
  | { kind: 'overview' }
  | { kind: 'section'; heading: string }
  | { kind: 'finale'; heading?: string };

export interface TourStop {
  id: string;
  label: string;
  panel: TourPanel;
  pos: V3;
  look: V3;
  place: V3;
}

export function roomTour(slug: string, index: number): TourStop[] | null {
  const r = roomBounds(index);
  // Shared viewpoints: the screen on the left wall, seen at an angle so the
  // panel can float to its right, and the way out by the far doorway
  const screen = (heading: string, label = 'The screen'): TourStop => ({
    id: 'screen', label, panel: { kind: 'section', heading },
    pos: [-1.0, 1.8, r.zc + 3.2], look: [-7, 2.4, r.zc + 0.4], place: [0.95, -0.05, 2.4],
  });
  const finale = (heading: string): TourStop => ({
    id: 'finale', label: 'Before you go', panel: { kind: 'finale', heading },
    pos: [-1.6, 1.7, r.z1 + 5.2], look: [-2.5, 1.9, r.z1], place: [0.75, -0.1, 2.5],
  });
  const arrive = (look: V3, place: V3 = [-0.6, 0.12, 2.5]): TourStop => ({
    id: 'arrive', label: 'Arrive', panel: { kind: 'overview' }, pos: [ROOM.doorX, 1.75, r.z0 - 1.5], look, place,
  });
  switch (slug) {
    case 'kinetic-email':
      return [
        arrive([6, 1.7, r.zc - 0.5]),
        { id: 'mailroom', label: 'The mailroom', panel: { kind: 'section', heading: 'The Problem' }, pos: [3.0, 1.7, r.zc + 3.0], look: [7, 1.8, r.zc - 0.5], place: [-0.6, -0.05, 2.4] },
        screen('Describe an email → get two production builds'),
        finale('The generation pipeline'),
      ];
    case 'outlooksucks':
      return [
        arrive([3.6, 1.1, r.zc - 2.2]),
        { id: 'crt', label: 'The cubicle', panel: { kind: 'section', heading: 'The problem, in one ticker' }, pos: [3.2, 1.5, r.zc + 0.6], look: [4.0, 1.0, r.zc - 2.1], place: [-0.55, 0.25, 2.2] },
        screen('Edit on the email itself'),
        finale('A real Outlook template, written byte by byte'),
      ];
    case 'buddy-cup':
      return [
        arrive([-6, 2.2, r.zc], [0.95, 0.05, 2.5]),
        { id: 'mat', label: 'On the mat', panel: { kind: 'section', heading: 'The idea' }, pos: [1.6, 1.65, r.zc + 1.6], look: [-7, 2.0, r.zc + 0.4], place: [1.0, -0.1, 2.4] },
        { id: 'bag', label: 'The bag', panel: { kind: 'section', heading: 'Signature features' }, pos: [2.2, 1.7, r.zc - 0.2], look: [4.5, 0.9, r.zc - 3], place: [-0.6, 0.2, 2.4] },
        finale('On the course: iPhone and Apple Watch'),
      ];
    case 'rocket-pool-tour':
      return [
        arrive([3.2, 0.9, r.zc - 1]),
        { id: 'table', label: 'The table', panel: { kind: 'section', heading: 'The RRO app: every rack, rated' }, pos: [0.6, 1.75, r.zc + 1.0], look: [3.2, 0.85, r.zc - 0.8], place: [-0.6, 0.25, 2.3] },
        screen('A pitch deck for every partner'),
        finale('A CRM built for the deal flow'),
      ];
    case 'human-diet':
      return [
        arrive([3.6, 1.0, r.zc - 1.2]),
        screen('A walk through 300,000 years'),
        { id: 'diorama', label: 'The diorama', panel: { kind: 'section', heading: 'Bodies that follow the data' }, pos: [0.2, 1.7, r.zc + 2.6], look: [3.6, 0.9, r.zc - 1], place: [-0.6, 0.2, 2.4] },
        { id: 'finale', label: 'Before you go', panel: { kind: 'finale', heading: 'Next: a photorealistic world built in Blender' }, pos: [-1.2, 1.7, r.zc - 3.5], look: [3.6, 1.2, r.zc - 1.5], place: [-0.55, 0.0, 2.5] },
      ];
    case 'money-never-sleeps':
      return [
        { id: 'arrive', label: 'Center court', panel: { kind: 'overview' }, pos: [ROOM.doorX, 1.75, r.z0 - 1.5], look: [-3, 2.3, r.zc - 4], place: [0.8, 0.0, 2.5] },
        { id: 'ribbon', label: 'The ribbon board', panel: { kind: 'section', heading: 'A real league, with real money problems' }, pos: [-0.5, 1.7, r.zc + 1.6], look: [7, 4.2, r.zc - 1.2], place: [0.7, -0.45, 2.5] },
        { id: 'bump', label: 'Bump', panel: { kind: 'section', heading: 'Bump, your AI general manager' }, pos: [-2.2, 1.8, r.zc + 0.8], look: [-7, 2.35, r.zc + 0.4], place: [1.0, -0.05, 2.4] },
        { id: 'hoop', label: 'Every game', panel: { kind: 'finale', heading: 'One login. Every game.' }, pos: [-1.6, 1.7, r.z1 + 5.2], look: [-3.5, 2.9, r.z1 + 0.2], place: [0.75, -0.1, 2.5] },
      ];
    default:
      return null;
  }
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
  artist?: string; // sculptures recreate real artworks: credit the artist
  width?: number; // sculptures: meters, to place the wall label beside them
}

// Hung in bays: each sculpture flanked by two photos, so one stop takes in
// a whole bay. Bays alternate walls down the hall, and the walk views each
// one at a slight angle, so turning from wall to wall sweeps through
// "looking ahead" instead of spinning around.
export const GALLERY_PIECES: GalleryPiece[] = [
  // Bay A, left
  { id: 'aj1', kind: 'photo', src: '/media/museum/photos/aj1hanging.jpg', side: -1, z: -16.8, y: 2.0, size: 1.5, title: 'Hung Up', note: 'Jordan 1s on a sconce' },
  { id: 'nets', kind: 'model', src: '/models/museum/tangled-nets.glb', side: -1, z: -19.2, y: 0.72, title: 'Tangled Nets', artist: 'Tyrell Winston', width: 1.5, note: 'Frayed nets in red, white and blue, hung from a brass rod' },
  { id: 'love', kind: 'photo', src: '/media/museum/photos/love.jpg', side: -1, z: -21.6, y: 2.0, size: 1.6, title: 'Love', note: 'Mural on a city wall' },
  // Bay B, right
  { id: 'moto', kind: 'photo', src: '/media/museum/photos/motoDeath.jpg', side: 1, z: -22.1, y: 2.0, size: 1.6, title: 'Last Ride', note: 'Wall mural' },
  { id: 'deflated', kind: 'model', src: '/models/museum/deflated-legends.glb', side: 1, z: -24.5, y: 1.25, title: 'Deflated Legends', artist: 'Tyrell Winston', width: 1.6, note: 'Twenty-four worn-out game balls, hung in a grid' },
  { id: 'hoody', kind: 'photo', src: '/media/museum/photos/hoody.jpg', side: 1, z: -26.9, y: 2.0, size: 1.6, title: 'Hoody', note: 'Hoodie and flag, in paint' },
  // Bay C, left
  { id: 'framehoop', kind: 'photo', src: '/media/museum/photos/framehoop.jpg', side: -1, z: -27.6, y: 2.0, size: 1.5, title: 'Frame Hoop', note: 'A hoop through the print' },
  { id: 'hoopgarden', kind: 'model', src: '/models/museum/hoop-garden.glb', side: -1, z: -30.0, y: 1.2, title: 'Hoop Garden', artist: 'Teddy Santis', width: 1.8, note: 'A backboard over four shelves of potted plants' },
  { id: 'chandelier', kind: 'photo', src: '/media/museum/photos/chandelier.jpg', side: -1, z: -32.4, y: 2.0, size: 1.6, title: 'Chandelier', note: 'Shoes hung from crystal' },
  // Bay D, right
  { id: 'surfing', kind: 'photo', src: '/media/museum/photos/surfingEvolution.jpg', side: 1, z: -32.6, y: 2.0, size: 1.7, title: 'Surfing Evolution', note: 'A painted wall by the beach' },
  { id: 'scars', kind: 'model', src: '/models/museum/scars-of-the-game.glb', side: 1, z: -35.5, y: 0.78, title: 'Shooting Hoops', artist: 'New York Sunshine', width: 1.6, note: 'A chain net hung from a field of weathered rods' },
  { id: 'vibe', kind: 'photo', src: '/media/museum/photos/vibe.jpg', side: 1, z: -38.4, y: 2.0, size: 1.7, title: 'Vibe', note: 'Building mural' },
  // Bays E and F: prints at the end of the hall
  { id: 'helmet', kind: 'photo', src: '/media/museum/photos/daHelmet.jpg', side: -1, z: -43.2, y: 2.0, size: 1.5, title: 'Helmet', note: 'One helmet, one wall' },
  { id: 'beached', kind: 'photo', src: '/media/museum/photos/beachedhoop.jpg', side: -1, z: -45.8, y: 2.0, size: 1.5, title: 'Beached Hoop', note: 'Framed print' },
  { id: 'balance', kind: 'photo', src: '/media/museum/photos/balance.jpg', side: 1, z: -43.2, y: 2.0, size: 1.6, title: 'Balance', note: 'Stacked stones in fog' },
  { id: 'hang11', kind: 'photo', src: '/media/museum/photos/hang11.jpg', side: 1, z: -45.8, y: 2.0, size: 1.5, title: 'Hang 11', note: 'A sneaker on the line' },
];

// Relic Rack stands on the floor in the middle of the hall, on its
// casters, turned a little toward the visitor walking up
export const CART = {
  x: 0, z: -40, turn: -0.35, scale: 1.12, depth: 0.4, src: '/models/museum/blue-planet-cart.glb',
  title: 'Relic Rack', artist: 'Daniel Arsham',
};

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
    id, group: 'Gallery', label: p.title, artist: p.artist,
    sub: `${p.note}. Flanked by ${piece(left).title} and ${piece(right).title}.`,
    ...bayView(p.side, p.z, p.kind === 'model' ? 1.75 : 1.9),
  };
}

export function buildStations(projects: MuseumProject[], tours: Record<string, PanelContent[]> = {}): Station[] {
  const stations: Station[] = [
    { id: 'entrance', group: 'Lobby', label: 'Sean Munley', sub: 'Selected works. Scroll to walk in.', pos: [0, EYE, 4.5], look: [0, 4.2, -14] },
    { id: 'mark', group: 'Lobby', label: 'The S', sub: 'Porcelain and gold leaf, on a marble plinth', pos: [0, 2.0, -4.2], look: [0, 1.9, -8.5] },
    { id: 'gallery', group: 'Gallery', label: 'The Gallery', sub: 'Basketball art from the mood board, under a glass roof', pos: [0, EYE, -11.5], look: [0, 3.1, -32] },
  ];
  stations.push(
    bay('nets', 'aj1', 'love'),
    bay('deflated', 'moto', 'hoody'),
    bay('hoopgarden', 'framehoop', 'chandelier'),
    bay('scars', 'surfing', 'vibe'),
    { id: 'cart', group: 'Gallery', label: CART.title, artist: CART.artist, sub: 'A rack of eroded blue balls, painted like globes', pos: [-1.2, 1.6, -36.9], look: [CART.x, 0.75, CART.z] },
    { id: 'prints-left', group: 'Gallery', label: 'Prints', sub: 'Helmet, and Beached Hoop', ...bayView(-1, -44.5, 1.95) },
    { id: 'prints-right', group: 'Gallery', label: 'Prints', sub: 'Balance, and Hang 11', ...bayView(1, -44.5, 1.95) },
  );

  ROOM_SLUGS.forEach((slug, i) => {
    const p = projects.find((x) => x.slug === slug);
    if (!p) return;
    const r = roomBounds(i);
    const tour = roomTour(slug, i);
    if (tour && tours[slug]?.length === tour.length) {
      tour.forEach((t, k) => {
        stations.push({
          id: `${slug}-${t.id}`, group: p.title, label: p.title, sub: t.label, slug,
          pos: t.pos, look: t.look, panel: k, place: t.place,
        });
        if (k === 0) stations.push(...ordinalStop(slug, r.zc, projects)); // OrdinalFrame, right after arriving
      });
      return;
    }
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
