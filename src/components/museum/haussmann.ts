// File: src/components/museum/haussmann.ts
// Purpose: The Kinetic room as a Haussmann salon: a tall ceiling with a
// cornice and a ceiling rose, wall panels in moulded frames, a white marble
// fireplace under the room's screen, a brass chandelier, and the right wall
// opened into a French window onto the lawn and the sea, its sheers and
// drapes moving in the breeze.
//
// Weight: everything painted white (panels, cornice, rose, casings) is one
// merged mesh; the window joinery, the railing, the chandelier's brass and
// its candles are one mesh each. The curtains move in their vertex shader,
// so nothing is re-uploaded per frame. The view outside is the golf
// course's grass and the sea (course.ts).

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SALON } from './layout';

type Bounds = { x0: number; x1: number; z0: number; z1: number; zc: number; h: number };
type Wall = 'L' | 'R' | 'B' | 'F';
type Track = <X extends { dispose(): void }>(x: X) => X;

export type SalonOpts = {
  r: Bounds;
  scene: THREE.Scene;
  wallT: number;
  track: Track;
  animators: ((t: number, dt: number) => void)[];
  reduceMotion: boolean;
  door: { x: number; w: number; h: number };
  screens: { x: number; w: number }[]; // the app screens on the back wall (bezel included)
  tv: { z: number; w: number }; // the room's own screen on the left wall, over the fireplace
};

// Long boxes (a cornice, a baseboard) are cut into ~1 m lengths: their light
// is baked per vertex (bake.ts), and one box the length of the room would
// only know the light at its two ends
const cuts = (len: number) => (len > 1.5 ? Math.min(24, Math.ceil(len)) : 1);
const box = (sx: number, sy: number, sz: number, x: number, y: number, z: number) => {
  const g = new THREE.BoxGeometry(sx, sy, sz, cuts(sx), cuts(sy), cuts(sz));
  g.translate(x, y, z);
  return g;
};

export function buildSalon(o: SalonOpts) {
  const { r, scene, track, wallT } = o;
  const H = r.h;
  const win = SALON.win;
  const winZ0 = r.zc - win.w / 2, winZ1 = r.zc + win.w / 2;

  // Each merged mesh gets a stable name, so its baked light (one colour per
  // vertex, see bake.ts) can find it again
  let meshes = 0;
  const mesh = (geos: THREE.BufferGeometry[], mat: THREE.Material, shadow = false) => {
    const g = track(mergeGeometries(geos, false));
    geos.forEach((x) => x.dispose());
    const m = new THREE.Mesh(g, mat);
    m.userData.bake = `salon-${meshes++}`;
    m.receiveShadow = true;
    m.castShadow = shadow;
    scene.add(m);
    return m;
  };
  const paint = track(new THREE.MeshStandardMaterial({ color: '#f2ede3', roughness: 0.55 }));

  // ---------- mouldings: one mesh ----------
  const trim: THREE.BufferGeometry[] = [];
  const face = { R: r.x1, L: r.x0, B: r.z1 + wallT / 2, F: r.z0 - wallT / 2 };
  // A box on a wall in the wall's own terms: u along it, y up, d out into the room
  const wb = (w: Wall, u0: number, u1: number, y0: number, y1: number, d0: number, d1: number, into = trim) => {
    const du = u1 - u0, dy = y1 - y0, dd = d1 - d0, uc = (u0 + u1) / 2, yc = (y0 + y1) / 2, dc = (d0 + d1) / 2;
    if (w === 'R') into.push(box(dd, dy, du, face.R - dc, yc, uc));
    else if (w === 'L') into.push(box(dd, dy, du, face.L + dc, yc, uc));
    else if (w === 'B') into.push(box(du, dy, dd, uc, yc, face.B + dc));
    else into.push(box(du, dy, dd, uc, yc, face.F - dc));
  };
  const band = (w: Wall, u0: number, u1: number, y0: number, y1: number, inset: number, bw: number, d: number) => {
    const a = u0 + inset, b = u1 - inset, c = y0 + inset, e = y1 - inset;
    wb(w, a, b, c, c + bw, 0, d);
    wb(w, a, b, e - bw, e, 0, d);
    wb(w, a, a + bw, c + bw, e - bw, 0, d);
    wb(w, b - bw, b, c + bw, e - bw, 0, d);
  };
  // A moulded frame: a flat band, and a raised bead along its inner edge
  const frame = (w: Wall, u0: number, u1: number, y0: number, y1: number) => {
    band(w, u0, u1, y0, y1, 0, 0.075, 0.016);
    band(w, u0, u1, y0, y1, 0.05, 0.026, 0.032);
  };
  const DADO: [number, number] = [0.32, 0.8], MAIN: [number, number] = [1.25, 4.75], ATTIC: [number, number] = [5.1, 6.15];
  // Baseboard and chair rail
  const run = (w: Wall, u0: number, u1: number) => {
    if (u1 - u0 < 0.05) return;
    wb(w, u0, u1, 0, 0.22, 0, 0.028);
    wb(w, u0, u1, 0.22, 0.25, 0, 0.04);
    wb(w, u0, u1, 0.9, 0.96, 0, 0.045);
    wb(w, u0, u1, 0.96, 1.0, 0, 0.028);
  };
  // The cornice, stepped out under the ceiling, with a row of dentils,
  // and a fine line of frieze below it. Runs the whole wall; the corners
  // overlap, which reads as a mitre.
  const cornice = (w: Wall, u0: number, u1: number) => {
    for (const [a, b, d] of [[0, 0.1, 0.34], [0.1, 0.16, 0.28], [0.16, 0.3, 0.22], [0.3, 0.38, 0.1], [0.38, 0.42, 0.12], [0.42, 0.48, 0.07]]) {
      wb(w, u0, u1, H - b, H - a, 0, d);
    }
    for (let u = u0 + 0.1; u < u1 - 0.06; u += 0.14) wb(w, u - 0.03, u + 0.03, H - 0.38, H - 0.3, 0.1, 0.17);
    wb(w, u0, u1, H - 0.92, H - 0.88, 0, 0.03);
  };
  // Bays of panels between u0 and u1, about 2 m each, a frame per tier
  const bays = (w: Wall, u0: number, u1: number, tiers = [DADO, MAIN, ATTIC]) => {
    if (u1 - u0 < 0.8) return;
    const g = 0.24, n = Math.max(1, Math.round((u1 - u0) / 2.1)), bw = (u1 - u0 - (n + 1) * g) / n;
    for (let i = 0; i < n; i++) {
      const a = u0 + g + i * (bw + g);
      for (const [y0, y1] of tiers) frame(w, a, a + bw, y0, y1);
    }
  };
  // A doorway's casing, its cornice cap, and a panel over it
  const doorway = (w: Wall) => {
    const a = o.door.x - o.door.w / 2, b = o.door.x + o.door.w / 2, h = o.door.h;
    wb(w, a - 0.2, a, 0, h + 0.2, 0, 0.05);
    wb(w, b, b + 0.2, 0, h + 0.2, 0, 0.05);
    wb(w, a - 0.2, b + 0.2, h, h + 0.2, 0, 0.05);
    wb(w, a - 0.06, a - 0.02, 0, h + 0.06, 0, 0.075);
    wb(w, b + 0.02, b + 0.06, 0, h + 0.06, 0, 0.075);
    wb(w, a - 0.06, b + 0.06, h + 0.02, h + 0.06, 0, 0.075);
    wb(w, a - 0.32, b + 0.32, h + 0.2, h + 0.3, 0, 0.12);
    wb(w, a - 0.38, b + 0.38, h + 0.3, h + 0.36, 0, 0.17);
    frame(w, a, b, h + 0.62, MAIN[1]);
    frame(w, a, b, ATTIC[0], ATTIC[1]);
    run(w, r.x0, a - 0.2);
    run(w, b + 0.2, r.x1);
    return [a - 0.2, b + 0.2];
  };

  const zs = [r.z1 + wallT / 2, r.z0 - wallT / 2];
  for (const w of ['R', 'L'] as const) cornice(w, zs[0], zs[1]);
  for (const w of ['B', 'F'] as const) cornice(w, r.x0, r.x1);

  // Right wall: the window, its casing, and panels either side of the curtains
  wb('R', winZ0 - 0.22, winZ0, 0, win.h + 0.22, 0, 0.05);
  wb('R', winZ1, winZ1 + 0.22, 0, win.h + 0.22, 0, 0.05);
  wb('R', winZ0 - 0.22, winZ1 + 0.22, win.h, win.h + 0.22, 0, 0.05);
  wb('R', winZ0 - 0.32, winZ1 + 0.32, win.h + 0.22, win.h + 0.32, 0, 0.13);
  run('R', zs[0], winZ0 - 0.22);
  run('R', winZ1 + 0.22, zs[1]);
  bays('R', zs[0], winZ0 - win.w / 2 - 0.1);
  bays('R', winZ1 + win.w / 2 + 0.1, zs[1]);
  frame('R', winZ0, winZ1, ATTIC[0], ATTIC[1]);

  // Left wall: the fireplace, and the room's screen in a tall frame over it
  const fz = o.tv.z, tvHalf = o.tv.w / 2 + 0.24;
  run('L', zs[0], fz - 1.12);
  run('L', fz + 1.12, zs[1]);
  frame('L', fz - tvHalf, fz + tvHalf, MAIN[0], MAIN[1]);
  frame('L', fz - tvHalf, fz + tvHalf, ATTIC[0], ATTIC[1]);
  frame('L', fz - tvHalf, fz - 1.3, DADO[0], DADO[1]);
  frame('L', fz + 1.3, fz + tvHalf, DADO[0], DADO[1]);
  bays('L', zs[0], fz - tvHalf - 0.04);
  bays('L', fz + tvHalf + 0.04, zs[1]);

  // Back wall: each app screen in its own panel, a smaller one above; the
  // giant phone stands in the bay right of the door
  const [, bB] = doorway('B');
  for (const s of o.screens) {
    const a = s.x - s.w / 2 - 0.3, b = s.x + s.w / 2 + 0.3;
    frame('B', a, b, DADO[0], DADO[1]);
    frame('B', a, b, MAIN[0], 3.05);
    frame('B', a, b, 3.3, MAIN[1]);
    frame('B', a, b, ATTIC[0], ATTIC[1]);
  }
  bays('B', bB, r.x1);
  bays('B', r.x0, Math.min(...o.screens.map((s) => s.x - s.w / 2)) - 0.34);
  // Front wall, behind you as you come in
  const [fA, fB] = doorway('F');
  bays('F', r.x0, fA);
  bays('F', fB, r.x1);

  // The ceiling: two nested frames and a rose for the chandelier
  {
    const cb = (x0: number, x1: number, z0: number, z1: number, drop: number) =>
      trim.push(box(x1 - x0, drop, z1 - z0, (x0 + x1) / 2, H - drop / 2, (z0 + z1) / 2));
    const rect = (inset: number, bw: number, drop: number) => {
      const x0 = r.x0 + inset, x1 = r.x1 - inset, z0 = r.z1 + wallT / 2 + inset, z1 = r.z0 - wallT / 2 - inset;
      cb(x0, x1, z0, z0 + bw, drop);
      cb(x0, x1, z1 - bw, z1, drop);
      cb(x0, x0 + bw, z0 + bw, z1 - bw, drop);
      cb(x1 - bw, x1, z0 + bw, z1 - bw, drop);
    };
    rect(1.1, 0.16, 0.04);
    rect(1.22, 0.04, 0.08);
    rect(1.7, 0.1, 0.035);
    const prof = [[0.001, 0], [0.82, 0], [0.82, -0.025], [0.74, -0.06], [0.66, -0.04], [0.56, -0.08], [0.44, -0.07], [0.34, -0.11], [0.22, -0.12], [0.13, -0.17], [0.001, -0.18]]
      .map(([x, y]) => new THREE.Vector2(x, y)).reverse();
    const rose = new THREE.LatheGeometry(prof, 40);
    rose.translate(0, H, r.zc);
    trim.push(rose);
  }
  mesh(trim, paint);

  // ---------- the fireplace: white marble, a dark firebox, a hearth ----------
  {
    const parts: THREE.BufferGeometry[] = [];
    const L = (u0: number, u1: number, y0: number, y1: number, d0: number, d1: number) => wb('L', fz + u0, fz + u1, y0, y1, d0, d1, parts);
    L(-1.12, 1.12, 1.06, 1.14, 0, 0.48); // shelf
    L(-1.06, 1.06, 1.0, 1.06, 0, 0.42);
    L(-1.0, 1.0, 0.84, 1.0, 0, 0.38); // frieze
    for (const s of [-1, 1]) {
      const a = s < 0 ? -1.0 : 0.64, b = s < 0 ? -0.64 : 1.0;
      L(a, b, 0.1, 0.84, 0, 0.36); // jambs
      L(a - 0.04, b + 0.04, 0, 0.1, 0, 0.4); // their plinths
      L(s < 0 ? -0.96 : 0.86, s < 0 ? -0.86 : 0.96, 0.84, 1.0, 0.38, 0.41); // corbels
    }
    L(-1.25, 1.25, 0, 0.025, 0, 0.8); // hearth
    const marble = track(new THREE.MeshStandardMaterial({ color: '#eeebe5', roughness: 0.22, metalness: 0.02 }));
    mesh(parts, marble);
    const fire: THREE.BufferGeometry[] = [];
    wb('L', fz - 0.64, fz + 0.64, 0.025, 0.84, 0, 0.34, fire);
    mesh(fire, track(new THREE.MeshStandardMaterial({ color: '#141210', roughness: 0.9 })));
  }

  // ---------- the window: a fixed transom, two leaves folded open ----------
  const joinery: THREE.BufferGeometry[] = [];
  const panes: THREE.BufferGeometry[] = [];
  {
    const X = r.x1 + 0.1; // the frame sits a little way into the reveal
    const jamb = 0.07;
    joinery.push(box(0.09, 0.08, win.w, X, win.h - 0.04, r.zc));
    joinery.push(box(0.09, win.h, jamb, X, win.h / 2, winZ0 + jamb / 2));
    joinery.push(box(0.09, win.h, jamb, X, win.h / 2, winZ1 - jamb / 2));
    joinery.push(box(0.1, 0.1, win.w, X, win.leaf + 0.05, r.zc));
    for (const k of [1, 2]) joinery.push(box(0.06, win.h - win.leaf - 0.18, 0.04, X, (win.leaf + 0.1 + win.h - 0.08) / 2, winZ0 + (win.w * k) / 3));
    const tg = new THREE.PlaneGeometry(win.w - 2 * jamb, win.h - win.leaf - 0.18);
    tg.rotateY(-Math.PI / 2);
    tg.translate(X + 0.02, (win.leaf + 0.1 + win.h - 0.08) / 2, r.zc);
    panes.push(tg);
    // A leaf, built flat (x from the hinge, y up), then swung open about
    // its hinge till it lies nearly flat against the wall
    const LW = win.w / 2 - jamb, LH = win.leaf;
    const leaf = (hingeZ: number, closedDir: number) => {
      const parts: THREE.BufferGeometry[] = [];
      const T = 0.055;
      parts.push(box(0.08, LH, T, 0.04, LH / 2, 0), box(0.08, LH, T, LW - 0.04, LH / 2, 0));
      parts.push(box(LW, 0.2, T, LW / 2, 0.1, 0), box(LW, 0.08, T, LW / 2, LH - 0.04, 0));
      for (let k = 1; k < 4; k++) parts.push(box(LW - 0.16, 0.035, 0.04, LW / 2, 0.2 + ((LH - 0.28) * k) / 4, 0));
      const glass = new THREE.PlaneGeometry(LW - 0.16, LH - 0.28);
      glass.translate(LW / 2, 0.2 + (LH - 0.28) / 2, 0);
      const a = THREE.MathUtils.degToRad(SALON.win.open);
      const dir = new THREE.Vector3(-Math.sin(a), 0, closedDir * Math.cos(a));
      const m = new THREE.Matrix4().makeRotationY(Math.atan2(-dir.z, dir.x)).setPosition(r.x1 - 0.03, 0, hingeZ);
      for (const p of parts) joinery.push(p.applyMatrix4(m));
      panes.push(glass.applyMatrix4(m));
    };
    leaf(winZ1 - jamb, -1);
    leaf(winZ0 + jamb, 1);
  }
  mesh(joinery, paint, true);
  const glass = track(new THREE.MeshStandardMaterial({
    color: '#dfeef5', transparent: true, opacity: 0.12, roughness: 0.05, metalness: 0.1, depthWrite: false, side: THREE.DoubleSide,
  }));
  mesh(panes, glass).receiveShadow = false;

  // The railing across the opening: wrought iron, a band of rings at the top
  {
    const iron: THREE.BufferGeometry[] = [];
    const X = r.x1 + wallT - 0.08, a = winZ0 + 0.08, b = winZ1 - 0.08, len = b - a;
    iron.push(box(0.05, 0.04, len, X, 1.0, r.zc), box(0.03, 0.03, len, X, 0.08, r.zc), box(0.03, 0.025, len, X, 0.76, r.zc));
    const n = Math.round(len / 0.11);
    for (let i = 0; i <= n; i++) {
      const z = a + (len * i) / n;
      iron.push(box(0.018, 0.68, 0.018, X, 0.42, z));
      if (i < n) {
        const ring = new THREE.TorusGeometry(0.05, 0.007, 4, 14);
        ring.rotateY(Math.PI / 2);
        ring.translate(X, 0.88, z + len / n / 2);
        iron.push(ring);
      }
    }
    mesh(iron, track(new THREE.MeshStandardMaterial({ color: '#1d1c1b', roughness: 0.45, metalness: 0.6 })), true);
  }

  // ---------- curtains: heavy linen drapes, and sheers in front of the glass ----------
  // They move in the vertex shader: pleats, a slow gusting billow into the
  // room that grows toward the hem, and a ripple travelling down. Normals
  // are taken from the displaced surface, so the folds catch the light.
  const time = { value: 0 };
  const curtain = (mat: THREE.MeshStandardMaterial, w: number, h: number, pleat: number, billow: number, phase: number, edge: number) => {
    const size = new THREE.Vector2(w, h);
    mat.onBeforeCompile = (s) => {
      Object.assign(s.uniforms, { uTime: time, uSize: { value: size }, uPleat: { value: pleat }, uBillow: { value: billow }, uPhase: { value: phase }, uEdge: { value: edge } });
      s.vertexShader = s.vertexShader
        .replace('#include <common>', `#include <common>
uniform float uTime, uPleat, uBillow, uPhase, uEdge;
uniform vec2 uSize;
vec3 drape(vec3 p) {
  float v = clamp(0.5 - p.y / uSize.y, 0.0, 1.0);
  float u = p.x / uSize.x + 0.5;
  float fold = sin(p.x * 25.0 + sin(p.x * 6.0) * 1.4) * uPleat * (0.6 + 0.4 * v);
  float gust = 0.5 + 0.5 * sin(uTime * 0.37 + uPhase) * sin(uTime * 0.61 + uPhase * 1.7);
  float ripple = sin(uTime * 1.9 - v * 5.0 + p.x * 1.7 + uPhase);
  float side = mix(u, 1.0 - u, uEdge);
  float w = 0.45 + 0.85 * smoothstep(0.0, 1.0, side);
  float b = uBillow * pow(v, 1.3) * w * (0.2 + 0.8 * gust) * (0.85 + 0.15 * ripple);
  float sway = uBillow * 0.3 * pow(v, 1.6) * gust * sin(uTime * 0.9 + uPhase + v * 2.5);
  return vec3(p.x + sway, p.y + b * 0.18, p.z + fold + b);
}`)
        .replace('#include <beginnormal_vertex>', `vec3 dp0 = drape(position);
vec3 objectNormal = normalize(cross(drape(position + vec3(0.01, 0.0, 0.0)) - dp0, drape(position + vec3(0.0, 0.01, 0.0)) - dp0));`)
        .replace('#include <begin_vertex>', 'vec3 transformed = dp0;');
    };
    mat.customProgramCacheKey = () => 'salon-curtain';
    const g = track(new THREE.PlaneGeometry(w, h, Math.round(w * 22), Math.round(h * 7)));
    const m = new THREE.Mesh(g, track(mat));
    m.rotation.y = -Math.PI / 2;
    m.receiveShadow = true;
    m.frustumCulled = false; // the billow takes it outside its flat bounds
    scene.add(m);
    return m;
  };
  const rodY = win.h + 0.62;
  const DW = 2.3, SW = 1.8;
  for (const s of [-1, 1]) {
    const edge = s > 0 ? winZ1 : winZ0;
    const drape = curtain(new THREE.MeshStandardMaterial({ color: '#cdb999', roughness: 0.95, side: THREE.DoubleSide }), DW, rodY - 0.06, 0.06, 0.12, s * 1.3, s > 0 ? 1 : 0);
    drape.position.set(r.x1 - 0.42, (rodY - 0.06) / 2 + 0.02, edge + s * (DW / 2 - 0.36));
    const sheer = curtain(new THREE.MeshStandardMaterial({
      color: '#fbf8f2', roughness: 0.9, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false,
    }), SW, rodY - 0.28, 0.035, 0.55, s * 2.1 + 0.7, s > 0 ? 1 : 0);
    sheer.position.set(r.x1 - 0.18, (rodY - 0.28) / 2 + 0.03, edge - s * (SW / 2 - 0.2));
    sheer.renderOrder = 1;
  }
  o.animators.push((t) => { if (!o.reduceMotion) time.value = t; });

  // Rods: brass for the drapes, a slim white one for the sheers
  const brass = track(new THREE.MeshStandardMaterial({ color: '#b48a3c', roughness: 0.32, metalness: 0.85 }));
  {
    const rod: THREE.BufferGeometry[] = [];
    const len = win.w + 2 * DW + 0.2;
    const c = new THREE.CylinderGeometry(0.022, 0.022, len, 10);
    c.rotateX(Math.PI / 2);
    c.translate(r.x1 - 0.42, rodY, r.zc);
    rod.push(c);
    for (const s of [-1, 1]) {
      const f = new THREE.SphereGeometry(0.055, 12, 8);
      f.translate(r.x1 - 0.42, rodY, r.zc + s * (len / 2 + 0.04));
      rod.push(f);
      rod.push(box(0.4, 0.03, 0.03, r.x1 - 0.21, rodY, r.zc + s * (len / 2 - 0.25)));
    }
    mesh(rod, brass);
    const sr = new THREE.CylinderGeometry(0.012, 0.012, win.w + 0.6, 8);
    sr.rotateX(Math.PI / 2);
    sr.translate(r.x1 - 0.18, rodY - 0.22, r.zc);
    mesh([sr], paint);
  }

  // ---------- the chandelier: brass, two tiers of candle arms ----------
  {
    const parts: THREE.BufferGeometry[] = [];
    const candles: THREE.BufferGeometry[] = [];
    const flames: THREE.BufferGeometry[] = [];
    const C = SALON.chandelier;
    const at = (g: THREE.BufferGeometry, x: number, y: number, z: number) => { g.translate(x, y, r.zc + z); return g; };
    parts.push(at(new THREE.CylinderGeometry(0.014, 0.014, H - 0.17 - (C.y + 0.55), 6), 0, (H - 0.17 + C.y + 0.55) / 2, 0));
    parts.push(at(new THREE.SphereGeometry(0.08, 14, 10), 0, C.y + 0.52, 0));
    parts.push(at(new THREE.CylinderGeometry(0.045, 0.06, 0.6, 12), 0, C.y + 0.2, 0));
    parts.push(at(new THREE.CylinderGeometry(0.19, 0.06, 0.13, 18), 0, C.y - 0.12, 0));
    parts.push(at(new THREE.SphereGeometry(0.06, 12, 8), 0, C.y - 0.24, 0));
    const tier = (n: number, y: number, reach: number, off: number) => {
      for (let i = 0; i < n; i++) {
        const a = off + (i / n) * Math.PI * 2, cx = Math.cos(a) * reach, cz = Math.sin(a) * reach;
        const arm = new THREE.CylinderGeometry(0.011, 0.011, reach, 6);
        arm.rotateZ(Math.PI / 2);
        arm.rotateY(-a);
        parts.push(at(arm, cx / 2, y, cz / 2));
        parts.push(at(new THREE.CylinderGeometry(0.011, 0.011, 0.14, 6), cx, y + 0.07, cz));
        parts.push(at(new THREE.CylinderGeometry(0.05, 0.022, 0.05, 12), cx, y + 0.16, cz));
        candles.push(at(new THREE.CylinderGeometry(0.017, 0.017, 0.13, 8), cx, y + 0.25, cz));
        flames.push(at(new THREE.SphereGeometry(0.024, 8, 6).scale(1, 1.5, 1), cx, y + 0.34, cz));
      }
    };
    tier(8, C.y, 0.6, 0);
    tier(5, C.y + 0.3, 0.32, Math.PI / 5);
    mesh(parts, brass, true);
    mesh(candles, track(new THREE.MeshStandardMaterial({ color: '#f4efe4', roughness: 0.6 })));
    mesh(flames, track(new THREE.MeshBasicMaterial({ color: '#ffe2b0', toneMapped: false })));
  }
}

