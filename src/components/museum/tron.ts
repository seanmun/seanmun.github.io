// File: src/components/museum/tron.ts
// Purpose: The Money Never Sleeps room's Tron grid. A faint 1 m grid of cyan
// light drawn by the wall (or floor) shader from world position: no texture,
// nothing to download, and door openings take care of themselves. Every
// third line is a little brighter. On walls the grid is brightest at the
// floor and fades as it climbs, so the top of the room stays calm.

import * as THREE from 'three';

type GridOpts = {
  color?: string;
  strength?: number; // overall brightness (the concept's slider: 0.55)
  fadeTo?: number; // walls: the height (m) the grid fades out toward; 0 = floor, no fade
  origin?: [number, number]; // world x, z the grid lines run from
};

export function tronGrid(mat: THREE.MeshStandardMaterial, o: GridOpts = {}) {
  const uniforms = {
    uTronColor: { value: new THREE.Color(o.color ?? '#00e5ff') },
    uTronStrength: { value: o.strength ?? 0.55 },
    uTronFade: { value: o.fadeTo ?? 0 },
    uTronOrigin: { value: new THREE.Vector2(...(o.origin ?? [0, 0])) },
  };
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vTronPos;\nvarying vec3 vTronN;')
      .replace('#include <project_vertex>', `#include <project_vertex>
        vTronPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
        vTronN = normalize(mat3(modelMatrix) * objectNormal);`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vTronPos;
        varying vec3 vTronN;
        uniform vec3 uTronColor;
        uniform float uTronStrength;
        uniform float uTronFade;
        uniform vec2 uTronOrigin;
        // distance (m) to the nearest line every 'step' m, along one axis
        float tronDist(float p, float step) { return abs(fract(p / step + 0.5) - 0.5) * step; }
        // a line of half-width w (m), antialiased, thinned to its coverage
        // when it's narrower than a pixel so distant walls don't shimmer
        float tronLine(float d, float fw, float w) {
          return (1.0 - smoothstep(w - fw, w + fw, d)) * min(1.0, 2.0 * w / max(fw, 1e-4));
        }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        {
          vec3 n = abs(vTronN);
          // the face's own two axes: walls run along x or z, and up y
          vec2 p = n.y > 0.5 ? vTronPos.xz - uTronOrigin
                 : vec2(n.x > 0.5 ? vTronPos.z - uTronOrigin.y : vTronPos.x - uTronOrigin.x, vTronPos.y);
          vec2 fw = fwidth(p);
          float minor = max(tronLine(tronDist(p.x, 1.0), fw.x, 0.008), tronLine(tronDist(p.y, 1.0), fw.y, 0.008));
          float major = max(tronLine(tronDist(p.x, 3.0), fw.x, 0.013), tronLine(tronDist(p.y, 3.0), fw.y, 0.013));
          float glow = 0.18 * max(1.0 - smoothstep(0.0, 0.07, tronDist(p.x, 3.0)), 1.0 - smoothstep(0.0, 0.07, tronDist(p.y, 3.0)));
          float g = max(minor * 0.5, major * 0.9) + glow;
          float fade = uTronFade > 0.0 ? 0.12 + 0.88 * pow(clamp(1.0 - vTronPos.y / uTronFade, 0.0, 1.0), 1.6) : 1.0;
          totalEmissiveRadiance += uTronColor * g * fade * uTronStrength;
        }`);
  };
  mat.customProgramCacheKey = () => `tron-grid-${o.fadeTo ? 'wall' : 'floor'}`;
  mat.needsUpdate = true;
  return mat;
}
