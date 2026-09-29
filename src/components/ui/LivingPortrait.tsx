'use client';
// File: src/components/ui/LivingPortrait.tsx
// Purpose: The hero avatar as a 3D bust (public/models/portrait.glb, a
// 0.54MB web copy of the Meshy export) that turns to look at the visitor's
// cursor, breathes, and drifts into slow glances when left alone.
// The Meshy mesh is one solid shell with painted eyes — no eyeballs, lids
// or rig — so the whole head turns; separate eyes and blinking would need
// the model rebuilt with those parts first.
// - Sits over the flat photo and fades in once loaded: the photo stays as
//   the instant placeholder and the fallback if WebGL fails.
// - Phones (no hover) and idle cursors get the slow glance instead.
// - Reduced motion: faces forward, no breathing, no following.
// - Renders only while on screen; never calls forceContextLoss on cleanup.

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const MODEL_URL = '/models/portrait.glb';
const FOV = 30;
const FRAME_HEIGHT = 1.2; // model units visible top to bottom: head and top of shoulders
const FOCUS_Y = 0.08; // aim a touch above the bust's centre, at the face
const MAX_YAW = 0.42; // radians — enough to clearly look your way, not a full turn
const MAX_PITCH = 0.2;
const IDLE_AFTER_MS = 3500;

export function LivingPortrait({ className = '' }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    const canvas = renderer.domElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    host.appendChild(canvas);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = environment;
    // A soft key light from the upper left gives the face form; studio
    // reflections alone leave it flat
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(-1.5, 1.8, 2.5);
    scene.add(key);

    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.01, 100);
    const distance = (FRAME_HEIGHT / 2) / Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    camera.position.set(0, FOCUS_Y, distance);
    camera.lookAt(0, FOCUS_Y, 0);

    const pivot = new THREE.Group();
    scene.add(pivot);

    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    let disposed = false;
    loader.load(MODEL_URL, (gltf) => {
      if (disposed) return;
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      model.position.sub(box.getCenter(new THREE.Vector3()));
      pivot.add(model);
      host.dataset.loaded = 'true';
    });

    // --- Where to look
    let targetYaw = 0;
    let targetPitch = 0;
    let lastPointerAt = -Infinity;

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const rect = host.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      // Scale by the viewport so the head tracks across the whole page
      targetYaw = THREE.MathUtils.clamp((dx / (window.innerWidth * 0.5)) * MAX_YAW, -MAX_YAW, MAX_YAW);
      targetPitch = THREE.MathUtils.clamp((dy / (window.innerHeight * 0.5)) * MAX_PITCH, -MAX_PITCH, MAX_PITCH);
      lastPointerAt = performance.now();
    };
    if (canHover && !reduceMotion) window.addEventListener('pointermove', onPointerMove, { passive: true });

    let visible = true;
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    intersection.observe(host);

    let yaw = 0;
    let pitch = 0;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      // Clamped at both ends: a frame timestamp can land slightly before the
      // loop started, and a negative step makes the easing below diverge
      // (it sent the head to -10,000° in testing)
      const dt = THREE.MathUtils.clamp((now - last) / 1000, 0, 0.05);
      last = now;
      if (!reduceMotion) {
        const t = now / 1000;
        if (now - lastPointerAt > IDLE_AFTER_MS) {
          // Nobody steering: slow, unhurried glances
          targetYaw = 0.2 * Math.sin(t * 0.35) + 0.06 * Math.sin(t * 0.9);
          targetPitch = 0.05 * Math.sin(t * 0.27);
        }
        // Ease toward the target like a neck, not a servo
        const ease = 1 - Math.exp(-dt * 4);
        yaw += (targetYaw - yaw) * ease;
        pitch += (targetPitch - pitch) * ease;
        pivot.rotation.set(pitch, yaw, 0);
        // Breathing: a barely-there rise and fall
        pivot.position.y = 0.006 * Math.sin(t * 1.6);
      }
      if (visible) renderer.render(scene, camera);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onPointerMove);
      resizeObserver.disconnect();
      intersection.disconnect();
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

  // Decorative: the photo underneath carries the alt text
  return <div ref={hostRef} aria-hidden="true" className={`living-portrait ${className}`} />;
}
