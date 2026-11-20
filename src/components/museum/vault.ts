// File: src/components/museum/vault.ts
// Purpose: The bunker under the bunker. In the sand trap beside the green a
// concrete-curbed opening; stairs go down to a short corridor under
// the course, lit by two caged bulbs, ending at a heavy wooden door with a
// slot. Knock (click the door) and it shudders, the slot slides open, and a
// pair of eyes looks out; the museum then hands over to the live door at
// /projects/classified, where the password is checked on the server.
// Nothing secret lives here: this is only the way in.
// - Built in the VAULT frame (layout.ts): u down the stairs, v across.
// - The hatch's rim and the stairwell's walls follow the terrain's height,
//   so the cut through the grass and sand has no gaps.

import * as THREE from 'three';
import { VAULT, COURSE, vaultPoint } from './layout';
import { courseHeight } from './course';
import * as T from './textures';

type Track = <X extends { dispose(): void }>(x: X) => X;

// How far a world point is outside the hatch opening, in meters (<= 0 inside)
export function hatchDist(x: number, z: number) {
  const dx = x - COURSE.bunker.x, dz = z - COURSE.bunker.z;
  const c = Math.cos(VAULT.theta), s = Math.sin(VAULT.theta);
  const u = dx * c - dz * s, v = dx * s + dz * c;
  const mid = (VAULT.open[0] + VAULT.open[1]) / 2, halfU = (VAULT.open[1] - VAULT.open[0]) / 2;
  return Math.max(Math.abs(u - mid) - halfU, Math.abs(v) - VAULT.half);
}
// Is a world point inside the hatch opening (grown by pad)?
export const inHatch = (x: number, z: number, pad = 0) => hatchDist(x, z) < pad;

// The curb round the opening stands this far above the ground
const CURB = 0.2;

// Ground height at a point of the frame, plus a lift
const ground = (u: number, v: number, lift = 0) => {
  const [x, , z] = vaultPoint(u, v, 0);
  return courseHeight(x, z) + lift;
};

function concreteTex() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#8d8a84';
  ctx.fillRect(0, 0, 256, 256);
  let s = 41;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 90; i++) {
    const x = r() * 256, y = r() * 256, rad = 8 + r() * 40;
    ctx.fillStyle = r() < 0.5 ? 'rgba(40,36,30,0.07)' : 'rgba(255,250,240,0.05)';
    for (const ox of [0, -256, 256]) for (const oy of [0, -256, 256]) { ctx.beginPath(); ctx.arc(x + ox, y + oy, rad, 0, Math.PI * 2); ctx.fill(); }
  }
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = r() < 0.5 ? 'rgba(30,28,25,0.25)' : 'rgba(235,230,220,0.18)';
    ctx.fillRect(r() * 256, r() * 256, 1, 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function woodTex() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 512;
  const ctx = c.getContext('2d')!;
  let s = 7;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const planks = 5, pw = 256 / planks;
  // Painted navy, like the door at /projects/classified, the grain showing through
  for (let p = 0; p < planks; p++) {
    const base = 40 + r() * 10;
    ctx.fillStyle = `rgb(${base - 12},${base + 6},${base + 46})`;
    ctx.fillRect(p * pw, 0, pw, 512);
    for (let k = 0; k < 40; k++) {
      ctx.strokeStyle = `rgba(${r() < 0.5 ? '6,10,24' : '90,110,160'},${0.06 + r() * 0.1})`;
      ctx.lineWidth = 0.6 + r() * 1.4;
      const x = p * pw + r() * pw;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(x + (r() - 0.5) * 8, 170, x + (r() - 0.5) * 8, 340, x + (r() - 0.5) * 6, 512);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(4,8,20,0.7)';
    ctx.fillRect(p * pw, 0, 2, 512);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// A box whose UVs tile its texture by meters (every face), not stretched
function box(track: Track, w: number, h: number, d: number, tile = 1.6) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv;
  const dims: [number, number][] = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) {
    const i = f * 4 + k;
    uv.setXY(i, uv.getX(i) * dims[f][0] / tile, uv.getY(i) * dims[f][1] / tile);
  }
  return track(g);
}

// A wall whose top follows the ground: quads from (a0..a1) along one axis,
// from `bottom` up to the ground at each point. at(s) gives the frame (u, v).
function groundWall(track: Track, at: (s: number) => [number, number], a0: number, a1: number, bottom: number, step = 0.1) {
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  const n = Math.max(1, Math.ceil((a1 - a0) / step));
  for (let i = 0; i <= n; i++) {
    const sv = a0 + ((a1 - a0) * i) / n;
    const [u, v] = at(sv);
    const top = ground(u, v, CURB);
    pos.push(u, bottom, v, u, top, v);
    uv.push(sv / 1.6, bottom / 1.6, sv / 1.6, top / 1.6);
    if (i) { const b = (i - 1) * 2; idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return track(g);
}

// The curb: a strip of concrete round the opening, its top CURB above the
// ground, inner edge on the hole, outer edge `w` out along (nu, nv), with a
// face down into the ground on the outside
function coping(track: Track, at: (s: number) => [number, number], nu: number, nv: number, a0: number, a1: number, w: number) {
  const pos: number[] = [], idx: number[] = [];
  const n = Math.max(1, Math.ceil((a1 - a0) / 0.12));
  for (let i = 0; i <= n; i++) {
    const [u, v] = at(a0 + ((a1 - a0) * i) / n);
    const ou = u + nu * w, ov = v + nv * w;
    const yIn = ground(u, v, CURB), yOut = ground(ou, ov, CURB - 0.02);
    pos.push(u, yIn, v, ou, yOut, ov, ou, yOut - CURB - 0.15, ov);
    if (i) {
      const b = (i - 1) * 3;
      idx.push(b, b + 3, b + 1, b + 1, b + 3, b + 4, b + 1, b + 4, b + 2, b + 2, b + 4, b + 5);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return track(g);
}

export function buildVault(o: {
  scene: THREE.Scene;
  track: Track;
  animators: ((t: number, dt: number) => void)[];
  clickable: THREE.Object3D[];
  reduceMotion: boolean;
  rim: number; // the coping's width: enough to cover the terrain's cut edge
}) {
  const { track, reduceMotion } = o;
  const [U0, U1] = VAULT.open;
  const H = VAULT.half, FLOOR = VAULT.floor, CEIL = VAULT.ceil, END = VAULT.end;

  // Everything in the frame: local x = u, local z = v
  const g = new THREE.Group();
  g.position.set(COURSE.bunker.x, 0, COURSE.bunker.z);
  g.rotation.y = VAULT.theta;
  o.scene.add(g);

  const cTex = track(concreteTex());
  const concrete = track(new THREE.MeshStandardMaterial({ map: cTex, roughness: 0.92, side: THREE.DoubleSide }));
  const darkConcrete = track(new THREE.MeshStandardMaterial({ map: cTex, color: '#cfc9be', roughness: 0.95, side: THREE.DoubleSide }));
  const iron = track(new THREE.MeshStandardMaterial({ color: '#1e1c1a', roughness: 0.55, metalness: 0.6 }));
  const silver = track(new THREE.MeshStandardMaterial({ color: '#c9ced6', roughness: 0.25, metalness: 0.95 }));
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = true;
    g.add(m);
    return m;
  };

  // The stairwell's walls, rising to the ground on every side of the opening
  add(groundWall(track, (s) => [s, -H], U0, U1, FLOOR - 0.3), concrete, 0, 0, 0);
  add(groundWall(track, (s) => [s, H], U0, U1, FLOOR - 0.3), concrete, 0, 0, 0);
  add(groundWall(track, (s) => [U0, s], -H, H, FLOOR - 0.3), concrete, 0, 0, 0);
  // over the far end, between the corridor's ceiling and the ground
  const head = new THREE.Mesh(groundWall(track, (s) => [U1, s], -H, H, CEIL), concrete);
  head.castShadow = true;
  g.add(head);

  // Coping round the opening (it hides the terrain's cut edge)
  const W = o.rim;
  for (const [at, nu, nv, a0, a1] of [
    [(s: number) => [s, -H] as [number, number], 0, -1, U0 - W, U1 + W],
    [(s: number) => [s, H] as [number, number], 0, 1, U0 - W, U1 + W],
    [(s: number) => [U0, s] as [number, number], -1, 0, -H, H],
    [(s: number) => [U1, s] as [number, number], 1, 0, -H, H],
  ] as const) {
    const m = new THREE.Mesh(coping(track, at, nu, nv, a0, a1, W), darkConcrete);
    m.receiveShadow = m.castShadow = true;
    g.add(m);
  }

  // Stairs: from the sand at the top of the opening down to the floor
  const y0 = ground(U0, 0, -0.03);
  const n = Math.max(8, Math.round((y0 - FLOOR) / 0.19));
  const rise = (y0 - FLOOR) / n, tread = (U1 - U0) / n;
  const stepGeo = box(track, tread + 0.02, 0.5, H * 2);
  for (let i = 0; i < n; i++) {
    const top = y0 - i * rise;
    add(stepGeo, concrete, U0 + (i + 0.5) * tread, top - 0.25, 0);
  }
  // a pipe handrail down the left wall, 0.9 m over the nosings
  const ra = new THREE.Vector3(U0 + 0.7, y0 - (0.7 / tread) * rise + 0.9, -H + 0.09);
  const rb = new THREE.Vector3(U1, FLOOR + 0.9, -H + 0.09);
  const rail = add(track(new THREE.CylinderGeometry(0.022, 0.022, ra.distanceTo(rb), 8)), iron, (ra.x + rb.x) / 2, (ra.y + rb.y) / 2, ra.z);
  rail.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), rb.clone().sub(ra).normalize());

  // The corridor: floor, walls, ceiling, and the end wall with the door
  const len = END - U1 + 0.3;
  add(box(track, len + (U1 - U0), 0.3, H * 2 + 0.4), darkConcrete, U1 + len / 2 - (U1 - U0) / 2, FLOOR - 0.15, 0);
  for (const side of [-1, 1]) add(box(track, len, CEIL - FLOOR, 0.3), concrete, U1 + len / 2, (FLOOR + CEIL) / 2, side * (H + 0.15));
  add(box(track, len, 0.35, H * 2 + 0.6), darkConcrete, U1 + len / 2, CEIL + 0.175, 0);
  // The end wall, with a doorway (the door hangs in it), and behind it the
  // room: dark until the door swings, then warm light and a bar back wall
  const DW = 1.0, DH = 2.1, side = H + 0.3;
  for (const s of [-1, 1]) add(box(track, 0.3, CEIL - FLOOR + 0.35, side - DW / 2 - 0.08), concrete, END + 0.15, (FLOOR + CEIL) / 2, s * (side + DW / 2 + 0.08) / 2);
  add(box(track, 0.3, CEIL + 0.35 - (FLOOR + DH + 0.08), DW + 0.16), concrete, END + 0.15, (FLOOR + DH + 0.08 + CEIL + 0.35) / 2, 0);
  const ROOM = 2.6;
  const roomMat = track(new THREE.MeshStandardMaterial({ color: '#5a3a24', roughness: 0.8, side: THREE.BackSide }));
  const room = add(box(track, ROOM, CEIL - FLOOR, 2.8), roomMat, END + 0.3 + ROOM / 2, (FLOOR + CEIL) / 2, 0);
  room.castShadow = false;
  // The back bar: shelves of bottles in silhouette against amber light
  const barTex = (() => {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 256;
    const ctx = c.getContext('2d')!;
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#3a1e0e'); grad.addColorStop(0.5, '#b8692a'); grad.addColorStop(1, '#2a160a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);
    let q = 3;
    const r = () => ((q = (q * 16807) % 2147483647) / 2147483647);
    for (const y of [92, 168]) {
      ctx.fillStyle = '#1a0d06';
      ctx.fillRect(0, y, 512, 6);
      for (let x = 8; x < 500; x += 14 + r() * 10) {
        const bh = 34 + r() * 30, bw = 8 + r() * 6;
        ctx.fillStyle = `rgba(20,10,4,${0.75 + r() * 0.2})`;
        ctx.fillRect(x, y - bh, bw, bh);
        ctx.fillRect(x + bw / 2 - 2, y - bh - 12, 4, 12);
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const bar = new THREE.Mesh(track(new THREE.PlaneGeometry(2.6, 1.3)), track(new THREE.MeshBasicMaterial({ map: track(barTex), color: '#000000' })));
  bar.position.set(END + 0.3 + ROOM - 0.02, FLOOR + 1.45, 0);
  bar.rotation.y = -Math.PI / 2;
  g.add(bar);
  const glow = new THREE.PointLight('#ffa552', 0, 6, 1.6);
  glow.position.set(END + 1.2, FLOOR + 2.0, 0);
  g.add(glow);

  // Caged bulbs: one halfway down the corridor, one over the door
  const bulbMat = track(new THREE.MeshBasicMaterial({ color: '#ffd9a0', toneMapped: false }));
  const cageGeo = track(new THREE.TorusGeometry(0.075, 0.006, 6, 16));
  for (const [u, power] of [[U1 + 1.2, 5], [END - 0.7, 7]] as const) {
    const bulb = new THREE.Mesh(track(new THREE.SphereGeometry(0.045, 12, 8)), bulbMat);
    bulb.position.set(u, CEIL - 0.16, 0);
    g.add(bulb);
    for (const r of [0, Math.PI / 2]) {
      const cage = new THREE.Mesh(cageGeo, iron);
      cage.position.set(u, CEIL - 0.16, 0);
      cage.rotation.y = r;
      g.add(cage);
    }
    const lamp = new THREE.PointLight('#ffb766', power, 7, 1.8);
    lamp.position.set(u, CEIL - 0.25, 0);
    g.add(lamp);
  }

  // "MEMBERS ONLY", stencilled on the concrete over the door
  const sign = T.lettering('MEMBERS ONLY', { size: 80, weight: 700, spacing: 0.3, color: '#cfc6b2' });
  track(sign.texture);
  const signW = 1.2;
  const signM = new THREE.Mesh(track(new THREE.PlaneGeometry(signW, signW / sign.aspect)),
    track(new THREE.MeshStandardMaterial({ map: sign.texture, transparent: true, opacity: 0.8, roughness: 1, depthWrite: false })));
  signM.position.set(END - 0.005, FLOOR + 2.32, 0);
  signM.rotation.y = -Math.PI / 2;
  g.add(signM);

  // The door, a sibling of the one at /projects/classified: navy planks,
  // two riveted straps, a silver ring pull, and a wide slot near the top.
  // It hangs on its left edge and swings away, into the room.
  const door = new THREE.Group(); // its face toward -u
  door.position.set(END - 0.02, FLOOR, 0);
  door.rotation.y = -Math.PI / 2;
  g.add(door);
  for (const [w, h, x, y] of [[0.08, DH + 0.08, -DW / 2 - 0.04, DH / 2], [0.08, DH + 0.08, DW / 2 + 0.04, DH / 2], [DW + 0.16, 0.08, 0, DH + 0.04]] as const) {
    const f = new THREE.Mesh(box(track, w, h, 0.12), iron);
    f.position.set(x, y, 0.02);
    door.add(f);
  }
  const hinge = new THREE.Group();
  hinge.position.x = -DW / 2;
  door.add(hinge);
  const slab = new THREE.Group();
  slab.position.x = DW / 2;
  hinge.add(slab);
  const wood = track(new THREE.MeshStandardMaterial({ map: track(woodTex()), roughness: 0.7 }));
  const panel = new THREE.Mesh(track(new THREE.BoxGeometry(DW, DH, 0.07)), wood);
  panel.position.set(0, DH / 2, 0);
  panel.castShadow = panel.receiveShadow = true;
  panel.userData.action = 'knock';
  slab.add(panel);
  o.clickable.push(panel);
  for (const y of [0.42, 1.13]) {
    const strap = new THREE.Mesh(box(track, DW + 0.04, 0.045, 0.02), iron);
    strap.position.set(0, y, 0.045);
    slab.add(strap);
    for (const x of [-0.45, -0.3, -0.15, 0, 0.15, 0.3, 0.45]) {
      const rivet = new THREE.Mesh(track(new THREE.SphereGeometry(0.012, 8, 6)), iron);
      rivet.position.set(x, y, 0.057);
      slab.add(rivet);
    }
  }
  const pull = new THREE.Mesh(track(new THREE.TorusGeometry(0.04, 0.012, 8, 20)), silver);
  pull.position.set(0.39, 0.92, 0.06);
  slab.add(pull);
  // The slot: an iron frame round a dark opening, two eyes in it, and an
  // iron cover that slides up out of the way
  const SY = 1.72, SW = 0.62, SH = 0.2;
  const eyeMat = track(new THREE.MeshBasicMaterial({ color: '#e9e2d2', transparent: true, opacity: 0 }));
  const pupilMat = track(new THREE.MeshBasicMaterial({ color: '#120d08', transparent: true, opacity: 0 }));
  const frame = new THREE.Mesh(box(track, SW + 0.06, SH + 0.06, 0.02), iron);
  frame.position.set(0, SY, 0.04);
  slab.add(frame);
  const hollow = new THREE.Mesh(track(new THREE.PlaneGeometry(SW, SH)), track(new THREE.MeshBasicMaterial({ color: '#030406' })));
  hollow.position.set(0, SY, 0.0505);
  slab.add(hollow);
  const eyes: THREE.Mesh[] = [], pupils: THREE.Mesh[] = [];
  for (const x of [-0.075, 0.075]) {
    const eye = new THREE.Mesh(track(new THREE.CircleGeometry(0.034, 18)), eyeMat);
    eye.position.set(x, SY, 0.051);
    slab.add(eye);
    eyes.push(eye);
    const pupil = new THREE.Mesh(track(new THREE.CircleGeometry(0.013, 12)), pupilMat);
    pupil.position.set(x, SY, 0.052);
    slab.add(pupil);
    pupils.push(pupil);
  }
  const coverMat = track(new THREE.MeshStandardMaterial({ color: '#2b2c2e', roughness: 0.5, metalness: 0.5 }));
  const cover = new THREE.Mesh(box(track, SW + 0.02, SH + 0.02, 0.015), coverMat);
  cover.position.set(0, SY, 0.058);
  const stud = new THREE.Mesh(track(new THREE.SphereGeometry(0.012, 8, 6)), silver);
  stud.position.set(SW / 2 - 0.07, 0, 0.01);
  cover.add(stud);
  cover.userData.action = 'knock';
  slab.add(cover);
  o.clickable.push(cover);

  // The door's moves, driven by the conversation at it (Museum's BunkerDoor):
  // each eases toward its goal every frame
  const state = { shake: -1, shakeAmp: 0, slot: 0, slotGoal: 0, slotSpeed: 4, lid: 0.55, lidGoal: 0.55, swing: 0, swingGoal: 0, clock: 0, blinkAt: 3 };
  o.animators.push((t, dt) => {
    state.clock = t;
    const ease = (v: number, goal: number, speed: number) => (reduceMotion ? goal : v + (goal - v) * Math.min(1, dt * speed));
    // raps, or a slam's jolt
    const k = t - state.shake;
    slab.position.x = DW / 2 + (!reduceMotion && state.shake >= 0 && k < 0.6 && [0, 0.24, 0.48].some((r) => k > r && k < r + 0.1)
      ? Math.sin(k * 140) * state.shakeAmp : 0);
    state.slot = ease(state.slot, state.slotGoal, state.slotSpeed);
    cover.position.y = SY + (SH + 0.03) * state.slot;
    const seen = Math.min(1, Math.max(0, (state.slot - 0.5) * 2));
    eyeMat.opacity = pupilMat.opacity = seen;
    // eyelids: a mood, and a blink every few seconds
    state.lid = ease(state.lid, state.lidGoal, 8);
    const blink = t > state.blinkAt && t < state.blinkAt + 0.14;
    if (t > state.blinkAt + 0.14) state.blinkAt = t + 2.4 + ((t * 7919) % 3);
    for (const e of eyes) e.scale.y = blink ? 0.08 : state.lid;
    for (const p of pupils) p.scale.y = blink ? 0.08 : Math.min(1, state.lid * 1.6);
    // the swing, and light pouring out of the room
    state.swing = ease(state.swing, state.swingGoal, 1.6);
    hinge.rotation.y = 1.75 * state.swing;
    glow.intensity = 9 * state.swing;
    (bar.material as THREE.MeshBasicMaterial).color.setScalar(state.swing);
  });
  const LIDS = { neutral: 0.55, suspicious: 0.3, pleased: 0.38 };
  return {
    knock() { state.shake = state.clock; state.shakeAmp = 0.006; },
    slot(open: boolean, slam = false) {
      state.slotGoal = open ? 1 : 0;
      state.slotSpeed = slam ? 30 : 4;
      if (slam) { state.shake = state.clock - 0.48; state.shakeAmp = 0.012; } // one hard jolt
    },
    mood(m: keyof typeof LIDS) { state.lidGoal = LIDS[m]; },
    swing() { state.swingGoal = 1; },
  };
}

export type DoorControls = ReturnType<typeof buildVault>;
