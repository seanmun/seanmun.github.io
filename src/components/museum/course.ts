// File: src/components/museum/course.ts
// Purpose: Buddy Cup's room is outdoors: out the back of the museum onto a
// golf hole. A putting green with a flag, a sand bunker cut into the slope
// beside it, a fairway leading up from the door, rough everywhere else, and
// one big oak in the distance, all under the same sun as the sky.
// - One terrain, with real height (the green raised and tilted toward you,
//   the bunker sunk, gentle rolls, hills far off). Its shader blends four
//   surfaces from a painted mask: rough, fairway, putting green and sand,
//   with mowing stripes on the green and fairway.
// - Two meshes share the height: a fine one around the hole and a coarse
//   one out to the horizon (and around the building), hidden in haze.

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { COURSE, SALON_STREET } from './layout';

// Under the street outside the Kinetic salon's window (see SALON_STREET)
const inStreet = (x: number, z: number) =>
  x > SALON_STREET.x0 && x < SALON_STREET.x1 && z > SALON_STREET.z0 && z < SALON_STREET.z1;
import { buildVault, hatchDist, inHatch } from './vault';

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// ---------- shapes ----------
// Each shape is an ellipse with a wobble in its outline; dist() is roughly
// the distance in meters outside its edge (negative inside).

type Blob = { x: number; z: number; rx: number; rz: number; rot: number; wob: [number, number, number][] };

function blobDist(b: Blob, x: number, z: number) {
  const dx = x - b.x, dz = z - b.z;
  const c = Math.cos(-b.rot), s = Math.sin(-b.rot);
  const lx = dx * c - dz * s, lz = dx * s + dz * c;
  const len = Math.hypot(lx, lz);
  const th = Math.atan2(lz, lx);
  const ell = (b.rx * b.rz) / Math.hypot(b.rz * Math.cos(th), b.rx * Math.sin(th));
  let k = 1;
  for (const [amp, freq, ph] of b.wob) k += amp * Math.sin(freq * th + ph);
  return len - ell * k;
}

const GREEN: Blob = { ...COURSE.green, wob: [[0.07, 3, 1.1], [0.04, 5, 2.3], [0.025, 7, 0.4]] };
// A kidney: pinched on the side facing the green
const BUNKER: Blob = { ...COURSE.bunker, wob: [[0.06, 3, 0.2], [-0.16, 2, 1.9], [0.03, 6, 1.0]] };

// The fairway: a soft band from the patio up to the front of the green
function fairwayDist(x: number, z: number) {
  const t = Math.min(1, Math.max(0, (COURSE.z0 - 2 - z) / (COURSE.z0 - 2 - COURSE.green.z)));
  const cx = THREE.MathUtils.lerp(COURSE.doorX, COURSE.green.x + 1, t) + Math.sin(z * 0.35) * 0.6;
  const half = 3.8 + Math.sin(z * 0.21 + 1) * 0.6;
  const along = z > COURSE.z0 - 1.5 ? (z - (COURSE.z0 - 1.5)) * 2 : 0;
  return Math.abs(x - cx) - half + along;
}

// ---------- height ----------

const HATCH_PAD = -0.62; // the sand's level round the hatch

export function courseHeight(x: number, z: number) {
  const { z0 } = COURSE;
  // In and right beside the building the ground sits just under the floors
  const nearBuilding = z > z0 - 0.6 ? 1 - smoothstep(11, 16, Math.abs(x)) : 0;
  const away = smoothstep(z0 - 1, z0 - 9, z); // 0 at the back door, 1 out on the course
  let h = (0.32 * Math.sin(0.21 * x + 0.7) * Math.sin(0.17 * z + 1.3) + 0.22 * Math.sin(0.09 * x - 0.13 * z + 2)) * away;

  // The green: raised, tilted down toward the visitor, smoothed flat on top
  const gd = blobDist(GREEN, x, z);
  const gIn = smoothstep(3.5, -1.5, gd);
  const tilt = Math.max(-1, Math.min(1, (COURSE.green.z - z) / COURSE.green.rz)); // +1 at the back
  h = h * (1 - 0.75 * gIn) + gIn * (0.32 + 0.14 * tilt + 0.03 * Math.sin(x * 0.5));

  // The bunker: a bowl with a steep face, and a raised lip around it
  const bd = blobDist(BUNKER, x, z);
  h -= 0.85 * smoothstep(0.2, -1.4, bd);
  h += 0.2 * Math.exp(-(((bd - 0.3) / 0.4) ** 2));
  // A level pad of sand round the hatch, so its curb sits square
  const hd = hatchDist(x, z);
  if (hd < 1.4) h = THREE.MathUtils.lerp(h, HATCH_PAD, 1 - smoothstep(0.4, 1.4, hd));

  // Hills beyond the hole, and out to the sides
  const R = Math.hypot(x - COURSE.green.x, (z - COURSE.green.z) * 0.8);
  h += smoothstep(38, 120, R) * (4.5 + 3.5 * Math.sin(0.031 * x + 1) * Math.cos(0.027 * z) + 1.5 * Math.sin(0.07 * x + z * 0.05));

  return nearBuilding > 0 ? THREE.MathUtils.lerp(h, -0.05, nearBuilding) : h;
}

// ---------- surfaces ----------

function canvasTex(S: number, draw: (ctx: CanvasRenderingContext2D, r: () => number) => void, seed: number) {
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d')!;
  draw(ctx, rng(seed));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

// Draw at x,y and wrapped copies, so the tile has no seams
function wrapped(S: number, x: number, y: number, pad: number, fn: (x: number, y: number) => void) {
  for (const ox of [0, -S, S]) for (const oy of [0, -S, S]) {
    const px = x + ox, py = y + oy;
    if (px > -pad && px < S + pad && py > -pad && py < S + pad) fn(px, py);
  }
}

// Rough: longer, uneven grass, some of it dry
const roughTex = () => canvasTex(512, (ctx, r) => {
  ctx.fillStyle = '#4e6334';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 260; i++) {
    const x = r() * 512, y = r() * 512, rad = 10 + r() * 40;
    const l = r() < 0.5 ? 'rgba(30,48,16,0.10)' : 'rgba(120,140,60,0.08)';
    wrapped(512, x, y, rad, (px, py) => { ctx.fillStyle = l; ctx.beginPath(); ctx.arc(px, py, rad, 0, Math.PI * 2); ctx.fill(); });
  }
  for (let i = 0; i < 16000; i++) {
    const x = r() * 512, y = r() * 512, len = 3 + r() * 9, a = r() * Math.PI * 2;
    const dry = r() < 0.05;
    const g = 80 + r() * 55;
    ctx.strokeStyle = dry ? `rgba(${140 + r() * 30},${135 + r() * 25},${80 + r() * 20},0.45)` : `rgba(${Math.round(g * 0.6)},${Math.round(g)},${Math.round(g * 0.4)},0.55)`;
    ctx.lineWidth = 1 + r();
    wrapped(512, x, y, 12, (px, py) => {
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + Math.cos(a) * len, py + Math.sin(a) * len);
      ctx.stroke();
    });
  }
}, 301);

// Fine turf for the green and fairway: tight, even, a little speckle
const fineTex = () => canvasTex(512, (ctx, r) => {
  ctx.fillStyle = '#557a37';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 40000; i++) {
    const g = 100 + r() * 50;
    ctx.fillStyle = `rgba(${Math.round(g * 0.6)},${Math.round(g)},${Math.round(g * 0.4)},0.5)`;
    ctx.fillRect(r() * 512, r() * 512, 1.3, 1.3);
  }
  for (let i = 0; i < 1200; i++) {
    ctx.fillStyle = r() < 0.5 ? 'rgba(25,55,15,0.35)' : 'rgba(170,200,110,0.25)';
    ctx.fillRect(r() * 512, r() * 512, 2, 2);
  }
}, 302);

// Sand: pale grains, raked in soft waves
const sandTex = () => canvasTex(512, (ctx, r) => {
  ctx.fillStyle = '#d9c7a0';
  ctx.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 2) {
    const w = Math.sin((y / 512) * Math.PI * 2 * 14) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(${w > 0.5 ? '255,250,235' : '120,100,70'},${0.05 + Math.abs(w - 0.5) * 0.07})`;
    ctx.fillRect(0, y, 512, 2);
  }
  for (let i = 0; i < 45000; i++) {
    const v = r();
    ctx.fillStyle = v < 0.45 ? 'rgba(255,250,235,0.5)' : v < 0.9 ? 'rgba(150,125,85,0.35)' : 'rgba(90,75,55,0.5)';
    ctx.fillRect(r() * 512, r() * 512, 1.2, 1.2);
  }
}, 303);

// The mask: R = putting green, G = fairway and collar, B = sand
const MASK = { x0: -34, z1: COURSE.z0 - 62, w: 68, d: 64, px: 6 }; // px per meter
function maskTex() {
  const W = MASK.w * MASK.px, H = MASK.d * MASK.px;
  const data = new Uint8Array(W * H * 4);
  for (let j = 0; j < H; j++) {
    const z = MASK.z1 + (j + 0.5) / MASK.px;
    for (let i = 0; i < W; i++) {
      const x = MASK.x0 + (i + 0.5) / MASK.px;
      const gd = blobDist(GREEN, x, z), bd = blobDist(BUNKER, x, z);
      const green = smoothstep(0.12, -0.12, gd);
      const collar = smoothstep(1.4, 1.0, gd);
      const fair = Math.max(collar, smoothstep(0.5, -0.5, fairwayDist(x, z)));
      const sand = smoothstep(0.1, -0.1, bd);
      const o = (j * W + i) * 4;
      data[o] = green * 255;
      data[o + 1] = fair * 255;
      data[o + 2] = sand * 255;
      data[o + 3] = 255 * (1 - Math.exp(-(((bd + 0.05) / 0.22) ** 2)));
    }
  }
  const t = new THREE.DataTexture(data, W, H, THREE.RGBAFormat);
  t.magFilter = t.minFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
}

function terrainMaterial(track: <X extends { dispose(): void }>(x: X) => X) {
  const mat = track(new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.95 }));
  const uniforms = {
    uMask: { value: track(maskTex()) },
    uMaskMin: { value: new THREE.Vector2(MASK.x0, MASK.z1) },
    uMaskSize: { value: new THREE.Vector2(MASK.w, MASK.d) },
    uRough: { value: track(roughTex()) },
    uFine: { value: track(fineTex()) },
    uSand: { value: track(sandTex()) },
  };
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWorld;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vWorld;
uniform sampler2D uMask, uRough, uFine, uSand;
uniform vec2 uMaskMin, uMaskSize;`)
      .replace('#include <map_fragment>', `
vec2 xz = vWorld.xz;
vec2 muv = (xz - uMaskMin) / uMaskSize;
vec4 m = texture2D(uMask, vec2(muv.x, muv.y));
// Rough at two scales so its tile never shows, and a slow patchiness on top
vec3 rough = mix(texture2D(uRough, xz * 0.43).rgb, texture2D(uRough, xz * 0.157 + 0.37).rgb, 0.5);
float patchy = texture2D(uRough, xz * 0.012).g / 0.16;
rough *= 0.78 + 0.32 * clamp(patchy, 0.0, 1.4);
vec3 fine = texture2D(uFine, xz * 0.8).rgb;
// Mowing stripes: across the green, and in wide bands down the fairway
float aa = fwidth(xz.x) * 0.6;
float sg = smoothstep(0.5 - aa, 0.5 + aa, abs(fract(dot(xz, vec2(0.80, 0.60)) / 2.2) - 0.5) * 2.0);
float sf = smoothstep(0.5 - aa, 0.5 + aa, abs(fract(xz.x / 5.0) - 0.5) * 2.0);
vec3 green = fine * mix(0.92, 1.05, sg) * vec3(0.96, 1.03, 0.93);
vec3 fair = texture2D(uFine, xz * 0.53 + 0.21).rgb * mix(0.93, 1.03, sf) * vec3(1.03, 0.99, 0.88);
vec3 sand = texture2D(uSand, xz * 0.5).rgb;
vec3 col = mix(rough, fair, m.g);
col = mix(col, green, m.r);
col = mix(col, sand, m.b);
col *= 1.0 - 0.45 * (1.0 - m.a); // the bunker's lip
diffuseColor.rgb *= col;`);
  };
  return mat;
}

// cut: where to leave the ground out (the hatch's opening)
function terrain(w: number, d: number, cx: number, cz: number, step: number, drop: number, cut: (x: number, z: number) => boolean) {
  const g = new THREE.PlaneGeometry(w, d, Math.round(w / step), Math.round(d / step));
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) + cx, z = p.getZ(i) + cz;
    p.setXYZ(i, x, courseHeight(x, z) - drop, z);
  }
  // A triangle with any corner in the cut goes, so no teeth poke into the
  // opening (the hatch's coping covers the ragged edge this leaves)
  const index = g.index!.array, keep: number[] = [];
  for (let t = 0; t < index.length; t += 3) {
    const a = index[t], b = index[t + 1], c = index[t + 2];
    if (![a, b, c].some((i) => cut(p.getX(i), p.getZ(i)))) keep.push(a, b, c);
  }
  g.setIndex(keep);
  g.computeVertexNormals();
  return g;
}

// ---------- the oak ----------

// A broad oak: a tapered trunk splitting into limbs, and leaf cards whose
// normals point out from the crown, so it shades like one soft mass in the
// sun rather than hundreds of flat cards.
function leafCards() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d')!;
  const r = rng(907);
  for (let i = 0; i < 70; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 100;
    const x = 128 + Math.cos(a) * d, y = 128 + Math.sin(a) * d;
    const len = 18 + r() * 16, wid = len * 0.5;
    const g = 62 + r() * 48;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(r() * Math.PI * 2);
    ctx.fillStyle = `rgb(${Math.round(g * 0.52)},${Math.round(g)},${Math.round(g * 0.26)})`;
    ctx.beginPath();
    // lobed, like an oak leaf
    ctx.moveTo(-len / 2, 0);
    for (let k = 0; k <= 6; k++) {
      const t = k / 6, xx = -len / 2 + t * len, lobe = (k % 2 ? 1 : 0.65) * Math.sin(t * Math.PI);
      ctx.lineTo(xx, -wid * lobe);
    }
    for (let k = 6; k >= 0; k--) {
      const t = k / 6, xx = -len / 2 + t * len, lobe = (k % 2 ? 1 : 0.65) * Math.sin(t * Math.PI);
      ctx.lineTo(xx, wid * lobe);
    }
    ctx.fill();
    ctx.restore();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function oak(track: <X extends { dispose(): void }>(x: X) => X, x: number, z: number, seed: number) {
  const r = rng(seed);
  const y0 = courseHeight(x, z) - 0.3;
  const parts: THREE.BufferGeometry[] = [];
  const tips: THREE.Vector3[] = [];
  const UP = new THREE.Vector3(0, 1, 0);

  const grow = (from: THREE.Vector3, dir: THREE.Vector3, len: number, rad: number, depth: number) => {
    // A bent limb: a curve through jittered points, as a tapered tube
    const pts = [from.clone()];
    const d = dir.clone();
    for (let k = 1; k <= 3; k++) {
      d.add(new THREE.Vector3((r() - 0.5) * 0.5, (r() - 0.4) * 0.3, (r() - 0.5) * 0.5)).normalize();
      pts.push(pts[k - 1].clone().addScaledVector(d, len / 3));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const segs = 6, radial = depth < 2 ? 8 : 5;
    const g = new THREE.TubeGeometry(curve, segs, rad, radial, false);
    const p = g.attributes.position;
    for (let i = 0; i <= segs; i++) {
      const c = curve.getPointAt(i / segs);
      const k = 1 - 0.45 * (i / segs);
      for (let j = 0; j <= radial; j++) {
        const v = i * (radial + 1) + j;
        p.setXYZ(v, c.x + (p.getX(v) - c.x) * k, c.y + (p.getY(v) - c.y) * k, c.z + (p.getZ(v) - c.z) * k);
      }
    }
    g.computeVertexNormals();
    parts.push(g);
    const end = pts[3];
    if (depth >= 2) for (let k = 0; k < (depth === 3 ? 4 : 2); k++) tips.push(curve.getPointAt(0.5 + r() * 0.5));
    if (depth === 3) return;
    const kids = depth === 0 ? 6 : 3;
    for (let k = 0; k < kids; k++) {
      const a = (k / kids) * Math.PI * 2 + r() * 0.8;
      const out = depth === 0 ? 1.15 : 0.8;
      const nd = d.clone().multiplyScalar(0.45).add(new THREE.Vector3(Math.cos(a) * out, (depth === 0 ? 0.55 : 0.4) + r() * 0.35, Math.sin(a) * out)).normalize();
      const at = curve.getPointAt(depth === 0 ? 0.7 + r() * 0.3 : 0.45 + r() * 0.55);
      grow(at, nd, len * (depth === 0 ? 1.55 : 0.68), rad * (depth === 0 ? 0.48 : 0.58), depth + 1);
    }
    void end;
  };
  grow(new THREE.Vector3(x, y0, z), UP.clone(), 3.6, 0.7, 0);

  const bark = track(new THREE.MeshStandardMaterial({ color: '#4a3d31', roughness: 0.95 }));
  const wood = new THREE.Mesh(track(mergeGeometries(parts)!), bark);
  parts.forEach((p) => p.dispose());
  wood.castShadow = wood.receiveShadow = true;

  // The crown: cards scattered around each tip, normals pointing out of the crown
  const center = tips.reduce((a, b) => a.add(b), new THREE.Vector3()).multiplyScalar(1 / tips.length);
  center.y -= 1.2;
  const pos: number[] = [], nor: number[] = [], uv: number[] = [], col: number[] = [], idx: number[] = [];
  const q = new THREE.Quaternion(), e = new THREE.Euler();
  const corners = [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]];
  const crownH = Math.max(...tips.map((t) => t.y)) - Math.min(...tips.map((t) => t.y));
  for (const tip of tips) {
    for (let k = 0; k < 6; k++) {
      const p = tip.clone().add(new THREE.Vector3((r() - 0.5) * 2.8, (r() - 0.35) * 1.8, (r() - 0.5) * 2.8));
      const size = 2.0 + r() * 1.4;
      q.setFromEuler(e.set(r() * Math.PI, r() * Math.PI, r() * Math.PI));
      const out = p.clone().sub(center).normalize();
      // darker low in the crown and deep inside it: light doesn't get in there
      const shade = 0.42 + 0.48 * Math.min(1, Math.max(0, (p.y - (center.y)) / (crownH + 1))) * (0.7 + 0.3 * Math.min(1, p.distanceTo(center) / 6));
      const tint = 0.9 + r() * 0.2;
      const base = pos.length / 3;
      for (const [u, v] of corners) {
        const c = new THREE.Vector3(u * size, v * size, 0).applyQuaternion(q).add(p);
        pos.push(c.x, c.y, c.z);
        nor.push(out.x, out.y, out.z);
        uv.push(u + 0.5, v + 0.5);
        col.push(shade * tint, shade, shade * (0.95 + r() * 0.1));
      }
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  const map = track(leafCards());
  // Lambert: leaves have no glossy sheen (a standard material caught the
  // low sun as white glints across the top of the crown)
  const leaves = track(new THREE.MeshLambertMaterial({
    map, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide,
    // sun through the leaves
    emissive: new THREE.Color('#2f5a18'), emissiveMap: map, emissiveIntensity: 0.12,
  }));
  const crown = new THREE.Mesh(track(g), leaves);
  crown.castShadow = true;
  crown.customDepthMaterial = track(new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map, alphaTest: 0.5 }));
  return { wood, crown, center };
}

// ---------- the flag ----------

function flagstick(track: <X extends { dispose(): void }>(x: X) => X, scene: THREE.Scene, animators: ((t: number, dt: number) => void)[], reduceMotion: boolean) {
  const { x, z } = COURSE.cup;
  const y = courseHeight(x, z);
  // The cup: a dark hole with a white liner showing at the lip
  const hole = new THREE.Mesh(track(new THREE.CircleGeometry(0.054, 32)), track(new THREE.MeshBasicMaterial({ color: '#0d0f0b' })));
  hole.rotation.x = -Math.PI / 2;
  hole.position.set(x, y + 0.006, z);
  const liner = new THREE.Mesh(track(new THREE.RingGeometry(0.054, 0.06, 32)), track(new THREE.MeshStandardMaterial({ color: '#f2f2ee', roughness: 0.6 })));
  liner.rotation.x = -Math.PI / 2;
  liner.position.set(x, y + 0.007, z);
  const pole = new THREE.Mesh(track(new THREE.CylinderGeometry(0.0125, 0.0125, 2.3, 10)), track(new THREE.MeshStandardMaterial({ color: '#f4f2ea', roughness: 0.35 })));
  pole.position.set(x, y + 1.15, z);
  pole.castShadow = true;
  scene.add(hole, liner, pole);

  // The flag: a cloth that ripples in the breeze, more at its free edge
  const FW = 0.52, FH = 0.36, SX = 14, SY = 6;
  const cloth = track(new THREE.PlaneGeometry(FW, FH, SX, SY));
  cloth.translate(FW / 2, 0, 0);
  const rest = Float32Array.from(cloth.attributes.position.array as Float32Array);
  const flag = new THREE.Mesh(cloth, track(new THREE.MeshStandardMaterial({ color: '#f2c318', roughness: 0.75, side: THREE.DoubleSide })));
  flag.position.set(x + 0.012, y + 2.3 - FH / 2 - 0.01, z);
  flag.rotation.y = 0.6; // blowing off to the left
  flag.castShadow = true;
  scene.add(flag);
  const wave = (t: number) => {
    const p = cloth.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const fx = rest[i * 3], fy = rest[i * 3 + 1];
      const k = fx / FW;
      p.setZ(i, k * (0.06 * Math.sin(fx * 9 - t * 6.5) + 0.025 * Math.sin(fx * 17 - t * 9 + fy * 4)));
      p.setY(i, fy - k * k * 0.02);
    }
    p.needsUpdate = true;
    cloth.computeVertexNormals();
  };
  wave(0);
  if (!reduceMotion) animators.push((t) => wave(t));

  // A ball, just short of the cup
  const ball = new THREE.Mesh(track(new THREE.SphereGeometry(0.0214, 20, 14)), track(new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.35 })));
  ball.position.set(x - 0.55, courseHeight(x - 0.55, z + 0.9) + 0.0214, z + 0.9);
  ball.castShadow = true;
  scene.add(ball);
}

// ---------- the whole hole ----------

export function buildCourse(o: {
  scene: THREE.Scene;
  track: <X extends { dispose(): void }>(x: X) => X;
  animators: ((t: number, dt: number) => void)[];
  mobile: boolean;
  reduceMotion: boolean;
  clickable: THREE.Object3D[];
}) {
  const { scene, track, mobile } = o;
  const mat = terrainMaterial(track);

  // Around the hole, fine enough for the bunker's lip; beyond, coarse. Both
  // leave out the hatch's opening (the coarse one a wide margin round it,
  // where the fine one covers)
  const step = mobile ? 0.4 : 0.22;
  const fine = new THREE.Mesh(track(terrain(MASK.w, MASK.d, MASK.x0 + MASK.w / 2, MASK.z1 + MASK.d / 2, step, 0, (x, z) => inHatch(x, z))), mat);
  const far = new THREE.Mesh(track(terrain(440, 330, 0, COURSE.z0 - 95, 2.5, 0.04, (x, z) => inHatch(x, z, 3) || inStreet(x, z))), mat);
  fine.receiveShadow = far.receiveShadow = true;
  scene.add(fine, far);

  // A flagstone path from the back door onto the grass
  const stone = track(new THREE.MeshStandardMaterial({ color: '#b8b2a6', roughness: 0.9 }));
  const r = rng(77);
  for (let k = 0; k < 5; k++) {
    const zz = COURSE.z0 - 0.9 - k * 1.05;
    const xx = COURSE.doorX + (r() - 0.5) * 0.3;
    const s = new THREE.Mesh(track(new THREE.CylinderGeometry(0.42 + r() * 0.08, 0.44, 0.08, 9)), stone);
    s.position.set(xx, courseHeight(xx, zz) + 0.01, zz);
    s.rotation.y = r() * 3;
    s.scale.z = 0.75;
    s.receiveShadow = true;
    scene.add(s);
  }

  flagstick(track, scene, o.animators, o.reduceMotion);

  const tree = oak(track, COURSE.tree.x, COURSE.tree.z, 5);
  scene.add(tree.wood, tree.crown);
  if (mobile) {
    // No shadow maps on phones: a soft pool of shade under the crown instead
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d')!;
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(0,0,0,0.5)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    const t = track(new THREE.CanvasTexture(c));
    const shade = new THREE.Mesh(track(new THREE.PlaneGeometry(13, 10)), track(new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false })));
    shade.rotation.x = -Math.PI / 2;
    shade.position.set(tree.center.x - 2.5, courseHeight(tree.center.x - 2.5, tree.center.z - 2) + 0.05, tree.center.z - 2);
    scene.add(shade);
  }

  // The hatch in the trap, and the way down to the classified door
  return buildVault({ scene, track, animators: o.animators, clickable: o.clickable, reduceMotion: o.reduceMotion, rim: step * 1.6 });
}
