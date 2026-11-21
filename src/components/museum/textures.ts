// File: src/components/museum/textures.ts
// Purpose: Procedural canvas textures for the museum, so the architecture
// ships as code instead of megabytes of image files. Every generator is
// seeded, so the walls look identical on every visit.

import * as THREE from 'three';

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

// Phones draw the big surfaces at half size from the start: a canvas half
// the size, its drawing scaled by half, so the drawing code is unchanged
// but no full-size canvas ever exists (25 of them at once, briefly, while
// the museum built, was part of what killed iPhones in the lobby)
let K = 1;
export function setPhoneTextures(on: boolean) { K = on ? 0.5 : 1; }
function big(S: number) {
  const [c, ctx] = canvas(Math.round(S * K), Math.round(S * K));
  ctx.scale(K, K);
  return [c, ctx] as const;
}

function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!] as const;
}

function finish(c: HTMLCanvasElement, repeat = true) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function speckle(ctx: CanvasRenderingContext2D, w: number, h: number, r: () => number, n: number, alpha: number) {
  for (let i = 0; i < n; i++) {
    const v = r() > 0.5 ? 255 : 0;
    ctx.fillStyle = `rgba(${v},${v},${v},${r() * alpha})`;
    ctx.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2);
  }
}

function blotches(ctx: CanvasRenderingContext2D, w: number, h: number, r: () => number, n: number, alpha: number) {
  for (let i = 0; i < n; i++) {
    const x = r() * w, y = r() * h, rad = 20 + r() * 120;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    const v = r() > 0.5 ? 255 : 0;
    g.addColorStop(0, `rgba(${v},${v},${v},${alpha * r()})`);
    g.addColorStop(1, `rgba(${v},${v},${v},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
}

// Board-formed concrete with form-tie holes, Tadao Ando style. One tile is
// two 2.4m form panels square, so world UVs should divide by 4.8.
export function concrete(base = '#a19e98', seed = 1) {
  const S = 1024;
  const [c, ctx] = big(S);
  const r = rng(seed);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, S, S);
  blotches(ctx, S, S, r, 90, 0.08);
  speckle(ctx, S, S, r, 26000, 0.14);
  const P = S / 2;
  for (let py = 0; py < 2; py++) {
    for (let px = 0; px < 2; px++) {
      // each panel pours a touch lighter or darker than its neighbor
      ctx.fillStyle = `rgba(${r() > 0.5 ? '255,255,255' : '0,0,0'},${0.02 + r() * 0.04})`;
      ctx.fillRect(px * P, py * P, P, P);
      for (const [fx, fy] of [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]]) {
        const x = px * P + fx * P, y = py * P + fy * P;
        const g = ctx.createRadialGradient(x, y, 1, x, y, 9);
        g.addColorStop(0, 'rgba(40,38,35,0.85)');
        g.addColorStop(0.55, 'rgba(70,68,64,0.5)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, 9, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fillRect(0, P - 1, S, 2);
  ctx.fillRect(P - 1, 0, 2, S);
  ctx.fillRect(0, 0, S, 1);
  ctx.fillRect(0, 0, 1, S);
  return finish(c);
}

// Honed white marble with soft gray veining. Tile: 3m.
export function marble(seed = 4, base = '#ebe7e0', vein = '120,118,115') {
  const S = 1024;
  const [c, ctx] = big(S);
  const r = rng(seed);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, S, S);
  blotches(ctx, S, S, r, 60, 0.05);
  // veins wrap around the tile edges so the pattern repeats without seams
  for (let v = 0; v < 18; v++) {
    let x = r() * S, y = r() * S;
    let a = r() * Math.PI * 2;
    const width = 0.4 + r() * (v < 4 ? 3 : 1.2);
    ctx.strokeStyle = `rgba(${vein},${0.18 + r() * 0.35})`;
    ctx.lineWidth = width;
    for (let s = 0; s < 220; s++) {
      const nx = x + Math.cos(a) * 6, ny = y + Math.sin(a) * 6;
      for (const ox of [-S, 0, S]) {
        for (const oy of [-S, 0, S]) {
          ctx.beginPath();
          ctx.moveTo(x + ox, y + oy);
          ctx.lineTo(nx + ox, ny + oy);
          ctx.stroke();
        }
      }
      x = (nx + S) % S;
      y = (ny + S) % S;
      a += (r() - 0.5) * 0.5;
    }
  }
  speckle(ctx, S, S, r, 8000, 0.05);
  return finish(c);
}

// Fine-grain plaster for gallery walls. Tile: 4m.
export function plaster(base = '#efece6', seed = 9) {
  const S = 512;
  const [c, ctx] = canvas(S, S);
  const r = rng(seed);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, S, S);
  blotches(ctx, S, S, r, 30, 0.025);
  speckle(ctx, S, S, r, 9000, 0.05);
  return finish(c);
}

// Polished concrete floor. Tile: 6m.
export function polished(base = '#6d6a65', seed = 2) {
  const S = 1024;
  const [c, ctx] = big(S);
  const r = rng(seed);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, S, S);
  blotches(ctx, S, S, r, 140, 0.07);
  speckle(ctx, S, S, r, 30000, 0.12);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(0, 0, S, 2);
  ctx.fillRect(0, 0, 2, S);
  return finish(c);
}

// A flat color with grain, for themed room walls and floors. Tile: 4m.
export function grain(base: string, seed = 5, amount = 0.08) {
  const S = 512;
  const [c, ctx] = canvas(S, S);
  const r = rng(seed);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, S, S);
  blotches(ctx, S, S, r, 40, amount * 0.6);
  speckle(ctx, S, S, r, 12000, amount);
  return finish(c);
}

// Maple planks with a half court painted on. Maps once across a 14m floor,
// so it is not a repeating texture. basketX: the basket's offset from the
// floor's center, in meters (the key sits under it, at the canvas top).
export function court(basketX = 0) {
  const S = 2048;
  const [c, ctx] = canvas(S, S);
  const r = rng(23);
  const plank = S / 64; // ~22cm planks
  for (let x = 0; x < S; x += plank) {
    let y = -r() * 400;
    while (y < S) {
      const len = 300 + r() * 500;
      const tone = 196 + r() * 26;
      ctx.fillStyle = `rgb(${tone},${tone * 0.72},${tone * 0.45})`;
      ctx.fillRect(x, y, plank, len);
      for (let g = 0; g < 6; g++) {
        ctx.fillStyle = `rgba(110,60,20,${0.05 + r() * 0.08})`;
        ctx.fillRect(x + r() * plank, y, 1, len);
      }
      ctx.fillStyle = 'rgba(70,40,15,0.35)';
      ctx.fillRect(x, y, plank, 2);
      y += len;
    }
    ctx.fillStyle = 'rgba(70,40,15,0.3)';
    ctx.fillRect(x, 0, 1.5, S);
  }
  const m = S / 14; // pixels per meter
  const cx = S / 2 + basketX * m;
  // painted key in team navy
  ctx.fillStyle = 'rgba(25,42,92,0.88)';
  ctx.fillRect(cx - 2.45 * m, 0, 4.9 * m, 5.8 * m);
  ctx.strokeStyle = '#f7f3ea';
  ctx.lineWidth = 0.06 * m;
  ctx.strokeRect(cx - 2.45 * m, 0, 4.9 * m, 5.8 * m);
  ctx.beginPath();
  ctx.arc(cx, 5.8 * m, 1.8 * m, 0, Math.PI);
  ctx.stroke();
  ctx.beginPath(); // three-point line
  ctx.moveTo(cx - 6.6 * m, 0);
  ctx.lineTo(cx - 6.6 * m, 1.4 * m);
  ctx.arc(cx, 1.575 * m, 6.75 * m, Math.PI - 0.08, 0.08, true);
  ctx.lineTo(cx + 6.6 * m, 0);
  ctx.stroke();
  ctx.beginPath(); // center circle at half court
  ctx.arc(S / 2, S, 1.8 * m, Math.PI, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, S - 1);
  ctx.lineTo(S, S - 1);
  ctx.stroke();
  // varnish sheen
  blotches(ctx, S, S, r, 50, 0.05);
  const t = finish(c, false);
  return t;
}

// A court in black hardwood with neon lines, in the MNS colours. Returns
// the floor and a glow map holding only the lines, as light: bright tube
// cores with a soft halo, for an emissive map.
export function neonCourt(basketX = 0) {
  const S = 2048;
  const [c, ctx] = big(S);
  const [gc, gctx] = big(S);
  const r = rng(29);
  const plank = S / 64;
  for (let x = 0; x < S; x += plank) {
    let y = -r() * 400;
    while (y < S) {
      const len = 300 + r() * 500;
      const tone = 14 + r() * 12;
      ctx.fillStyle = `rgb(${tone},${tone},${tone * 1.15})`;
      ctx.fillRect(x, y, plank, len);
      for (let g = 0; g < 6; g++) {
        ctx.fillStyle = `rgba(255,255,255,${0.012 + r() * 0.02})`;
        ctx.fillRect(x + r() * plank, y, 1, len);
      }
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(x, y, plank, 2);
      y += len;
    }
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(x, 0, 1.5, S);
  }
  blotches(ctx, S, S, r, 50, 0.04);
  gctx.fillStyle = '#000';
  gctx.fillRect(0, 0, S, S);

  const m = S / 14;
  const cx = S / 2 + basketX * m;
  const GREEN = '#00ff87', CYAN = '#00e5ff', PURPLE = '#bf5af2';
  // the key, faintly tinted purple
  ctx.fillStyle = 'rgba(191,90,242,0.07)';
  ctx.fillRect(cx - 2.45 * m, 0, 4.9 * m, 5.8 * m);
  const paths: [string, (g: CanvasRenderingContext2D) => void][] = [
    [PURPLE, (g) => { g.strokeRect(cx - 2.45 * m, 0, 4.9 * m, 5.8 * m); }],
    [PURPLE, (g) => { g.beginPath(); g.arc(cx, 5.8 * m, 1.8 * m, 0, Math.PI); g.stroke(); }],
    [GREEN, (g) => {
      g.beginPath();
      g.moveTo(cx - 6.6 * m, 0);
      g.lineTo(cx - 6.6 * m, 1.4 * m);
      g.arc(cx, 1.575 * m, 6.75 * m, Math.PI - 0.08, 0.08, true);
      g.lineTo(cx + 6.6 * m, 0);
      g.stroke();
    }],
    [CYAN, (g) => { g.beginPath(); g.arc(S / 2, S, 1.8 * m, Math.PI, 0); g.stroke(); }],
    [CYAN, (g) => { g.beginPath(); g.moveTo(0, S - 1); g.lineTo(S, S - 1); g.stroke(); }],
  ];
  // A neon tube: a wide soft halo, the coloured glass, then a hot pale core
  const W = 0.06 * m;
  for (const [color, draw] of paths) {
    for (const [g, glow] of [[ctx, false], [gctx, true]] as const) {
      g.lineCap = 'round';
      g.lineJoin = 'round';
      if (glow) {
        g.save();
        g.filter = `blur(${W * 1.6 * K}px)`; // filters ignore the scale, so match it
        g.globalAlpha = 0.55;
        g.strokeStyle = color;
        g.lineWidth = W * 3.2;
        draw(g);
        g.restore();
      }
      g.strokeStyle = color;
      g.lineWidth = W;
      draw(g);
      g.strokeStyle = 'rgba(235,255,245,0.85)';
      g.lineWidth = W * 0.35;
      draw(g);
    }
  }
  const map = finish(c, false);
  const glow = finish(gc, false);
  return { map, glow };
}

// Billiard felt. Tile: 1m.
export function felt(base = '#1d6b4f') {
  return grain(base, 41, 0.05);
}

// LED ribbon board text. Scroll it by moving texture.offset.x.
export function ticker(items: { label: string; value: string; up: boolean }[]) {
  const W = 4096, H = 96;
  const [c, ctx] = canvas(W, H);
  ctx.fillStyle = '#05070c';
  ctx.fillRect(0, 0, W, H);
  ctx.font = '700 52px ui-monospace, Menlo, monospace';
  ctx.textBaseline = 'middle';
  let x = 30;
  let i = 0;
  while (x < W) {
    const it = items[i % items.length];
    ctx.fillStyle = '#f2f2f2';
    ctx.fillText(it.label, x, H / 2);
    x += ctx.measureText(it.label).width + 20;
    ctx.fillStyle = it.up ? '#3ddc84' : '#ff4d4d';
    const v = `${it.up ? '▲' : '▼'} ${it.value}`;
    ctx.fillText(v, x, H / 2);
    x += ctx.measureText(v).width + 70;
    i++;
  }
  // LED dot mask
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);
  for (let xx = 0; xx < W; xx += 4) ctx.fillRect(xx, 0, 1, H);
  const t = finish(c);
  t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

// Large display lettering, e.g. over a doorway. Transparent background.
export function lettering(text: string, opts: { color?: string; size?: number; weight?: number; spacing?: number; sub?: string } = {}) {
  const { color = '#2b2a28', size = 120, weight = 300, spacing = 0.32, sub } = opts;
  const [probe, pctx] = canvas(8, 8);
  void probe;
  pctx.font = `${weight} ${size}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
  const chars = [...text];
  const widths = chars.map((ch) => pctx.measureText(ch).width + size * spacing);
  const tw = Math.ceil(widths.reduce((a, b) => a + b, 0)) + 40;
  const th = Math.ceil(size * (sub ? 1.9 : 1.35));
  const [c, ctx] = canvas(tw, th);
  ctx.font = pctx.font;
  ctx.fillStyle = color;
  ctx.textBaseline = 'top';
  let x = 20 + (size * spacing) / 2;
  chars.forEach((ch, i) => {
    ctx.fillText(ch, x, size * 0.12);
    x += widths[i];
  });
  if (sub) {
    ctx.font = `400 ${Math.round(size * 0.34)}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
    ctx.globalAlpha = 0.7;
    ctx.textAlign = 'center';
    ctx.fillText(sub.toUpperCase().split('').join(' '), tw / 2, size * 1.3);
  }
  const t = finish(c, false);
  return { texture: t, aspect: tw / th };
}

// A museum wall label: title, a line of detail and a call to action.
export function placard(title: string, detail: string, cta: string) {
  const W = 1024, H = 640;
  const [c, ctx] = canvas(W, H);
  ctx.fillStyle = '#fbfaf7';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#1d1c1a';
  ctx.font = '600 76px "Helvetica Neue", Helvetica, Arial, sans-serif';
  ctx.fillText(title, 64, 150, W - 128);
  ctx.fillStyle = '#5d5a55';
  ctx.font = '400 36px "Helvetica Neue", Helvetica, Arial, sans-serif';
  wrap(ctx, detail, 64, 230, W - 128, 50, 5);
  ctx.fillStyle = '#b4532a';
  ctx.font = '600 34px "Helvetica Neue", Helvetica, Arial, sans-serif';
  ctx.fillText(cta, 64, H - 64);
  ctx.fillStyle = '#1d1c1a';
  ctx.fillRect(64, 176, 80, 4);
  return finish(c, false);
}

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number, maxLines: number) {
  const words = text.split(' ');
  let line = '';
  let lines = 0;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      if (lines === maxLines - 1) {
        ctx.fillText(`${line}…`, x, y);
        return;
      }
      ctx.fillText(line, x, y);
      y += lh;
      lines++;
      line = w;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, y);
}

// The beige CRT's screen in the OutlookSucks cubicle.
export function crtScreen() {
  const W = 640, H = 480;
  const [c, ctx] = canvas(W, H);
  ctx.fillStyle = '#3a6ea5';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#d4d0c8';
  ctx.fillRect(110, 140, 420, 190);
  ctx.fillStyle = '#0a246a';
  ctx.fillRect(110, 140, 420, 30);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 18px Tahoma, Verdana, sans-serif';
  ctx.fillText('Microsoft Outlook', 120, 161);
  ctx.fillStyle = '#000000';
  ctx.font = '16px Tahoma, Verdana, sans-serif';
  ctx.fillText('Microsoft Word is rendering this email.', 170, 215);
  ctx.fillText('Your CSS has been ignored.', 170, 240);
  ctx.fillStyle = '#c0392b';
  ctx.beginPath();
  ctx.arc(140, 228, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '700 20px Tahoma';
  ctx.fillText('×', 133, 235);
  ctx.fillStyle = '#d4d0c8';
  ctx.strokeStyle = '#404040';
  ctx.fillRect(280, 280, 80, 30);
  ctx.strokeRect(280, 280, 80, 30);
  ctx.fillStyle = '#000';
  ctx.fillText('OK', 307, 301);
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
  return finish(c, false);
}

// A light shaft: bright at the skylight, fading toward the floor, with
// feathered sides so the plane never shows a hard edge.
export function shaftGradient() {
  const [c, ctx] = canvas(64, 256);
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, 'rgba(255,255,255,0.9)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 256);
  ctx.globalCompositeOperation = 'destination-in';
  const side = ctx.createLinearGradient(0, 0, 64, 0);
  side.addColorStop(0, 'rgba(0,0,0,0)');
  side.addColorStop(0.5, 'rgba(0,0,0,1)');
  side.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = side;
  ctx.fillRect(0, 0, 64, 256);
  return finish(c, false);
}

// A soft round contact shadow to lay under objects on the floor.
export function blob() {
  const [c, ctx] = canvas(128, 128);
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
  g.addColorStop(0, 'rgba(0,0,0,0.75)');
  g.addColorStop(0.45, 'rgba(0,0,0,0.3)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return finish(c, false);
}

// ---------- OrdinalFrame slides ----------
// Generated stand-ins for inscriptions, drawn as a square of art centered on
// a landscape slide (ordinalSlides crops them back to the square).

const SLIDE_W = 1200, SLIDE_H = 720;

function slideBase(seed: number) {
  const [c, ctx] = canvas(SLIDE_W, SLIDE_H);
  const g = ctx.createLinearGradient(0, 0, SLIDE_W, SLIDE_H);
  g.addColorStop(0, '#2a2350');
  g.addColorStop(1, '#141a33');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SLIDE_W, SLIDE_H);
  return { c, ctx, r: rng(seed), x: (SLIDE_W - 600) / 2, y: (SLIDE_H - 600) / 2 - 8, s: 600 };
}

// A mirrored pixel creature, the classic on-chain look
function pixelSlide() {
  const { c, ctx, r, x, y, s } = slideBase(101);
  const n = 24, px = s / n;
  ctx.fillStyle = '#0e0f1c';
  ctx.fillRect(x, y, s, s);
  const pal = ['#f7931a', '#ffd23f', '#ee4266', '#3bceac', '#540d6e', '#ffffff'];
  const grid: number[][] = [];
  for (let j = 0; j < n; j++) {
    grid.push([]);
    for (let i = 0; i < n / 2; i++) {
      const dx = (n / 2 - i) / (n / 2), dy = Math.abs(j - n / 2) / (n / 2);
      const p = 0.75 - dx * 0.45 - dy * 0.55;
      grid[j].push(r() < p ? 1 + Math.floor(r() * (pal.length - 1)) : 0);
    }
  }
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const v = grid[j][i < n / 2 ? i : n - 1 - i];
    if (!v) continue;
    ctx.fillStyle = pal[v - 1];
    ctx.fillRect(x + i * px, y + j * px, px + 0.5, px + 0.5);
  }
  for (const ex of [8, 15]) { ctx.fillStyle = '#000'; ctx.fillRect(x + ex * px, y + 9 * px, px, px * 2); }
  return c;
}

// Orange rings radiating from off center
function ringSlide() {
  const { c, ctx, r, x, y, s } = slideBase(202);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, s, s);
  ctx.clip();
  ctx.fillStyle = '#120a02';
  ctx.fillRect(x, y, s, s);
  const cx = x + s * 0.38, cy = y + s * 0.6;
  for (let k = 40; k > 0; k--) {
    const t = k / 40;
    ctx.fillStyle = `hsl(${28 + t * 18 + r() * 6}, 95%, ${12 + (k % 2) * 40 * (1 - t * 0.6)}%)`;
    ctx.beginPath();
    ctx.arc(cx, cy, t * s * 0.95, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  return c;
}

// Nested squares in primary color, after Albers
function squareSlide() {
  const { c, ctx, r, x, y, s } = slideBase(303);
  const pal = ['#1d3fbb', '#f2c12e', '#e4402b', '#f4efe3', '#111111', '#2b9d6b'];
  let size = s, ox = x, oy = y;
  for (let k = 0; k < 6; k++) {
    ctx.fillStyle = pal[k];
    ctx.fillRect(ox, oy, size, size);
    const next = size * (0.72 - r() * 0.08);
    ox += (size - next) / 2;
    oy += (size - next) * (0.62 + r() * 0.1);
    size = next;
  }
  return c;
}

// The display is square and shows only the art, edge to edge: no device UI.
export const ART_PX = 1024;

// One of the owner's inscriptions, cover-fitted to the square screen, with
// pixel art kept crisp instead of blurred by scaling.
export function ordinalArtSlide(img: HTMLImageElement) {
  const [c, ctx] = canvas(ART_PX, ART_PX);
  const w = img.naturalWidth || ART_PX, h = img.naturalHeight || ART_PX;
  const k = Math.max(ART_PX / w, ART_PX / h);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, ART_PX, ART_PX);
  ctx.imageSmoothingEnabled = Math.max(w, h) > 256;
  ctx.drawImage(img, (ART_PX - w * k) / 2, (ART_PX - h * k) / 2, w * k, h * k);
  ctx.imageSmoothingEnabled = true;
  return c;
}

// Stand-ins when no inscriptions are in the folder: the generated art squares
export function ordinalSlides() {
  return [pixelSlide(), ringSlide(), squareSlide()].map((full) => {
    const [c, ctx] = canvas(ART_PX, ART_PX);
    const { x, y, s } = slideBase(0);
    ctx.drawImage(full, x, y, s, s, 0, 0, ART_PX, ART_PX);
    return c;
  });
}

// The white mat around the display: soft off-white board with a faint tooth,
// a bevelled cut around the window and a soft shadow where the screen sits.
// w, h and win are meters; the window is centered.
export function ordinalMat(w: number, h: number, win: number) {
  const PPM = 700;
  const W = Math.round(w * PPM), H = Math.round(h * PPM);
  const [c, ctx] = canvas(W, H);
  ctx.fillStyle = '#f2efe9';
  ctx.fillRect(0, 0, W, H);
  // Tooth: fine speckle, lighter and darker
  const r = rng(77);
  for (let i = 0; i < W * H * 0.06; i++) {
    ctx.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.35)' : 'rgba(120,110,95,0.07)';
    ctx.fillRect(r() * W, r() * H, 1.5, 1.5);
  }
  // A gentle falloff toward the edges, as if lit from the front
  const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.7);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(60,50,35,0.10)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
  const s = win * PPM, x = (W - s) / 2, y = (H - s) / 2, bevel = 0.012 * PPM;
  // Soft shadow the screen throws onto the board
  ctx.save();
  ctx.shadowColor = 'rgba(30,24,16,0.35)';
  ctx.shadowBlur = 0.03 * PPM;
  ctx.shadowOffsetY = 0.008 * PPM;
  ctx.fillStyle = '#f2efe9';
  ctx.fillRect(x - bevel, y - bevel, s + bevel * 2, s + bevel * 2);
  ctx.restore();
  // The bevel: four trapezoids, lit from above (top bright, bottom shaded)
  const o = [x - bevel, y - bevel, x + s + bevel, y + s + bevel];
  const sides: [number[][], string][] = [
    [[[o[0], o[1]], [o[2], o[1]], [x + s, y], [x, y]], '#fffdf8'],
    [[[o[0], o[3]], [o[2], o[3]], [x + s, y + s], [x, y + s]], '#ddd7cc'],
    [[[o[0], o[1]], [o[0], o[3]], [x, y + s], [x, y]], '#f7f3ec'],
    [[[o[2], o[1]], [o[2], o[3]], [x + s, y + s], [x + s, y]], '#e6e0d6'],
  ];
  for (const [pts, col] of sides) {
    ctx.fillStyle = col;
    ctx.beginPath();
    pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.closePath();
    ctx.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// Glare on the display's glass: a soft diagonal sheen and a faint window
// reflection, drawn twice the screen's size so it can slide with the view.
export function screenGlare() {
  const S = 512;
  const [c, ctx] = canvas(S, S);
  ctx.translate(S / 2, S / 2);
  ctx.rotate(-0.55);
  const band = (off: number, wid: number, a: number) => {
    const g = ctx.createLinearGradient(off - wid, 0, off + wid, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, `rgba(255,255,255,${a})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(off - wid, -S, wid * 2, S * 2);
  };
  band(-40, 70, 0.16);
  band(60, 14, 0.12);
  band(110, 34, 0.06);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  // A blurred bright rectangle: the room's ceiling light caught in the glass
  ctx.filter = 'blur(18px)';
  ctx.fillStyle = 'rgba(255,250,240,0.10)';
  ctx.fillRect(S * 0.58, S * 0.14, S * 0.16, S * 0.1);
  ctx.filter = 'none';
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function averageColor(source: CanvasImageSource) {
  const [, ctx] = canvas(1, 1);
  ctx.drawImage(source, 0, 0, 1, 1);
  const d = ctx.getImageData(0, 0, 1, 1).data;
  return `rgb(${d[0]},${d[1]},${d[2]})`;
}

// A soft glow for light spilling from a screen onto a wall: brightest at
// the screen's edge, falling off smoothly to nothing (no visible border).
// Sizes are meters; the returned plane size fits the falloff exactly.
export function screenGlow(halfW: number, halfH: number, reachM: number) {
  const PPM = 90; // pixels per meter
  const W = Math.ceil((halfW + reachM) * 2 * PPM), H = Math.ceil((halfH + reachM) * 2 * PPM);
  const [c, ctx] = canvas(W, H);
  const img = ctx.createImageData(W, H);
  const hx = halfW * PPM, hy = halfH * PPM, reach = reachM * PPM;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dx = Math.max(0, Math.abs(x - W / 2) - hx);
      const dy = Math.max(0, Math.abs(y - H / 2) - hy);
      const t = Math.min(1, Math.hypot(dx, dy) / reach);
      const a = Math.pow(1 - t, 2.2);
      const i = (y * W + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
      img.data[i + 3] = Math.round(a * 255);
    }
  }
  ctx.putImageData(img, 0, 0);
  return { texture: finish(c, false), width: W / PPM, height: H / PPM };
}

// A museum tombstone label for a recreated artwork: title, artist, and an
// honest line that this is a 3D recreation of their piece.
export function artLabel(title: string, artist: string, notes = ['Recreated in 3D after the original', 'Mood board, seanmun.com']) {
  const W = 640, H = 400;
  const [c, ctx] = canvas(W, H);
  ctx.fillStyle = '#fbfaf7';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#1d1c1a';
  ctx.font = '600 52px "Helvetica Neue", Helvetica, Arial, sans-serif';
  ctx.fillText(title, 44, 104, W - 88);
  ctx.font = '400 40px "Helvetica Neue", Helvetica, Arial, sans-serif';
  ctx.fillText(artist, 44, 168, W - 88);
  ctx.fillRect(44, 200, 56, 3);
  ctx.fillStyle = '#6d6a64';
  ctx.font = 'italic 400 28px "Helvetica Neue", Helvetica, Arial, sans-serif';
  ctx.fillText(notes[0], 44, 262, W - 88);
  ctx.font = '400 26px "Helvetica Neue", Helvetica, Arial, sans-serif';
  ctx.fillText(notes[1], 44, 304, W - 88);
  return finish(c, false);
}
