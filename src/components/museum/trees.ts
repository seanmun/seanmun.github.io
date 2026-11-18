// File: src/components/museum/trees.ts
// Purpose: Big trees outside the gallery, leaning over its glass roof. Seen
// from inside you look up through the steel grid into their canopy, and
// their leaves throw dappled, leaf-shaped shadows through the glass.
// - Branches grow recursively and lean toward the building, merged into one
//   mesh per tree; leaves are cards from a drawn leaf texture, one instanced
//   mesh for every tree, with alpha-tested shadows so the shade has the
//   shape of leaves, not squares.

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

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

// A cluster of leaves on a transparent card
function leafTexture() {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d')!;
  const r = rng(91);
  for (let i = 0; i < 26; i++) {
    const x = 30 + r() * (S - 60), y = 30 + r() * (S - 60);
    const len = 26 + r() * 30, wid = len * (0.38 + r() * 0.12);
    const a = r() * Math.PI * 2;
    const g = 70 + r() * 70;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.fillStyle = `rgb(${Math.round(g * 0.42)},${Math.round(g)},${Math.round(g * 0.3)})`;
    ctx.beginPath();
    ctx.moveTo(-len / 2, 0);
    ctx.quadraticCurveTo(0, -wid, len / 2, 0);
    ctx.quadraticCurveTo(0, wid, -len / 2, 0);
    ctx.fill();
    ctx.strokeStyle = 'rgba(20,40,10,0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-len / 2, 0);
    ctx.lineTo(len / 2, 0);
    ctx.stroke();
    ctx.restore();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export interface TreeSpot {
  x: number;
  z: number;
  lean: number; // +1 grows toward +x, -1 toward -x (toward the building)
  seed: number;
}

export function buildTrees(scene: THREE.Scene, spots: TreeSpot[], keepOut: (p: THREE.Vector3) => boolean) {
  const disposables: { dispose(): void }[] = [];
  const bark = new THREE.MeshStandardMaterial({ color: '#4b3d30', roughness: 0.92 });
  const leafMap = leafTexture();
  const leaves = new THREE.MeshStandardMaterial({
    map: leafMap, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.8,
    // a little of the sun shining through, when seen from below
    emissive: new THREE.Color('#3f6b22'), emissiveMap: leafMap, emissiveIntensity: 0.35,
  });
  const leafDepth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: leafMap, alphaTest: 0.5 });
  disposables.push(bark, leafMap, leaves, leafDepth);

  const cards: THREE.Matrix4[] = [];
  const UP = new THREE.Vector3(0, 1, 0);

  for (const spot of spots) {
    const r = rng(spot.seed);
    const parts: THREE.BufferGeometry[] = [];
    const toward = new THREE.Vector3(spot.lean, 0, 0);

    const grow = (from: THREE.Vector3, dir: THREE.Vector3, len: number, rad: number, depth: number) => {
      const to = from.clone().addScaledVector(dir, len);
      if (depth > 0 && keepOut(to)) return; // never grow into the building
      const g = new THREE.CylinderGeometry(rad * 0.7, rad, len, 7, 1);
      g.translate(0, len / 2, 0);
      g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, dir));
      g.translate(from.x, from.y, from.z);
      parts.push(g);
      if (depth >= 2) {
        // Leaf clusters along the outer branches
        const n = depth >= 3 ? 16 : 7;
        for (let i = 0; i < n; i++) {
          const p = from.clone().lerp(to, 0.35 + r() * 0.65).add(new THREE.Vector3((r() - 0.5) * 2.2, (r() - 0.3) * 1.3, (r() - 0.5) * 2.2));
          if (keepOut(p)) continue;
          const size = 1.3 + r() * 1.1;
          const m = new THREE.Matrix4().compose(
            p,
            new THREE.Quaternion().setFromEuler(new THREE.Euler(r() * Math.PI, r() * Math.PI, r() * Math.PI)),
            new THREE.Vector3(size, size, size),
          );
          cards.push(m);
        }
      }
      if (depth === 3) return;
      const kids = depth === 0 ? 4 : 3;
      for (let k = 0; k < kids; k++) {
        const spread = new THREE.Vector3((r() - 0.5) * 1.6, 0.35 + r() * 0.6, (r() - 0.5) * 1.6);
        const d = dir.clone().multiplyScalar(0.8).add(spread).addScaledVector(toward, 0.55 + r() * 0.4).normalize();
        const at = from.clone().lerp(to, depth === 0 ? 0.75 + r() * 0.25 : 0.55 + r() * 0.45);
        grow(at, d, len * (0.62 + r() * 0.15), rad * 0.6, depth + 1);
      }
    };

    grow(new THREE.Vector3(spot.x, 1.5, spot.z), new THREE.Vector3(spot.lean * 0.12, 1, 0).normalize(), 7.5, 0.42, 0);
    const merged = mergeGeometries(parts.map((p) => p.toNonIndexed()));
    parts.forEach((p) => p.dispose());
    if (!merged) continue;
    disposables.push(merged);
    const tree = new THREE.Mesh(merged, bark);
    tree.castShadow = true;
    scene.add(tree);
  }

  const card = new THREE.PlaneGeometry(1, 1);
  disposables.push(card);
  const canopy = new THREE.InstancedMesh(card, leaves, cards.length);
  cards.forEach((m, i) => canopy.setMatrixAt(i, m));
  canopy.castShadow = true;
  canopy.customDepthMaterial = leafDepth;
  scene.add(canopy);

  return { dispose: () => disposables.forEach((d) => d.dispose()) };
}
