'use client';
// File: src/components/ui/SpinningMark.tsx
// Purpose: The porcelain S (public/models/s-mark.glb, a 1MB web-optimized
// copy of the Meshy export) as a 3D object visitors can spin: drag or swipe
// to turn it, flick to send it spinning with momentum, and it drifts back to
// a slow idle turn when left alone.
// - Touch: `touch-action: pan-y` hands vertical swipes to the page, so it
//   spins sideways but never traps a thumb that is trying to scroll.
// - Keyboard: focusable; arrow keys spin it.
// - Reduced motion: no idle spin and no coasting; dragging still works.
// - Renders only while on screen; never calls forceContextLoss on cleanup,
//   which kills the context on dev StrictMode's double mount.

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const MODEL_URL = '/models/s-mark.glb';
const IDLE_SPEED = 0.35; // radians per second
const DRAG_SENSITIVITY = 0.012; // radians per pixel dragged
const FRICTION = 0.94; // velocity kept per 60fps frame while coasting
const MAX_TILT = 0.45;
const RESUME_IDLE_MS = 2500;
const FOV = 30;

// decorative: a repeat appearance (e.g. the footer signature). Hidden from
// assistive tech and out of the tab order — the hero instance already
// carries the label — but still spinnable by pointer.
export function SpinningMark({ className = '', decorative = false }: { className?: string; decorative?: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    const canvas = renderer.domElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.touchAction = 'pan-y';
    canvas.style.cursor = 'grab';
    host.appendChild(canvas);

    // Soft studio reflections: what makes the glaze shine and the gold read as metal
    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = environment;

    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.01, 100);
    const pivot = new THREE.Group();
    scene.add(pivot);
    let modelHeight = 2;

    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      // Back off until the full height fits, with a little air
      camera.position.set(0, 0, ((modelHeight / 2) / Math.tan(THREE.MathUtils.degToRad(FOV / 2))) * 1.12);
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);

    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    let disposed = false;
    loader.load(MODEL_URL, (gltf) => {
      if (disposed) return;
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      model.position.sub(box.getCenter(new THREE.Vector3()));
      modelHeight = box.getSize(new THREE.Vector3()).y;
      pivot.add(model);
      resize();
      host.dataset.loaded = 'true';
    });

    // --- Spin physics
    let yaw = 0.5; // start angled so the depth reads at once
    let tilt = 0;
    let velocity = reduceMotion ? 0 : IDLE_SPEED;
    let direction = 1;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let lastMoveAt = 0;
    let lastInteraction = -Infinity;

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      lastMoveAt = performance.now();
      lastInteraction = lastMoveAt;
      velocity = 0;
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = 'grabbing';
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const now = performance.now();
      const dt = Math.max(1, now - lastMoveAt) / 1000;
      const turn = (e.clientX - lastX) * DRAG_SENSITIVITY;
      yaw += turn;
      tilt = THREE.MathUtils.clamp(tilt + (e.clientY - lastY) * DRAG_SENSITIVITY * 0.5, -MAX_TILT, MAX_TILT);
      velocity = turn / dt;
      if (turn !== 0) direction = Math.sign(turn);
      lastX = e.clientX;
      lastY = e.clientY;
      lastMoveAt = now;
      lastInteraction = now;
    };
    const onPointerUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      // A finger that stopped before lifting means "hold it here", not a flick
      if (performance.now() - lastMoveAt > 80 || reduceMotion) velocity = 0;
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
      canvas.style.cursor = 'grab';
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      direction = e.key === 'ArrowRight' ? 1 : -1;
      if (reduceMotion) yaw += direction * 0.3;
      else velocity += direction * 2.5;
      lastInteraction = performance.now();
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    host.addEventListener('keydown', onKeyDown);

    // Only render while on screen
    let visible = true;
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    intersection.observe(host);

    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      // Never negative: a frame timestamp can land slightly before the loop
      // started, and FRICTION ** (negative) would grow the spin, not slow it
      const dt = THREE.MathUtils.clamp((now - last) / 1000, 0, 0.05);
      last = now;
      if (!dragging) {
        if (!reduceMotion && now - lastInteraction > RESUME_IDLE_MS) {
          // Left alone: ease back into the slow idle turn, same direction
          velocity += (IDLE_SPEED * direction - velocity) * Math.min(1, dt * 1.2);
        } else {
          velocity *= Math.pow(FRICTION, dt * 60);
        }
        yaw += velocity * dt;
        tilt += (0 - tilt) * Math.min(1, dt * 2.5);
      }
      pivot.rotation.set(tilt, yaw, 0);
      if (visible) renderer.render(scene, camera);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersection.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      host.removeEventListener('keydown', onKeyDown);
      pivot.traverse((object) => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose();
        const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
        materials.forEach((material) => {
          Object.values(material).forEach((value) => {
            if (value instanceof THREE.Texture) value.dispose();
          });
          material.dispose();
        });
      });
      environment.dispose();
      pmrem.dispose();
      renderer.dispose();
      canvas.remove();
    };
  }, []);

  if (decorative) {
    return <div ref={hostRef} aria-hidden="true" className={`spinning-mark ${className}`} />;
  }

  return (
    <div
      ref={hostRef}
      role="img"
      aria-label="Sean Munley's porcelain S mark in 3D. Drag, swipe, or use the arrow keys to spin it."
      tabIndex={0}
      className={`spinning-mark ${className}`}
    />
  );
}
