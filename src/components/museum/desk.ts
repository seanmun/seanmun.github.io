// File: src/components/museum/desk.ts
// Purpose: The lobby's front desk: who built the museum. A concrete desk
// with a walnut top, and four pieces on it, one per link about Sean:
// marble statues for GitHub, LinkedIn and AI Philosophy (the last a bust
// of Sean), and an ancient scroll for the résumé. Each can be clicked; the
// stop's caption carries the same four as buttons, which is what phones use.

import * as THREE from 'three';
import { DESK, type AboutId } from './layout';

interface DeskKit {
  scene: THREE.Scene;
  track: <T extends { dispose(): void }>(x: T) => T;
  clickable: THREE.Object3D[];
  concrete: THREE.Texture | null; // the lobby walls' concrete, for the desk's body
  load: (src: string, onLoad: (root: THREE.Object3D) => void) => void; // a GLB, made ready like the museum's other models
  wallZ: number; // the face of the wall behind the desk
  sign: THREE.Material; // lettering for the wall behind
  signAspect: number;
}

export function buildDesk(k: DeskKit) {
  const { scene, track } = k;
  const desk = new THREE.Group();
  desk.position.set(DESK.x, 0, DESK.z);
  scene.add(desk);

  const mat = (p: THREE.MeshStandardMaterialParameters) => track(new THREE.MeshStandardMaterial({ roughness: 0.6, ...p }));
  const box = (size: [number, number, number], pos: [number, number, number], material: THREE.Material | THREE.Material[], parent: THREE.Object3D = desk) => {
    const m = new THREE.Mesh(track(new THREE.BoxGeometry(...size)), material);
    m.position.set(...pos);
    m.castShadow = m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  // ---------- the desk ----------

  const concreteMap = k.concrete ? track(k.concrete.clone()) : null;
  if (concreteMap) { concreteMap.repeat.set(1.3, 0.45); concreteMap.needsUpdate = true; }
  const concrete = mat({ map: concreteMap, color: '#c9c6c0', roughness: 0.92 });
  const walnut = mat({ color: '#4a3323', roughness: 0.45 });
  const brass = mat({ color: '#c79a3e', metalness: 1, roughness: 0.32 });
  const TOP = DESK.h;
  box([DESK.w, TOP - 0.06, DESK.d], [0, (TOP - 0.06) / 2, 0], concrete);
  box([DESK.w + 0.1, 0.06, DESK.d + 0.1], [0, TOP - 0.03, 0], walnut);
  box([DESK.w - 0.5, 0.014, 0.006], [0, TOP - 0.2, DESK.d / 2 + 0.002], brass); // a brass line let into the front

  // A spot from the ceiling, like the one on the S: the desk sits in the
  // lobby's shaded corner (the bake lights the wall and floor from it too)
  const spot = new THREE.SpotLight('#fff3e0', 55, 13, 0.4, 0.85, 1.5);
  spot.position.set(DESK.x - 0.6, 6.5, DESK.z + 2.8);
  spot.target.position.set(DESK.x, 1.0, DESK.z - 0.3);
  scene.add(spot, spot.target);

  const sign = new THREE.Mesh(track(new THREE.PlaneGeometry(1.7, 1.7 / k.signAspect)), k.sign);
  sign.position.set(DESK.x, 2.7, k.wallZ + 0.02);
  scene.add(sign);

  // Each thing stands in its own group on the desk top; an unseen box
  // around it is what a click lands on, so small things are easy to hit
  const item = (id: AboutId, x: number, w = 0.56, z = 0) => {
    const g = new THREE.Group();
    g.position.set(x, TOP, z);
    desk.add(g);
    const hitBox = new THREE.Mesh(track(new THREE.BoxGeometry(w, 0.74, 0.5)), concrete);
    hitBox.position.set(x, TOP + 0.36, z);
    hitBox.visible = false; // (still raycast)
    hitBox.userData.about = id;
    desk.add(hitBox);
    k.clickable.push(hitBox);
    return g;
  };

  // ---------- the four pieces ----------
  // GitHub, LinkedIn and AI Philosophy are Sean's own designs, made into
  // models with Meshy: the Octocat in a ring and the LinkedIn plaque, each
  // on a carved pedestal, and a bust of Sean on a base cut with PHILOSOPHY.
  // The résumé is an ancient scroll on a marble stand (Meshy too). Each is
  // stood on the desk at the same height, whatever size its model came in.
  const HEIGHT = 0.6;
  const statue = (id: AboutId, x: number, src: string, turn = 0) => {
    const g = item(id, x, 0.56);
    k.load(src, (m) => {
      const size = new THREE.Box3().setFromObject(m);
      const s = HEIGHT / (size.max.y - size.min.y);
      m.scale.setScalar(s);
      m.position.set(-((size.max.x + size.min.x) / 2) * s, -size.min.y * s, -((size.max.z + size.min.z) / 2) * s);
      const turned = new THREE.Group();
      turned.rotation.y = turn;
      turned.add(m);
      g.add(turned);
    });
  };
  statue('github', -1.05, '/models/museum/statue-github.glb', 0.1);
  statue('linkedin', -0.35, '/models/museum/statue-linkedin.glb', 0.05);
  statue('resume', 0.35, '/models/museum/statue-resume.glb');
  statue('ai', 1.05, '/models/museum/statue-philosophy.glb', -0.06);
}
