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
import { Font, type FontData } from 'three/examples/jsm/loaders/FontLoader.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import orbitronName from './orbitron-name.json'; // Orbitron Black, just the letters of the name (SIL OFL)
import { buildTrees } from './trees';
import { buildCourse, courseHeight } from './course';
import type { DoorControls } from './vault';
import { buildSalon } from './haussmann';
import { createPost } from './post';
import { tronGrid } from './tron';
import { bakedLight } from './bake';
import { buildDesk } from './desk';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import * as T from './textures';
import {
  COURSE, GALLERY, GALLERY_PIECES, LOBBY, ORDINAL, OUTDOOR_SLUG, ROOM, SALON, ROOM_SLUGS, roomBounds,
  type AboutId, type MuseumProject, type Station, type V3,
} from './layout';

export interface MuseumHandle {
  setScroll(s: number): void;
  // Pixels covered by the info sheet at the bottom of a narrow screen: the
  // view shifts its center up into the open area above it
  setInset(px: number): void;
  // The classified door in the bunker, for the conversation at it
  door(): DoorControls | null;
  dispose(): void;
}

interface Options {
  stations: Station[];
  projects: MuseumProject[];
  ordinals: string[]; // the owner's own inscriptions; generated stand-ins if empty
  panels: { station: number; element: HTMLElement }[]; // hologram panels, rendered by React
  reduceMotion: boolean;
  onPlacard(slug: string): void;
  onKnock(): void; // the classified door was clicked
  onAbout(id: AboutId): void; // something on the front desk was clicked
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
  T.setPhoneTextures(mobile);

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
    mesh.userData.shell = true; // floor, walls, ceiling: what a room's baked light map covers (see bake.ts)
    scene.add(mesh);
    return mesh;
  }

  type Win = { y0: number; y1: number; w: number; zs: number[] };
  type Hole = { x0: number; x1: number; z0: number; z1: number };
  const openings: { side: number; x: number; y0: number; y1: number; z0: number; z1: number }[] = [];

  // A side wall (thickness along x) with an optional band of windows
  function sideWall(xa: number, xb: number, z1: number, z0: number, h: number, mat: Mat, side: number, win?: Win) {
    if (!win) { slab([xa, 0, z1], [xb, h, z0], mat); return; }
    if (win.y0 > 0) slab([xa, 0, z1], [xb, win.y0, z0], mat); // (a French window runs to the floor)
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
    opts: { windows?: Win; winSide?: number; skylights?: Hole[] } = {}) {
    slab([b.x0 - WALL_T, -0.2, b.z1], [b.x1 + WALL_T, 0, b.z0], floor);
    ceiling(b.x0 - WALL_T, b.x1 + WALL_T, b.z1, b.z0, b.h, ceil, opts.skylights);
    // windows in both side walls, or just the one winSide names
    sideWall(b.x0 - WALL_T, b.x0, b.z1, b.z0, b.h, wall, -1, opts.winSide === 1 ? undefined : opts.windows);
    sideWall(b.x1, b.x1 + WALL_T, b.z1, b.z0, b.h, wall, 1, opts.winSide === -1 ? undefined : opts.windows);
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

  // The lobby, the gallery and the salon have their light baked (bake.ts),
  // and a baked material belongs to one room: so each gets its own copies of
  // the shared wall, floor and ceiling materials
  const own = (m: Mat) => track(m.clone() as Mat);
  const LOBBY_MAT = { wall: own(M.concrete), floor: own(M.marbleFloor) };
  const GALLERY_MAT = { wall: own(M.plaster), floor: own(M.polished), ceil: own(M.ceiling) };
  const noBake = new URLSearchParams(window.location.search).has('nobake'); // ?nobake: live light, to compare

  const LOBBY_SKYLIGHTS: Hole[] = [-5, 0, 5].map((x) => ({ x0: x - 0.55, x1: x + 0.55, z0: 4, z1: -12 }));
  space(LOBBY, LOBBY_MAT.wall, LOBBY_MAT.floor, LOBBY_MAT.wall, { skylights: LOBBY_SKYLIGHTS });
  partition(LOBBY.z0, LOBBY.x0 - WALL_T, LOBBY.x1 + WALL_T, LOBBY.h, M.concrete, LOBBY_MAT.wall);
  partition(LOBBY.z1, LOBBY.x0 - WALL_T, LOBBY.x1 + WALL_T, LOBBY.h, LOBBY_MAT.wall, GALLERY_MAT.wall, { x: 0, w: 4.2, h: 5.2 });

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
  // Out on the course it's late afternoon: the sun sinks to about 28° and
  // swings round ahead and to the left, so the grass is backlit and shadows
  // reach toward you. The sky follows it. (Nothing indoors is visible from
  // out there, so the rooms keep their midday light.) The shadow map then
  // covers just the hole, so the tree's and the flag's shadows stay crisp.
  const SUN_OUT = new THREE.Vector3(-0.45, 0.47, -0.76).normalize();
  const sunDir = SUN_DIR.clone();
  const COURSE_CENTER = new THREE.Vector3(COURSE.green.x - 3, 0, COURSE.z0 - 26);
  const sunCenter = MUSEUM_CENTER.clone();
  let outT = 0; // 0 indoors, 1 out on the course
  const setOutdoors = (on: boolean, dt: number) => {
    const goal = on ? 1 : 0;
    if (outT === goal) return;
    outT = reduceMotion ? goal : Math.abs(goal - outT) < 0.002 ? goal : outT + (goal - outT) * (1 - Math.exp(-dt * 2.2));
    const e = outT * outT * (3 - 2 * outT);
    sunDir.copy(SUN_DIR).lerp(SUN_OUT, e).normalize();
    skyU.sunPosition.value.copy(sunDir);
    // a tighter, fainter halo round the sun, and less glow, once it's in view
    skyU.mieCoefficient.value = THREE.MathUtils.lerp(0.004, 0.0018, e);
    skyU.mieDirectionalG.value = THREE.MathUtils.lerp(0.8, 0.9, e);
    post?.setBloom(THREE.MathUtils.lerp(0.2, 0.05, e), THREE.MathUtils.lerp(4, 14, e));
    sunCenter.lerpVectors(MUSEUM_CENTER, COURSE_CENTER, e);
    sun.target.position.copy(sunCenter);
    sun.position.copy(sunCenter).addScaledVector(sunDir, 90);
    if (mobile) return;
    const cam = sun.shadow.camera, half = outT > 0.5 ? 40 : 80;
    if (cam.right !== half) {
      cam.left = -half; cam.right = half; cam.top = half; cam.bottom = -half;
      cam.updateProjectionMatrix();
    }
    sunDirty = Math.max(sunDirty, 2);
  };
  // Less fill on desktop, so sunlit and shaded areas read as daylight does
  const hemi = new THREE.HemisphereLight('#eef2f6', '#4a4741', mobile ? 0.6 : 0.5);
  scene.add(hemi);
  // Underground (the bunker's corridor) the daylight fill fades away; on
  // phones, with no shadow maps to block it, the sun does too
  const LIGHT_BASE = { sun: sun.intensity, hemi: hemi.intensity, env: scene.environmentIntensity };
  let below = 0;
  const setBelow = (camY: number) => {
    const b = Math.min(1, Math.max(0, (-0.3 - camY) / 1.8));
    if (Math.abs(b - below) < 0.002) return;
    below = b;
    hemi.intensity = LIGHT_BASE.hemi * (1 - 0.9 * b);
    scene.environmentIntensity = LIGHT_BASE.env * (1 - 0.6 * b);
    if (mobile) sun.intensity = LIGHT_BASE.sun * (1 - b);
  };

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

  // Name on the wall over the gallery door, set like the home page's
  // SeanMunley in Orbitron Black: "SeanMun" stands proud of the concrete in
  // block letters with flat chiselled bevels that catch the light, and
  // "ley" is cut into the wall, a V-groove the way stone is lettered
  {
    const font = new Font(orbitronName as unknown as FontData);
    const SIZE = 1.12, TRACK = 0.05 * SIZE, BASE = 6.9;
    const wallZ = LOBBY.z1 + WALL_T / 2;
    const adv = (ch: string) => (font.data.glyphs[ch].ha / font.data.resolution) * SIZE + TRACK;
    const word = 'SeanMunley', cut = 7; // 'ley' starts here
    const width = [...word].reduce((a, ch) => a + adv(ch), 0) - TRACK;
    const xs: number[] = [];
    [...word].reduce((x, ch) => { xs.push(x); return x + adv(ch); }, -width / 2);

    // Raised: each letter stands 16 cm proud, with a single-step bevel (a flat chamfer)
    const raised = mergeGeometries([...word.slice(0, cut)].map((ch, i) => {
      const g = new THREE.ExtrudeGeometry(font.generateShapes(ch, SIZE), {
        depth: 0.06, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.03, bevelSegments: 1, curveSegments: 8,
      });
      g.translate(xs[i], BASE, 0);
      return g;
    }));
    raised.computeVertexNormals();
    const letters = new THREE.Mesh(track(raised), color('#b9b4ab', { roughness: 0.82 }));
    letters.position.z = wallZ + 0.05; // the back bevel meets the wall
    letters.castShadow = letters.receiveShadow = true;
    scene.add(letters);

    // Carved: a decal on the wall with a normal map of a V-groove, deepest
    // along each stroke's centre line, and shading that darkens with depth
    const PX = 420; // texels per metre
    const x0 = xs[cut] - 0.05, x1 = xs[word.length - 1] + adv(word[word.length - 1]) + 0.05;
    const yTop = BASE + 0.95 * SIZE, yBot = BASE - 0.3 * SIZE;
    const W = Math.ceil((x1 - x0) * PX), H = Math.ceil((yTop - yBot) * PX);
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const g2 = cv.getContext('2d', { willReadFrequently: true })!;
    g2.fillStyle = '#fff';
    for (let i = cut; i < word.length; i++) {
      for (const shape of font.generateShapes(word[i], SIZE)) {
        const path = new Path2D();
        for (const contour of [shape.getPoints(12), ...shape.holes.map((h) => h.getPoints(12))]) {
          contour.forEach((p, j) => {
            const px = (xs[i] + p.x - x0) * PX, py = (yTop - (BASE + p.y)) * PX;
            if (j) path.lineTo(px, py); else path.moveTo(px, py);
          });
          path.closePath();
        }
        g2.fill(path, 'evenodd');
      }
    }
    const img = g2.getImageData(0, 0, W, H), a = img.data;
    // distance to the letter's edge, in texels (two-pass chamfer)
    const d = new Float32Array(W * H);
    for (let i = 0; i < W * H; i++) d[i] = a[i * 4] > 127 ? 1e6 : 0;
    const at = (x: number, y: number) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : d[y * W + x]);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (d[i]) d[i] = Math.min(d[i], at(x - 1, y) + 1, at(x, y - 1) + 1, at(x - 1, y - 1) + 1.414, at(x + 1, y - 1) + 1.414);
    }
    for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) {
      const i = y * W + x;
      if (d[i]) d[i] = Math.min(d[i], at(x + 1, y) + 1, at(x, y + 1) + 1, at(x + 1, y + 1) + 1.414, at(x - 1, y + 1) + 1.414);
    }
    let deepest = 0;
    for (let i = 0; i < W * H; i++) deepest = Math.max(deepest, d[i]);
    const nrm = g2.createImageData(W, H), n = nrm.data;
    const col = g2.createImageData(W, H), c = col.data;
    const SLOPE = 1.4; // groove walls at roughly 55 degrees
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, o = i * 4;
      const depth = Math.min(d[i], deepest) / deepest; // 0 at the edge, 1 on the centre line
      // h = -distance: the floor of the groove falls toward the centre
      const hx = -(at(x + 1, y) - at(x - 1, y)) / 2, hy = -(at(x, y + 1) - at(x, y - 1)) / 2;
      const nx = -hx * SLOPE, ny = hy * SLOPE, len = Math.hypot(nx, ny, 1);
      n[o] = 128 + 127 * (nx / len); n[o + 1] = 128 + 127 * (ny / len); n[o + 2] = 255 * (1 / len); n[o + 3] = 255;
      const shade = 150 - 62 * depth; // darker toward the bottom of the cut
      c[o] = shade; c[o + 1] = shade * 0.97; c[o + 2] = shade * 0.93;
      c[o + 3] = Math.min(255, a[o] * 1.0);
    }
    const toTex = (data: ImageData, srgb: boolean) => {
      const k = document.createElement('canvas');
      k.width = W; k.height = H;
      k.getContext('2d')!.putImageData(data, 0, 0);
      const t = track(new THREE.CanvasTexture(k));
      if (srgb) t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      return t;
    };
    const carved = track(new THREE.MeshStandardMaterial({
      map: toTex(col, true), normalMap: toTex(nrm, false), normalScale: new THREE.Vector2(1.6, 1.6),
      transparent: true, roughness: 0.92, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2,
    }));
    const decal = plane(x1 - x0, yTop - yBot, carved, [(x0 + x1) / 2, (yTop + yBot) / 2, wallZ + 0.003]);
    decal.receiveShadow = true;

    const sub = T.lettering('SELECTED WORKS', { size: 60, weight: 400, spacing: 0.6, color: '#46433e' });
    track(sub.texture);
    plane(3.2, 3.2 / sub.aspect, basic(sub.texture, true), [0, BASE - 0.5, wallZ + 0.02]);
  }

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
  space(GALLERY, GALLERY_MAT.wall, GALLERY_MAT.floor, GALLERY_MAT.ceil, { skylights: [ATRIUM] });
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
  // A dusty shaft of sun from a window facing it, down to the floor
  function sunShaft(o: { side: number; x: number; y0: number; y1: number; z0: number; z1: number }) {
    if (Math.sign(SUN_DIR.x) !== o.side) return;
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

  for (const o of openings) {
    const zc = (o.z0 + o.z1) / 2, yc = (o.y0 + o.y1) / 2, w = o.z1 - o.z0, h = o.y1 - o.y0;
    const pane = plane(w, h, glass, [o.x - o.side * 0.12, yc, zc], o.side < 0 ? Math.PI / 2 : -Math.PI / 2);
    pane.castShadow = false;
    const mx = o.x - o.side * 0.14;
    for (const dz of [-w / 2, -w / 6, w / 6, w / 2]) box([0.06, h, 0.06], [mx, yc, zc + dz], mullion).castShadow = true;
    for (const y of [o.y0, yc, o.y1]) box([0.06, 0.06, w], [mx, y, zc], mullion).castShadow = true;
    sunShaft(o);
  }

  // ---------- project rooms ----------

  const videoScreens: { index: number; video: HTMLVideoElement; src: string; mat: THREE.MeshBasicMaterial; loaded: boolean }[] = [];
  const animators: ((t: number, dt: number) => void)[] = [];
  const clickable: THREE.Object3D[] = [];

  // The front desk, right of the gallery door (desk.ts)
  {
    const sign = T.lettering('INFORMATION', { size: 60, weight: 400, spacing: 0.6, color: '#46433e' });
    track(sign.texture);
    buildDesk({ scene, track, clickable, concrete: M.concrete.map, marble: plinthMat.map, wallZ: LOBBY.z1 + WALL_T / 2, sign: basic(sign.texture, true), signAspect: sign.aspect });
  }

  // fogRange: [near, far]; rooms keep the building's default
  // the MNS grid runs from the room's back left corner
  const MNS_GRID = ((r) => [r.x0, r.z1 + WALL_T / 2] as [number, number])(roomBounds(ROOM_SLUGS.indexOf('money-never-sleeps')));
  const roomStyle: Record<string, { wall: Mat; floor: Mat | null; ceil: Mat; fog: string; fogRange?: [number, number] }> = {
    // A Haussmann salon: warm white plaster, oak chevrons (see haussmann.ts)
    'kinetic-email': { wall: std(track(T.plaster('#eee8dc', 21)), 4, { roughness: 0.92 }), floor: std(track(T.parquet()), 2.1, { roughness: 0.3 }), ceil: own(M.ceiling),
      // a long, cool haze: nothing indoors is far enough to fog; the sea is
      fog: '#cdd6dc', fogRange: [30, 240] },
    // Tron: a faint cyan grid drawn by the wall and floor shaders (tron.ts)
    'money-never-sleeps': {
      wall: tronGrid(std(track(T.grain('#0c0f17', 7, 0.05)), 4, { roughness: 0.55, metalness: 0.15 }), { fadeTo: ROOM.h, origin: MNS_GRID }),
      floor: tronGrid(std(track(T.grain('#121216', 12, 0.05)), 3, { roughness: 0.4 }), { origin: MNS_GRID }),
      ceil: std(track(T.grain('#07090e', 8, 0.04)), 4), fog: '#0a0a0f' },
    outlooksucks: { wall: std(track(T.grain('#cbc3ae', 9)), 4), floor: std(track(T.grain('#56606b', 10, 0.18)), 2), ceil: std(track(T.grain('#ecebe6', 11)), 4), fog: '#c9c4b5' },
    // Outdoors: "wall" is the building's back face, seen from the course;
    // the fog is a blue daylight haze that hides where the world ends
    'buddy-cup': { wall: M.concrete, floor: null, ceil: M.ceiling, fog: '#c3d0da', fogRange: [32, 185] },
    'rocket-pool-tour': { wall: std(track(T.grain('#1c2a23', 14)), 4), floor: std(track(T.grain('#3b2717', 15, 0.12)), 3, { roughness: 0.5 }), ceil: std(track(T.grain('#141c18', 16)), 4), fog: '#1a221e' },
    'human-diet': { wall: std(track(T.grain('#c6ab84', 17)), 4), floor: std(track(T.grain('#b39770', 18, 0.14)), 3), ceil: std(track(T.grain('#d8c7a8', 19)), 4), fog: '#c9b391' },
  };
  Object.values(roomStyle).forEach((s) => { track(s.wall); if (s.floor) track(s.floor); track(s.ceil); });
  const FOG_RANGE: [number, number] = [22, 75];

  // Gallery to first room
  partition(GALLERY.z1, -ROOM.width / 2 - WALL_T, ROOM.width / 2 + WALL_T, GALLERY.h, GALLERY_MAT.wall, roomStyle[ROOM_SLUGS[0]].wall,
    { x: ROOM.doorX, w: ROOM.doorW, h: ROOM.doorH });

  const screenFrame = color('#0d0d0d', { roughness: 0.4 });
  const placardFrame = color('#1b1a18', { roughness: 0.5 });
  const loader = new THREE.TextureLoader();

  // Rooms can place GLB models; they load once the loader below is set up.
  // Each model remembers its room, so phones can load a room's models only
  // as the visitor nears it and free them once they've walked on.
  type OnModel = (root: THREE.Object3D, clips: THREE.AnimationClip[]) => void;
  type RoomModel = { room: number; src: string; onLoad: OnModel; root: THREE.Object3D | null; want: boolean; busy: boolean };
  const roomModels: RoomModel[] = [];
  const model = (room: number) => (src: string, onLoad: OnModel) => {
    roomModels.push({ room, src, onLoad, root: null, want: false, busy: false });
  };

  // Posters: the still on each screen until its video plays. Desktop loads
  // them all up front. Phones load a room's posters as the visitor nears
  // it, free them a few stops after, and drop each one once its video is
  // playing (it's only a placeholder by then): together they were ~70 MB.
  type Poster = { room: number; url: string; mat: THREE.MeshBasicMaterial; tex: THREE.Texture | null; loading: boolean; want: boolean; onSize?: (aspect: number) => void };
  const posters: Poster[] = [];
  const loadPoster = (p: Poster) => {
    p.loading = true;
    loader.load(p.url, (t) => {
      p.loading = false;
      t.colorSpace = THREE.SRGBColorSpace;
      if (!mobile) track(t);
      const img = t.image as { width: number; height: number };
      p.onSize?.(img.width / img.height);
      // gone past the room, or its video took over, while this loaded
      if (mobile && (!p.want || p.mat.map)) { t.dispose(); return; }
      if (mobile) shrink(t, 1024);
      lighten(t);
      p.tex = t;
      if (!p.mat.map) { p.mat.map = t; p.mat.color.set('#fff'); p.mat.needsUpdate = true; }
    }, undefined, () => { p.loading = false; });
  };
  const addPoster = (room: number, url: string, mat: THREE.MeshBasicMaterial, onSize?: (aspect: number) => void) => {
    const p: Poster = { room, url, mat, tex: null, loading: false, want: !mobile, onSize };
    posters.push(p);
    if (!mobile) loadPoster(p);
  };
  const freePoster = (p: Poster) => {
    if (!p.tex) return;
    if (p.mat.map === p.tex) { p.mat.map = null; p.mat.color.set('#111'); p.mat.needsUpdate = true; }
    p.tex.dispose();
    p.tex = null;
  };

  let vault: DoorControls | null = null;
  ROOM_SLUGS.forEach((slug, i) => {
    const r = roomBounds(i);
    const style = roomStyle[slug];
    const p = projects.find((x) => x.slug === slug);
    const next = ROOM_SLUGS[i + 1];
    // The course is outdoors: no walls, no ceiling, no screen; the hole
    // itself is built in its dressing (see course.ts)
    // A video that starts loading when the visitor nears this room
    const addVideo = (src: string, mat: THREE.MeshBasicMaterial) => {
      const video = document.createElement('video');
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = 'none';
      videoScreens.push({ index: i, video, src, mat, loaded: false });
    };
    // still: the poster only, never the video (to spare a phone's decoders)
    const videoMat = (src: string, poster: string, still = false) => {
      const mat = track(new THREE.MeshBasicMaterial({ color: '#111', toneMapped: false }));
      addPoster(i, poster, mat);
      if (!still) addVideo(src, mat);
      return mat;
    };

    if (slug === OUTDOOR_SLUG) {
      vault = DRESS[slug]?.({ r, scene, box, plane, color, basic, track, animators, reduceMotion, slab, clickable, videoMat, model: model(i), mobile }) || null;
      return;
    }
    const salon = slug === 'kinetic-email';
    space(r, style.wall, style.floor ?? M.polished, style.ceil,
      salon ? { windows: { y0: 0, y1: SALON.win.h, w: SALON.win.w, zs: [r.zc] }, winSide: 1 } : {});
    if (salon) sunShaft({ side: 1, x: r.x1, y0: 0, y1: SALON.win.h, z0: r.zc - SALON.win.w / 2, z1: r.zc + SALON.win.w / 2 });
    // (the salon is taller than the room after it; the wall above that
    // room's ceiling is out of sight)
    partition(r.z1, r.x0 - WALL_T, r.x1 + WALL_T, next ? Math.max(r.h, roomBounds(i + 1).h) : r.h, style.wall, next ? roomStyle[next].wall : style.wall,
      next ? { x: ROOM.doorX, w: ROOM.doorW, h: ROOM.doorH } : undefined);

    // The first room's name over its doorway, out in the gallery. Later rooms
    // go unsigned: their sign would hang inside the previous room, naming the
    // next project while you're still looking at this one
    if (p && i === 0) {
      const label = T.lettering(p.title.toUpperCase(), { size: 90, weight: 400, color: '#2b2a28', spacing: 0.25 });
      track(label.texture);
      const w = Math.min(4.2, 0.42 * label.aspect);
      plane(w, w / label.aspect, basic(label.texture, true), [ROOM.doorX, ROOM.doorH + 0.55, r.z0 + WALL_T / 2 + 0.02]);
    }

    // Room light
    // (×1.5 since the rooms grew from 14 to 18 m: the walls are further from it)
    const lamp = new THREE.PointLight('#fff1dc', 1.5 * (slug === 'rocket-pool-tour' ? 14 : slug === 'money-never-sleeps' ? 9 : 26), 0, 1.6);
    lamp.position.set(0, salon ? SALON.chandelier.y + 0.2 : r.h - 0.6, r.zc);
    scene.add(lamp);

    // The screen on the left wall, and the placard to its right
    const screenZ = r.zc + 0.4;
    const screenH = 2.5;
    const screenGroup = new THREE.Group();
    screenGroup.position.set(r.x0 + 0.06, salon ? SALON.tvY : 2.45, screenZ);
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
      const w = Math.min(4.6, screenH * aspect);
      const h = w / aspect;
      screen.scale.set(w, h, 1);
      bezel.scale.set(w + 0.14, h + 0.14, 1);
    };
    fit(16 / 9);

    const media = ROOM_MEDIA[slug];
    if (media.poster) addPoster(i, media.poster, screenMat, fit);
    if (media.video) addVideo(media.video, screenMat);
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

    DRESS[slug]?.({ r, scene, box, plane, color, basic, track, animators, reduceMotion, slab, clickable, videoMat, model: model(i), mobile });
    // The salon's light is baked in Blender (see bake.ts)
    if (salon && !noBake) bakedLight({ name: 'salon', room: r, wallT: WALL_T, shell: [style.wall, style.floor ?? M.polished, style.ceil], scene, mobile, track, pmrem,
      gain: mobile ? 1.08 : 1.35 }); // phones render at a brighter exposure
  });

  // ---------- art ----------

  // Phones load their own copies of the models (public/models/m/): the
  // same meshes with every texture at 512 and meshopt geometry, made with
  // gltf-transform (resize, then meshopt). The originals carry 2048
  // textures that decoded to ~16 MB each before they could be shrunk, a
  // spike that killed iPhones while the lobby was still loading.
  const phoneModels = (url: string) => (mobile && /\/models\/(?!m\/).*\.glb$/.test(url) ? url.replace('/models/', '/models/m/') : url);
  const manager = new THREE.LoadingManager();
  manager.setURLModifier(phoneModels);
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
  // Phones: sculpture textures come in at 1024-2048, up to ~22 MB of GPU
  // memory each with mipmaps, and a dozen of them crash iOS Safari's tab.
  // Bring them down to 512 before they upload (posters and prints to their
  // own sizes); at phone size the difference doesn't show.
  const shrunk = new WeakSet<THREE.Texture>();
  const shrink = (t: THREE.Texture, max = 512) => {
    const img = t.image as { width: number; height: number; close?: () => void } | undefined;
    if (shrunk.has(t) || !img || Math.max(img.width, img.height) <= max) return;
    shrunk.add(t);
    const k = max / Math.max(img.width, img.height);
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * k);
    c.height = Math.round(img.height * k);
    c.getContext('2d')!.drawImage(img as CanvasImageSource, 0, 0, c.width, c.height);
    img.close?.(); // ImageBitmaps hold their pixels until closed
    t.image = c;
    t.needsUpdate = true;
  };
  // Phones: an iPhone's CPU and GPU share one pool of memory, and three.js
  // keeps every texture's source image (a canvas, a decoded JPEG) and every
  // model's vertex arrays in JS after uploading them, so each counted
  // about twice. Once uploaded, drop the CPU side. Textures that are drawn
  // again (userData.live) keep theirs; a texture is only ever uploaded
  // again after it's freed and rebuilt, which starts from fresh sources.
  const lighten = (t: THREE.Texture | null | undefined) => {
    if (!mobile || !t || t.userData.live || (t as THREE.VideoTexture).isVideoTexture || t.onUpdate) return;
    t.onUpdate = () => {
      const img = t.image as { width?: number; height?: number } | null;
      if (img && typeof img.width === 'number') t.image = { width: img.width, height: img.height };
      t.onUpdate = null;
    };
  };
  const lightenGeometry = (g: THREE.BufferGeometry) => {
    if (!mobile || g.userData.light) return;
    g.userData.light = true;
    g.computeBoundingSphere(); // culling needs these; worked out while the arrays are here
    g.computeBoundingBox();
    const drop = function (this: { array: unknown }) { this.array = null; };
    for (const a of Object.values(g.attributes)) if ((a as THREE.BufferAttribute).isBufferAttribute) (a as THREE.BufferAttribute).onUpload(drop);
    g.index?.onUpload(drop);
  };
  const asArt = (root: THREE.Object3D) => {
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.castShadow = true;
      m.receiveShadow = true;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      for (const mat of mats as THREE.MeshStandardMaterial[]) {
        const maps = [mat.map, mat.normalMap, mat.roughnessMap, mat.metalnessMap, mat.aoMap, mat.emissiveMap];
        for (const t of maps) {
          if (!t) continue;
          t.anisotropy = mobile ? 4 : 8;
          if (mobile) shrink(t);
          lighten(t);
        }
      }
      // sculptures aren't picked by the pointer, so their arrays can go too
      if (!(m as THREE.SkinnedMesh).isSkinnedMesh) lightenGeometry(m.geometry);
    });
    return root;
  };
  // Room models. Desktop loads them all up front, behind the loading
  // screen. Phones can't hold them all (eight Meshy pieces are ~17 MB of
  // GPU memory each, and iOS Safari drops the tab near 450 MB), so there a
  // room's models load as the visitor approaches it and are freed again a
  // few stops after they leave. A separate loader keeps these late loads
  // out of the loading screen's progress.
  const lazyGltf = new GLTFLoader(new THREE.LoadingManager().setURLModifier(phoneModels));
  lazyGltf.setMeshoptDecoder(MeshoptDecoder);
  lazyGltf.setDRACOLoader(draco);
  const freeModel = (root: THREE.Object3D) => {
    root.removeFromParent();
    root.traverse((o) => {
      const mesh = o as THREE.SkinnedMesh;
      if (!mesh.isMesh) return;
      mesh.geometry.dispose();
      mesh.skeleton?.dispose();
      const mats = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) as THREE.MeshStandardMaterial[];
      for (const mat of mats) {
        for (const t of [mat.map, mat.normalMap, mat.roughnessMap, mat.metalnessMap, mat.aoMap, mat.emissiveMap]) t?.dispose();
        mat.dispose();
      }
    });
  };
  const loadModel = (m: RoomModel, loader: GLTFLoader) => {
    m.busy = true;
    loader.load(m.src, (g) => {
      const root = asArt(g.scene);
      // Compile its shaders off the main thread first (where the browser
      // can), so a model arriving mid-walk doesn't stall a frame
      renderer.compileAsync(root, camera, scene).catch(() => {}).finally(() => {
        m.busy = false;
        m.onLoad(root, g.animations);
        m.root = root;
        if (!m.want) { freeModel(root); m.root = null; } // left the room while it loaded
      });
    }, undefined, () => { m.busy = false; });
  };
  // the stretch of stops, in scroll units, where each room's models are kept
  const roomSpan = ROOM_SLUGS.map((slug) => {
    const first = stations.findIndex((st) => st.slug === slug);
    const last = stations.findLastIndex((st) => st.slug === slug);
    return first < 0 ? null : { first, last };
  });
  // Load from 2.5 stops ahead; free once 4 stops past either end (3.2 on
  // phones). The gap
  // between the two keeps a visitor hovering at a doorway from reloading.
  const updateModels = (s: number) => {
    for (const m of roomModels) {
      const span = roomSpan[m.room];
      const near = !span || (s > span.first - 2.5 && s < span.last + 2.5);
      const gone = mobile ? 3.2 : 4;
      const far = span && (s < span.first - gone || s > span.last + gone);
      if (near) m.want = true;
      else if (far) m.want = false;
      if (m.want && !m.root && !m.busy) loadModel(m, lazyGltf);
      else if (!m.want && m.root) { freeModel(m.root); m.root = null; }
    }
  };
  if (!mobile) for (const m of roomModels) { m.want = true; loadModel(m, gltf); }
  // Phones' posters: load from 3 stops ahead, free 4.5 stops past, and
  // free once the screen's video is showing
  const updatePosters = (s: number) => {
    for (const p of posters) {
      const span = roomSpan[p.room];
      if (!span) continue;
      if (s > span.first - 3 && s < span.last + 3) p.want = true;
      else if (s < span.first - 4.5 || s > span.last + 4.5) p.want = false;
      const videoShowing = !!p.mat.map && p.mat.map !== p.tex;
      if (p.tex && (!p.want || videoShowing)) freePoster(p);
      else if (p.want && !p.tex && !p.loading && !p.mat.map) loadPoster(p);
    }
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
        t.anisotropy = mobile ? 4 : 8;
        track(t);
        const img = t.image as HTMLImageElement;
        const aspect = img.width / img.height;
        if (mobile) shrink(t, 640);
        lighten(t);
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

  // ---------- OrdinalFrame, on the gallery's end wall ----------

  const ordinalProject = projects.find((x) => x.slug === ORDINAL.slug);
  if (ordinalProject) {
    const g = new THREE.Group();
    g.position.set(ORDINAL.x, ORDINAL.y, ORDINAL.z + 0.005);
    scene.add(g);
    gltf.load(ORDINAL.src, (m) => g.add(asArt(m.scene)));

    // The display: a square screen showing only the art, crossfading between
    // pieces, set in a soft white mat that fills the frame's opening
    const slides: CanvasImageSource[] = [];
    const colors: string[] = [];
    const addSlide = (sl: CanvasImageSource) => {
      slides.push(sl);
      colors.push(T.averageColor(sl));
    };
    const W = T.ART_PX, H = T.ART_PX;
    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = W;
    screenCanvas.height = H;
    const sctx = screenCanvas.getContext('2d')!;
    const screenTex = track(new THREE.CanvasTexture(screenCanvas));
    screenTex.userData.live = true; // redrawn every slide
    screenTex.colorSpace = THREE.SRGBColorSpace;
    screenTex.anisotropy = 4;
    const screenMat = track(new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }));
    screenMat.color.setScalar(1.1); // backlit: a touch brighter than the room
    // The gilded frame (Meshy, 1.71 x 1.46 m, its back on the wall; its own
    // white lip about 3 cm out, around a 1.14 x 0.90 m opening). Inside it,
    // the mat board, then a slim black bezel, the screen and its glass
    const SCREEN = 0.72, BEZEL = 0.016;
    const MAT_W = 1.22, MAT_H = 0.96;
    const mat = plane(MAT_W, MAT_H, track(new THREE.MeshStandardMaterial({
      map: track(T.ordinalMat(MAT_W, MAT_H, SCREEN + BEZEL * 2)), roughness: 0.92,
    })), [0, 0, 0.012]);
    scene.remove(mat);
    mat.receiveShadow = true;
    g.add(mat);
    const bezel = box([SCREEN + BEZEL * 2, SCREEN + BEZEL * 2, 0.008], [0, 0, 0.016], color('#070708', { roughness: 0.35, metalness: 0.2 }), g);
    bezel.castShadow = true;
    const screenMesh = new THREE.Mesh(track(new THREE.PlaneGeometry(SCREEN, SCREEN)), screenMat);
    screenMesh.position.z = 0.0205;
    screenMesh.userData.slug = ORDINAL.slug;
    g.add(screenMesh);
    clickable.push(screenMesh);
    // The glass: the room mirrored in it (environment reflection, added on
    // top of the picture) plus a painted sheen that slides as the view moves
    // (unlit, so the room's lamps don't leave hotspots on the art)
    const glass = new THREE.Mesh(track(new THREE.PlaneGeometry(SCREEN, SCREEN)), track(new THREE.MeshBasicMaterial({
      color: '#000000', envMap: scene.environment, combine: THREE.AddOperation, reflectivity: 0.5,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    })));
    glass.position.z = 0.021;
    g.add(glass);
    const glareTex = track(T.screenGlare());
    glareTex.repeat.set(0.5, 0.5);
    glareTex.offset.set(0.25, 0.25);
    const glare = new THREE.Mesh(track(new THREE.PlaneGeometry(SCREEN, SCREEN)), track(new THREE.MeshBasicMaterial({
      map: glareTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    })));
    glare.position.z = 0.0215;
    g.add(glare);
    const glassAt = new THREE.Vector3();
    animators.push(() => {
      glare.getWorldPosition(glassAt);
      const dx = THREE.MathUtils.clamp((camera.position.x - glassAt.x) * 0.06, -0.2, 0.2);
      const dy = THREE.MathUtils.clamp((camera.position.y - glassAt.y) * 0.06, -0.2, 0.2);
      glareTex.offset.set(0.25 - dx, 0.25 - dy);
    });
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
    }

    // Light from the screen: a halo on the wall and a lamp that takes the art's color
    const glow = T.screenGlow(0.62, 0.5, 0.6);
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
  // A stop can frame itself differently on tall, narrow screens (view());
  // the route is rebuilt when the screen changes shape
  const n = stations.length;
  const view = (s: Station, narrow: boolean) => (narrow && s.narrow) || s;
  let P: THREE.Vector3[] = [];
  let path!: THREE.CatmullRomCurve3;
  let heading: { yaw: number; pitch: number }[] = [];
  const buildRoute = (narrow: boolean) => {
    P = stations.map((s) => new THREE.Vector3(...view(s, narrow).pos));
    path = new THREE.CatmullRomCurve3(P, false, 'centripetal', 0.5);
    heading = stations.map((s) => {
      const v = view(s, narrow);
      const d = new THREE.Vector3(...v.look).sub(new THREE.Vector3(...v.pos)).normalize();
      return { yaw: Math.atan2(-d.x, -d.z), pitch: Math.asin(d.y) };
    });
  };
  buildRoute(false);
  const fogColors = stations.map((s) => new THREE.Color(s.fog ?? (s.slug ? roomStyle[s.slug]?.fog ?? '#d9d5ce' : '#d9d5ce')));
  const fogRanges = stations.map((s) => s.fogRange ?? ((s.slug && roomStyle[s.slug]?.fogRange) || FOG_RANGE));
  const fogNearFar = new THREE.Vector2(...FOG_RANGE), fogNearFarTarget = fogNearFar.clone();
  // Stops out on the course (the sun's shadow follows the visitor outdoors)
  const firstOutdoor = stations.findIndex((s) => s.slug === OUTDOOR_SLUG);
  const camPos = P[0].clone();
  let camYaw = heading[0].yaw;
  let camPitch = heading[0].pitch;
  const targetPos = new THREE.Vector3();
  let targetYaw = camYaw;
  // The camera's springs (see tick): rates in 1/s. Position settles in
  // about 2 s, turns a little slower, since a swinging view tires the eye
  // more than walking does
  const SPRING_POS = 2.4, SPRING_TURN = 2.1;
  const camVel = new THREE.Vector3(), springAcc = new THREE.Vector3();
  let yawVel = 0, pitchVel = 0;
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
    fogNearFarTarget.set(
      THREE.MathUtils.lerp(fogRanges[i][0], fogRanges[i + 1][0], e),
      THREE.MathUtils.lerp(fogRanges[i][1], fogRanges[i + 1][1], e),
    );
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
      const v = view(st, narrow);
      const pos = new THREE.Vector3(...v.pos);
      const fwd = new THREE.Vector3(...v.look).sub(pos).normalize();
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

  // Phones also unload a room's videos once the visitor is 2.4 stops past it:
  // Safari keeps every loaded video's decoder and frames alive otherwise.
  // The screen falls back to its poster until they come back.
  type Live = { tex: THREE.VideoTexture | null; poster: THREE.Texture | null; posterColor: THREE.Color; onPlaying: () => void };
  const live = new Map<(typeof videoScreens)[number], Live>();
  function updateVideos(s: number) {
    for (const v of videoScreens) {
      const slug = ROOM_SLUGS[v.index];
      const first = stations.findIndex((st) => st.slug === slug);
      const last = stations.findLastIndex((st) => st.slug === slug);
      const near = s > first - 1.6 && s < last + 1.4;
      const far = s < first - 2.4 || s > last + 2.4; // only phones unload
      if (near && !v.loaded) {
        v.loaded = true;
        const l: Live = { tex: null, poster: null, posterColor: v.mat.color.clone(), onPlaying: () => {
          const vt = track(new THREE.VideoTexture(v.video));
          vt.colorSpace = THREE.SRGBColorSpace;
          l.tex = vt;
          l.poster = mobile ? null : v.mat.map;
          l.posterColor = v.mat.color.clone();
          v.mat.map = vt;
          v.mat.color.set('#fff');
          v.mat.needsUpdate = true;
        } };
        live.set(v, l);
        v.video.addEventListener('playing', l.onPlaying, { once: true });
        v.video.src = v.src;
        v.video.load();
      }
      if (!v.loaded) continue;
      if (mobile && far) {
        const l = live.get(v)!;
        v.video.removeEventListener('playing', l.onPlaying);
        v.video.pause();
        v.video.removeAttribute('src');
        v.video.load();
        if (l.tex) {
          // phones dropped the poster: dark until it reloads on the way back
          v.mat.map = l.poster;
          if (l.poster) v.mat.color.copy(l.posterColor); else v.mat.color.set('#111');
          v.mat.needsUpdate = true;
          l.tex.dispose();
        }
        live.delete(v);
        v.loaded = false;
      } else if (near && v.video.paused) v.video.play().catch(() => {});
      else if (!near && !v.video.paused) v.video.pause();
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
    return h && h.distance < 12 ? (h.object.userData as { slug?: string; action?: string; about?: AboutId }) : null;
  };
  const onMove = (e: PointerEvent) => {
    pointer.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    if (e.pointerType === 'mouse') renderer.domElement.style.cursor = hit(e) ? 'pointer' : 'default';
  };
  const onDown = (e: PointerEvent) => { downAt = { x: e.clientX, y: e.clientY }; };
  const onUp = (e: PointerEvent) => {
    if (!downAt || Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 8) return;
    const target = hit(e);
    if (target?.action === 'knock') opts.onKnock();
    else if (target?.about) opts.onAbout(target.about);
    else if (target?.slug) opts.onPlacard(target.slug);
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
    const wasNarrow = narrow;
    narrow = w / h < 0.8;
    if (narrow !== wasNarrow) buildRoute(narrow);
    camera.fov = narrow ? 56 : 55; // phones: a little closer in
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
  // if 1x is still slow, drop ambient occlusion, the costliest pass.
  // Phones keep watching the whole walk (their heavy rooms come later,
  // as models load), and one-off hitches from a load don't count: each
  // frame counts for at most 50 ms.
  let perfFrames = 0, perfTime = 0, perfSettled = false;
  const adapt = (dt: number) => {
    if (perfSettled || !allLoaded || sunDirty > 0 || document.hidden) return;
    perfFrames++;
    perfTime += mobile ? Math.min(dt, 0.05) : dt;
    if (perfTime < 1.5) return;
    const fps = perfFrames / perfTime;
    perfFrames = 0;
    perfTime = 0;
    if (fps >= (mobile ? 45 : 50)) { if (!mobile) perfSettled = true; return; }
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
    // A critically damped spring, not a plain ease-out: it gathers speed
    // and sheds it smoothly at both ends. (Easing out alone starts every
    // move at full speed, a jolt the eye has to chase: a turn between stops
    // began at over 200°/s. The spring peaks at about a third of that.)
    const k = reduceMotion ? 1 : 1 - Math.exp(-dt * 2.6);
    if (reduceMotion) {
      camPos.copy(targetPos);
      camYaw = targetYaw;
      camPitch = targetPitch;
      camVel.set(0, 0, 0);
      yawVel = pitchVel = 0;
    } else {
      const steps = Math.ceil(dt / (1 / 120)), h = dt / steps;
      for (let i = 0; i < steps; i++) {
        springAcc.subVectors(targetPos, camPos).multiplyScalar(SPRING_POS * SPRING_POS).addScaledVector(camVel, -2 * SPRING_POS);
        camVel.addScaledVector(springAcc, h);
        camPos.addScaledVector(camVel, h);
        yawVel += (wrap(targetYaw - camYaw) * SPRING_TURN * SPRING_TURN - 2 * SPRING_TURN * yawVel) * h;
        camYaw = wrap(camYaw + yawVel * h);
        pitchVel += ((targetPitch - camPitch) * SPRING_TURN * SPRING_TURN - 2 * SPRING_TURN * pitchVel) * h;
        camPitch += pitchVel * h;
      }
    }
    (scene.fog as THREE.Fog).color.lerp(fogTarget, k);
    fogNearFar.lerp(fogNearFarTarget, k);
    (scene.fog as THREE.Fog).near = fogNearFar.x;
    (scene.fog as THREE.Fog).far = fogNearFar.y;
    setOutdoors(firstOutdoor >= 0 && scroll > firstOutdoor - 0.6, dt);
    (scene.background as THREE.Color).copy((scene.fog as THREE.Fog).color);
    camera.position.copy(camPos);
    setBelow(camPos.y);
    lightPool?.();
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
    if (mobile) { updateModels(scroll); updatePosters(scroll); }
    updatePanels(scroll);
    if (post) post.render(dt, t);
    else renderer.render(scene, camera);
    cssRenderer.render(cssScene, camera);
  };
  // Phones: every drawn texture (surfaces, wall labels, placards, mats)
  // goes to 512 at most before the first frame, so the big ones never
  // reach the GPU; the redrawn ones (userData.live) keep their size.
  if (mobile) {
    const seen = new Set<THREE.Texture>();
    scene.traverse((o) => {
      const mats = (o as THREE.Mesh).material;
      if (!mats) return;
      for (const m of (Array.isArray(mats) ? mats : [mats]) as THREE.MeshStandardMaterial[]) {
        for (const t of [m.map, m.normalMap, m.roughnessMap, m.bumpMap, m.emissiveMap, m.alphaMap]) {
          if (!t || seen.has(t)) continue;
          seen.add(t);
          // tiling surfaces, labels, placards and mats: 512 is plenty at phone size
          if ((t as THREE.CanvasTexture).isCanvasTexture && !t.userData.live) shrink(t, 512);
          lighten(t);
        }
      }
    });
  }
  // Phones: a fixed pool of lights follows the visitor. three.js lights
  // every pixel with every light in the scene (26 point and spot lights,
  // most of them rooms away), which is what made phones run hot and
  // stutter. Instead, the originals stay as invisible markers and a few
  // pool lights take on the nearest ones' settings each frame. The pool's
  // size never changes, so no shader is ever recompiled for it.
  const lightPool = mobile ? (() => {
    const points: THREE.PointLight[] = [], spots: THREE.SpotLight[] = [];
    scene.traverse((o) => {
      if ((o as THREE.SpotLight).isSpotLight) spots.push(o as THREE.SpotLight);
      else if ((o as THREE.PointLight).isPointLight) points.push(o as THREE.PointLight);
    });
    for (const l of [...points, ...spots]) l.visible = false;
    const poolP = Array.from({ length: 6 }, () => new THREE.PointLight('#fff', 0));
    const poolS = Array.from({ length: 4 }, () => new THREE.SpotLight('#fff', 0));
    for (const l of poolP) scene.add(l);
    for (const l of poolS) scene.add(l, l.target);
    const at = new THREE.Vector3();
    const where = new Map<THREE.Light, THREE.Vector3>();
    const near = <L extends THREE.PointLight | THREE.SpotLight>(list: L[], n: number) => list
      .filter((l) => l.intensity > 0)
      .map((l) => {
        const w = where.get(l) ?? where.set(l, new THREE.Vector3()).get(l)!;
        l.getWorldPosition(w);
        return { l, d: w.distanceToSquared(camera.position) };
      })
      .sort((a, b) => a.d - b.d)
      .slice(0, n)
      .map((x) => x.l);
    let chosenP: THREE.PointLight[] = [], chosenS: THREE.SpotLight[] = [], frame = 0;
    return () => {
      // re-pick a few times a second; copy every frame (some lights animate)
      if (frame++ % 6 === 0) { chosenP = near(points, poolP.length); chosenS = near(spots, poolS.length); }
      poolP.forEach((p, i) => {
        const o = chosenP[i];
        if (!o) { p.intensity = 0; return; }
        p.color.copy(o.color);
        p.intensity = o.intensity;
        p.distance = o.distance;
        p.decay = o.decay;
        p.position.copy(where.get(o)!);
      });
      poolS.forEach((p, i) => {
        const o = chosenS[i];
        if (!o) { p.intensity = 0; return; }
        p.color.copy(o.color);
        p.intensity = o.intensity;
        p.distance = o.distance;
        p.decay = o.decay;
        p.angle = o.angle;
        p.penumbra = o.penumbra;
        p.position.copy(where.get(o)!);
        p.target.position.copy(o.target.getWorldPosition(at));
        p.target.updateMatrixWorld();
      });
    };
  })() : null;
  tick();

  // The lobby's and the gallery's light is baked in Blender too (bake.ts)
  if (!noBake) {
    bakedLight({ name: 'lobby', room: LOBBY, wallT: WALL_T, shell: [LOBBY_MAT.wall, LOBBY_MAT.floor], scene, mobile, track, pmrem, gain: mobile ? 0.95 : 1 });
    bakedLight({ name: 'gallery', room: GALLERY, wallT: WALL_T, shell: [GALLERY_MAT.wall, GALLERY_MAT.floor, GALLERY_MAT.ceil], scene, mobile, track, pmrem, gain: mobile ? 0.95 : 1 });
  }

  // For the light-baking tools (scripts/museum/bake): with ?bake in the
  // address, the scene is reachable from the page so its geometry can be
  // exported to Blender, along with each space's bounds by name
  if (new URLSearchParams(window.location.search).has('bake')) {
    (window as unknown as { __museumBake?: unknown }).__museumBake = {
      scene, wallT: WALL_T, sun: SUN_DIR.toArray(),
      spaces: { lobby: LOBBY, gallery: GALLERY, salon: roomBounds(0), ...Object.fromEntries(ROOM_SLUGS.map((slug, i) => [slug, roomBounds(i)])) },
    };
  }

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
    door() {
      return vault;
    },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      for (const v of videoScreens) { v.video.pause(); v.video.removeAttribute('src'); v.video.load(); }
      for (const p of posters) p.tex?.dispose();
      for (const m of roomModels) { m.want = false; if (m.root) freeModel(m.root); m.root = null; }
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

const ROOM_MEDIA: Record<string, { video?: string; poster?: string }> = {
  'kinetic-email': { video: '/media/kinetic/sizzle.mp4', poster: '/media/kinetic/sizzle-poster.jpg' },
  'money-never-sleeps': { video: '/media/mns/bump-voice.mp4', poster: '/media/mns/bump-voice.jpg' },
  outlooksucks: { video: '/media/outlooksucks/hero.mp4', poster: '/media/outlooksucks/hero.jpg' },
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
  videoMat(src: string, poster: string, still?: boolean): THREE.MeshBasicMaterial;
  model(src: string, onLoad: (root: THREE.Object3D, clips: THREE.AnimationClip[]) => void): void;
  mobile: boolean;
}

// The lit tubes of a neon sign, from its colour texture: pale, greenish
// pixels become MNS green light, everything else (the board, the white
// net) stays dark. Returns an emissive map.
function tubeMask(img: CanvasImageSource & { width: number; height: number }) {
  const k = Math.min(1, 1024 / Math.max(img.width, img.height));
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * k);
  c.height = Math.round(img.height * k);
  const g = c.getContext('2d', { willReadFrequently: true })!;
  g.drawImage(img, 0, 0, c.width, c.height);
  const px = g.getImageData(0, 0, c.width, c.height);
  const d = px.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], gr = d[i + 1], b = d[i + 2];
    const lum = 0.3 * r + 0.59 * gr + 0.11 * b;
    const green = gr - Math.max(r, b * 0.9);
    const a = Math.min(1, Math.max(0, (lum - 95) / 60)) * Math.min(1, Math.max(0, green / 18));
    d[i] = 40 * a; d[i + 1] = 255 * a; d[i + 2] = 150 * a; d[i + 3] = 255;
  }
  g.putImageData(px, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.flipY = false; // glTF textures aren't flipped
  return t;
}

// A museum wall label (title, artist) on a small backing, at pos in parent
function artLabel(k: Kit, parent: THREE.Object3D, pos: V3, title: string, artist: string, backing?: THREE.Material) {
  const label = new THREE.Group();
  label.position.set(...pos);
  parent.add(label);
  k.box([0.4, 0.26, 0.012], [0, 0, 0.006], backing ?? k.color('#d9d6cf', { roughness: 0.9 }), label);
  const face = new THREE.Mesh(k.track(new THREE.PlaneGeometry(0.384, 0.24)),
    k.track(new THREE.MeshStandardMaterial({ map: k.track(T.artLabel(title, artist)), roughness: 0.8 })));
  face.position.z = 0.0125;
  label.add(face);
}

// A phone the size of a person, on a plinth like a sculpture, its screen a
// portrait video (448 x 960). Stands at [x, z] with its back to a wall;
// rotY turns it (0 faces +z).
function giantPhone(k: Kit, at: [number, number], rotY: number, video: string, poster: string, label: [string, string, string, string]) {
  const phone = new THREE.Group();
  phone.position.set(at[0], 0.5, at[1]);
  phone.rotation.y = rotY;
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
  const screen = new THREE.Mesh(k.track(new THREE.PlaneGeometry(SW, SH)), k.videoMat(video, poster));
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
  const face = new THREE.Mesh(k.track(new THREE.PlaneGeometry(0.42, 0.2625)),
    k.track(new THREE.MeshStandardMaterial({ map: k.track(T.artLabel(label[0], label[1], [label[2], label[3]])), roughness: 0.8 })));
  face.position.set(0.62, -0.25, 0.502);
  phone.add(face);
  // A spot from the ceiling, and the screen's glow on the plinth
  const spot = new THREE.SpotLight('#fff4e4', 30, 9, 0.42, 0.6, 1.4);
  spot.position.set(0, ROOM.h - 0.8, 3.0);
  spot.target.position.set(0, 1.4, 0.2);
  phone.add(spot, spot.target);
  const spill = new THREE.PointLight('#7fb4ff', 1.6, 2.6, 2);
  spill.position.set(0, 1.5, 1.0);
  phone.add(spill);
  return { phone, spot };
}

// A room's dressing; the course returns the classified door's knock
const DRESS: Record<string, (k: Kit) => void | DoorControls> = {
  // A Haussmann salon (haussmann.ts), the right wall a French window onto
  // the lawn and the sea. The app at work: on the back wall, three screens loop the real
  // product, left to right: describe an email and get a build, the AMP
  // version live in Gmail, and Kineticize turning an old email interactive
  'kinetic-email'(k) {
    const { r } = k;
    const H = 0.9, Y = SALON.screenY, z = r.z1 + WALL_T / 2;
    const bezel = k.color('#111214', { roughness: 0.35, metalness: 0.4 });
    const clips = [
      { name: 'generate', aspect: 1100 / 826, title: 'Describe it', artist: '01 · AI Playground → interactive build' },
      { name: 'amp', aspect: 1100 / 890, title: 'Live in the inbox', artist: '02 · The AMP build, running in Gmail' },
      { name: 'kineticize', aspect: 1100 / 720, title: 'Kineticize', artist: '03 · An old email, made interactive' },
    ];
    const screens = clips.map((c, i) => {
      const g = new THREE.Group();
      g.position.set(SALON.screens[i], Y, z);
      k.scene.add(g);
      const W = H * c.aspect;
      k.box([W + 0.1, H + 0.1, 0.06], [0, 0, 0.03], bezel, g).castShadow = true;
      // Phones play only the middle one; the others hold a still
      const scr = new THREE.Mesh(k.track(new THREE.PlaneGeometry(W, H)),
        k.videoMat(`/media/kinetic/${c.name}.mp4`, `/media/kinetic/${c.name}.jpg`, k.mobile && i !== 1));
      scr.position.z = 0.062;
      scr.userData.slug = 'kinetic-email';
      g.add(scr);
      k.clickable.push(scr);
      artLabel(k, g, [W / 2 - 0.2, -H / 2 - 0.3, 0], c.title, c.artist);
      // Screen light on the wall and floor, the cool violet of the app
      const glow = new THREE.PointLight('#8f7dff', 1.4, 2.4, 2);
      glow.position.set(0, -0.2, 0.8);
      g.add(glow);
      return { x: SALON.screens[i], w: W + 0.1 };
    });

    // Right of the door, a phone the size of a person, on a plinth like a
    // sculpture: Bolt, the Kinetic game, playing on its screen
    giantPhone(k, [SALON.phoneX, z + 0.42], 0, '/media/kinetic/bolt.mp4', '/media/kinetic/bolt.jpg',
      ['Bolt', 'Kinetic.Email', 'One email, Deploy to click', 'Play at bolt.kinetic.email']);

    // (the room's own screen is 16:9, 2.5 m tall, capped at 4.6 m wide; see the room loop)
    buildSalon({
      r, scene: k.scene, wallT: WALL_T, track: k.track, animators: k.animators, reduceMotion: k.reduceMotion,
      door: { x: ROOM.doorX, w: ROOM.doorW, h: ROOM.doorH },
      screens, tv: { z: r.zc + 0.4, w: Math.min(4.6, 2.5 * 16 / 9) + 0.14 },
    });
  },

  // Center court: painted hardwood, a neon hoop, and the market on the ribbon board
  'money-never-sleeps'(k) {
    const { r } = k;
    // Black hardwood, its lines laid in neon: green, cyan and purple
    const court = T.neonCourt(-3.5);
    // (phones draw it at 1024: see setPhoneTextures)
    // the court is 14 m; the room's dark floor runs round it
    const floor = k.plane(14, 14, k.track(new THREE.MeshStandardMaterial({
      map: k.track(court.map), emissive: '#ffffff', emissiveMap: k.track(court.glow), emissiveIntensity: 1.6, roughness: 0.28, metalness: 0.1,
    })), [0, 0.003, r.zc]);
    floor.rotation.x = -Math.PI / 2;

    // The hoop (Meshy): a Money Never Sleeps backboard drawn like a $100 bill
    // in tube lettering. Its pale green tubes are found in the texture and lit
    // as neon: a glow map of just the tubes, a green spill on the wall, and
    // the hum and stutter of a gas-discharge sign.
    const HX = -3.5, wallZ = r.z1 + WALL_T / 2, RIM = 0.467;
    const neon = { mats: [] as THREE.MeshStandardMaterial[], base: 2.4 };
    k.model('/models/museum/neon-hoop.glb', (m) => {
      neon.mats.length = 0; // phones reload the hoop after freeing it
      m.position.set(HX, 3.05 - RIM, wallZ + 0.315 + 0.32);
      k.scene.add(m);
      m.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (!mat.map?.image) return;
        mat.emissive = new THREE.Color('#ffffff');
        mat.emissiveMap = tubeMask(mat.map.image as CanvasImageSource & { width: number; height: number }); // freed with the model
        mat.emissiveIntensity = neon.base;
        mat.needsUpdate = true;
        neon.mats.push(mat);
      });
    });
    // the arm from the wall to the board
    k.box([0.14, 0.14, 0.34], [HX, 3.05 + 0.2, wallZ + 0.17], k.color('#15151b', { roughness: 0.4, metalness: 0.6 }));
    const spill = new THREE.PointLight('#00ff87', 4, 5, 1.6);
    spill.position.set(HX, 3.45, wallZ + 0.9);
    k.scene.add(spill);
    // Neon hums: a faint 50 Hz shimmer, and every so often a tube stutters
    let next = 4, stutter = 0;
    k.animators.push((t, dt) => {
      if (k.reduceMotion || !neon.mats.length) return;
      next -= dt;
      if (next <= 0) { stutter = 0.35 + Math.random() * 0.3; next = 6 + Math.random() * 8; }
      let v = 1 + 0.025 * Math.sin(t * 50 * Math.PI * 2 / 60 * 7.3);
      if (stutter > 0) {
        stutter -= dt;
        v *= Math.sin(t * 61) > 0.1 ? 1 : 0.25 + Math.random() * 0.2;
      }
      for (const mat of neon.mats) mat.emissiveIntensity = neon.base * v;
      spill.intensity = 4 * v;
    });

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
    // Two walls only: the back wall you walk toward, and the right wall over
    // the roster phone (the ribbon board stop). Four was a lot going on
    add(ROOM.width, [0, y, r.z1 + WALL_T / 2 + 0.01], 0);
    add(ROOM.depth, [r.x1 - 0.01, y, r.zc], -Math.PI / 2);
    k.animators.push((_t, dt) => {
      if (k.reduceMotion) return;
      for (const b of bands) b.mat.map!.offset.x = (b.mat.map!.offset.x + dt * 0.06) % 1;
    });
    // On the right wall under the ribbon board, a giant phone showing a
    // roster against the cap (sample team, real NBA contracts)
    giantPhone(k, [r.x1 - 0.47, r.zc - 1.9], -Math.PI / 2, '/media/mns/roster.mp4', '/media/mns/roster.jpg',
      ['The roster', 'MNS Fantasy', 'Real NBA contracts, a real cap', 'Sample team, mnsfantasy.com']);

    // Light lines along every seam: bright at the floor, dimmer at the
    // ceiling, up each corner. The floor lines break for the doorways
    {
      const seam = k.track(new THREE.MeshBasicMaterial({ color: new THREE.Color('#00e5ff').multiplyScalar(1.6), toneMapped: false }));
      const seamTop = k.track(new THREE.MeshBasicMaterial({ color: new THREE.Color('#00e5ff').multiplyScalar(0.55), toneMapped: false }));
      const T = 0.035, zb = r.z1 + WALL_T / 2 + T / 2, zf = r.z0 - WALL_T / 2 - T / 2, d = zf - zb;
      const dl = ROOM.doorX - ROOM.doorW / 2, dr = ROOM.doorX + ROOM.doorW / 2;
      for (const [y, mat] of [[T / 2, seam], [ROOM.h - T / 2, seamTop]] as const) {
        k.box([T, T, d], [r.x0 + T / 2, y, (zb + zf) / 2], mat);
        k.box([T, T, d], [r.x1 - T / 2, y, (zb + zf) / 2], mat);
        for (const z of [zb, zf]) {
          if (y > 1) { k.box([r.x1 - r.x0, T, T], [0, y, z], mat); continue; }
          k.box([dl - r.x0, T, T], [(r.x0 + dl) / 2, y, z], mat);
          k.box([r.x1 - dr, T, T], [(dr + r.x1) / 2, y, z], mat);
        }
      }
      for (const x of [r.x0 + T / 2, r.x1 - T / 2]) for (const z of [zb, zf]) k.box([T, ROOM.h, T], [x, ROOM.h / 2, z], seam);
    }

    // a ball at the free throw line
    const ball = new THREE.Mesh(k.track(new THREE.SphereGeometry(0.12, 24, 16)), k.color('#c8642c', { roughness: 0.8 }));
    ball.position.set(-1.6, 0.12, r.z1 + 4.3);
    k.scene.add(ball);
  },

  // A 2007 cubicle: fabric panels, a desk, a beige CRT stuck on a dialog
  outlooksucks(k) {
    const { r } = k;
    // On the back wall, the outlooksucks.email home page video: describe an
    // email, attach a comp, and the AI builds the draft from real blocks
    {
      const W = 3.4, H = W * 800 / 1280, x = -3.9, y = 2.35, z = r.z1 + WALL_T / 2;
      k.box([W + 0.14, H + 0.14, 0.08], [x, y, z + 0.04], k.color('#111214', { roughness: 0.35, metalness: 0.4 }));
      const s = k.plane(W, H, k.videoMat('/media/outlooksucks/ai-build.mp4', '/media/outlooksucks/ai-build.jpg'), [x, y, z + 0.085]);
      s.userData.slug = 'outlooksucks';
      k.clickable.push(s);
    }
    const fabric = k.color('#7d8a99', { roughness: 1 });
    const trim = k.color('#b9b5ab', { roughness: 0.6 });
    const desk = k.color('#c9b48f', { roughness: 0.7 });
    // open toward the doorway, so you see straight into the cubicle
    const cx = 4.0, cz = r.zc - 1.6;
    k.box([2.6, 1.6, 0.06], [cx, 0.8, cz - 1.0], fabric);
    k.box([0.06, 1.6, 2.0], [cx - 1.3, 0.8, cz], fabric);
    k.box([0.06, 1.6, 2.0], [cx + 1.3, 0.8, cz], fabric);
    k.box([2.66, 0.04, 0.08], [cx, 1.62, cz - 1.0], trim);
    k.box([2.5, 0.04, 0.8], [cx, 0.74, cz - 0.58], desk);
    k.box([0.04, 0.7, 0.7], [cx - 1.15, 0.37, cz - 0.58], desk);
    k.box([0.04, 0.7, 0.7], [cx + 1.15, 0.37, cz - 0.58], desk);
    // The computer (Meshy): a beige CRT on a desktop case, a tower beside it,
    // keyboard and ball mouse. Raw model is 1.9 units wide, centred, facing
    // +z; at 0.46 it's 0.87 m wide and sits on the desk top (0.76 m).
    // (on the right of the desk, clear of the tour card at the cubicle stop)
    const PC = 0.46, DESK_TOP = 0.76, pcX = cx + 0.55, pcZ = cz - 0.58;
    k.model('/models/museum/os-computer.glb', (m) => {
      m.scale.setScalar(PC);
      m.position.set(pcX, DESK_TOP + 0.657 * PC, pcZ);
      k.scene.add(m);
    });
    // Its screen, stuck on a dialog, laid over the model's glass (the glass
    // is 0.69 x 0.62 units at x -0.127, y 0.249, front at z 0.335)
    const crt = k.plane(0.66 * PC, 0.58 * PC, k.basic(k.track(T.crtScreen())), [pcX - 0.127 * PC, DESK_TOP + (0.657 + 0.249) * PC, pcZ + 0.337 * PC]);
    crt.userData.slug = 'outlooksucks';
    k.clickable.push(crt);
    // The chair (Meshy): a 2000s task chair, 0.95 m tall at 0.5, turned to the desk
    k.model('/models/museum/os-chair.glb', (m) => {
      m.scale.setScalar(0.5);
      m.position.set(pcX - 0.15, 0.952 * 0.5, cz + 0.25);
      m.rotation.y = Math.PI - 0.35; // pushed back from the desk, swung a little toward the doorway
      k.scene.add(m);
    });
    // fluorescent drop-ceiling panels
    const glow = k.track(new THREE.MeshBasicMaterial({ color: '#f4f8ff', toneMapped: false }));
    for (const x of [-3, 3]) for (const z of [-3.5, 0, 3.5]) {
      const p = k.plane(1.2, 0.6, glow, [x, ROOM.h - 0.02, r.zc + z]);
      p.rotation.x = Math.PI / 2;
    }
  },

  // Out on the course: the hole (course.ts), and the app on a giant phone
  // standing on the grass beside the green
  'buddy-cup'(k) {
    const C = COURSE;
    const door = buildCourse({ scene: k.scene, track: k.track, animators: k.animators, mobile: k.mobile, reduceMotion: k.reduceMotion, clickable: k.clickable });
    // The iPhone app: entering a hole's scores, then the cup page (sample players)
    const { phone, spot } = giantPhone(k, [C.phone.x, C.phone.z], C.phone.rotY, '/media/buddycup/phone.mp4', '/media/buddycup/phone.jpg',
      ['The app', 'Buddy Cup', 'Score a hole, watch the cup move', 'Sample trip, invented players']);
    // Sit the plinth on the slope: its lowest corner just into the grass
    const lowest = Math.min(...[[-1, -0.45], [1, -0.45], [-1, 0.5], [1, 0.5]].map(([dx, dz]) => {
      const c = Math.cos(C.phone.rotY), s = Math.sin(C.phone.rotY);
      return courseHeight(C.phone.x + dx * c + dz * s, C.phone.z - dx * s + dz * c);
    }));
    phone.position.y += lowest - 0.04;
    spot.intensity = 0; // the sun lights it out here

    // Beyond the bunker, out in the sun: a Daniel Arsham bronze bust on
    // its plinth, recreated in 3D (Meshy) from the user's photos of the piece
    // at Whistling Straits. The model is 2.4 m wide, 2.9 m tall and 2.15 m
    // deep, shown at 1.3 (monumental, as his outdoor busts are). It faces +z
    // with its back at z = 0, so it's set down by its middle, turned to the tee
    {
      const S = 1.3, B = { x: -19, z: C.z0 - 25, depth: 2.15 * S };
      const rotY = Math.atan2(C.doorX - B.x, (C.z0 - 1.6) - B.z);
      // seat the plinth on the slope: its lowest corner a little into the turf
      const ground = Math.min(...[[-1.2, -1.1], [1.2, -1.1], [-1.2, 1.1], [1.2, 1.1]].map(([dx, dz]) => [dx * S, dz * S]).map(([dx, dz]) =>
        courseHeight(B.x + dx * Math.cos(rotY) + dz * Math.sin(rotY), B.z - dx * Math.sin(rotY) + dz * Math.cos(rotY))));
      k.model('/models/museum/arsham-bust.glb', (m) => {
        m.scale.setScalar(S);
        m.position.set(B.x - Math.sin(rotY) * B.depth / 2, ground - 0.16, B.z - Math.cos(rotY) * B.depth / 2);
        m.rotation.y = rotY;
        m.traverse((o) => { if ((o as THREE.Mesh).isMesh) o.castShadow = o.receiveShadow = true; });
        k.scene.add(m);
      });
    }
    return door;
  },

  // The pool hall: a table under a low lamp, a rack ready to break
  'rocket-pool-tour'(k) {
    const { r } = k;
    const cx = 3.2, cz = r.zc - 0.5;
    // The table (Meshy, 2.8 x 1.73 m, felt at 0.74 m), long side down the room
    k.model('/models/museum/pool-table.glb', (m) => {
      m.position.set(cx, 0, cz);
      m.rotation.y = Math.PI / 2;
      k.scene.add(m);
    });
    const FELT = 0.74, BR = 0.028, D = BR * 2;
    // Pool balls: 1-8 solid, 9-15 striped, each with its number in a white
    // spot on two sides (drawn on an equirectangular canvas for the sphere)
    const BALL = ['#f6f3ea', '#f2b51f', '#1f4fc9', '#d2322d', '#5b2a86', '#ec6a1f', '#1f7a3a', '#7a1f1f', '#111111'];
    const ballGeo = k.track(new THREE.SphereGeometry(BR, 24, 16));
    const ballTex = (num: number) => {
      const c = document.createElement('canvas');
      c.width = 256; c.height = 128;
      const g = c.getContext('2d')!;
      const color = BALL[num > 8 ? num - 8 : num];
      g.fillStyle = num > 8 ? '#f6f3ea' : color;
      g.fillRect(0, 0, 256, 128);
      if (num > 8) { g.fillStyle = color; g.fillRect(0, 34, 256, 60); }
      if (num > 0) {
        for (const u of [64, 192]) {
          g.fillStyle = '#f6f3ea';
          g.beginPath(); g.arc(u, 64, 17, 0, Math.PI * 2); g.fill();
          g.fillStyle = '#111';
          g.font = `bold ${num > 9 ? 17 : 21}px Arial, sans-serif`;
          g.textAlign = 'center'; g.textBaseline = 'middle';
          g.fillText(String(num), u, 65);
        }
      }
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      return k.track(t);
    };
    let spin = 7;
    const addBall = (num: number, x: number, z: number) => {
      const mat = k.track(new THREE.MeshStandardMaterial({ map: ballTex(num), roughness: 0.12 }));
      const ball = new THREE.Mesh(ballGeo, mat);
      ball.position.set(x, FELT + BR, z);
      // turned every which way, as racked balls are
      spin = (spin * 16807) % 2147483647;
      ball.rotation.set((spin % 628) / 100, (spin % 314) / 50, (spin % 271) / 100);
      ball.castShadow = true;
      k.scene.add(ball);
    };
    // The Rocket Run-Out rack: eleven balls. The 9 on the spot, then 2 and 10,
    // 11, 8 and 3, then 5, 13, 4 and 12, with the 1 behind the middle of the
    // back row. The apex faces the cue ball.
    const RACK = [[9], [2, 10], [11, 8, 3], [5, 13, 4, 12], [1]];
    const apex = cz + 0.62, rowStep = D * Math.sqrt(3) / 2;
    RACK.forEach((row, ri) => row.forEach((num, i) => {
      addBall(num, cx + (i - (row.length - 1) / 2) * D, apex + ri * rowStep);
    }));
    addBall(0, cx, cz - 0.65);

    // The lamp: the Rocket Pool Tour stained-glass shade (Meshy, 2.0 m long,
    // its chain tops 0.45 m either side of centre, 1.0 m above its base). Its
    // shade's lower edge hangs about a metre above the felt.
    const LY = 1.62, CHAIN = 0.45, TOP = LY + 1.0;
    k.model('/models/museum/pool-lamp.glb', (m) => {
      m.position.set(cx, LY, cz);
      m.rotation.y = Math.PI / 2;
      // lit from inside: the glass glows its own colours
      m.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.castShadow = false;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.emissive = new THREE.Color('#ffd2a0');
        mat.emissiveMap = mat.map;
        mat.emissiveIntensity = 0.55;
      });
      k.scene.add(m);
    });
    // Chains up to the ceiling: oval links, each turned a quarter from the last
    const LINK = 0.05;
    const linkGeo = k.track(new THREE.TorusGeometry(0.019, 0.0055, 6, 14));
    linkGeo.scale(1, 1.55, 1);
    const n = Math.ceil((ROOM.h - TOP) / LINK);
    const chain = new THREE.InstancedMesh(linkGeo, k.color('#2b2b2e', { roughness: 0.35, metalness: 0.85 }), n * 2);
    const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1), up = new THREE.Vector3(0, 1, 0);
    let li = 0;
    for (const sz of [-1, 1]) {
      for (let j = 0; j < n; j++) {
        q.setFromAxisAngle(up, j % 2 ? Math.PI / 2 : 0);
        mtx.compose(new THREE.Vector3(cx, TOP + LINK * (j + 0.4), cz + sz * CHAIN), q, one);
        chain.setMatrixAt(li++, mtx);
      }
      // a canopy where each chain meets the ceiling
      const cap = new THREE.Mesh(k.track(new THREE.CylinderGeometry(0.06, 0.08, 0.05, 20)), k.color('#2b2b2e', { roughness: 0.35, metalness: 0.85 }));
      cap.position.set(cx, ROOM.h - 0.025, cz + sz * CHAIN);
      k.scene.add(cap);
    }
    k.scene.add(chain);

    // Incandescent light: three warm bulbs under the shade, one spot casting
    // the pool of light on the felt, and faint beams through the haze
    const WARM = '#ffb070';
    const lamp = new THREE.SpotLight(WARM, 22, 4, 0.98, 0.6, 1.3);
    lamp.position.set(cx, LY + 0.3, cz);
    lamp.target.position.set(cx, 0, cz);
    if (!k.mobile) {
      lamp.castShadow = true;
      lamp.shadow.mapSize.set(1024, 1024);
      lamp.shadow.camera.near = 0.2;
      lamp.shadow.camera.far = 3;
      lamp.shadow.bias = -0.0004;
      lamp.shadow.radius = 4;
    }
    k.scene.add(lamp, lamp.target);
    // Soft beams: brightest at the bulb, fading toward the felt, and to
    // nothing at the cone's edges, so they read as light in the air, not glass
    const beamMat = k.track(new THREE.ShaderMaterial({
      uniforms: { color: { value: new THREE.Color('#ffc58a') }, strength: { value: 0.22 } },
      vertexShader: `
        varying float vUp; varying vec3 vN; varying vec3 vView;
        void main() {
          vUp = uv.y;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vN = normalize(normalMatrix * normal);
          vView = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform vec3 color; uniform float strength;
        varying float vUp; varying vec3 vN; varying vec3 vView;
        void main() {
          float facing = pow(abs(dot(normalize(vN), normalize(vView))), 2.0);
          gl_FragColor = vec4(color * strength * facing * vUp * vUp, 1.0);
        }`,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    }));
    const beamH = LY + 0.22 - FELT;
    const beamGeo = k.track(new THREE.CylinderGeometry(0.1, 0.5, beamH, 32, 1, true));
    const bulbMat = k.track(new THREE.MeshBasicMaterial({ color: '#ffe2b8', toneMapped: false }));
    const bulbGeo = k.track(new THREE.CircleGeometry(0.075, 24));
    for (const dz of [-0.6, 0, 0.6]) {
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(cx, FELT + beamH / 2, cz + dz);
      k.scene.add(beam);
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.rotation.x = Math.PI / 2;
      bulb.position.set(cx, LY + 0.24, cz + dz);
      k.scene.add(bulb);
    }

    // On the back wall, left of the doorway: a giant phone running the RRO
    // score tracker (the live demo, scoring a five-rack match)
    giantPhone(k, [-4.2, r.z1 + WALL_T / 2 + 0.42], 0, '/media/rocket/rro-phone.mp4', '/media/rocket/rro-phone.jpg',
      ['The RRO app', 'Rocket Pool Tour', 'Every rack scored as you tap', 'Live demo, nothing saved']);

    // a cue rack on the right wall
    for (let i = 0; i < 5; i++) {
      const stick = new THREE.Mesh(k.track(new THREE.CylinderGeometry(0.008, 0.014, 1.45, 8)), k.color('#c9a06a', { roughness: 0.5 }));
      stick.position.set(r.x1 - 0.08, 1.2, r.zc + 3.5 + i * 0.16);
      k.scene.add(stick);
    }
  },

  // A natural history diorama: a woolly mammoth on rocks and sand, with
  // the three walkers from the Human Diet site (man, woman and child in the
  // first era's hides) caught mid-stride, crossing in front of it
  'human-diet'(k) {
    const { r } = k;
    const rock = k.color('#8a7b66', { roughness: 0.95, flatShading: true });
    const BASE = 0.3;
    k.box([5, BASE, 4.5], [3.6, BASE / 2, r.zc - 1], k.color('#b9a07a', { roughness: 1 }));
    const rocks: [number, number, number, number][] = [[1.7, 0.5, r.zc - 2.7, 0.45], [5.6, 0.45, r.zc - 2.9, 0.38], [2.6, 0.4, r.zc + 0.6, 0.3], [1.5, 0.38, r.zc + 0.4, 0.22]];
    for (const [x, y, z, s] of rocks) {
      const m = new THREE.Mesh(k.track(new THREE.IcosahedronGeometry(s, 0)), rock);
      m.position.set(x, y, z);
      m.rotation.set(x, z, y);
      k.scene.add(m);
    }
    k.model('/models/museum/mammoth.glb', (m) => {
      m.scale.setScalar(0.88);
      m.position.set(3.3, BASE, r.zc - 2.0);
      m.rotation.y = -0.3;
      k.scene.add(m);
    });
    // Each walker, frozen at a different point in the walk cycle
    const walkers: [string, number, number, number][] = [['man', 4.7, 0.2, 0.32], ['woman', 5.55, 0.5, 0.66], ['child', 5.15, 0.95, 0.1]];
    for (const [who, x, dz, phase] of walkers) {
      k.model(`/models/museum/walker-${who}-1.glb`, (m, clips) => {
        m.position.set(x, BASE, r.zc + dz - 0.6);
        m.rotation.y = -Math.PI / 2 + 0.55; // walking toward the visitor
        m.traverse((o) => { o.frustumCulled = false; }); // skinned: bounds don't follow the pose
        if (clips[0]) {
          const mixer = new THREE.AnimationMixer(m);
          mixer.clipAction(clips[0]).play();
          mixer.setTime(clips[0].duration * phase);
        }
        k.scene.add(m);
      });
    }
    const glass = k.track(new THREE.MeshStandardMaterial({ color: '#dff2f5', transparent: true, opacity: 0.12, roughness: 0.05, depthWrite: false }));
    k.box([5.1, 3.5, 4.6], [3.6, BASE + 1.75, r.zc - 1], glass);
    // a warm museum spot over the case
    const spot = new THREE.SpotLight('#fff0dc', 30, 9, 0.7, 0.6, 1.4);
    spot.position.set(2.2, ROOM.h - 0.3, r.zc + 1.5);
    spot.target.position.set(3.6, 1.0, r.zc - 1.2);
    k.scene.add(spot, spot.target);
  },
};
