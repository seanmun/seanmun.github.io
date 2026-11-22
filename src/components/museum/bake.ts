// File: src/components/museum/bake.ts
// Purpose: Light baked in Blender for a room (scripts/museum/bake). Blender
// lights the room's real geometry once (sun through the window, sky, light
// bouncing off the floor and walls, soft shadow under every moulding) and
// the museum shows the result, so a phone gets the same light as a desktop
// for the cost of one small image.
//
// Two kinds of baked light, both "light only" (the surface keeps its own
// colour and texture):
// - the shell (floor, ceiling, four walls) reads a light map: one atlas
//   image, looked up from each pixel's world position and facing, so the
//   room's geometry needs no extra UVs. ATLAS mirrors bake_room.py.
// - named meshes (mouldings, fireplace...) carry one baked colour per vertex.
// A baked surface takes its diffuse light from the bake alone; live lights
// still give it highlights and reflections. Until the files arrive (or if a
// mesh has changed since the bake and its vertex count no longer matches)
// everything stays live-lit, as before.

import * as THREE from 'three';

type Room = { x0: number; x1: number; z0: number; z1: number; h: number };
type Manifest = { range: number; size: number; room: Room; meshes: Record<string, [number, number]>; probe?: { at: [number, number, number]; range: number } };

// x, y, w, h in a 1024 grid, origin bottom-left
const ATLAS = {
  floor: [0, 0, 512, 512],
  ceil: [512, 0, 256, 256],
  left: [0, 512, 512, 216],
  right: [512, 512, 512, 216],
  back: [0, 728, 512, 216],
  front: [512, 728, 512, 216],
} as const;
const PAD = 3;
const vec4 = (r: readonly number[]) => `vec4(${r.map((v) => v.toFixed(1)).join(', ')})`;

type Uniforms = {
  uBakeOn: { value: number };
  uBakeGain: { value: number };
  uBakeRange: { value: number };
  uBakeMap: { value: THREE.Texture | null };
  uBakeLo: { value: THREE.Vector3 };
  uBakeHi: { value: THREE.Vector3 };
  uBakeProbe: { value: THREE.Vector3 };
};

// Patch a material so its diffuse light comes from the bake. mode 'map' looks
// the light up in the atlas; 'vertex' reads the mesh's bakeColor attribute.
function patch(mat: THREE.MeshStandardMaterial, mode: 'map' | 'vertex', u: Uniforms) {
  // (each material has its own switch for the room's reflection: only the
  // smoother ones get it)
  const box = { value: 0 };
  mat.userData.bakeBox = box;
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u, { uBakeBox: box });
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        varying vec3 vBakeP;
        varying vec3 vBakeN;
        ${mode === 'vertex' ? 'attribute vec3 bakeColor;\nvarying vec3 vBakeC;' : ''}`)
      .replace('#include <project_vertex>', `#include <project_vertex>
        vBakeP = (modelMatrix * vec4(transformed, 1.0)).xyz;
        vBakeN = normalize(mat3(modelMatrix) * objectNormal);
        ${mode === 'vertex' ? 'vBakeC = bakeColor;' : ''}`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vBakeP;
        varying vec3 vBakeN;
        ${mode === 'vertex' ? 'varying vec3 vBakeC;' : 'uniform sampler2D uBakeMap;'}
        uniform float uBakeOn;
        uniform float uBakeGain;
        uniform float uBakeRange;
        uniform vec3 uBakeLo;
        uniform vec3 uBakeHi;
        uniform vec3 uBakeProbe;
        uniform float uBakeBox;
        // The room's reflection is one picture taken from its middle. Treat
        // it as painted on the room's own walls (a box), so a reflection
        // lands where the thing reflected really is, not at infinity.
        vec3 bakeBoxProject(vec3 r) {
          vec3 inside = step(uBakeLo, vBakeP) * step(vBakeP, uBakeHi);
          if (uBakeBox * inside.x * inside.y * inside.z < 0.5) return r;
          vec3 d = sign(r) * max(abs(r), vec3(1e-5));
          vec3 far = max((uBakeHi - vBakeP) / d, (uBakeLo - vBakeP) / d);
          return normalize(vBakeP + r * min(min(far.x, far.y), far.z) - uBakeProbe);
        }`)
      .replace('#include <envmap_physical_pars_fragment>', THREE.ShaderChunk.envmap_physical_pars_fragment.replace(
        'reflectVec = inverseTransformDirection( reflectVec, viewMatrix );',
        'reflectVec = bakeBoxProject( inverseTransformDirection( reflectVec, viewMatrix ) );'))
      .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
        {
          // only inside the baked room: some materials are shared with others
          vec3 inside = step(uBakeLo, vBakeP) * step(vBakeP, uBakeHi);
          float on = uBakeOn * inside.x * inside.y * inside.z;
          if (on > 0.5) {
            ${mode === 'vertex' ? 'vec3 v = vBakeC;' : `
            vec3 n = vBakeN;
            vec3 span = uBakeHi - uBakeLo;
            vec3 q = clamp((vBakeP - uBakeLo) / span, 0.0, 1.0);
            // (the walls' height runs from the floor, not from the slab under it)
            q.y = clamp(vBakeP.y / (uBakeHi.y - 0.02), 0.0, 1.0);
            vec2 t; vec4 rc;
            if (abs(n.y) > 0.7) { t = q.xz; rc = n.y > 0.0 ? ${vec4(ATLAS.floor)} : ${vec4(ATLAS.ceil)}; }
            else if (abs(n.x) > 0.7) { t = q.zy; rc = n.x > 0.0 ? ${vec4(ATLAS.left)} : ${vec4(ATLAS.right)}; }
            else { t = q.xy; rc = n.z > 0.0 ? ${vec4(ATLAS.back)} : ${vec4(ATLAS.front)}; }
            vec3 v = texture2D(uBakeMap, (rc.xy + ${PAD.toFixed(1)} + t * (rc.zw - ${(2 * PAD).toFixed(1)})) / 1024.0).rgb;`}
            vec3 baked = v * v * uBakeRange * uBakeGain;
            reflectedLight.directDiffuse = vec3(0.0);
            reflectedLight.indirectDiffuse = baked * material.diffuseColor;
          }
        }`);
  };
  mat.customProgramCacheKey = () => `bake-${mode}`;
  mat.needsUpdate = true;
}

export function bakedLight(o: {
  name: string; // files: /media/museum/bake/<name>-light.webp, -verts.bin, -bake.json
  room: Room;
  wallT: number;
  shell: THREE.MeshStandardMaterial[]; // the room's wall, floor and ceiling materials
  scene: THREE.Scene; // searched for meshes named for the bake (userData.bake)
  mobile: boolean;
  gain?: number;
  pmrem: THREE.PMREMGenerator; // turns the room's reflection picture into an environment map
  reflect?: number; // how strongly the smoother baked surfaces mirror the room (default 0.35)
  track: <X extends { dispose(): void }>(x: X) => X;
}) {
  const { room: r, wallT: T } = o;
  const u: Uniforms = {
    uBakeOn: { value: 0 },
    uBakeGain: { value: o.gain ?? 1 },
    uBakeRange: { value: 8 },
    uBakeMap: { value: null },
    // the atlas's world span: the room, plus the walls' thickness in x and z
    uBakeLo: { value: new THREE.Vector3(r.x0 - T, -0.02, r.z1 - T) },
    uBakeHi: { value: new THREE.Vector3(r.x1 + T, r.h + 0.02, r.z0 + T) },
    uBakeProbe: { value: new THREE.Vector3() },
  };
  const base = `/media/museum/bake/${o.name}`;
  let cancelled = false;

  (async () => {
    const [manifest, bin] = await Promise.all([
      fetch(`${base}-bake.json`).then((res) => res.json() as Promise<Manifest>),
      fetch(`${base}-verts.bin`).then((res) => res.arrayBuffer()),
    ]);
    const map = await new THREE.TextureLoader().loadAsync(`${base}-light${o.mobile ? '-half' : ''}.webp`);
    if (cancelled) { map.dispose(); return; }
    map.colorSpace = THREE.NoColorSpace;
    map.generateMipmaps = false; // mips would bleed one surface's light into its neighbour's
    map.minFilter = THREE.LinearFilter;
    o.track(map);
    u.uBakeMap.value = map;
    u.uBakeRange.value = manifest.range;

    // Vertex-baked meshes: opaque, non-metal ones whose geometry still
    // matches the bake. A material is only patched if every mesh using it does.
    const patched: THREE.MeshStandardMaterial[] = [];
    const bytes = new Uint8Array(bin);
    const byMat = new Map<THREE.MeshStandardMaterial, { mesh: THREE.Mesh; at: [number, number] | undefined }[]>();
    o.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      const id = mesh.userData?.bake as string | undefined;
      if (!mesh.isMesh || !id?.startsWith(`${o.name}-`)) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (!mat.isMeshStandardMaterial || mat.transparent || mat.metalness > 0.5) return;
      const at = manifest.meshes[id];
      const ok = at && at[1] === mesh.geometry.attributes.position.count;
      byMat.set(mat, [...(byMat.get(mat) ?? []), { mesh, at: ok ? at : undefined }]);
    });
    for (const [mat, uses] of byMat) {
      if (uses.some((x) => !x.at)) continue; // changed since the bake: stays live-lit
      for (const { mesh, at } of uses) {
        const [offset, count] = at!;
        mesh.geometry.setAttribute('bakeColor', new THREE.BufferAttribute(bytes.subarray(offset, offset + count * 3), 3, true));
      }
      patch(mat, 'vertex', u);
      patched.push(mat);
    }
    for (const mat of o.shell) { patch(mat, 'map', u); patched.push(mat); }
    u.uBakeOn.value = 1;

    // The reflection probe: the room as seen from its middle, stored like
    // the light (sqrt of value / range). Decoded to linear floats, then
    // prefiltered so rougher surfaces get a blurrier reflection.
    if (manifest.probe) {
      const img = await new THREE.ImageLoader().loadAsync(`${base}-probe.webp`);
      if (cancelled) return;
      const w = img.width, h = img.height;
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const g = c.getContext('2d')!;
      g.drawImage(img, 0, 0);
      const src = g.getImageData(0, 0, w, h).data;
      const data = new Uint16Array(w * h * 4);
      const one = THREE.DataUtils.toHalfFloat(1);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const from = (y * w + x) * 4, to = ((h - 1 - y) * w + x) * 4; // the texture's first row is the bottom
          for (let k = 0; k < 3; k++) {
            const v = src[from + k] / 255;
            data[to + k] = THREE.DataUtils.toHalfFloat(v * v * manifest.probe.range);
          }
          data[to + 3] = one;
        }
      }
      const pano = new THREE.DataTexture(data, w, h, THREE.RGBAFormat, THREE.HalfFloatType);
      pano.mapping = THREE.EquirectangularReflectionMapping;
      pano.colorSpace = THREE.LinearSRGBColorSpace;
      pano.magFilter = pano.minFilter = THREE.LinearFilter;
      pano.needsUpdate = true;
      const env = o.track(o.pmrem.fromEquirectangular(pano).texture);
      pano.dispose();
      u.uBakeProbe.value.fromArray(manifest.probe.at);
      for (const mat of patched) {
        // Matte surfaces (plaster, a ceiling) keep the soft default: a
        // mirror image of the window smeared across them reads as a glow
        if (mat.roughness > 0.6) continue;
        (mat.userData.bakeBox as { value: number }).value = 1;
        mat.envMap = env;
        mat.envMapIntensity = (o.reflect ?? 0.35) * (o.gain ?? 1);
        mat.needsUpdate = true;
      }
    }
  })().catch((err) => console.warn(`No baked light for ${o.name}:`, err));

  return { uniforms: u, dispose() { cancelled = true; } };
}
