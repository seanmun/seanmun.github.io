'use client';
// File: src/components/ui/SmokeBackground.tsx
// Purpose: Ambient smoke background — a GPU Navier–Stokes fluid simulation.
// Thin haze seeps in low in the frame, buoyancy makes plumes rise and roll,
// and the cursor stirs the field (click-drag injects a wisp of dye).
// Fixed behind the page content; themes (default / dark / amber) tint the
// smoke at display time and crossfade on the accessibility theme toggle.
// Amber mode uses warm tones only — no blue light.
//
// Requires WebGL2 + EXT_color_buffer_float; renders nothing without them.
// Static haze under prefers-reduced-motion; pauses when the tab is hidden;
// resolution scales down on small screens.

import React, { useEffect, useRef } from 'react';

type RGB = [number, number, number];

interface SmokeTheme {
  smoke: RGB; // body color of the smoke
  hot: RGB; // dense-core tint
  density: number; // overall opacity cap
}

// Keyed by data-theme; anything unknown falls back to default
const THEMES: Record<string, SmokeTheme> = {
  default: { smoke: [0.17, 0.16, 0.21], hot: [0.33, 0.13, 0.49], density: 0.6 },
  dark: { smoke: [0.81, 0.83, 0.91], hot: [1.0, 0.69, 0.41], density: 0.75 },
  // Amber mode exists to cut blue light — warm smoke, ember core
  amber: { smoke: [0.3, 0.17, 0.06], hot: [0.8, 0.27, 0.0], density: 0.55 },
};

const CONFIG = {
  SIM_RES: 152,
  DYE_RES: 640,
  PRESSURE_ITER: 22,
  VEL_DISSIPATION: 0.2,
  DYE_DISSIPATION: 0.4,
  CURL: 32.0,
  FORCE: 4900.0,
  CURSOR_RADIUS: 0.0014,
  EMIT_RATE: 0.36,
  BUOYANCY: 11.0,
  AMBIENT_DRIFT: 1.4,
};

const SHADER_HEADER = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 frag;
`;

const NOISE_LIB = `
float hash(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1,0)), f.x),
             mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y);
}
`;

const VERT_SRC = `#version 300 es
precision highp float;
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const ADVECTION_SRC = SHADER_HEADER + `
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2  uTexel;
uniform float uDt;
uniform float uDissipation;
void main() {
  vec2 coord = vUv - uDt * texture(uVelocity, vUv).xy * uTexel;
  vec4 result = texture(uSource, coord);
  float decay = 1.0 + uDissipation * uDt;
  frag = result / decay;
}`;

const SPLAT_SRC = SHADER_HEADER + `
uniform sampler2D uTarget;
uniform vec2  uPoint;
uniform vec3  uValue;
uniform float uRadius;
uniform float uAspect;
void main() {
  vec2 d = vUv - uPoint;
  d.x *= uAspect;
  float g = exp(-dot(d, d) / uRadius);
  vec3 base = texture(uTarget, vUv).xyz;
  frag = vec4(base + uValue * g, 1.0);
}`;

// Buoyancy: hot smoke rises — density pushes the velocity field upward,
// with a noise-wandering horizontal breeze so plumes lean and sway
const BUOYANCY_SRC = SHADER_HEADER + NOISE_LIB + `
uniform sampler2D uVelocity;
uniform sampler2D uDye;
uniform float uDt;
uniform float uBuoyancy;
uniform float uDrift;
uniform float uTime;
void main() {
  vec2 vel = texture(uVelocity, vUv).xy;
  float d = texture(uDye, vUv).x;
  vel.y += d * uBuoyancy * uDt * 60.0;
  float breeze = (noise(vUv * 2.0 + vec2(uTime * 0.07, 0.0)) - 0.5) * 2.0;
  vel.x += d * breeze * uDrift * uDt * 60.0;
  frag = vec4(vel, 0.0, 1.0);
}`;

const CURL_SRC = SHADER_HEADER + `
uniform sampler2D uVelocity;
uniform vec2 uTexel;
void main() {
  float L = texture(uVelocity, vUv - vec2(uTexel.x, 0.0)).y;
  float R = texture(uVelocity, vUv + vec2(uTexel.x, 0.0)).y;
  float B = texture(uVelocity, vUv - vec2(0.0, uTexel.y)).x;
  float T = texture(uVelocity, vUv + vec2(0.0, uTexel.y)).x;
  frag = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
}`;

const VORTICITY_SRC = SHADER_HEADER + `
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform vec2  uTexel;
uniform float uCurlStrength;
uniform float uDt;
void main() {
  float L = texture(uCurl, vUv - vec2(uTexel.x, 0.0)).x;
  float R = texture(uCurl, vUv + vec2(uTexel.x, 0.0)).x;
  float B = texture(uCurl, vUv - vec2(0.0, uTexel.y)).x;
  float T = texture(uCurl, vUv + vec2(0.0, uTexel.y)).x;
  float C = texture(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 1e-4;
  force *= uCurlStrength * C;
  force.y *= -1.0;
  vec2 vel = texture(uVelocity, vUv).xy;
  vel += force * uDt;
  vel = clamp(vel, vec2(-1000.0), vec2(1000.0));
  frag = vec4(vel, 0.0, 1.0);
}`;

const DIVERGENCE_SRC = SHADER_HEADER + `
uniform sampler2D uVelocity;
uniform vec2 uTexel;
void main() {
  float L = texture(uVelocity, vUv - vec2(uTexel.x, 0.0)).x;
  float R = texture(uVelocity, vUv + vec2(uTexel.x, 0.0)).x;
  float B = texture(uVelocity, vUv - vec2(0.0, uTexel.y)).y;
  float T = texture(uVelocity, vUv + vec2(0.0, uTexel.y)).y;
  vec2 C = texture(uVelocity, vUv).xy;
  if (vUv.x - uTexel.x < 0.0) L = -C.x;
  if (vUv.x + uTexel.x > 1.0) R = -C.x;
  if (vUv.y - uTexel.y < 0.0) B = -C.y;
  if (vUv.y + uTexel.y > 1.0) T = -C.y;
  frag = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}`;

const PRESSURE_SRC = SHADER_HEADER + `
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
uniform vec2 uTexel;
void main() {
  float L = texture(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
  float R = texture(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
  float B = texture(uPressure, vUv - vec2(0.0, uTexel.y)).x;
  float T = texture(uPressure, vUv + vec2(0.0, uTexel.y)).x;
  float div = texture(uDivergence, vUv).x;
  frag = vec4((L + R + B + T - div) * 0.25, 0.0, 0.0, 1.0);
}`;

const GRADIENT_SRC = SHADER_HEADER + `
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
uniform vec2 uTexel;
void main() {
  float L = texture(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
  float R = texture(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
  float B = texture(uPressure, vUv - vec2(0.0, uTexel.y)).x;
  float T = texture(uPressure, vUv + vec2(0.0, uTexel.y)).x;
  vec2 vel = texture(uVelocity, vUv).xy;
  vel -= 0.5 * vec2(R - L, T - B);
  frag = vec4(vel, 0.0, 1.0);
}`;

// Ambient seep: fine-grained, concentrated along the bottom edge — like
// smoke entering the frame, not fog materializing everywhere
const EMIT_SRC = SHADER_HEADER + NOISE_LIB + `
uniform sampler2D uDye;
uniform float uTime;
uniform float uDt;
uniform float uRate;
void main() {
  float d = texture(uDye, vUv).x;
  float n = noise(vUv * vec2(9.0, 5.0) + vec2(uTime * 0.12, -uTime * 0.05));
  n *= noise(vUv * vec2(23.0, 13.0) - vec2(uTime * 0.21, 0.0));
  n = smoothstep(0.24, 0.72, n);
  float bias = exp(-vUv.y * 3.8);
  float emit = n * bias * uRate * uDt;
  d = min(d + emit, 1.0);
  frag = vec4(d, 0.0, 0.0, 1.0);
}`;

const DISPLAY_SRC = SHADER_HEADER + NOISE_LIB + `
uniform sampler2D uDye;
uniform vec3  uSmoke;
uniform vec3  uHot;
uniform float uDensity;
uniform float uTime;
void main() {
  float d = texture(uDye, vUv).x;
  // curved remap keeps the mids translucent — wisps, not pudding
  float a = pow(clamp(d, 0.0, 1.0), 1.22);
  float g = noise(vUv * vec2(180.0, 120.0) + vec2(0.0, -uTime * 0.6));
  a *= 0.86 + g * 0.28;
  float alpha = clamp(a * uDensity, 0.0, 1.0);
  vec3 col = mix(uSmoke, uHot, smoothstep(0.5, 1.0, d) * 0.5);
  alpha += (hash(gl_FragCoord.xy + uTime) - 0.5) * 0.012;
  alpha = clamp(alpha, 0.0, 1.0);
  frag = vec4(col * alpha, alpha);
}`;

interface FBO {
  tex: WebGLTexture;
  fbo: WebGLFramebuffer;
  w: number;
  h: number;
  texel: [number, number];
}

interface DoubleFBO {
  readonly read: FBO;
  readonly write: FBO;
  swap: () => void;
  texel: [number, number];
}

export function SmokeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      depth: false,
      stencil: false,
      powerPreference: 'low-power',
    });
    if (!gl) return;
    if (!gl.getExtension('EXT_color_buffer_float')) return;
    gl.getExtension('OES_texture_float_linear');

    // --- Program setup ---
    const compileShader = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const baseVertex = compileShader(gl.VERTEX_SHADER, VERT_SRC);
    const createProgram = (fragSrc: string) => {
      const p = gl.createProgram()!;
      gl.attachShader(p, baseVertex);
      gl.attachShader(p, compileShader(gl.FRAGMENT_SHADER, fragSrc));
      gl.bindAttribLocation(p, 0, 'aPos');
      gl.linkProgram(p);
      const u: Record<string, WebGLUniformLocation | null> = {};
      const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS) as number;
      for (let i = 0; i < n; i++) {
        const info = gl.getActiveUniform(p, i);
        if (info) u[info.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(p, info.name);
      }
      return { program: p, u };
    };

    const advectionProg = createProgram(ADVECTION_SRC);
    const splatProg = createProgram(SPLAT_SRC);
    const buoyancyProg = createProgram(BUOYANCY_SRC);
    const curlProg = createProgram(CURL_SRC);
    const vorticityProg = createProgram(VORTICITY_SRC);
    const divergenceProg = createProgram(DIVERGENCE_SRC);
    const pressureProg = createProgram(PRESSURE_SRC);
    const gradientProg = createProgram(GRADIENT_SRC);
    const emitProg = createProgram(EMIT_SRC);
    const displayProg = createProgram(DISPLAY_SRC);
    if (!gl.getProgramParameter(displayProg.program, gl.LINK_STATUS)) return;

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    // --- FBOs ---
    const createFBO = (w: number, h: number, internalFormat: number, format: number): FBO => {
      const tex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, gl.HALF_FLOAT, null);
      const fbo = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return { tex, fbo, w, h, texel: [1 / w, 1 / h] };
    };
    const createDoubleFBO = (w: number, h: number, ifmt: number, fmt: number): DoubleFBO => {
      let a = createFBO(w, h, ifmt, fmt);
      let b = createFBO(w, h, ifmt, fmt);
      return {
        get read() { return a; },
        get write() { return b; },
        swap() { [a, b] = [b, a]; },
        texel: a.texel,
      };
    };

    let velocity: DoubleFBO, dye: DoubleFBO, pressure: DoubleFBO;
    let divergence: FBO, curl: FBO;

    const dprCap = () => Math.min(window.devicePixelRatio, 2);
    // Scale the simulation down on small screens
    const simRes = () => (window.innerWidth < 768 ? 112 : CONFIG.SIM_RES);
    const dyeRes = () => (window.innerWidth < 768 ? 448 : CONFIG.DYE_RES);

    const initBuffers = () => {
      const aspect = canvas.width / canvas.height;
      const simH = simRes(), simW = Math.max(8, Math.round(simH * aspect));
      const dyeH = dyeRes(), dyeW = Math.max(8, Math.round(dyeH * aspect));
      velocity = createDoubleFBO(simW, simH, gl.RG16F, gl.RG);
      pressure = createDoubleFBO(simW, simH, gl.R16F, gl.RED);
      divergence = createFBO(simW, simH, gl.R16F, gl.RED);
      curl = createFBO(simW, simH, gl.R16F, gl.RED);
      dye = createDoubleFBO(dyeW, dyeH, gl.R16F, gl.RED);
    };

    const blit = (target: FBO | null) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fbo : null);
      gl.viewport(0, 0, target ? target.w : canvas.width, target ? target.h : canvas.height);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const bindTex = (tex: WebGLTexture, unit: number) => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      return unit;
    };

    // --- Theme handling: live values ease toward the active theme ---
    const currentTheme = () =>
      THEMES[document.documentElement.getAttribute('data-theme') ?? 'default'] ?? THEMES.default;
    const live: SmokeTheme = JSON.parse(JSON.stringify(currentTheme()));
    let target: SmokeTheme = currentTheme();

    const lerp = (a: number, b: number, f: number) => a + (b - a) * f;
    const lerpRGB = (a: RGB, b: RGB, f: number): RGB => [
      lerp(a[0], b[0], f),
      lerp(a[1], b[1], f),
      lerp(a[2], b[2], f),
    ];

    // --- Pointer ---
    const pointer = { x: 0.5, y: 0.5, dx: 0, dy: 0, moved: false, down: false };
    const updatePointer = (e: PointerEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = 1.0 - e.clientY / window.innerHeight;
      pointer.dx = x - pointer.x;
      pointer.dy = y - pointer.y;
      pointer.x = x;
      pointer.y = y;
      pointer.moved = true;
    };

    // --- Sim steps ---
    const splat = (
      targetFBO: DoubleFBO,
      x: number, y: number,
      vx: number, vy: number, vz: number,
      radius: number
    ) => {
      const p = splatProg;
      gl.useProgram(p.program);
      gl.uniform1i(p.u.uTarget, bindTex(targetFBO.read.tex, 0));
      gl.uniform2f(p.u.uPoint, x, y);
      gl.uniform3f(p.u.uValue, vx, vy, vz);
      gl.uniform1f(p.u.uRadius, radius);
      gl.uniform1f(p.u.uAspect, canvas.width / canvas.height);
      blit(targetFBO.write);
      targetFBO.swap();
    };

    const seed = () => {
      // thin haze low in the frame + a few rising starter plumes
      for (let i = 0; i < 30; i++) {
        const x = Math.random(), y = Math.random() * 0.35;
        splat(dye, x, y, 0.06 + Math.random() * 0.09, 0, 0, 0.002 + Math.random() * 0.006);
      }
      for (let i = 0; i < 5; i++) {
        const x = 0.1 + Math.random() * 0.8;
        splat(velocity, x, 0.15, (Math.random() - 0.5) * 400, 500 + Math.random() * 400, 0, 0.002);
      }
    };

    const step = (dt: number, time: number) => {
      gl.disable(gl.BLEND);

      let p = advectionProg;
      gl.useProgram(p.program);
      gl.uniform2fv(p.u.uTexel, velocity.texel);
      gl.uniform1f(p.u.uDt, dt);
      gl.uniform1f(p.u.uDissipation, CONFIG.VEL_DISSIPATION);
      gl.uniform1i(p.u.uVelocity, bindTex(velocity.read.tex, 0));
      gl.uniform1i(p.u.uSource, bindTex(velocity.read.tex, 0));
      blit(velocity.write);
      velocity.swap();

      p = buoyancyProg;
      gl.useProgram(p.program);
      gl.uniform1f(p.u.uDt, dt);
      gl.uniform1f(p.u.uBuoyancy, CONFIG.BUOYANCY);
      gl.uniform1f(p.u.uDrift, CONFIG.AMBIENT_DRIFT);
      gl.uniform1f(p.u.uTime, time);
      gl.uniform1i(p.u.uVelocity, bindTex(velocity.read.tex, 0));
      gl.uniform1i(p.u.uDye, bindTex(dye.read.tex, 1));
      blit(velocity.write);
      velocity.swap();

      if (pointer.moved) {
        const fx = pointer.dx * CONFIG.FORCE;
        const fy = pointer.dy * CONFIG.FORCE;
        splat(velocity, pointer.x, pointer.y, fx, fy, 0, CONFIG.CURSOR_RADIUS);
        if (pointer.down) {
          splat(dye, pointer.x, pointer.y, 0.32, 0, 0, CONFIG.CURSOR_RADIUS * 2.0);
        }
        pointer.moved = false;
      }

      p = curlProg;
      gl.useProgram(p.program);
      gl.uniform2fv(p.u.uTexel, velocity.texel);
      gl.uniform1i(p.u.uVelocity, bindTex(velocity.read.tex, 0));
      blit(curl);

      p = vorticityProg;
      gl.useProgram(p.program);
      gl.uniform2fv(p.u.uTexel, velocity.texel);
      gl.uniform1f(p.u.uCurlStrength, CONFIG.CURL);
      gl.uniform1f(p.u.uDt, dt);
      gl.uniform1i(p.u.uVelocity, bindTex(velocity.read.tex, 0));
      gl.uniform1i(p.u.uCurl, bindTex(curl.tex, 1));
      blit(velocity.write);
      velocity.swap();

      p = divergenceProg;
      gl.useProgram(p.program);
      gl.uniform2fv(p.u.uTexel, velocity.texel);
      gl.uniform1i(p.u.uVelocity, bindTex(velocity.read.tex, 0));
      blit(divergence);

      p = pressureProg;
      gl.useProgram(p.program);
      gl.uniform2fv(p.u.uTexel, velocity.texel);
      gl.uniform1i(p.u.uDivergence, bindTex(divergence.tex, 1));
      for (let i = 0; i < CONFIG.PRESSURE_ITER; i++) {
        gl.uniform1i(p.u.uPressure, bindTex(pressure.read.tex, 0));
        blit(pressure.write);
        pressure.swap();
      }

      p = gradientProg;
      gl.useProgram(p.program);
      gl.uniform2fv(p.u.uTexel, velocity.texel);
      gl.uniform1i(p.u.uPressure, bindTex(pressure.read.tex, 0));
      gl.uniform1i(p.u.uVelocity, bindTex(velocity.read.tex, 1));
      blit(velocity.write);
      velocity.swap();

      p = advectionProg;
      gl.useProgram(p.program);
      gl.uniform2fv(p.u.uTexel, velocity.texel);
      gl.uniform1f(p.u.uDt, dt);
      gl.uniform1f(p.u.uDissipation, CONFIG.DYE_DISSIPATION);
      gl.uniform1i(p.u.uVelocity, bindTex(velocity.read.tex, 0));
      gl.uniform1i(p.u.uSource, bindTex(dye.read.tex, 1));
      blit(dye.write);
      dye.swap();

      p = emitProg;
      gl.useProgram(p.program);
      gl.uniform1f(p.u.uTime, time);
      gl.uniform1f(p.u.uDt, dt);
      gl.uniform1f(p.u.uRate, CONFIG.EMIT_RATE);
      gl.uniform1i(p.u.uDye, bindTex(dye.read.tex, 0));
      blit(dye.write);
      dye.swap();
    };

    const render = (time: number) => {
      live.smoke = lerpRGB(live.smoke, target.smoke, 0.06);
      live.hot = lerpRGB(live.hot, target.hot, 0.06);
      live.density = lerp(live.density, target.density, 0.06);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      const p = displayProg;
      gl.useProgram(p.program);
      gl.uniform1i(p.u.uDye, bindTex(dye.read.tex, 0));
      gl.uniform3f(p.u.uSmoke, ...live.smoke);
      gl.uniform3f(p.u.uHot, ...live.hot);
      gl.uniform1f(p.u.uDensity, live.density);
      gl.uniform1f(p.u.uTime, time);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    // --- Loop ---
    let rafId: number | null = null;
    let running = true;
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const reducedMq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const start = performance.now();
    let lastTime = start;

    const frame = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 1 / 30);
      lastTime = now;
      const time = (now - start) / 1000;
      if (!reducedMq.matches) step(dt, time);
      render(time);
      if (running && !reducedMq.matches) {
        rafId = requestAnimationFrame(frame);
      } else {
        rafId = null;
      }
    };
    const startLoop = () => {
      if (rafId === null) {
        lastTime = performance.now(); // avoid a dt spike after a pause
        rafId = requestAnimationFrame(frame);
      }
    };

    const resizeCanvas = () => {
      const dpr = dprCap();
      canvas.width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      canvas.height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      initBuffers();
      seed();
    };

    // --- Listeners ---
    const onPointerMove = (e: PointerEvent) => updatePointer(e);
    const onPointerDown = (e: PointerEvent) => {
      pointer.down = true;
      updatePointer(e);
      pointer.dx = 0;
      pointer.dy = 0;
    };
    const onPointerUp = () => { pointer.down = false; };
    const onResize = () => {
      // Debounced: a resize rebuilds every sim buffer and reseeds
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resizeCanvas();
        startLoop();
      }, 200);
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
    window.addEventListener('pointerup', onPointerUp);
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
      window.removeEventListener('pointerup', onPointerUp);
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
