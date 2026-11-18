// File: src/components/museum/post.ts
// Purpose: The museum's post-processing on desktop: what turns a clean 3D
// render into something that reads as a photograph.
//   1. Render to an HDR buffer with 4x multisampling
//   2. GTAO: soft contact shadow in corners, under beams, behind frames
//   3. Bloom: a soft glow only on the brightest things (sky, screens, lamps)
//   4. Tone mapping to the display (the renderer's tone mapping)
//   5. A finish: gentle contrast curve, warm highlights and cool shadows,
//      a slight vignette, and fine film grain

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

// GTAO only skips points and lines in its depth pass. Glass, leaf cards,
// light shafts and the sky would read as solid and darken what's behind
// them, so they are hidden from it too (they still render normally).
class MuseumGTAO extends GTAOPass {
  constructor(scene: THREE.Scene, camera: THREE.Camera, w: number, h: number, private skip: (o: THREE.Object3D) => boolean) {
    super(scene, camera, w, h);
  }
  _overrideVisibility() {
    // @ts-expect-error: internal method of GTAOPass, not in its typings
    super._overrideVisibility();
    const cache = (this as unknown as { _visibilityCache: THREE.Object3D[] })._visibilityCache;
    this.scene.traverse((o) => {
      if (!o.visible) return;
      const mesh = o as THREE.Mesh;
      const mats = mesh.isMesh ? (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) : [];
      if (this.skip(o) || mats.some((m) => m.transparent || m.alphaTest > 0)) {
        o.visible = false;
        cache.push(o);
      }
    });
  }
}

const Finish = {
  uniforms: { tDiffuse: { value: null }, time: { value: 0 }, resolution: { value: new THREE.Vector2(1, 1) } },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform vec2 resolution;
    varying vec2 vUv;
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      vec3 col = c.rgb;
      col = mix(col, col * col * (3.0 - 2.0 * col), 0.16);            // gentle S-curve
      float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col += vec3(0.014, 0.005, -0.012) * smoothstep(0.45, 1.0, l);     // warm highlights
      col += vec3(-0.008, 0.0, 0.012) * (1.0 - smoothstep(0.0, 0.35, l)); // cool shadows
      vec2 d = vUv - 0.5;
      col *= 1.0 - 0.55 * dot(d, d);                                    // vignette
      float n = fract(sin(dot(floor(vUv * resolution) + fract(time) * 97.0, vec2(12.9898, 78.233))) * 43758.5453);
      col += (n - 0.5) * 0.018;                                         // grain
      gl_FragColor = vec4(clamp(col, 0.0, 1.0), c.a);
    }`,
};

export function createPost(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera, skip: (o: THREE.Object3D) => boolean) {
  const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));

  const gtao = new MuseumGTAO(scene, camera, 1, 1, skip);
  gtao.blendIntensity = 0.9;
  gtao.updateGtaoMaterial({ radius: 0.55, distanceExponent: 1.6, thickness: 1.2, scale: 1.0, samples: 12, distanceFallOff: 1.0 });
  gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, radiusExponent: 1, rings: 2, samples: 12 });
  composer.addPass(gtao);

  // HDR input: sunlit plaster runs well above 1, so only the sky and real
  // glints (well past that) should glow
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.2, 0.45, 4.0);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const finish = new ShaderPass(Finish);
  composer.addPass(finish);

  return {
    setSize(w: number, h: number, pixelRatio: number) {
      composer.setPixelRatio(pixelRatio);
      composer.setSize(w, h);
      (finish.uniforms.resolution.value as THREE.Vector2).set(w * pixelRatio, h * pixelRatio);
    },
    render(dt: number, t: number) {
      finish.uniforms.time.value = t;
      composer.render(dt);
    },
    dispose() {
      composer.dispose();
      gtao.dispose();
      bloom.dispose();
      target.dispose();
    },
  };
}
