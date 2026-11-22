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
  narrow?: { pos: V3; look: V3 }; // a different view on tall, narrow screens
  fog?: string; // fog color and range here, when not the room's
  fogRange?: [number, number];
  knock?: boolean; // the classified door: the caption offers a knock
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
  figure?: PanelFigure;
}

// A device drawn into a panel beside its text (sample data only)
export type PanelFigure = 'watch-score';

// A panel's copy comes from the case study section with this heading.
// `bullets` replaces the section's bullets when they're too long to read
// standing up, or when the stop shows something the section doesn't cover.
export type TourPanel =
  | { kind: 'overview' }
  | { kind: 'section'; heading: string; bullets?: string[] }
  | { kind: 'finale'; heading?: string; bullets?: string[]; link?: { label: string; href: string }; figure?: PanelFigure };

export interface TourStop {
  id: string;
  label: string;
  panel: TourPanel;
  pos: V3;
  look: V3;
  place: V3;
  narrow?: { pos: V3; look: V3 };
}

export function roomTour(slug: string, index: number): TourStop[] | null {
  const r = roomBounds(index);
  // Shared viewpoints: the screen on the left wall, seen at an angle so the
  // panel can float to its right, and the way out by the far doorway
  const screen = (heading: string, label = 'The screen'): TourStop => ({
    id: 'screen', label, panel: { kind: 'section', heading },
    // framed from the wall it hangs on (x0), so it holds whatever the room's width
    pos: [r.x0 + 6.4, 1.8, r.zc + 3.6], look: [r.x0, 2.4, r.zc - 1.6], place: [1.0, -0.05, 2.4],
    // phones: square on to it, far enough back to see it whole
    narrow: { pos: [r.x0 + 11.6, 1.75, r.zc + 0.4], look: [r.x0, 1.9, r.zc + 0.4] },
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
        // in through the door, the French window and its curtains ahead and to
        // the right, the lawn running down to the sea. Phones walk closer and
        // look a little down, so the view clears the card
        { ...arrive([7, 2.35, r.zc - 0.4]), narrow: { pos: [3.2, 1.75, r.zc + 1.6], look: [9, 1.5, r.zc - 0.4] } },
        { id: 'atwork', label: 'The app at work', panel: { kind: 'section', heading: 'Interactive email, without the hacks', bullets: [
          'Describe it: the AI Playground turns a plain-English prompt into an interactive build',
          'Live in the inbox: the AMP version runs right in Gmail, carousels and forms included',
          'Kineticize: drop in an old email and pick the part that should come alive',
        ] },
          // Desktop: the three screens on the back wall, left of the panel's
          // spot on the right. Phones: back far enough to see all three
          pos: [-1.88, 1.75, r.z1 + 7.5], look: [-1.88, 2.05, r.z1], place: [0.95, -0.05, 2.4],
          narrow: { pos: [-4.5, 1.75, r.z1 + 13.6], look: [-4.5, 1.15, r.z1] } },
        // the screen hangs high, over the fireplace: phones step back across the room
        { ...screen('Describe an email → get two production builds'), narrow: { pos: [2.6, 1.75, r.zc + 0.4], look: [r.x0, 2.4, r.zc + 0.4] } },
        { id: 'finale', label: 'Bolt', panel: { kind: 'finale', heading: 'Bolt: the game that markets it', link: { label: 'Play Bolt', href: 'https://bolt.kinetic.email/' } },
          pos: [4.0, 1.75, r.z1 + 5.8], look: [SALON.phoneX, 2.1, r.z1], place: [-1.05, -0.05, 2.5],
          narrow: { pos: [SALON.phoneX, 1.75, r.z1 + 9.6], look: [SALON.phoneX, 2.1, r.z1] } },
      ];
    case 'outlooksucks':
      return [
        arrive([3.6, 1.1, r.zc - 2.2]),
        { id: 'crt', label: 'The cubicle', panel: { kind: 'section', heading: 'The problem, in one ticker' }, pos: [3.2, 1.5, r.zc + 0.6], look: [4.0, 1.0, r.zc - 2.1], place: [-0.55, 0.25, 2.2] },
        screen('Edit on the email itself'),
        { id: 'ai', label: 'The AI', panel: { kind: 'section', heading: 'AI that edits, not generates', bullets: [
          'The model returns a short list of block operations, each checked against its schema: all apply, or none',
          'It writes [[PLACEHOLDER]] instead of inventing facts or links, flagged before export',
          'Every AI change is a single undo step',
        ] }, pos: [-1.2, 1.75, r.z1 + 5.6], look: [-3.9, 2.3, r.z1], place: [1.05, -0.05, 2.5] },
        { ...finale('A real Outlook template, written byte by byte'), look: [3.0, 1.9, r.z1], place: [-0.75, -0.1, 2.5] },
      ];
    case 'buddy-cup': {
      // Outdoors: out the back door onto the hole
      const C = COURSE;
      return [
        { id: 'arrive', label: 'Out on the course', panel: { kind: 'overview' }, pos: [C.doorX, 1.75, C.z0 - 1.6], look: [C.green.x - 1, 0.9, C.green.z], place: [0.95, 0.05, 2.5] },
        { id: 'green', label: 'The green', panel: { kind: 'section', heading: 'The idea' }, pos: [C.cup.x + 2.6, 1.7, C.cup.z + 9.5], look: [C.cup.x, 1.0, C.cup.z], place: [-0.95, -0.05, 2.4] },
        { id: 'bunker', label: 'The bunker', panel: { kind: 'section', heading: 'Signature features' }, pos: [C.bunker.x + 5.2, 1.7, C.bunker.z + 5.6], look: [C.bunker.x - 0.5, 0.0, C.bunker.z - 0.6], place: [0.95, 0.05, 2.4] },
        { id: 'finale', label: 'Before you go', panel: { kind: 'finale', heading: 'On the course: iPhone and Apple Watch', figure: 'watch-score' }, pos: [C.phone.x - 4.4, 1.75, C.phone.z + 6.2], look: [C.phone.x, 2.0, C.phone.z], place: [-0.95, -0.05, 2.5] },
      ];
    }
    case 'rocket-pool-tour':
      return [
        arrive([3.2, 0.9, r.zc - 1]),
        { id: 'rro', label: 'The RRO app', panel: { kind: 'section', heading: 'The RRO app: every rack, rated' }, pos: [-2.4, 1.75, r.z1 + 5.8], look: [-4.2, 2.1, r.z1], place: [1.05, -0.05, 2.5],
          narrow: { pos: [-4.2, 1.75, r.z1 + 9.6], look: [-4.2, 2.1, r.z1] } },
        { ...screen('A pitch deck for every partner'), id: 'finale', label: 'Before you go', panel: { kind: 'finale', heading: 'A pitch deck for every partner', bullets: [
          'More than two dozen bespoke decks across ten industries, all from one slide system',
          'Each deck feeds the team CRM: deal status, contacts, and every call, email and meeting logged',
        ] } },
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
        { id: 'ribbon', label: 'The ribbon board', panel: { kind: 'section', heading: 'A real league, with real money problems', bullets: [
          'Nine-category head-to-head matchups, with up to eight keepers priced by draft round',
          'The prize pool is tracked like a portfolio: point MNS at the league\'s crypto wallet and the pot is priced live',
          'Every payout is a share of the pot, so the champion\'s prize rises and falls with the market',
        ] }, pos: [1.4, 1.75, r.zc + 1.0], look: [r.x1, 2.7, r.zc - 1.9], place: [1.05, -0.15, 2.5] },
        { id: 'bump', label: 'Bump', panel: { kind: 'section', heading: 'Bump, your AI general manager' }, pos: [r.x0 + 4.8, 1.8, r.zc + 0.8], look: [r.x0, 2.35, r.zc + 0.4], place: [1.0, -0.05, 2.4] },
        { id: 'hoop', label: 'Every game', panel: { kind: 'finale', heading: 'One login. Every game.' }, pos: [-1.7, 1.7, r.z1 + 6.0], look: [-1.75, 2.45, r.z1 + 0.2], place: [1.1, -0.1, 2.5],
          narrow: { pos: [-3.5, 1.8, r.z1 + 8.8], look: [-3.5, 2.95, r.z1 + 0.2] } },
      ];
    default:
      return null;
  }
}

export const LOBBY = { x0: -9, x1: 9, z0: 6, z1: -14, h: 12 };
export const GALLERY = { x0: -6, x1: 6, z0: -14, z1: -48, h: 8 };
// 18 m square: room to stand back from the work, so walls don't stream past
export const ROOM = { width: 18, depth: 18, h: 6, doorX: 1.8, doorW: 3.2, doorH: 3.6 };

// The Kinetic room is a Haussmann salon (haussmann.ts): a taller ceiling,
// and the right wall opened into a French window, centered on the room.
// win.open is how far its leaves swing in (180 would lie flat on the wall).
export const SALON = {
  h: 7.5,
  win: { w: 4.0, h: 5.2, leaf: 4.2, open: 172 },
  chandelier: { y: 5.1 },
  // the app screens along the back wall, left of the door (centers, x)
  screens: [-6.79, -4.585, -2.295],
  screenY: 2.25,
  phoneX: 6.3, // Bolt, in the bay right of the door
  tvY: 2.95, // the room's own screen, over the fireplace
};
// The coast: the course's grass rolls down the museum's right side to a
// beach, and the ocean beyond. coastX(z) is where the grass ends; the sea
// starts at SEA_X. Seen from the salon's window and from the golf hole.
export const SEA_X = 104;
export const SEA_Y = -9; // the land falls away to the beach: from the museum you see over the water
export const coastX = (z: number) => 86 + 10 * Math.sin(z * 0.025) + 5 * Math.sin(z * 0.061 + 1);

// Room order follows the project grid on the home page, except Buddy Cup:
// its room is outdoors, so it comes last, out the museum's back door
export const ROOM_SLUGS = [
  'kinetic-email',
  'money-never-sleeps',
  'outlooksucks',
  'rocket-pool-tour',
  'human-diet',
  'buddy-cup',
] as const;
export const OUTDOOR_SLUG = 'buddy-cup';

// Buddy Cup's hole, out the back door (world coordinates). z0 is the
// building's back wall; the course runs away from it toward -z.
const COURSE_Z0 = GALLERY.z1 - ROOM.depth * ROOM_SLUGS.indexOf(OUTDOOR_SLUG);
export const COURSE = {
  z0: COURSE_Z0,
  doorX: ROOM.doorX,
  green: { x: -1.5, z: COURSE_Z0 - 19, rx: 9.5, rz: 7, rot: 0.15 },
  cup: { x: 0.6, z: COURSE_Z0 - 20 },
  bunker: { x: -11.4, z: COURSE_Z0 - 12.2, rx: 5.4, rz: 2.6, rot: 0.45 },
  tree: { x: -15, z: COURSE_Z0 - 50 },
  phone: { x: 9.2, z: COURSE_Z0 - 14.5, rotY: -0.5 },
};

// The bunker under the bunker: a steel hatch open in the sand trap, stairs
// down, and a short concrete corridor to a door. Laid out in its own frame:
// u runs down the stairs (along the trap's long axis, the way you walk in
// from the green), v across, origin at the trap's center.
export const VAULT = {
  theta: Math.PI - COURSE.bunker.rot, // the frame's turn about y
  half: 0.8, // half the stairwell's width
  open: [-2.2, 2.4] as const, // the hatch opening, in u
  end: 6.8, // the door's wall
  floor: -4.2,
  ceil: -1.6, // the corridor's ceiling
};
export function vaultPoint(u: number, v: number, y: number): V3 {
  const c = Math.cos(VAULT.theta), s = Math.sin(VAULT.theta);
  return [COURSE.bunker.x + u * c + v * s, y, COURSE.bunker.z - u * s + v * c];
}

// OrdinalFrame closes the gallery: on the end wall, left of the doorway
// into the rooms, the last piece of art before the projects. z is the
// wall's face (the partition is 0.4 thick); it faces back down the hall.
export const ORDINAL = { slug: 'ordinalframe', x: -3, z: GALLERY.z1 + 0.2, y: 1.95, src: '/models/museum/gold-frame.glb' };

// Every project the museum shows a placard for
export const PLACARD_SLUGS: readonly string[] = [...ROOM_SLUGS, ORDINAL.slug];

export function roomBounds(index: number) {
  const z0 = GALLERY.z1 - ROOM.depth * index;
  const z1 = z0 - ROOM.depth;
  return { x0: -ROOM.width / 2, x1: ROOM.width / 2, z0, z1, zc: (z0 + z1) / 2, h: ROOM_SLUGS[index] === 'kinetic-email' ? SALON.h : ROOM.h };
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
  labelY?: number; // wall label height, when two pieces share one wall
}

// Photos only. Each wall hangs a print every
// 5.6 m, the right wall offset half a step, so walking down the middle the
// eye moves left, right, left.
const PITCH = 5.6;
const L = (k: number) => -16.5 - PITCH * k;
const R = (k: number) => -16.5 - PITCH / 2 - PITCH * k;

export const GALLERY_PIECES: GalleryPiece[] = [
  // Left wall
  { id: 'aj1', kind: 'photo', src: '/media/museum/photos/aj1hanging.jpg', side: -1, z: L(0), y: 2.0, size: 1.5, title: 'Hung Up', note: 'Jordan 1s on a sconce' },
  { id: 'love', kind: 'photo', src: '/media/museum/photos/love.jpg', side: -1, z: L(1), y: 2.0, size: 1.6, title: 'Love', note: 'Mural on a city wall' },
  { id: 'framehoop', kind: 'photo', src: '/media/museum/photos/framehoop.jpg', side: -1, z: L(2), y: 2.0, size: 1.5, title: 'Frame Hoop', note: 'A hoop through the print' },
  { id: 'chandelier', kind: 'photo', src: '/media/museum/photos/chandelier.jpg', side: -1, z: L(3), y: 2.0, size: 1.6, title: 'Chandelier', note: 'Shoes hung from crystal' },
  { id: 'beached', kind: 'photo', src: '/media/museum/photos/beachedhoop.jpg', side: -1, z: L(4), y: 2.0, size: 1.5, title: 'Beached Hoop', note: 'Framed print' },
  // Right wall
  { id: 'moto', kind: 'photo', src: '/media/museum/photos/motoDeath.jpg', side: 1, z: R(0), y: 2.0, size: 1.6, title: 'Last Ride', note: 'Wall mural' },
  { id: 'hoody', kind: 'photo', src: '/media/museum/photos/hoody.jpg', side: 1, z: R(1), y: 2.0, size: 1.6, title: 'Hoody', note: 'Hoodie and flag, in paint' },
  { id: 'surfing', kind: 'photo', src: '/media/museum/photos/surfingEvolution.jpg', side: 1, z: R(2), y: 2.0, size: 1.7, title: 'Surfing Evolution', note: 'A painted wall by the beach' },
  { id: 'vibe', kind: 'photo', src: '/media/museum/photos/vibe.jpg', side: 1, z: R(3), y: 2.0, size: 1.7, title: 'Vibe', note: 'Building mural' },
  { id: 'hang11', kind: 'photo', src: '/media/museum/photos/hang11.jpg', side: 1, z: R(4), y: 2.0, size: 1.5, title: 'Hang 11', note: 'A sneaker on the line' },
];

// Scroll per stop, in screen heights: room to linger at each piece
export const STEP = 1.35;

const EYE = 1.7;

// A bay seen from the middle of the hall, a little before it, so the view
// angles down the hall rather than square onto the wall.
// Phones see a narrow slice: an angled view down the wall fits both prints.
function bayView(side: -1 | 1, z: number, y = 1.8): Pick<Station, 'pos' | 'look' | 'narrow'> {
  return { pos: [side * 2.0, EYE, z + 1.9], look: [side * 6, y, z], narrow: { pos: [-side * 2.5, EYE, z + 9.3], look: [side * 6, y + 0.1, z + 0.45] } };
}

function piece(id: string) {
  return GALLERY_PIECES.find((p) => p.id === id)!;
}

export function buildStations(projects: MuseumProject[], tours: Record<string, PanelContent[]> = {}): Station[] {
  const stations: Station[] = [
    { id: 'entrance', group: 'Lobby', label: 'Sean Munley', sub: 'Selected works. Scroll to walk in.', pos: [0, EYE, 4.5], look: [0, 4.2, -14] },
    { id: 'mark', group: 'Lobby', label: 'The S', sub: 'Porcelain and gold leaf, on a marble plinth', pos: [0, 2.0, -4.2], look: [0, 1.9, -8.5] },
    { id: 'gallery', group: 'Gallery', label: 'The Gallery', sub: 'Prints from the mood board, under a glass roof', pos: [0, EYE, -11.5], look: [0, 3.1, -32] },
  ];
  stations.push(
    { id: 'prints-right', group: 'Gallery', label: 'Prints', sub: 'Hoody and Surfing Evolution', ...bayView(1, (piece('hoody').z + piece('surfing').z) / 2, 1.95) },
    { id: 'prints-left', group: 'Gallery', label: 'Prints', sub: 'Chandelier and Beached Hoop', ...bayView(-1, (piece('chandelier').z + piece('beached').z) / 2, 1.95) },
    ...ordinalStop(projects),
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
          pos: t.pos, look: t.look, panel: k, place: t.place, narrow: t.narrow,
        });
      });
      return;
    }
    stations.push(
      { id: `${slug}-enter`, group: p.title, label: p.title, sub: ROOM_NOTES[slug] ?? '', slug, pos: [ROOM.doorX, 1.75, r.z0 - 1.5], look: enterLook(slug, r.zc) },
      { id: `${slug}-screen`, group: p.title, label: p.title, sub: 'Open the placard to read about it', slug, pos: [r.x0 + 4.8, 1.8, r.zc + 0.8], look: [r.x0, 2.35, r.zc + 0.4] },
    );
  });
  // Past the last room, in the trap beside the green: the hatch, then down
  // the stairs to the door of the classified projects
  if (stations.some((st) => st.slug === OUTDOOR_SLUG)) {
    stations.push(
      { id: 'bunker-hatch', group: 'Classified', label: 'The bunker', sub: 'Every course has one. This one goes down.',
        pos: vaultPoint(-3.7, 0.15, 1.85), look: vaultPoint(1.2, 0, -2.6), fog: '#c3d0da', fogRange: [32, 185],
        narrow: { pos: vaultPoint(-5.4, 0.1, 2.5), look: vaultPoint(1.0, 0, -2.6) } },
      { id: 'bunker-door', group: 'Classified', label: 'Classified', sub: 'Members only. Knock, and have the password ready.',
        pos: vaultPoint(3.3, 0, VAULT.floor + 1.7), look: vaultPoint(VAULT.end, 0, VAULT.floor + 1.25), fog: '#17130f', fogRange: [6, 32], knock: true },
    );
  }
  return stations;
}

function ordinalStop(projects: MuseumProject[]): Station[] {
  const p = projects.find((x) => x.slug === ORDINAL.slug);
  if (!p) return [];
  return [{
    id: 'ordinalframe', group: 'Gallery', label: p.title, slug: p.slug,
    sub: 'Bitcoin Ordinals on a Raspberry Pi, in a gold frame',
    // centered on the frame, far enough back that a phone fits it whole
    pos: [ORDINAL.x + 0.2, 1.75, ORDINAL.z + 5.2], look: [ORDINAL.x + 0.2, ORDINAL.y - 0.15, ORDINAL.z],
  }];
}

// Where each room's entrance view points: at the thing that makes the room
function enterLook(slug: string, zc: number): V3 {
  switch (slug) {
    case 'kinetic-email': return [7, 2.7, zc - 0.4]; // the French window
    case 'money-never-sleeps': return [-3, 2.4, zc - 4]; // the hoop and ribbon board
    case 'outlooksucks': return [3.6, 1.1, zc - 2.2]; // into the cubicle
    case 'rocket-pool-tour': return [3.2, 0.9, zc - 1]; // the table
    case 'human-diet': return [3.6, 1.0, zc - 1.2]; // the diorama
    default: return [-3, 2.0, zc - 2];
  }
}

export const ROOM_NOTES: Record<string, string> = {
  'kinetic-email': 'A Paris salon, with interactive email at work on the wall',
  'money-never-sleeps': 'Center court, with the market on the ribbon board',
  outlooksucks: 'A cubicle, circa 2007. Outlook is still rendering.',
  'buddy-cup': 'Out the back door, onto the course. Match play, scored live.',
  'rocket-pool-tour': 'The pool hall: a pro billiards league, start to finish',
  'human-diet': 'A natural history diorama, 300,000 years of eating',
};
