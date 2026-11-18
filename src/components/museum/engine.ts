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
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import * as T from './textures';
import {
  GALLERY, GALLERY_PIECES, LOBBY, ORDINAL, ROOM, ROOM_SLUGS, STACK, roomBounds,
  type MuseumProject, type Station, type V3,
} from './layout';

export interface MuseumHandle {
  setScroll(s: number): void;
  dispose(): void;
}

interface Options {
  stations: Station[];
  projects: MuseumProject[];
  ordinals: string[]; // the owner's own inscriptions; generated stand-ins if empty
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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.98;
  host.appendChild(renderer.domElement);
  renderer.domElement.style.display = 'block';

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#d9d5ce');
  scene.fog = new THREE.Fog('#d9d5ce', 22, 75);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.38;

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
    scene.add(mesh);
    return mesh;
  }

  // A space: floor, ceiling and side walls. Front and back walls are
  // partitions, shared with the neighboring space.
  function space(b: { x0: number; x1: number; z0: number; z1: number; h: number }, wall: Mat, floor: Mat, ceil: Mat) {
    slab([b.x0 - WALL_T, -0.2, b.z1], [b.x1 + WALL_T, 0, b.z0], floor);
    slab([b.x0 - WALL_T, b.h, b.z1], [b.x1 + WALL_T, b.h + 0.3, b.z0], ceil);
    slab([b.x0 - WALL_T, 0, b.z1], [b.x0, b.h, b.z0], wall);
    slab([b.x1, 0, b.z1], [b.x1 + WALL_T, b.h, b.z0], wall);
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

  space(LOBBY, M.concrete, M.marbleFloor, M.concrete);
  partition(LOBBY.z0, LOBBY.x0 - WALL_T, LOBBY.x1 + WALL_T, LOBBY.h, M.concrete, M.concrete);
  partition(LOBBY.z1, LOBBY.x0 - WALL_T, LOBBY.x1 + WALL_T, LOBBY.h, M.concrete, M.plaster, { x: 0, w: 4.2, h: 5.2 });

  // Skylights: glowing slots in the ceiling and soft shafts of light below
  const skyMat = track(new THREE.MeshBasicMaterial({ color: '#fffaf0', toneMapped: false }));
  const shaftTex = track(T.shaftGradient());
  const shaftMat = track(new THREE.MeshBasicMaterial({
    map: shaftTex, color: '#fff3dc', transparent: true, opacity: 0.07, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false,
  }));
  for (const x of [-5, 0, 5]) {
    const slot = plane(1.1, 16, skyMat, [x, LOBBY.h - 0.01, -4]);
    slot.rotation.x = Math.PI / 2;
    for (const r of [0, Math.PI / 2]) {
      const s = plane(1.4, 13, shaftMat, [x + 1.1, LOBBY.h / 2 - 0.3, -4], r);
      s.rotation.z = 0.18;
      s.renderOrder = 2;
    }
  }

  const sun = new THREE.DirectionalLight('#fff4e2', 1.4);
  sun.position.set(6, 30, 8);
  scene.add(sun);
  scene.add(new THREE.HemisphereLight('#f6f1e8', '#4a4741', 0.6));

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
  sKey.position.set(2.5, 8, -5);
  sKey.target.position.set(0, 1.8, -8.5);
  scene.add(sKey, sKey.target);

  // ---------- gallery ----------

  space(GALLERY, M.plaster, M.polished, M.ceiling);
  // Track lights run the length of the gallery ceiling
  const trackMat = color('#2a2a2a', { roughness: 0.5, metalness: 0.6 });
  for (const x of [-3, 3]) box([0.06, 0.06, 33], [x, GALLERY.h - 0.25, (GALLERY.z0 + GALLERY.z1) / 2], trackMat);

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
    if (media.video) {
      const video = document.createElement('video');
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = 'none';
      videoScreens.push({ index: i, video, src: media.video, mat: screenMat, loaded: false });
    }

    if (p) {
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

    DRESS[slug]?.({ r, scene, box, plane, color, basic, track, animators, reduceMotion, slab, clickable });
  });

  // ---------- art ----------

  const manager = new THREE.LoadingManager();
  let loaded = 0;
  let total = 0;
  manager.onStart = (_u, l, t) => { loaded = l; total = t; opts.onProgress(loaded, total); };
  manager.onProgress = (_u, l, t) => { loaded = l; total = t; opts.onProgress(loaded, total); };
  const gltf = new GLTFLoader(manager);
  gltf.setMeshoptDecoder(MeshoptDecoder);
  const photoLoader = new THREE.TextureLoader(manager);

  gltf.load('/models/s-mark.glb', (g) => {
    const model = g.scene;
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const scale = 1.5 / size.y;
    model.scale.setScalar(scale);
    const center = bounds.getCenter(new THREE.Vector3());
    model.position.set(-center.x * scale, -bounds.min.y * scale + 0.02, -center.z * scale);
    sPivot.add(model);
  });

  const frameMat = color('#141414', { roughness: 0.45 });
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
        group.add(g.scene);
      });
      pieceLights.push([p.side * 3.2, GALLERY.h - 0.4, p.z]);
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
    const s = new THREE.SpotLight('#fff3e0', 45, 12, 0.5, 0.65, 1.4);
    s.position.set(...lp);
    s.target.position.set(Math.sign(lp[0]) * 6, 1.6, lp[2]);
    scene.add(s, s.target);
  }

  // Stack, on a plinth in the middle of the floor
  box([0.62, STACK.plinth, 0.62], [STACK.x, STACK.plinth / 2, STACK.z], plinthMat);
  blob(STACK.x, STACK.z, 1.6);
  gltf.load(STACK.src, (g) => {
    g.scene.position.set(STACK.x, STACK.plinth, STACK.z);
    scene.add(g.scene);
    animators.push((t) => { if (!reduceMotion) g.scene.rotation.y = t * 0.15; });
  });
  const stackLight = new THREE.SpotLight('#fff3e0', 40, 10, 0.32, 0.6, 1.4);
  stackLight.position.set(STACK.x + 0.5, GALLERY.h - 0.4, STACK.z + 1);
  stackLight.target.position.set(STACK.x, 1, STACK.z);
  scene.add(stackLight, stackLight.target);

  // ---------- OrdinalFrame, glowing in the dark pool room ----------

  const ordinalProject = projects.find((x) => x.slug === ORDINAL.slug);
  if (ordinalProject) {
    const room = roomBounds(ROOM_SLUGS.indexOf(ORDINAL.room as (typeof ROOM_SLUGS)[number]));
    const z = room.zc + ORDINAL.dz;
    const g = new THREE.Group();
    g.position.set(room.x1 - 0.005, ORDINAL.y, z);
    g.rotation.y = -Math.PI / 2;
    scene.add(g);
    gltf.load(ORDINAL.src, (m) => g.add(m.scene));

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

  const n = stations.length;
  const P = stations.map((s) => new THREE.Vector3(...s.pos));
  const L = stations.map((s) => new THREE.Vector3(...s.look));
  const fogColors = stations.map((s) => new THREE.Color(s.slug ? roomStyle[s.slug]?.fog ?? '#d9d5ce' : '#d9d5ce'));
  const camPos = P[0].clone();
  const camLook = L[0].clone();
  const targetPos = new THREE.Vector3();
  const targetLook = new THREE.Vector3();
  const fogTarget = new THREE.Color();
  let scroll = 0;
  const pointer = new THREE.Vector2();
  const pointerSmooth = new THREE.Vector2();

  const smooth = (a: number, b: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };

  function routeAt(s: number) {
    const clamped = Math.min(n - 1, Math.max(0, s));
    const i = Math.min(n - 2, Math.floor(clamped));
    const e = smooth(0.12, 0.88, clamped - i);
    targetPos.lerpVectors(P[i], P[i + 1], e);
    targetLook.lerpVectors(L[i], L[i + 1], e);
    fogTarget.lerpColors(fogColors[i], fogColors[i + 1], e);
  }

  // ---------- video lifecycle ----------

  function updateVideos(s: number) {
    for (const v of videoScreens) {
      const stationIdx = stations.findIndex((st) => st.slug === ROOM_SLUGS[v.index]);
      const near = Math.abs(s - stationIdx - 0.5) < 2.2;
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

  const resize = () => {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 0.8 ? 72 : 55;
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(host);

  // ---------- loop ----------

  const timer = new THREE.Timer();
  let raf = 0;
  const tick = (now?: number) => {
    raf = requestAnimationFrame(tick);
    timer.update(now);
    const dt = Math.min(timer.getDelta(), 0.1);
    const t = timer.getElapsed();
    routeAt(scroll);
    const k = reduceMotion ? 1 : 1 - Math.exp(-dt * 5);
    camPos.lerp(targetPos, k);
    camLook.lerp(targetLook, k);
    (scene.fog as THREE.Fog).color.lerp(fogTarget, k);
    (scene.background as THREE.Color).copy((scene.fog as THREE.Fog).color);
    camera.position.copy(camPos);
    camera.lookAt(camLook);
    if (!reduceMotion && !mobile) {
      pointerSmooth.lerp(pointer, 1 - Math.exp(-dt * 3));
      camera.rotateY(-pointerSmooth.x * 0.06);
      camera.rotateX(-pointerSmooth.y * 0.04);
    }
    if (!reduceMotion) sPivot.rotation.y = t * 0.25;
    for (const a of animators) a(t, dt);
    renderer.render(scene, camera);
  };
  tick();

  return {
    setScroll(s: number) {
      scroll = s;
      updateVideos(s);
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
      renderer.dispose();
      renderer.domElement.remove();
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
