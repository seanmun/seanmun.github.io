// File: src/components/museum/engine.ts
// Purpose: The museum's three.js runtime. Builds the building from
// layout.ts, hangs the art, dresses each project room, and flies the camera
// along the station route as the page scrolls.
// - Scroll position s (in screens) maps to the route: the camera eases out
//   of one station and settles into the next, so it dwells at each stop.
// - Videos load only when their room is near and play only while it is.
// - Placards and screens are clickable; the click is handed to React,
//   which opens the HTML placard (readable, accessible, indexable).

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { CSS3DObject, CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { buildTrees } from './trees';
import { createPost } from './post';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import * as T from './textures';
import {
  CART, GALLERY, GALLERY_PIECES, LOBBY, ORDINAL, ROOM, ROOM_SLUGS, roomBounds,
  type MuseumProject, type Station, type V3,
} from './layout';

export interface MuseumHandle {
  setScroll(s: number): void;
  // Pixels covered by the info sheet at the bottom of a narrow screen: the
  // view shifts its center up into the open area above it
  setInset(px: number): void;
  dispose(): void;
}

interface Options {
  stations: Station[];
  projects: MuseumProject[];
  ordinals: string[]; // the owner's own inscriptions; generated stand-ins if empty
  panels: { station: number; element: HTMLElement }[]; // hologram panels, rendered by React
  reduceMotion: boolean;
  onPlacard(slug: string): void;
  onProgress(loaded: number, total: number): void;
}

const WALL_T = 0.4;

type Mat = THREE.MeshStandardMaterial & { userData: { tile?: number } };

function std(map: THREE.Texture | null, tile: number, params: THREE.MeshStandardMaterialParameters = {}): Mat {
  const m = new THREE.MeshStandardMaterial({ map, roughness: 0.85, ...params }) as Mat;
  m.userData.tile = tile;
  return m;
}

// UVs from world position, so one texture tiles at true scale on any box
function worldUV(geo: THREE.BufferGeometry, tile: number) {
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const ax = Math.abs(nor.getX(i)), ay = Math.abs(nor.getY(i)), az = Math.abs(nor.getZ(i));
    let u: number, v: number;
    if (ax >= ay && ax >= az) { u = pos.getZ(i) * -Math.sign(nor.getX(i)); v = pos.getY(i); }
    else if (ay >= az) { u = pos.getX(i); v = pos.getZ(i); }
    else { u = pos.getX(i) * Math.sign(nor.getZ(i)); v = pos.getY(i); }
    uv[i * 2] = u / tile;
    uv[i * 2 + 1] = v / tile;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}

export function createMuseum(host: HTMLElement, opts: Options): MuseumHandle {
  const { stations, projects, reduceMotion } = opts;
  const mobile = window.matchMedia('(max-width: 768px)').matches;

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  // Desktop starts at up to 1.5x and steps down if the frame rate can't keep
  // up (see the loop): post-processing at full Retina density is ~4x the work
  let pixelRatio = Math.min(window.devicePixelRatio, 1.5);
  renderer.setPixelRatio(pixelRatio);
  // Khronos PBR Neutral: true to the art's and screens' colors, where ACES
  // shifts saturated reds and blues
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = mobile ? 1.0 : 0.8; // phones have no sun shadows, bloom or grading
  // Real shadows from the gallery spotlights: what makes the sculptures
  // read as objects on a wall rather than pictures of them. Off on phones.
  renderer.shadowMap.enabled = !mobile;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  host.appendChild(renderer.domElement);
  // Fit the canvas to its host: its pixel buffer is sized for the screen's
  // density, and without this a high-density screen shows only its top-left
  Object.assign(renderer.domElement.style, { display: 'block', width: '100%', height: '100%' });
  renderer.domElement.setAttribute('aria-hidden', 'true');

  // Hologram panels are real HTML placed in the scene: crisp text, links
  // that work, and readable by assistive tech, yet they sit in the room
  const cssRenderer = new CSS3DRenderer();
  Object.assign(cssRenderer.domElement.style, { position: 'absolute', inset: '0', pointerEvents: 'none' });
  host.appendChild(cssRenderer.domElement);
  const cssScene = new THREE.Scene();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#d9d5ce');
  scene.fog = new THREE.Fog('#d9d5ce', 22, 75);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = mobile ? 0.38 : 0.3;

  const camera = new THREE.PerspectiveCamera(55, 1, 0.05, 200);
  const disposables: { dispose(): void }[] = [];
  const track = <X extends { dispose(): void }>(x: X) => { disposables.push(x); return x; };

  // ---------- building blocks ----------

  function slab(min: V3, max: V3, material: THREE.Material | THREE.Material[], tile?: number) {
    const size = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
    const g = new THREE.BoxGeometry(size[0], size[1], size[2]);
    g.translate((min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2);
    const first = Array.isArray(material) ? material[4] : material;
    worldUV(g, tile ?? (first as Mat).userData?.tile ?? 4);
    track(g);
    const mesh = new THREE.Mesh(g, material);
    mesh.receiveShadow = true;
    mesh.castShadow = true; // the building blocks the sun; light only gets in through openings
    scene.add(mesh);
    return mesh;
  }

  type Win = { y0: number; y1: number; w: number; zs: number[] };
  type Hole = { x0: number; x1: number; z0: number; z1: number };
  const openings: { side: number; x: number; y0: number; y1: number; z0: number; z1: number }[] = [];

  // A side wall (thickness along x) with an optional band of windows
  function sideWall(xa: number, xb: number, z1: number, z0: number, h: number, mat: Mat, side: number, win?: Win) {
    if (!win) { slab([xa, 0, z1], [xb, h, z0], mat); return; }
    slab([xa, 0, z1], [xb, win.y0, z0], mat);
    slab([xa, win.y1, z1], [xb, h, z0], mat);
    const spans = win.zs.map((z) => [z - win.w / 2, z + win.w / 2]).sort((a, b) => a[0] - b[0]);
    let at = z1;
    for (const [a, b] of spans) {
      if (a > at) slab([xa, win.y0, at], [xb, win.y1, a], mat);
      openings.push({ side, x: side < 0 ? xb : xa, y0: win.y0, y1: win.y1, z0: a, z1: b });
      at = b;
    }
    if (z0 > at) slab([xa, win.y0, at], [xb, win.y1, z0], mat);
  }

  // A ceiling with rectangular skylight holes cut through it
  function ceiling(x0: number, x1: number, z1: number, z0: number, y: number, mat: Mat, holes: Hole[] = []) {
    const xs = [...new Set([x0, x1, ...holes.flatMap((h) => [h.x0, h.x1])])].sort((a, b) => a - b);
    for (let i = 0; i < xs.length - 1; i++) {
      const [a, b] = [xs[i], xs[i + 1]];
      const inStrip = holes.filter((h) => h.x0 <= a && h.x1 >= b).sort((p, q) => p.z1 - q.z1);
      let at = z1;
      for (const h of inStrip) {
        if (h.z1 > at) slab([a, y, at], [b, y + 0.3, h.z1], mat);
        at = h.z0;
      }
      if (z0 > at) slab([a, y, at], [b, y + 0.3, z0], mat);
    }
  }

  // A space: floor, ceiling and side walls. Front and back walls are
  // partitions, shared with the neighboring space.
  function space(b: { x0: number; x1: number; z0: number; z1: number; h: number }, wall: Mat, floor: Mat, ceil: Mat,
    opts: { windows?: Win; skylights?: Hole[] } = {}) {
    slab([b.x0 - WALL_T, -0.2, b.z1], [b.x1 + WALL_T, 0, b.z0], floor);
    ceiling(b.x0 - WALL_T, b.x1 + WALL_T, b.z1, b.z0, b.h, ceil, opts.skylights);
    sideWall(b.x0 - WALL_T, b.x0, b.z1, b.z0, b.h, wall, -1, opts.windows);
    sideWall(b.x1, b.x1 + WALL_T, b.z1, b.z0, b.h, wall, 1, opts.windows);
    // shadow gap where wall meets floor: the detail that makes walls read as built
    box([0.012, 0.05, b.z0 - b.z1 - WALL_T], [b.x0 + 0.006, 0.025, (b.z0 + b.z1) / 2], reveal);
    box([0.012, 0.05, b.z0 - b.z1 - WALL_T], [b.x1 - 0.006, 0.025, (b.z0 + b.z1) / 2], reveal);
  }

  // A wall across z, with an optional doorway. near faces +z, far faces -z.
  function partition(z: number, x0: number, x1: number, h: number, near: Mat, far: Mat, door?: { x: number; w: number; h: number }) {
    const mats = [near, near, near, near, near, far];
    const z0 = z - WALL_T / 2, z1 = z + WALL_T / 2;
    if (!door) { slab([x0, 0, z0], [x1, h, z1], mats); return; }
    slab([x0, 0, z0], [door.x - door.w / 2, h, z1], mats);
    slab([door.x + door.w / 2, 0, z0], [x1, h, z1], mats);
    slab([door.x - door.w / 2, door.h, z0], [door.x + door.w / 2, h, z1], mats);
  }

  function plane(w: number, h: number, material: THREE.Material, pos: V3, rotY = 0) {
    const g = track(new THREE.PlaneGeometry(w, h));
    const m = new THREE.Mesh(g, material);
    m.position.set(...pos);
    m.rotation.y = rotY;
    scene.add(m);
    return m;
  }

  function box(size: V3, pos: V3, material: THREE.Material, parent: THREE.Object3D = scene) {
    const m = new THREE.Mesh(track(new THREE.BoxGeometry(...size)), material);
    m.position.set(...pos);
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }

  const reveal = track(new THREE.MeshBasicMaterial({ color: '#1e1d1b' }));
  const color = (c: string, p: THREE.MeshStandardMaterialParameters = {}) => track(new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...p }));
  const basic = (map: THREE.Texture, transparent = false) => track(new THREE.MeshBasicMaterial({ map, transparent, toneMapped: false }));

  // ---------- materials ----------

  const tex = {
    concrete: track(T.concrete('#a8a59f', 1)),
    marble: track(T.marble(4)),
    plaster: track(T.plaster('#e9e5de')),
    polished: track(T.polished('#77736d')),
  };
  const M = {
    concrete: std(tex.concrete, 4.8, { roughness: 0.92 }),
    marbleFloor: std(tex.marble, 3, { roughness: 0.22 }),
    plaster: std(tex.plaster, 4, { roughness: 0.95 }),
    polished: std(tex.polished, 6, { roughness: 0.35 }),
    ceiling: std(track(T.plaster('#f6f4f0', 12)), 4, { roughness: 1 }),
  };
  Object.values(M).forEach(track);

  // ---------- lobby ----------

  const LOBBY_SKYLIGHTS: Hole[] = [-5, 0, 5].map((x) => ({ x0: x - 0.55, x1: x + 0.55, z0: 4, z1: -12 }));
  space(LOBBY, M.concrete, M.marbleFloor, M.concrete, { skylights: LOBBY_SKYLIGHTS });
  partition(LOBBY.z0, LOBBY.x0 - WALL_T, LOBBY.x1 + WALL_T, LOBBY.h, M.concrete, M.concrete);
  partition(LOBBY.z1, LOBBY.x0 - WALL_T, LOBBY.x1 + WALL_T, LOBBY.h, M.concrete, M.plaster, { x: 0, w: 4.2, h: 5.2 });

  // Skylights: open slots to the sky, with soft shafts of light below
  const shaftTex = track(T.shaftGradient());
  const shaftMat = track(new THREE.MeshBasicMaterial({
    map: shaftTex, color: '#fff3dc', transparent: true, opacity: 0.07, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false,
  }));
  for (const x of [-5, 0, 5]) {
    for (const r of [0, Math.PI / 2]) {
      const s = plane(1.4, 13, shaftMat, [x + 1.1, LOBBY.h / 2 - 0.3, -4], r);
      s.rotation.z = 0.18;
      s.renderOrder = 2;
    }
  }

  // The sun: high in the east-southeast. On desktop it casts
  // shadows from the whole building, so it only lands where an opening lets
  // it in. Phones skip shadows and keep the old soft fill instead.
  const SUN_DIR = new THREE.Vector3(0.5, 0.78, 0.38).normalize(); // about 50° up
  const MUSEUM_CENTER = new THREE.Vector3(0, 0, -63);
  let sunDirty = 150; // frames left to re-render the sun's shadow
  const sun = new THREE.DirectionalLight('#fff1dc', mobile ? 1.4 : 6.5);
  sun.position.copy(MUSEUM_CENTER).addScaledVector(SUN_DIR, 90);
  sun.target.position.copy(MUSEUM_CENTER);
  if (!mobile) {
    sun.castShadow = true;
    sun.shadow.mapSize.set(4096, 4096);
    const cam = sun.shadow.camera;
    cam.left = -80; cam.right = 80; cam.top = 80; cam.bottom = -80; cam.near = 10; cam.far = 200;
    sun.shadow.bias = -0.0003;
    sun.shadow.normalBias = 0.04;
    sun.shadow.radius = 3;
    // The building doesn't move, so this big shadow re-renders only for a few
    // seconds after the page opens and after each model arrives (see tick)
    sun.shadow.autoUpdate = false;
  }
  scene.add(sun, sun.target);
  // Less fill on desktop, so sunlit and shaded areas read as daylight does
  scene.add(new THREE.HemisphereLight('#eef2f6', '#4a4741', mobile ? 0.6 : 0.5));

  // A physically based sky outside every opening, with the sun in it
  const sky = new Sky();
  sky.scale.setScalar(150);
  const skyU = sky.material.uniforms;
  skyU.turbidity.value = 4;
  skyU.rayleigh.value = 1.2;
  skyU.mieCoefficient.value = 0.004;
  skyU.mieDirectionalG.value = 0.8;
  skyU.sunPosition.value.copy(SUN_DIR);
  scene.add(sky);

  // Name on the wall over the gallery door
  const name = T.lettering('SEAN MUNLEY', { size: 150, weight: 200, sub: 'Selected works', color: '#3b3935' });
  track(name.texture);
  plane(7.5, 7.5 / name.aspect, basic(name.texture, true), [0, 7.4, LOBBY.z1 + WALL_T / 2 + 0.02]);

  // Plinth for the S
  const plinthMat = std(track(T.marble(8, '#f3f1ec', '150,146,140')), 1.5, { roughness: 0.3 });
  track(plinthMat);
  box([1.1, 1.1, 1.1], [0, 0.55, -8.5], plinthMat);
  const blobMat = track(new THREE.MeshBasicMaterial({ map: track(T.blob()), transparent: true, depthWrite: false, opacity: 0.55 }));
  const blob = (x: number, z: number, size: number) => {
    const b = plane(size, size, blobMat, [x, 0.004, z]);
    b.rotation.x = -Math.PI / 2;
  };
  blob(0, -8.5, 2.6);
  const sPivot = new THREE.Group();
  sPivot.position.set(0, 1.1, -8.5);
  scene.add(sPivot);
  const sKey = new THREE.SpotLight('#fff6e8', 60, 14, 0.42, 0.7, 1.5);
  sKey.castShadow = !mobile;
  sKey.shadow.mapSize.set(1024, 1024);
  sKey.shadow.bias = -0.0004;
  sKey.shadow.normalBias = 0.02;
  sKey.shadow.radius = 5;
  sKey.position.set(2.5, 8, -5);
  sKey.target.position.set(0, 1.8, -8.5);
  scene.add(sKey, sKey.target);

  // ---------- gallery ----------

  // An atrium: nearly the whole ceiling is glass on a steel grid, so the sun
  // pours in from above and lays the grid's shadow across the floor and walls
  const ATRIUM: Hole = { x0: GALLERY.x0 + 0.5, x1: GALLERY.x1 - 0.5, z0: GALLERY.z0 - 0.6, z1: GALLERY.z1 + 0.6 };
  space(GALLERY, M.plaster, M.polished, M.ceiling, { skylights: [ATRIUM] });
  {
    const steel = color('#2a2c2f', { roughness: 0.5, metalness: 0.75 });
    const y = GALLERY.h;
    const w = ATRIUM.x1 - ATRIUM.x0, len = ATRIUM.z0 - ATRIUM.z1, zc = (ATRIUM.z0 + ATRIUM.z1) / 2;
    // Deep cross beams every 2.4 m, and lighter rafters running the length
    const beams = Math.round(len / 2.4);
    for (let i = 0; i <= beams; i++) {
      box([w + 0.3, 0.5, 0.16], [0, y + 0.05, ATRIUM.z1 + (i * len) / beams], steel).castShadow = true;
    }
    for (let k = 0; k <= 6; k++) {
      box([0.09, 0.22, len], [ATRIUM.x0 + (k * w) / 6, y + 0.2, zc], steel).castShadow = true;
    }
    const roofGlass = plane(w, len, track(new THREE.MeshStandardMaterial({
      color: '#dcebf2', transparent: true, opacity: 0.12, roughness: 0.04, metalness: 0.1, depthWrite: false, side: THREE.DoubleSide,
    })), [0, y + 0.32, zc]);
    roofGlass.rotation.x = -Math.PI / 2;
  }

  // Big trees outside the gallery, their crowns hanging over the glass.
  // Nothing may grow inside the lobby, the gallery or a room.
  const inside = (p: THREE.Vector3) =>
    (p.z > LOBBY.z1 - 0.5 && p.z < LOBBY.z0 + 0.5 && Math.abs(p.x) < LOBBY.x1 + 0.6 && p.y < LOBBY.h + 0.4) ||
    (p.z > GALLERY.z1 && p.z < GALLERY.z0 + 0.5 && Math.abs(p.x) < GALLERY.x1 + 0.6 && p.y < GALLERY.h + 0.6) ||
    (p.z < GALLERY.z1 + 0.5 && Math.abs(p.x) < ROOM.width / 2 + 0.6 && p.y < ROOM.h + 0.4);
  disposables.push(buildTrees(scene, [
    { x: -9.8, z: -22, lean: 1, seed: 11 },
    { x: -9.8, z: -38, lean: 1, seed: 23 },
    { x: 9.8, z: -27, lean: -1, seed: 37 },
    { x: 9.8, z: -42, lean: -1, seed: 41 },
  ], inside));
  // Track lights hang just under the atrium's beams
  const trackMat = color('#2a2a2a', { roughness: 0.5, metalness: 0.6 });
  for (const x of [-3, 3]) box([0.06, 0.06, 33], [x, GALLERY.h - 0.35, (GALLERY.z0 + GALLERY.z1) / 2], trackMat);

  // ---------- windows: glass, mullions, and sun through them ----------

  const glass = track(new THREE.MeshStandardMaterial({
    color: '#dfeef5', transparent: true, opacity: 0.1, roughness: 0.05, metalness: 0.1, depthWrite: false,
  }));
  const mullion = color('#2b2d30', { roughness: 0.45, metalness: 0.7 });
  const sunShaftMat = track(new THREE.MeshBasicMaterial({
    map: shaftTex, color: '#ffe9c4', transparent: true, opacity: mobile ? 0 : 0.06, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false,
  }));
  for (const o of openings) {
    const zc = (o.z0 + o.z1) / 2, yc = (o.y0 + o.y1) / 2, w = o.z1 - o.z0, h = o.y1 - o.y0;
    const pane = plane(w, h, glass, [o.x - o.side * 0.12, yc, zc], o.side < 0 ? Math.PI / 2 : -Math.PI / 2);
    pane.castShadow = false;
    const mx = o.x - o.side * 0.14;
    for (const dz of [-w / 2, -w / 6, w / 6, w / 2]) box([0.06, h, 0.06], [mx, yc, zc + dz], mullion).castShadow = true;
    for (const y of [o.y0, yc, o.y1]) box([0.06, 0.06, w], [mx, y, zc], mullion).castShadow = true;
    // A dusty shaft of sun from each window facing it, down to the floor
    if (Math.sign(SUN_DIR.x) !== o.side) continue;
    const top = [[o.y1, o.z0], [o.y1, o.z1], [o.y0, o.z1], [o.y0, o.z0]];
    const pos: number[] = [], uv: number[] = [];
    const corner = (y: number, z: number, t: number) => {
      const len = (y / SUN_DIR.y) * t;
      return [o.x - SUN_DIR.x * len, y - SUN_DIR.y * len, z - SUN_DIR.z * len];
    };
    for (let k = 0; k < 4; k++) {
      const [ya, za] = top[k], [yb, zb] = top[(k + 1) % 4];
      const quad = [corner(ya, za, 0), corner(yb, zb, 0), corner(yb, zb, 1), corner(ya, za, 1)];
      for (const i of [0, 1, 2, 0, 2, 3]) pos.push(...quad[i]);
      uv.push(0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0);
    }
    const g = track(new THREE.BufferGeometry());
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    const shaft = new THREE.Mesh(g, sunShaftMat);
    shaft.renderOrder = 2;
    scene.add(shaft);
  }

  // ---------- project rooms ----------

  const videoScreens: { index: number; video: HTMLVideoElement; src: string; mat: THREE.MeshBasicMaterial; loaded: boolean }[] = [];
  const animators: ((t: number, dt: number) => void)[] = [];
  const clickable: THREE.Object3D[] = [];

  const roomStyle: Record<string, { wall: Mat; floor: Mat | null; ceil: Mat; fog: string }> = {
    'kinetic-email': { wall: M.plaster, floor: M.polished, ceil: M.ceiling, fog: '#d9d5ce' },
    'money-never-sleeps': { wall: std(track(T.grain('#18233f', 7)), 4), floor: null, ceil: std(track(T.grain('#10172b', 8)), 4), fog: '#1b2338' },
    outlooksucks: { wall: std(track(T.grain('#cbc3ae', 9)), 4), floor: std(track(T.grain('#56606b', 10, 0.18)), 2), ceil: std(track(T.grain('#ecebe6', 11)), 4), fog: '#c9c4b5' },
    'buddy-cup': { wall: std(track(T.grain('#232625', 12)), 4), floor: std(track(T.turf()), 2), ceil: std(track(T.grain('#1a1c1b', 13)), 4), fog: '#1f2321' },
    'rocket-pool-tour': { wall: std(track(T.grain('#1c2a23', 14)), 4), floor: std(track(T.grain('#3b2717', 15, 0.12)), 3, { roughness: 0.5 }), ceil: std(track(T.grain('#141c18', 16)), 4), fog: '#1a221e' },
    'human-diet': { wall: std(track(T.grain('#c6ab84', 17)), 4), floor: std(track(T.grain('#b39770', 18, 0.14)), 3), ceil: std(track(T.grain('#d8c7a8', 19)), 4), fog: '#c9b391' },
  };
  Object.values(roomStyle).forEach((s) => { track(s.wall); if (s.floor) track(s.floor); track(s.ceil); });

  // Gallery to first room
  partition(GALLERY.z1, -ROOM.width / 2 - WALL_T, ROOM.width / 2 + WALL_T, GALLERY.h, M.plaster, roomStyle[ROOM_SLUGS[0]].wall,
    { x: ROOM.doorX, w: ROOM.doorW, h: ROOM.doorH });

  const screenFrame = color('#0d0d0d', { roughness: 0.4 });
  const placardFrame = color('#1b1a18', { roughness: 0.5 });
  const loader = new THREE.TextureLoader();

  ROOM_SLUGS.forEach((slug, i) => {
    const r = roomBounds(i);
    const style = roomStyle[slug];
    const p = projects.find((x) => x.slug === slug);
    space(r, style.wall, style.floor ?? M.polished, style.ceil);
    const next = ROOM_SLUGS[i + 1];
    partition(r.z1, r.x0 - WALL_T, r.x1 + WALL_T, ROOM.h, style.wall, next ? roomStyle[next].wall : style.wall,
      next ? { x: ROOM.doorX, w: ROOM.doorW, h: ROOM.doorH } : undefined);

    // Room name over its doorway, on the side you approach from
    if (p) {
      const dark = i > 0 ? ['money-never-sleeps', 'buddy-cup', 'rocket-pool-tour'].includes(ROOM_SLUGS[i - 1]) : false;
      const label = T.lettering(p.title.toUpperCase(), { size: 90, weight: 400, color: dark ? '#e9e5dc' : '#2b2a28', spacing: 0.25 });
      track(label.texture);
      const w = Math.min(4.2, 0.42 * label.aspect);
      plane(w, w / label.aspect, basic(label.texture, true), [ROOM.doorX, ROOM.doorH + 0.55, r.z0 + WALL_T / 2 + 0.02]);
    }

    // Room light
    const lamp = new THREE.PointLight('#fff1dc', slug === 'buddy-cup' || slug === 'rocket-pool-tour' ? 14 : 26, 0, 1.6);
    lamp.position.set(0, ROOM.h - 0.6, r.zc);
    scene.add(lamp);

    // The screen on the left wall, and the placard to its right
    const screenZ = r.zc + 0.4;
    const screenH = slug === 'buddy-cup' ? 3.2 : 2.5;
    const screenGroup = new THREE.Group();
    screenGroup.position.set(r.x0 + 0.06, 2.45, screenZ);
    screenGroup.rotation.y = Math.PI / 2;
    scene.add(screenGroup);
    const bezel = box([1, 1, 0.08], [0, 0, -0.02], screenFrame, screenGroup);
    const screenMat = track(new THREE.MeshBasicMaterial({ color: '#111', toneMapped: false }));
    const screen = new THREE.Mesh(track(new THREE.PlaneGeometry(1, 1)), screenMat);
    screen.position.z = 0.025;
    screenGroup.add(screen);
    screen.userData.slug = slug;
    clickable.push(screen);
    const fit = (aspect: number) => {
      const w = Math.min(slug === 'buddy-cup' ? 6.2 : 4.6, screenH * aspect);
      const h = w / aspect;
      screen.scale.set(w, h, 1);
      bezel.scale.set(w + 0.14, h + 0.14, 1);
    };
    fit(16 / 9);

    const media = ROOM_MEDIA[slug];
    if (media.poster) {
      loader.load(media.poster, (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        track(t);
        if (!screenMat.map) { screenMat.map = t; screenMat.color.set('#fff'); screenMat.needsUpdate = true; }
        const img = t.image as HTMLImageElement;
        fit(img.width / img.height);
      });
    }
    if (media.canvas) {
      const t = track(media.canvas());
      screenMat.map = t;
      screenMat.color.set('#fff');
      fit(16 / 9);
    }
    // A video that starts loading when the visitor nears this room
    const addVideo = (src: string, mat: THREE.MeshBasicMaterial) => {
      const video = document.createElement('video');
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = 'none';
      videoScreens.push({ index: i, video, src, mat, loaded: false });
    };
    if (media.video) addVideo(media.video, screenMat);
    const videoMat = (src: string, poster: string) => {
      const mat = track(new THREE.MeshBasicMaterial({ color: '#111', toneMapped: false }));
      loader.load(poster, (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        track(t);
        if (!mat.map) { mat.map = t; mat.color.set('#fff'); mat.needsUpdate = true; }
      });
      addVideo(src, mat);
      return mat;
    };

    const toured = stations.some((st) => st.slug === slug && st.panel !== undefined);
    if (p && !toured) {
      const pt = track(T.placard(p.title, `${p.status} · ${p.techStack.slice(0, 4).join(', ')}`, 'Click to read the placard →'));
      const pg = new THREE.Group();
      pg.position.set(r.x0 + 0.04, 1.45, r.zc - 2.9);
      pg.rotation.y = Math.PI / 2;
      scene.add(pg);
      box([1.08, 0.7, 0.03], [0, 0, 0], placardFrame, pg);
      const face = new THREE.Mesh(track(new THREE.PlaneGeometry(1.0, 0.625)), track(new THREE.MeshStandardMaterial({ map: pt, roughness: 0.7 })));
      face.position.z = 0.017;
      face.userData.slug = slug;
      pg.add(face);
      clickable.push(face);
    }

    DRESS[slug]?.({ r, scene, box, plane, color, basic, track, animators, reduceMotion, slab, clickable, videoMat });
  });

  // ---------- art ----------

  const manager = new THREE.LoadingManager();
  let loaded = 0;
  let total = 0;
  manager.onStart = (_u, l, t) => { loaded = l; total = t; opts.onProgress(loaded, total); };
  manager.onProgress = (_u, l, t) => { loaded = l; total = t; opts.onProgress(loaded, total); };
  let allLoaded = false;
  manager.onLoad = () => { sunDirty = 90; allLoaded = true; };
  const gltf = new GLTFLoader(manager);
  gltf.setMeshoptDecoder(MeshoptDecoder);
  const draco = new DRACOLoader().setDecoderPath('/draco/');
  gltf.setDRACOLoader(draco);
  disposables.push(draco);

  // Art casts and catches shadows, and its textures stay sharp at an angle
  const asArt = (root: THREE.Object3D) => {
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.castShadow = true;
      m.receiveShadow = true;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      for (const mat of mats as THREE.MeshStandardMaterial[]) {
        for (const t of [mat.map, mat.normalMap, mat.roughnessMap]) if (t) t.anisotropy = 8;
      }
    });
    return root;
  };
  const shadowSpot = (light: THREE.SpotLight, far = 12) => {
    light.castShadow = !mobile;
    light.shadow.mapSize.set(1024, 1024);
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = far;
    light.shadow.bias = -0.0004;
    light.shadow.normalBias = 0.02;
    light.shadow.radius = 5;
    return light;
  };
  const photoLoader = new THREE.TextureLoader(manager);

  gltf.load('/models/s-mark.glb', (g) => {
    const model = g.scene;
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const scale = 1.5 / size.y;
    model.scale.setScalar(scale);
    const center = bounds.getCenter(new THREE.Vector3());
    model.position.set(-center.x * scale, -bounds.min.y * scale + 0.02, -center.z * scale);
    sPivot.add(asArt(model));
  });

  const frameMat = color('#141414', { roughness: 0.45 });
  const labelBacking = color('#d9d6cf', { roughness: 0.9 });
  const matboard = color('#f7f5f0', { roughness: 0.95 });
  const pieceLights: V3[] = [];

  for (const p of GALLERY_PIECES) {
    const group = new THREE.Group();
    group.position.set(p.side * (GALLERY.x1 - 0.01), 0, p.z);
    group.rotation.y = p.side < 0 ? Math.PI / 2 : -Math.PI / 2;
    scene.add(group);
    if (p.kind === 'model') {
      gltf.load(p.src, (g) => {
        g.scene.position.y = p.y ?? 0;
        group.add(asArt(g.scene));
      });
      // Wall label to the right of the piece, at reading height
      if (p.artist) {
        const label = new THREE.Group();
        label.position.set((p.width ?? 1.5) / 2 + 0.42, p.labelY ?? 1.45, 0);
        group.add(label);
        box([0.4, 0.26, 0.012], [0, 0, 0.006], labelBacking, label);
        const face = new THREE.Mesh(track(new THREE.PlaneGeometry(0.384, 0.24)),
          track(new THREE.MeshStandardMaterial({ map: track(T.artLabel(p.title, p.artist)), roughness: 0.8 })));
        face.position.z = 0.0125;
        label.add(face);
      }
      // one light per wall spot, even when two pieces share it
      if (!pieceLights.some((l) => l[2] === p.z && Math.sign(l[0]) === p.side)) pieceLights.push([p.side * 3.2, GALLERY.h - 0.4, p.z]);
    } else {
      photoLoader.load(p.src, (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 8;
        track(t);
        const img = t.image as HTMLImageElement;
        const aspect = img.width / img.height;
        const L = p.size ?? 1.5;
        const w = aspect >= 1 ? L : L * aspect;
        const h = aspect >= 1 ? L / aspect : L;
        const border = 0.16;
        box([w + border * 2 + 0.08, h + border * 2 + 0.08, 0.05], [0, p.y ?? 2, 0.025], frameMat, group);
        box([w + border * 2, h + border * 2, 0.01], [0, p.y ?? 2, 0.052], matboard, group);
        const photo = new THREE.Mesh(track(new THREE.PlaneGeometry(w, h)),
          track(new THREE.MeshStandardMaterial({ map: t, roughness: 0.55, emissive: '#ffffff', emissiveMap: t, emissiveIntensity: 0.18 })));
        photo.position.set(0, p.y ?? 2, 0.058);
        group.add(photo);
      });
    }
  }

  // Gallery spotlights on the sculptures
  for (const lp of pieceLights) {
    // the Tyrell Winston pair is taller: a wider cone, aimed higher
    const pair = GALLERY_PIECES.filter((p) => p.kind === 'model' && p.z === lp[2] && p.side === Math.sign(lp[0])).length > 1;
    const s = shadowSpot(new THREE.SpotLight('#fff3e0', pair ? 55 : 45, 12, pair ? 0.6 : 0.5, 0.65, 1.4));
    s.position.set(...lp);
    s.target.position.set(Math.sign(lp[0]) * 6, pair ? 2.0 : 1.6, lp[2]);
    scene.add(s, s.target);
  }

  // A softer wash on the prints-only wall across from the Winston pair
  const printWash = new THREE.SpotLight('#fff3e0', 32, 12, 0.62, 0.7, 1.4);
  printWash.position.set(3.2, GALLERY.h - 0.4, -24.5);
  printWash.target.position.set(6, 1.9, -24.5);
  scene.add(printWash, printWash.target);

  // Blue Planet Cart, on its casters in the middle of the floor
  blob(CART.x, CART.z, 2.2);
  const cart = new THREE.Group();
  cart.position.set(CART.x, 0, CART.z);
  cart.rotation.y = CART.turn;
  cart.scale.setScalar(CART.scale);
  scene.add(cart);
  gltf.load(CART.src, (g) => {
    g.scene.position.z = -CART.depth / 2; // exported back-to-wall; center it on its footprint
    cart.add(asArt(g.scene));
  });
  // Its label on a small lectern stand in front, angled up to read
  const stand = new THREE.Group();
  stand.position.set(CART.x + 1.0, 0, CART.z + 1.05);
  stand.rotation.y = CART.turn;
  scene.add(stand);
  box([0.05, 0.92, 0.05], [0, 0.46, 0], color('#2a2a2a', { roughness: 0.5, metalness: 0.5 }), stand);
  const lectern = new THREE.Group();
  lectern.position.set(0, 0.96, 0.02);
  lectern.rotation.x = -0.55;
  stand.add(lectern);
  box([0.42, 0.28, 0.02], [0, 0, 0], color('#2a2a2a', { roughness: 0.5, metalness: 0.5 }), lectern);
  const lecternFace = new THREE.Mesh(track(new THREE.PlaneGeometry(0.384, 0.24)),
    track(new THREE.MeshStandardMaterial({ map: track(T.artLabel(CART.title, CART.artist)), roughness: 0.8 })));
  lecternFace.position.z = 0.011;
  lectern.add(lecternFace);

  const cartLight = shadowSpot(new THREE.SpotLight('#fff3e0', 45, 11, 0.36, 0.6, 1.4));
  cartLight.position.set(CART.x + 1.2, GALLERY.h - 0.4, CART.z + 2);
  cartLight.target.position.set(CART.x, 0.7, CART.z);
  scene.add(cartLight, cartLight.target);

  // ---------- OrdinalFrame, glowing in the dark pool room ----------

  const ordinalProject = projects.find((x) => x.slug === ORDINAL.slug);
  if (ordinalProject) {
    const room = roomBounds(ROOM_SLUGS.indexOf(ORDINAL.room as (typeof ROOM_SLUGS)[number]));
    const z = room.zc + ORDINAL.dz;
    const g = new THREE.Group();
    g.position.set(room.x1 - 0.005, ORDINAL.y, z);
    g.rotation.y = -Math.PI / 2;
    scene.add(g);
    gltf.load(ORDINAL.src, (m) => g.add(asArt(m.scene)));

    // The screen: a slideshow canvas, crossfading between pieces
    const slides: CanvasImageSource[] = [];
    const colors: string[] = [];
    const addSlide = (sl: CanvasImageSource, at = slides.length) => {
      slides.splice(at, 0, sl);
      colors.splice(at, 0, T.averageColor(sl));
    };
    const [W, H] = [1200, 720];
    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = W;
    screenCanvas.height = H;
    const sctx = screenCanvas.getContext('2d')!;
    const screenTex = track(new THREE.CanvasTexture(screenCanvas));
    screenTex.colorSpace = THREE.SRGBColorSpace;
    const screenMat = track(new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }));
    screenMat.color.setScalar(1.15); // LCD backlight: a touch brighter than the room
    const screenMesh = new THREE.Mesh(track(new THREE.PlaneGeometry(1.2, 0.72)), screenMat);
    screenMesh.position.z = 0.025;
    screenMesh.userData.slug = ORDINAL.slug;
    g.add(screenMesh);
    clickable.push(screenMesh);
    // A photo of the real screen already carries the device UI; skip the overlay on it
    const cat = new Image();
    if (opts.ordinals.length) {
      // Load in folder order, then show them all
      const loadedArt: (HTMLCanvasElement | null)[] = opts.ordinals.map(() => null);
      let pending = opts.ordinals.length;
      opts.ordinals.forEach((src, i) => {
        const img = new Image();
        const done = () => {
          if (--pending > 0) return;
          loadedArt.forEach((c) => c && addSlide(c));
          if (slides.length) draw(0, 0, 0);
        };
        img.onload = () => { loadedArt[i] = T.ordinalArtSlide(img); done(); };
        img.onerror = done;
        img.src = src;
      });
    } else {
      T.ordinalSlides().forEach((sl) => addSlide(sl));
      cat.onload = () => { addSlide(cat, 0); draw(0, 0, 0); };
      cat.src = '/media/museum/ordinal-cat.jpg';
    }

    // Light from the screen: a halo on the wall and a lamp that takes the art's color
    const glow = T.screenGlow(0.74, 0.5, 0.6);
    const halo = plane(glow.width, glow.height, track(new THREE.MeshBasicMaterial({
      map: track(glow.texture), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    })), [0, 0, 0.003]);
    scene.remove(halo);
    g.add(halo);
    const spill = new THREE.PointLight('#ffffff', 4, 4.5, 2);
    spill.position.set(0, 0, 0.7);
    g.add(spill);

    const placardTex = track(T.placard(ordinalProject.title, `${ordinalProject.status} · ${ordinalProject.techStack.slice(0, 4).join(', ')}`, 'Click to read the placard →'));
    const pg = new THREE.Group();
    pg.position.set(1.3, -0.5, 0);
    g.add(pg);
    box([0.62, 0.4, 0.03], [0, 0, 0.015], placardFrame, pg);
    const pf = new THREE.Mesh(track(new THREE.PlaneGeometry(0.56, 0.35)), track(new THREE.MeshStandardMaterial({ map: placardTex, roughness: 0.7 })));
    pf.position.z = 0.031;
    pf.userData.slug = ORDINAL.slug;
    pg.add(pf);
    clickable.push(pf);

    const HOLD = 6, FADE = 1.2;
    const cur = new THREE.Color(), nxt = new THREE.Color();
    function draw(a: number, b: number, mix: number) {
      if (!slides.length) return;
      sctx.globalAlpha = 1;
      sctx.drawImage(slides[a], 0, 0, W, H);
      if (mix > 0 && a !== b) { sctx.globalAlpha = mix; sctx.drawImage(slides[b], 0, 0, W, H); }
      sctx.globalAlpha = 1;
      if (slides[b] !== cat || mix < 0.5) T.ordinalChrome(sctx, mix < 0.5 ? a : b, slides.length);
      screenTex.needsUpdate = true;
      cur.set(colors[a]);
      nxt.set(colors[b]);
      cur.lerp(nxt, mix);
      // Same strength for every piece: keep the hue, cap the brightness
      cur.multiplyScalar(0.32 / Math.max(0.05, cur.r, cur.g, cur.b));
      (halo.material as THREE.MeshBasicMaterial).color.copy(cur);
      spill.color.copy(cur);
    }
    draw(0, 0, 0);
    let last = -1;
    animators.push((now) => {
      const t = Math.max(0, now); // the first frame's timestamp can land just before the timer started
      const cycle = HOLD + FADE;
      const n = slides.length;
      if (!n) return;
      const i = Math.floor(t / cycle) % n;
      const phase = t % cycle;
      if (reduceMotion) { if (i !== last) { draw(i, i, 0); last = i; } return; }
      if (phase > HOLD) { draw(i, (i + 1) % n, (phase - HOLD) / FADE); last = -1; }
      else if (i !== last) { draw(i, i, 0); last = i; }
    });
  }

  // ---------- camera route ----------

  // Position follows a smooth curve through every stop. Heading is yaw and
  // pitch, turned the short way round, so the view never swings a look-at
  // point through the camera (which reads as a sudden 180° whip).
  const n = stations.length;
  const P = stations.map((s) => new THREE.Vector3(...s.pos));
  const path = new THREE.CatmullRomCurve3(P, false, 'centripetal', 0.5);
  const heading = stations.map((s) => {
    const d = new THREE.Vector3(...s.look).sub(new THREE.Vector3(...s.pos)).normalize();
    return { yaw: Math.atan2(-d.x, -d.z), pitch: Math.asin(d.y) };
  });
  const fogColors = stations.map((s) => new THREE.Color(s.slug ? roomStyle[s.slug]?.fog ?? '#d9d5ce' : '#d9d5ce'));
  const camPos = P[0].clone();
  let camYaw = heading[0].yaw;
  let camPitch = heading[0].pitch;
  const targetPos = new THREE.Vector3();
  let targetYaw = camYaw;
  let targetPitch = camPitch;
  const fogTarget = new THREE.Color();
  const lean = new THREE.Vector3();
  let scroll = 0;
  const pointer = new THREE.Vector2();
  const pointerSmooth = new THREE.Vector2();

  const smooth = (a: number, b: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a)); // to [-π, π]

  function routeAt(s: number) {
    const clamped = Math.min(n - 1, Math.max(0, s));
    const i = Math.min(n - 2, Math.floor(clamped));
    const f = clamped - i;
    // Rest at each stop for the first and last fifth of the scroll between them
    const e = smooth(0.2, 0.8, f);
    path.getPoint((i + e) / (n - 1), targetPos);
    const a = heading[i], b = heading[i + 1];
    targetYaw = a.yaw + wrap(b.yaw - a.yaw) * e;
    targetPitch = a.pitch + (b.pitch - a.pitch) * e;
    fogTarget.lerpColors(fogColors[i], fogColors[i + 1], e);
    // While resting, drift gently toward what you're looking at, so scrolling
    // through a stop still feels like moving, not a dead zone
    const near = Math.round(clamped);
    const rest = Math.max(0, 1 - Math.abs(clamped - near) / 0.3);
    lean.set(-Math.sin(heading[near].yaw), 0, -Math.cos(heading[near].yaw)).multiplyScalar(0.45 * smooth(0, 1, rest) * (clamped - near + 0.3) / 0.6);
    targetPos.add(lean);
  }

  // ---------- hologram panels ----------

  const PANEL_PX = 560; // CSS width of a panel
  const PANEL_M = 1.45; // its width in the room, meters
  const beamMat = () => track(new THREE.MeshBasicMaterial({
    color: '#6fdcff', transparent: true, opacity: 0, blending: THREE.AdditiveBlending,
    depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
  }));
  const holos = opts.panels.map(({ station, element }) => {
    const obj = new CSS3DObject(element);
    element.style.pointerEvents = 'none';
    obj.scale.setScalar(PANEL_M / PANEL_PX);
    cssScene.add(obj);
    // A projector on the floor and a faint cone of light up to the panel
    const coneMat = beamMat();
    const cone = new THREE.Mesh(track(new THREE.CylinderGeometry(0.5, 0.06, 1, 32, 1, true)), coneMat);
    const padMat = beamMat();
    const pad = new THREE.Mesh(track(new THREE.CylinderGeometry(0.16, 0.18, 0.03, 32)), padMat);
    const base = new THREE.Mesh(track(new THREE.CylinderGeometry(0.2, 0.22, 0.02, 32)), color('#1b1d22', { roughness: 0.4, metalness: 0.6 }));
    scene.add(cone, pad, base);
    return { station, element, obj, cone, coneMat, pad, padMat, base, on: false };
  });

  const UP = new THREE.Vector3(0, 1, 0);
  function placePanels(narrow: boolean) {
    for (const h of holos) {
      const st = stations[h.station];
      const pos = new THREE.Vector3(...st.pos);
      const fwd = new THREE.Vector3(...st.look).sub(pos).normalize();
      const right = new THREE.Vector3().crossVectors(fwd, UP).normalize();
      const up = new THREE.Vector3().crossVectors(right, fwd);
      // On a narrow screen the panel moves to the middle, a little lower and closer
      const [r, u, d] = narrow ? [0, -0.32, (st.place?.[2] ?? 3) * 0.92] : st.place ?? [1.2, 0, 3];
      const at = pos.clone().addScaledVector(fwd, d).addScaledVector(right, r).addScaledVector(up, u);
      h.obj.position.copy(at);
      h.obj.lookAt(pos);
      const halfH = ((h.element.offsetHeight || 420) * (PANEL_M / PANEL_PX)) / 2;
      const bottom = Math.max(0.3, at.y - halfH - 0.04);
      h.cone.scale.y = bottom;
      h.cone.position.set(at.x, bottom / 2, at.z);
      h.pad.position.set(at.x, 0.035, at.z);
      h.base.position.set(at.x, 0.01, at.z);
    }
  }

  function updatePanels(s: number) {
    for (const h of holos) {
      // On a narrow screen the panel's content shows in the bottom sheet instead
      const vis = narrow ? 0 : Math.max(0, 1 - Math.abs(s - h.station) / 0.45);
      const on = vis > 0.5;
      if (on !== h.on) {
        h.on = on;
        h.element.dataset.on = on ? '1' : '0';
        h.element.style.pointerEvents = on ? 'auto' : 'none'; // hidden panels never block the scene
      }
      const glow = smooth(0, 1, vis);
      h.coneMat.opacity = 0.045 * glow;
      h.padMat.opacity = 0.25 + 0.6 * glow;
    }
  }

  // ---------- video lifecycle ----------

  function updateVideos(s: number) {
    for (const v of videoScreens) {
      const slug = ROOM_SLUGS[v.index];
      const first = stations.findIndex((st) => st.slug === slug);
      const last = stations.length - 1 - [...stations].reverse().findIndex((st) => st.slug === slug);
      const near = s > first - 1.6 && s < last + 1.4;
      if (near && !v.loaded) {
        v.loaded = true;
        v.video.src = v.src;
        v.video.load();
        v.video.addEventListener('playing', () => {
          const vt = track(new THREE.VideoTexture(v.video));
          vt.colorSpace = THREE.SRGBColorSpace;
          v.mat.map = vt;
          v.mat.color.set('#fff');
          v.mat.needsUpdate = true;
        }, { once: true });
      }
      if (v.loaded) {
        if (near && v.video.paused) v.video.play().catch(() => {});
        else if (!near && !v.video.paused) v.video.pause();
      }
    }
  }

  // ---------- input ----------

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let downAt: { x: number; y: number } | null = null;

  const hit = (e: PointerEvent) => {
    const rect = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const h = raycaster.intersectObjects(clickable, false)[0];
    return h && h.distance < 12 ? (h.object.userData.slug as string) : null;
  };
  const onMove = (e: PointerEvent) => {
    pointer.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    if (e.pointerType === 'mouse') renderer.domElement.style.cursor = hit(e) ? 'pointer' : 'default';
  };
  const onDown = (e: PointerEvent) => { downAt = { x: e.clientX, y: e.clientY }; };
  const onUp = (e: PointerEvent) => {
    if (!downAt || Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 8) return;
    const slug = hit(e);
    if (slug) opts.onPlacard(slug);
  };
  window.addEventListener('pointermove', onMove);
  renderer.domElement.addEventListener('pointerdown', onDown);
  renderer.domElement.addEventListener('pointerup', onUp);

  // Post-processing on desktop; phones render straight to the screen
  const post = mobile ? null : createPost(renderer, scene, camera, (o) => o === sky);
  // Narrow screens: info lives in a bottom sheet, not floating panels, and
  // the lens shifts (like a tilt-shift lens: no distortion) so whatever the
  // camera aims at sits in the middle of the open area above the sheet
  let narrow = false;
  let inset = 0;
  const applyView = () => {
    const w = host.clientWidth, h = host.clientHeight;
    if (narrow && inset > 0) camera.setViewOffset(w, h, 0, inset / 2, w, h);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  };
  const resize = () => {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false);
    post?.setSize(w, h, renderer.getPixelRatio());
    cssRenderer.setSize(w, h);
    camera.aspect = w / h;
    narrow = w / h < 0.8;
    camera.fov = narrow ? 62 : 55;
    applyView();
    placePanels(narrow);
  };
  resize();
  // Panel heights are known once React has rendered them; place again
  requestAnimationFrame(() => placePanels(host.clientWidth / host.clientHeight < 0.8));
  const ro = new ResizeObserver(resize);
  ro.observe(host);

  // ---------- loop ----------

  const timer = new THREE.Timer();
  let raf = 0;
  // Adaptive quality: once everything has loaded, watch the frame rate in
  // 1.5 s windows; under ~50 fps, render fewer pixels (down to 1x), and
  // if 1x is still slow, drop ambient occlusion, the costliest pass
  let perfFrames = 0, perfTime = 0, perfSettled = false;
  const adapt = (dt: number) => {
    if (perfSettled || !allLoaded || sunDirty > 0 || document.hidden) return;
    perfFrames++;
    perfTime += dt;
    if (perfTime < 1.5) return;
    const fps = perfFrames / perfTime;
    perfFrames = 0;
    perfTime = 0;
    if (fps >= 50) { perfSettled = true; return; }
    if (pixelRatio > 1) {
      pixelRatio = Math.max(1, pixelRatio - 0.25);
      renderer.setPixelRatio(pixelRatio);
      resize();
    } else if (post?.ao) {
      post.ao = false;
    } else {
      perfSettled = true;
    }
  };
  const tick = (now?: number) => {
    raf = requestAnimationFrame(tick);
    timer.update(now);
    const rawDt = timer.getDelta();
    const dt = Math.min(rawDt, 0.1);
    const t = timer.getElapsed();
    adapt(rawDt);
    routeAt(scroll);
    // Inertia: the camera glides after the scroll instead of tracking it
    // frame for frame, so a fast flick of the wheel still reads as a walk.
    const k = reduceMotion ? 1 : 1 - Math.exp(-dt * 2.6);
    camPos.lerp(targetPos, k);
    camYaw += wrap(targetYaw - camYaw) * k;
    camPitch += (targetPitch - camPitch) * k;
    (scene.fog as THREE.Fog).color.lerp(fogTarget, k);
    (scene.background as THREE.Color).copy((scene.fog as THREE.Fog).color);
    camera.position.copy(camPos);
    let yaw = camYaw, pitch = camPitch;
    // Tall, narrow screens see more above and below: aim a little lower so
    // the art sits in the open middle of the screen, above the caption
    if (!reduceMotion && !mobile) {
      pointerSmooth.lerp(pointer, 1 - Math.exp(-dt * 3));
      yaw -= pointerSmooth.x * 0.06;
      pitch -= pointerSmooth.y * 0.04;
    }
    camera.rotation.set(pitch, yaw, 0, 'YXZ');
    sky.position.copy(camera.position);
    if (sunDirty > 0) { sun.shadow.needsUpdate = true; sunDirty--; }
    if (!reduceMotion) sPivot.rotation.y = t * 0.25;
    for (const a of animators) a(t, dt);
    updatePanels(scroll);
    if (post) post.render(dt, t);
    else renderer.render(scene, camera);
    cssRenderer.render(cssScene, camera);
  };
  tick();

  return {
    setScroll(s: number) {
      scroll = s;
      updateVideos(s);
    },
    setInset(px: number) {
      if (Math.abs(px - inset) < 2) return;
      inset = px;
      applyView();
    },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      for (const v of videoScreens) { v.video.pause(); v.video.removeAttribute('src'); v.video.load(); }
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh && o.parent && !disposables.includes(mesh.geometry)) {
          // geometry and materials from loaded models
          mesh.geometry.dispose();
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach((m) => { if (!disposables.includes(m)) (m as THREE.MeshStandardMaterial).map?.dispose(); });
        }
      });
      disposables.forEach((d) => d.dispose());
      pmrem.dispose();
      post?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      cssRenderer.domElement.remove();
    },
  };
}

// ---------- room media ----------

const ROOM_MEDIA: Record<string, { video?: string; poster?: string; canvas?: () => THREE.Texture }> = {
  'kinetic-email': { video: '/media/kinetic/sizzle.mp4', poster: '/media/kinetic/sizzle-poster.jpg' },
  'money-never-sleeps': { video: '/media/mns/bump.mp4', poster: '/media/mns/bump.jpg' },
  outlooksucks: { video: '/media/outlooksucks/hero.mp4', poster: '/media/outlooksucks/hero.jpg' },
  'buddy-cup': { canvas: T.fairway },
  'rocket-pool-tour': { video: '/media/rocket/deck.mp4', poster: '/media/rocket/deck.jpg' },
  'human-diet': { video: '/media/humandiet/walk.mp4', poster: '/media/humandiet/walk.jpg' },
};

// ---------- room dressing ----------

interface Kit {
  r: ReturnType<typeof roomBounds>;
  scene: THREE.Scene;
  box(size: V3, pos: V3, m: THREE.Material, parent?: THREE.Object3D): THREE.Mesh;
  plane(w: number, h: number, m: THREE.Material, pos: V3, rotY?: number): THREE.Mesh;
  color(c: string, p?: THREE.MeshStandardMaterialParameters): THREE.MeshStandardMaterial;
  basic(map: THREE.Texture, transparent?: boolean): THREE.MeshBasicMaterial;
  track<X extends { dispose(): void }>(x: X): X;
  slab(min: V3, max: V3, m: THREE.Material | THREE.Material[], tile?: number): THREE.Mesh;
  animators: ((t: number, dt: number) => void)[];
  clickable: THREE.Object3D[];
  reduceMotion: boolean;
  videoMat(src: string, poster: string): THREE.MeshBasicMaterial;
}

function hoop(k: Kit, pos: V3, rotY: number) {
  const g = new THREE.Group();
  g.position.set(...pos);
  g.rotation.y = rotY;
  k.scene.add(g);
  const white = k.color('#f4f4f2', { roughness: 0.3 });
  const red = k.color('#c8312c', { roughness: 0.4 });
  const orange = k.color('#e0552a', { roughness: 0.35, metalness: 0.4 });
  k.box([1.83, 1.07, 0.05], [0, 0.4, 0.5], white, g);
  for (const [w, h, x, y] of [[0.59, 0.04, 0, 0.32], [0.59, 0.04, 0, -0.12], [0.04, 0.45, -0.275, 0.1], [0.04, 0.45, 0.275, 0.1]] as const) {
    k.box([w, h, 0.01], [x, y, 0.53], red, g);
  }
  k.box([0.08, 0.08, 0.5], [0, 0.4, 0.25], k.color('#333'), g);
  const rim = new THREE.Mesh(k.track(new THREE.TorusGeometry(0.23, 0.012, 8, 40)), orange);
  rim.rotation.x = Math.PI / 2;
  rim.position.set(0, -0.12, 0.76);
  g.add(rim);
  const net = new THREE.LineSegments(
    k.track(new THREE.WireframeGeometry(k.track(new THREE.CylinderGeometry(0.23, 0.14, 0.42, 12, 4, true)))),
    k.track(new THREE.LineBasicMaterial({ color: '#f2f2f2' })),
  );
  net.position.set(0, -0.33, 0.76);
  g.add(net);
}

const DRESS: Record<string, (k: Kit) => void> = {
  // The mailroom: a wall of walnut pigeonholes with envelopes in the slots
  'kinetic-email'(k) {
    const { r } = k;
    const walnut = k.color('#5a3a22', { roughness: 0.6 });
    const cols = 12, rows = 7, cell = 0.36, depth = 0.4;
    const x = r.x1 - depth / 2;
    const z0 = r.zc - (cols * cell) / 2;
    const y0 = 0.7;
    k.box([0.02, rows * cell, cols * cell], [r.x1 - 0.012, y0 + (rows * cell) / 2, r.zc], k.color('#2a1a10', { roughness: 0.9 }));
    for (let c = 0; c <= cols; c++) k.box([depth, rows * cell, 0.02], [x, y0 + (rows * cell) / 2, z0 + c * cell], walnut);
    for (let rr = 0; rr <= rows; rr++) k.box([depth, 0.02, cols * cell], [x, y0 + rr * cell, r.zc], walnut);
    const paper = k.color('#f5f2ea', { roughness: 0.9 });
    const env = new THREE.InstancedMesh(k.track(new THREE.BoxGeometry(0.3, 0.012, 0.22)), paper, 60);
    const m = new THREE.Matrix4();
    let n = 0;
    for (let c = 0; c < cols; c++) {
      for (let rr = 0; rr < rows; rr++) {
        if ((c * 7 + rr * 3) % 5 === 0) continue;
        const stack = 1 + ((c + rr) % 3);
        for (let s = 0; s < stack && n < 60; s++) {
          m.makeRotationY(((c + s) % 3 - 1) * 0.12);
          m.setPosition(x - 0.02, y0 + rr * cell + 0.02 + s * 0.014, z0 + (c + 0.5) * cell);
          env.setMatrixAt(n++, m);
        }
      }
    }
    env.count = n;
    k.scene.add(env);

    // On the back wall, a phone the size of a person, on a plinth like a
    // sculpture: Bolt, the Kinetic game, playing on its screen
    const PX = -4.2;
    const phone = new THREE.Group();
    phone.position.set(PX, 0.5, r.z1 + WALL_T / 2 + 0.42);
    k.scene.add(phone);
    const PW = 1.56, PH = 3.2, SW = 1.42, SH = SW / (448 / 960);
    k.box([2.0, 0.5, 0.9], [0, -0.25, 0.05], k.color('#f3f1ec', { roughness: 0.55 }), phone);
    const lean = new THREE.Group(); // resting back against the wall
    lean.rotation.x = -0.07;
    lean.position.set(0, 0, 0.12);
    phone.add(lean);
    const body = new THREE.Mesh(k.track(new RoundedBoxGeometry(PW, PH, 0.14, 6, 0.17)),
      k.color('#1c1d21', { roughness: 0.28, metalness: 0.75 }));
    body.position.set(0, PH / 2, 0);
    body.castShadow = true;
    lean.add(body);
    // Black glass around the screen (a flat rounded plate)
    const plate = new THREE.Shape();
    const gw = PW - 0.05, gh = PH - 0.05, gr = 0.15;
    plate.moveTo(-gw / 2 + gr, -gh / 2);
    plate.lineTo(gw / 2 - gr, -gh / 2); plate.quadraticCurveTo(gw / 2, -gh / 2, gw / 2, -gh / 2 + gr);
    plate.lineTo(gw / 2, gh / 2 - gr); plate.quadraticCurveTo(gw / 2, gh / 2, gw / 2 - gr, gh / 2);
    plate.lineTo(-gw / 2 + gr, gh / 2); plate.quadraticCurveTo(-gw / 2, gh / 2, -gw / 2, gh / 2 - gr);
    plate.lineTo(-gw / 2, -gh / 2 + gr); plate.quadraticCurveTo(-gw / 2, -gh / 2, -gw / 2 + gr, -gh / 2);
    const glass = new THREE.Mesh(k.track(new THREE.ShapeGeometry(plate, 6)), k.color('#050506', { roughness: 0.12, metalness: 0.1 }));
    glass.position.set(0, PH / 2, 0.072);
    lean.add(glass);
    const screen = new THREE.Mesh(k.track(new THREE.PlaneGeometry(SW, SH)), k.videoMat('/media/kinetic/bolt.mp4', '/media/kinetic/bolt.jpg'));
    screen.position.set(0, PH / 2, 0.078);
    lean.add(screen);
    const island = new THREE.Mesh(k.track(new RoundedBoxGeometry(0.36, 0.1, 0.02, 4, 0.009)), k.color('#000', { roughness: 0.3 }));
    island.position.set(0, PH / 2 + SH / 2 - 0.1, 0.08);
    lean.add(island);
    // Side buttons
    for (const [y, h, sx] of [[2.45, 0.32, 1], [2.25, 0.18, -1], [1.98, 0.18, -1]] as const) {
      k.box([0.02, h, 0.05], [sx * (PW / 2 + 0.008), y, 0], k.color('#2a2b30', { roughness: 0.3, metalness: 0.8 }), lean);
    }
    // Wall label on the plinth
    const label = new THREE.Mesh(k.track(new THREE.PlaneGeometry(0.42, 0.2625)),
      k.track(new THREE.MeshStandardMaterial({ map: k.track(T.artLabel('Bolt', 'Kinetic.Email', ['One email, Deploy to click', 'Play at bolt.kinetic.email'])), roughness: 0.8 })));
    label.position.set(0.62, -0.25, 0.502);
    phone.add(label);
    // A spot from the ceiling, and the screen's glow on the plinth
    const spot = new THREE.SpotLight('#fff4e4', 30, 9, 0.42, 0.6, 1.4);
    spot.position.set(PX, ROOM.h - 0.3, r.z1 + 3.4);
    spot.target.position.set(PX, 1.9, r.z1 + 0.6);
    k.scene.add(spot, spot.target);
    const spill = new THREE.PointLight('#7fb4ff', 1.6, 2.6, 2);
    spill.position.set(PX, 2.0, r.z1 + 1.4);
    k.scene.add(spill);
  },

  // Center court: painted hardwood, a hoop, and the market on the ribbon board
  'money-never-sleeps'(k) {
    const { r } = k;
    const courtTex = k.track(T.court(-3.5));
    const floor = k.plane(14, 14, k.track(new THREE.MeshStandardMaterial({ map: courtTex, roughness: 0.32 })), [0, 0.003, r.zc]);
    floor.rotation.x = -Math.PI / 2;
    hoop(k, [-3.5, 3.05 + 0.12, r.z1 + WALL_T / 2], 0);

    const tick = T.ticker([
      { label: 'MNS', value: '4.2%', up: true }, { label: 'CAP', value: '$154.6M', up: true },
      { label: 'APRON', value: '$195.9M', up: false }, { label: 'BUMP', value: 'TRADE OK', up: true },
      { label: 'KEEPERS', value: '8 LOCKED', up: true }, { label: 'ROOKIE SCALE', value: '1.8%', up: false },
      { label: 'DYNASTY', value: 'YEAR 3', up: true }, { label: 'WIRE', value: '3 CLAIMS', up: false },
    ]);
    k.track(tick);
    const bands: { mat: THREE.MeshBasicMaterial; len: number }[] = [];
    const y = 5.05, hgt = 0.42;
    const add = (w: number, pos: V3, rot: number) => {
      const t = tick.clone();
      k.track(t);
      t.repeat.set(w / ((4096 / 96) * hgt), 1); // keep the lettering's proportions
      t.needsUpdate = true;
      const mat = k.basic(t);
      k.plane(w, hgt, mat, pos, rot);
      bands.push({ mat, len: w });
    };
    add(14, [0, y, r.z0 - WALL_T / 2 - 0.01], Math.PI);
    add(14, [0, y, r.z1 + WALL_T / 2 + 0.01], 0);
    add(14, [r.x0 + 0.01, y, r.zc], Math.PI / 2);
    add(14, [r.x1 - 0.01, y, r.zc], -Math.PI / 2);
    k.animators.push((_t, dt) => {
      if (k.reduceMotion) return;
      for (const b of bands) b.mat.map!.offset.x = (b.mat.map!.offset.x + dt * 0.06) % 1;
    });
    // a ball at the free throw line
    const ball = new THREE.Mesh(k.track(new THREE.SphereGeometry(0.12, 24, 16)), k.color('#c8642c', { roughness: 0.8 }));
    ball.position.set(-1.6, 0.12, r.z1 + 4.3);
    k.scene.add(ball);
  },

  // A 2007 cubicle: fabric panels, a desk, a beige CRT stuck on a dialog
  outlooksucks(k) {
    const { r } = k;
    const fabric = k.color('#7d8a99', { roughness: 1 });
    const trim = k.color('#b9b5ab', { roughness: 0.6 });
    const desk = k.color('#c9b48f', { roughness: 0.7 });
    const beige = k.color('#d8d0bb', { roughness: 0.6 });
    // open toward the doorway, so you see straight into the cubicle
    const cx = 4.0, cz = r.zc - 1.6;
    k.box([2.6, 1.6, 0.06], [cx, 0.8, cz - 1.0], fabric);
    k.box([0.06, 1.6, 2.0], [cx - 1.3, 0.8, cz], fabric);
    k.box([0.06, 1.6, 2.0], [cx + 1.3, 0.8, cz], fabric);
    k.box([2.66, 0.04, 0.08], [cx, 1.62, cz - 1.0], trim);
    k.box([2.5, 0.04, 0.8], [cx, 0.74, cz - 0.58], desk);
    k.box([0.04, 0.7, 0.7], [cx - 1.15, 0.37, cz - 0.58], desk);
    k.box([0.04, 0.7, 0.7], [cx + 1.15, 0.37, cz - 0.58], desk);
    k.box([0.5, 0.42, 0.48], [cx, 0.98, cz - 0.72], beige);
    k.box([0.3, 0.06, 0.3], [cx, 0.79, cz - 0.72], beige);
    const crt = k.plane(0.4, 0.3, k.basic(k.track(T.crtScreen())), [cx, 1.0, cz - 0.475]);
    crt.userData.slug = 'outlooksucks';
    k.clickable.push(crt);
    k.box([0.46, 0.02, 0.16], [cx, 0.77, cz - 0.3], beige);
    const chair = k.color('#2c2f33', { roughness: 0.8 });
    k.box([0.5, 0.08, 0.5], [cx + 0.1, 0.48, cz + 0.2], chair);
    k.box([0.5, 0.55, 0.06], [cx + 0.1, 0.8, cz + 0.45], chair);
    k.box([0.05, 0.44, 0.05], [cx + 0.1, 0.22, cz + 0.2], chair);
    // fluorescent drop-ceiling panels
    const glow = k.track(new THREE.MeshBasicMaterial({ color: '#f4f8ff', toneMapped: false }));
    for (const x of [-3, 3]) for (const z of [-3.5, 0, 3.5]) {
      const p = k.plane(1.2, 0.6, glow, [x, ROOM.h - 0.02, r.zc + z]);
      p.rotation.x = Math.PI / 2;
    }
  },

  // The simulator bay: hitting mat, a ball on a tee, a bag in the corner
  'buddy-cup'(k) {
    const { r } = k;
    const mat = k.color('#1f4a26', { roughness: 0.95 });
    k.box([1.6, 0.03, 1.6], [-0.6, 0.015, r.zc + 0.4], mat);
    k.box([0.012, 0.04, 0.012], [-0.9, 0.05, r.zc + 0.4], k.color('#f2f2f2'));
    const ball = new THREE.Mesh(k.track(new THREE.SphereGeometry(0.021, 16, 12)), k.color('#ffffff', { roughness: 0.4 }));
    ball.position.set(-0.9, 0.092, r.zc + 0.4);
    k.scene.add(ball);
    const bag = new THREE.Group();
    bag.position.set(4.5, 0, r.zc - 3);
    bag.rotation.z = 0.12;
    k.scene.add(bag);
    const bagBody = new THREE.Mesh(k.track(new THREE.CylinderGeometry(0.16, 0.14, 0.9, 20)), k.color('#b52a2a', { roughness: 0.7 }));
    bagBody.position.y = 0.45;
    bag.add(bagBody);
    const steel = k.color('#cfd3d6', { roughness: 0.25, metalness: 0.9 });
    for (let i = 0; i < 6; i++) {
      const shaft = new THREE.Mesh(k.track(new THREE.CylinderGeometry(0.008, 0.008, 0.5, 6)), steel);
      shaft.position.set(Math.cos(i) * 0.08, 1.1, Math.sin(i) * 0.08);
      bag.add(shaft);
      const head = new THREE.Mesh(k.track(new THREE.BoxGeometry(0.06, 0.05, 0.1)), k.color('#1a1a1a'));
      head.position.set(Math.cos(i) * 0.08, 1.36, Math.sin(i) * 0.08);
      bag.add(head);
    }
    // Netting around the screen
    const netMat = k.track(new THREE.MeshBasicMaterial({ color: '#0c0d0c', transparent: true, opacity: 0.55 }));
    for (const z of [-3.3, 4.1]) k.plane(3.5, 4.2, netMat, [r.x0 + 1.75, 2.1, r.zc + z]);
  },

  // The pool hall: a table under a low lamp, a rack ready to break
  'rocket-pool-tour'(k) {
    const { r } = k;
    const cx = 3.2, cz = r.zc - 0.5;
    const wood = k.color('#4a2412', { roughness: 0.45 });
    const cloth = new THREE.MeshStandardMaterial({ map: k.track(T.felt('#1f5fa8')), roughness: 0.95 });
    k.track(cloth);
    k.box([1.5, 0.7, 2.7], [cx, 0.42, cz], wood);
    k.box([1.3, 0.04, 2.5], [cx, 0.79, cz], cloth);
    for (const sx of [-1, 1]) k.box([0.1, 0.08, 2.7], [cx + sx * 0.7, 0.82, cz], wood);
    for (const sz of [-1, 1]) k.box([1.5, 0.08, 0.1], [cx, 0.82, cz + sz * 1.3], wood);
    const pocket = k.color('#050505');
    for (const sx of [-1, 1]) for (const sz of [-1, 0, 1]) {
      const p = new THREE.Mesh(k.track(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 16)), pocket);
      p.position.set(cx + sx * 0.64, 0.82, cz + sz * 1.24);
      k.scene.add(p);
    }
    const colors = ['#f2c12e', '#2a5bd7', '#d2322d', '#5b2a86', '#e8742a', '#1f7a3a', '#7a1f1f', '#111111', '#f2c12e'];
    let b = 0;
    for (let row = 0; row < 4; row++) for (let i = 0; i <= row; i++) {
      const ball = new THREE.Mesh(k.track(new THREE.SphereGeometry(0.028, 16, 12)), k.color(colors[b++ % colors.length], { roughness: 0.2 }));
      ball.position.set(cx + (i - row / 2) * 0.058, 0.838, cz - 0.6 - row * 0.05);
      k.scene.add(ball);
    }
    const cue = new THREE.Mesh(k.track(new THREE.SphereGeometry(0.028, 16, 12)), k.color('#f6f3ea', { roughness: 0.2 }));
    cue.position.set(cx, 0.838, cz + 0.65);
    k.scene.add(cue);
    // the lamp: a long green shade glowing underneath
    k.box([0.5, 0.18, 1.8], [cx, 2.2, cz], k.color('#1d4d32', { roughness: 0.4, metalness: 0.3 }));
    k.box([0.42, 0.01, 1.7], [cx, 2.105, cz], k.track(new THREE.MeshBasicMaterial({ color: '#fff3d6', toneMapped: false })));
    k.box([0.02, ROOM.h - 2.3, 0.02], [cx, (ROOM.h + 2.3) / 2, cz], k.color('#222'));
    const lamp = new THREE.SpotLight('#fff1d6', 30, 6, 0.95, 0.5, 1.5);
    lamp.position.set(cx, 2.1, cz);
    lamp.target.position.set(cx, 0, cz);
    k.scene.add(lamp, lamp.target);
    // a cue rack on the right wall
    for (let i = 0; i < 5; i++) {
      const stick = new THREE.Mesh(k.track(new THREE.CylinderGeometry(0.008, 0.014, 1.45, 8)), k.color('#c9a06a', { roughness: 0.5 }));
      stick.position.set(r.x1 - 0.08, 1.2, r.zc + 3.5 + i * 0.16);
      k.scene.add(stick);
    }
  },

  // A natural history diorama: rocks, sand, and a pair of tusks
  'human-diet'(k) {
    const { r } = k;
    const rock = k.color('#8a7b66', { roughness: 0.95, flatShading: true });
    const ivory = k.color('#efe6cf', { roughness: 0.5 });
    k.box([5, 0.3, 4.5], [3.6, 0.15, r.zc - 1], k.color('#b9a07a', { roughness: 1 }));
    const rocks: [number, number, number, number][] = [[2.2, 0.55, r.zc - 2.4, 0.5], [4.8, 0.45, r.zc - 2.6, 0.38], [5.2, 0.4, r.zc + 0.4, 0.3], [2.7, 0.4, r.zc + 0.6, 0.25]];
    for (const [x, y, z, s] of rocks) {
      const m = new THREE.Mesh(k.track(new THREE.IcosahedronGeometry(s, 0)), rock);
      m.position.set(x, y, z);
      m.rotation.set(x, z, y);
      k.scene.add(m);
    }
    for (const side of [-1, 1]) {
      const tusk = new THREE.Mesh(k.track(new THREE.TorusGeometry(1.1, 0.07, 10, 32, Math.PI * 0.62)), ivory);
      tusk.position.set(3.7 + side * 0.35, 0.3, r.zc - 1);
      tusk.rotation.set(0, side > 0 ? Math.PI : 0, 0.15);
      tusk.scale.set(1, 1.15, 1);
      k.scene.add(tusk);
    }
    const glass = k.track(new THREE.MeshStandardMaterial({ color: '#dff2f5', transparent: true, opacity: 0.12, roughness: 0.05, depthWrite: false }));
    k.box([5.1, 2.6, 4.6], [3.6, 1.6, r.zc - 1], glass);
  },
};
