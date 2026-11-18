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
  const [c, ctx] = canvas(S, S);
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
  const [c, ctx] = canvas(S, S);
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
  const [c, ctx] = canvas(S, S);
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

// Synthetic turf. Tile: 2m.
export function turf() {
  const S = 512;
  const [c, ctx] = canvas(S, S);
  const r = rng(31);
  ctx.fillStyle = '#2f6b2c';
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 26000; i++) {
    const g = 80 + r() * 90;
    ctx.fillStyle = `rgba(${g * 0.45},${g},${g * 0.35},0.6)`;
    ctx.fillRect(r() * S, r() * S, 1, 2 + r() * 3);
  }
  return finish(c);
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

// The golf simulator's impact screen: a hole drawn in perspective with a
// match-play scoreboard, like a sim between shots.
export function fairway() {
  const W = 1600, H = 900;
  const [c, ctx] = canvas(W, H);
  const r = rng(77);
  const sky = ctx.createLinearGradient(0, 0, 0, H * 0.45);
  sky.addColorStop(0, '#6aa8e8');
  sky.addColorStop(1, '#cfe6f5');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    const x = r() * W, y = 40 + r() * 160;
    for (let k = 0; k < 5; k++) {
      ctx.beginPath();
      ctx.ellipse(x + k * 34, y + (k % 2) * 8, 46, 22, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = '#4c7d48'; // tree line
  for (let x = 0; x < W; x += 18) {
    const h = 50 + r() * 60;
    ctx.beginPath();
    ctx.ellipse(x, H * 0.45, 26, h, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#3f8a3a';
  ctx.fillRect(0, H * 0.45, W, H);
  ctx.fillStyle = '#62b04f'; // fairway, narrowing toward the green
  ctx.beginPath();
  ctx.moveTo(W * 0.18, H);
  ctx.bezierCurveTo(W * 0.35, H * 0.7, W * 0.42, H * 0.55, W * 0.5, H * 0.47);
  ctx.bezierCurveTo(W * 0.58, H * 0.55, W * 0.66, H * 0.7, W * 0.84, H);
  ctx.fill();
  ctx.fillStyle = '#e8d9a6'; // bunker
  ctx.beginPath();
  ctx.ellipse(W * 0.6, H * 0.52, 60, 14, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7cc463';
  ctx.beginPath();
  ctx.ellipse(W * 0.5, H * 0.475, 70, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#f5f5f5';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(W * 0.505, H * 0.475);
  ctx.lineTo(W * 0.505, H * 0.405);
  ctx.stroke();
  ctx.fillStyle = '#e63b2e';
  ctx.beginPath();
  ctx.moveTo(W * 0.505, H * 0.405);
  ctx.lineTo(W * 0.53, H * 0.418);
  ctx.lineTo(W * 0.505, H * 0.43);
  ctx.fill();
  // shot tracer arcing toward the green
  ctx.strokeStyle = 'rgba(255,214,64,0.95)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(W * 0.5, H * 0.98);
  ctx.quadraticCurveTo(W * 0.46, H * 0.15, W * 0.505, H * 0.47);
  ctx.stroke();
  // scoreboard
  ctx.fillStyle = 'rgba(10,22,40,0.85)';
  ctx.fillRect(40, 40, 470, 170);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 34px "Helvetica Neue", Helvetica, Arial, sans-serif';
  ctx.fillText('BUDDY CUP · HOLE 16', 64, 90);
  ctx.font = '600 30px "Helvetica Neue", Helvetica, Arial, sans-serif';
  ctx.fillStyle = '#ff6b6b';
  ctx.fillText('RED  7½', 64, 140);
  ctx.fillStyle = '#6bb6ff';
  ctx.fillText('BLUE  6½', 64, 185);
  ctx.fillStyle = '#ffd640';
  ctx.fillText('DORMIE', 330, 140);
  ctx.fillStyle = 'rgba(10,22,40,0.85)';
  ctx.fillRect(W - 330, 40, 290, 110);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 30px "Helvetica Neue", Helvetica, Arial, sans-serif';
  ctx.fillText('CARRY  162 YDS', W - 306, 88);
  ctx.fillText('TO PIN  4 FT', W - 306, 130);
  return finish(c, false);
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
