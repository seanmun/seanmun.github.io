'use client';
// File: src/components/ui/LiquidGlass.tsx
// Purpose: "Liquid glass" interactive background — a faint blueprint grid
// rendered as an alpha mask and tinted per theme, distorted by a cursor
// lens with chromatic aberration, with click ripples. Fixed behind the
// page content; themes (default / dark / amber) crossfade via uniforms.
// Amber mode uses warm ink and rim only — no blue light.
//
// The grid texture carries shape only (white-on-transparent alpha mask);
// color is applied at draw time, so theme changes cost three floats.
// Output is premultiplied alpha so compositing is correct over any page
// background. Falls back to nothing when WebGL is unavailable; renders a
// static frame under prefers-reduced-motion; pauses when the tab is hidden.

import React, { useEffect, useRef } from 'react';

type RGB = [number, number, number];

interface GlassTheme {
  ink: RGB; // grid line tint
  inkAlpha: number; // resting grid opacity
  rim: RGB; // lens rim glow color
  rimStrength: number;
}

// Keyed by data-theme; anything unknown falls back to default
const THEMES: Record<string, GlassTheme> = {
  default: { ink: [0.09, 0.08, 0.11], inkAlpha: 0.12, rim: [0.15, 0.35, 0.95], rimStrength: 0.25 },
  dark: { ink: [1.0, 1.0, 1.0], inkAlpha: 0.1, rim: [0.45, 0.65, 1.0], rimStrength: 0.35 },
  // Amber mode exists to cut blue light — warm ink, warm rim
  amber: { ink: [0.36, 0.23, 0.13], inkAlpha: 0.13, rim: [0.96, 0.62, 0.04], rimStrength: 0.25 },
};

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2  uRes;
uniform float uTime;
uniform vec2  uMouse;
uniform sampler2D uTex;
uniform vec4  uRipples[6];
uniform vec3  uInk;
uniform float uInkAlpha;
uniform vec3  uRim;
uniform float uRimStrength;

float lens(vec2 p, vec2 c, float radius) {
  float d = length(p - c);
  return smoothstep(radius, 0.0, d);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  vec2 p = uv * vec2(aspect, 1.0);
  vec2 m = uMouse * vec2(aspect, 1.0);

  // cursor lens
  float radius = 0.28;
  float h  = lens(p, m, radius);
  vec2 eps = vec2(0.004, 0.0);
  vec2 grad = vec2(
    lens(p + eps.xy, m, radius) - lens(p - eps.xy, m, radius),
    lens(p + eps.yx, m, radius) - lens(p - eps.yx, m, radius)
  );
  vec2 offset = -grad * 0.22;

  // click ripples
  for (int i = 0; i < 6; i++) {
    if (uRipples[i].w < 0.5) continue;
    vec2 c = uRipples[i].xy * vec2(aspect, 1.0);
    float age = uTime - uRipples[i].z;
    float d = length(p - c);
    float band = d - age * 0.55;
    float ring = exp(-band * band * 900.0) * exp(-age * 1.8);
    offset += normalize(p - c + 1e-4) * ring * 0.05;
  }

  // chromatic aberration: three alpha samples at split offsets
  float ca = 1.0 + h * 0.6;
  float aR = texture2D(uTex, uv + offset * 1.00 * ca).a;
  float aG = texture2D(uTex, uv + offset * 1.15 * ca).a;
  float aB = texture2D(uTex, uv + offset * 1.30 * ca).a;

  // grid gets slightly more visible inside the lens
  float vis = uInkAlpha * (1.0 + h * 1.4);

  // premultiplied color: each channel = ink * its own coverage
  vec3 rgb = vec3(uInk.r * aR, uInk.g * aG, uInk.b * aB) * vis;
  float alpha = max(max(aR, aG), aB) * vis;

  // rim glow (additive, carries its own alpha)
  float rimMask = pow(length(grad) * 14.0, 2.0) * uRimStrength;
  rgb   += uRim * rimMask;
  alpha += rimMask * 0.6;

  // faint glass sheen inside the lens so it reads on any background
  float sheen = h * 0.05;
  rgb   += uInk * sheen * 0.5;
  alpha += sheen;

  gl_FragColor = vec4(rgb, clamp(alpha, 0.0, 1.0));
}
`;

export function LiquidGlass() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', {
      antialias: false,
      alpha: true,
      premultipliedAlpha: true,
      depth: false,
      stencil: false,
      powerPreference: 'low-power',
    });
    if (!gl) return;

    // --- Alpha-mask texture: white grid on transparent ---
    const dprCap = () => Math.min(window.devicePixelRatio, 2);
    const makeTexture = () => {
      const tex = document.createElement('canvas');
      const dpr = dprCap();
      tex.width = Math.max(1, Math.floor(window.innerWidth * dpr));
      tex.height = Math.max(1, Math.floor(window.innerHeight * dpr));
      const ctx = tex.getContext('2d')!;
      const step = 64 * dpr;

      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= tex.width; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, tex.height); ctx.stroke();
      }
      for (let y = 0; y <= tex.height; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(tex.width, y); ctx.stroke();
      }

      // intersection ticks at full mask strength
      ctx.strokeStyle = 'rgba(255,255,255,1.0)';
      const tick = 5 * dpr;
      for (let x = 0; x <= tex.width; x += step) {
        for (let y = 0; y <= tex.height; y += step) {
          ctx.beginPath();
          ctx.moveTo(x - tick, y); ctx.lineTo(x + tick, y);
          ctx.moveTo(x, y - tick); ctx.lineTo(x, y + tick);
          ctx.stroke();
        }
      }
      return tex;
    };

    // --- Shader setup ---
    const compile = (type: number, src: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      return shader;
    };
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const u = {
      res: gl.getUniformLocation(program, 'uRes'),
      time: gl.getUniformLocation(program, 'uTime'),
      mouse: gl.getUniformLocation(program, 'uMouse'),
      tex: gl.getUniformLocation(program, 'uTex'),
      ripples: gl.getUniformLocation(program, 'uRipples'),
      ink: gl.getUniformLocation(program, 'uInk'),
      inkAlpha: gl.getUniformLocation(program, 'uInkAlpha'),
      rim: gl.getUniformLocation(program, 'uRim'),
      rimStrength: gl.getUniformLocation(program, 'uRimStrength'),
    };

    const texture = gl.createTexture();
    const uploadTexture = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, makeTexture());
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    };

    // --- Theme handling: live values ease toward the active theme ---
    const currentTheme = () =>
      THEMES[document.documentElement.getAttribute('data-theme') ?? 'default'] ?? THEMES.default;

    const live: GlassTheme = JSON.parse(JSON.stringify(currentTheme()));
    let target: GlassTheme = currentTheme();

    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    const ripples = new Float32Array(24);
    let rippleIdx = 0;
    let rafId: number | null = null;
    let running = true;
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const reducedMq = window.matchMedia('(prefers-reduced-motion: reduce)');

    const resizeCanvas = () => {
      const dpr = dprCap();
      const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
        uploadTexture();
      }
    };

    const lerp = (a: number, b: number, f: number) => a + (b - a) * f;
    const lerpRGB = (a: RGB, b: RGB, f: number): RGB => [
      lerp(a[0], b[0], f),
      lerp(a[1], b[1], f),
      lerp(a[2], b[2], f),
    ];

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    const start = performance.now();
    const draw = () => {
      live.ink = lerpRGB(live.ink, target.ink, 0.08);
      live.rim = lerpRGB(live.rim, target.rim, 0.08);
      live.inkAlpha = lerp(live.inkAlpha, target.inkAlpha, 0.08);
      live.rimStrength = lerp(live.rimStrength, target.rimStrength, 0.08);
      mouse.x = lerp(mouse.x, mouse.tx, 0.1);
      mouse.y = lerp(mouse.y, mouse.ty, 0.1);

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(u.res, canvas.width, canvas.height);
      gl.uniform1f(u.time, (performance.now() - start) / 1000);
      gl.uniform2f(u.mouse, mouse.x, mouse.y);
      gl.uniform1i(u.tex, 0);
      gl.uniform4fv(u.ripples, ripples);
      gl.uniform3f(u.ink, ...live.ink);
      gl.uniform1f(u.inkAlpha, live.inkAlpha);
      gl.uniform3f(u.rim, ...live.rim);
      gl.uniform1f(u.rimStrength, live.rimStrength);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (running && !reducedMq.matches) {
        rafId = requestAnimationFrame(draw);
      } else {
        rafId = null;
      }
    };

    const startLoop = () => {
      if (rafId === null) rafId = requestAnimationFrame(draw);
    };

    // --- Listeners ---
    const onPointerMove = (e: PointerEvent) => {
      mouse.tx = e.clientX / window.innerWidth;
      mouse.ty = 1 - e.clientY / window.innerHeight;
    };
    const onPointerDown = (e: PointerEvent) => {
      if (reducedMq.matches) return;
      const i = rippleIdx * 4;
      ripples[i] = e.clientX / window.innerWidth;
      ripples[i + 1] = 1 - e.clientY / window.innerHeight;
      ripples[i + 2] = (performance.now() - start) / 1000;
      ripples[i + 3] = 1.0;
      rippleIdx = (rippleIdx + 1) % 6;
      startLoop();
    };
    const onResize = () => {
      // Debounced: mobile URL-bar show/hide fires resize storms, and each
      // real resize re-uploads a viewport-sized texture
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resizeCanvas();
        startLoop();
      }, 150);
    };
    const onVisibility = () => {
      running = document.visibilityState === 'visible';
      if (running) startLoop();
    };
    const onMotionChange = () => startLoop();
    const themeObserver = new MutationObserver(() => {
      target = currentTheme();
      startLoop();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);
    reducedMq.addEventListener('change', onMotionChange);

    resizeCanvas();
    startLoop();

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (resizeTimer) clearTimeout(resizeTimer);
      themeObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      reducedMq.removeEventListener('change', onMotionChange);
      // Deliberately NOT losing the WebGL context — React strict mode
      // remounts effects in dev and a lost context stays lost
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
}
