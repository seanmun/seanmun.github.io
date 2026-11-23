// File: src/components/museum/desk.ts
// Purpose: The lobby's front desk: who built the museum. A concrete desk
// with a walnut top, and five things on it, one per link about Sean (the
// same five as the home page's hero): GitHub's and LinkedIn's marks carved
// in marble on short columns, a résumé on a clipboard, a book for his AI
// philosophy, and a card-catalogue of skills. Each can be clicked; the
// stop's caption carries the same five as buttons, which is what phones use.
// Nothing here is personal beyond what the home page already shows: the
// résumé's text is drawn as rules, not words.

import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { DESK, type AboutId } from './layout';

// The two marks' outlines (the standard 24-unit icon paths)
const GITHUB_MARK = 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12';
const LINKEDIN_MARK = 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z';

interface DeskKit {
  scene: THREE.Scene;
  track: <T extends { dispose(): void }>(x: T) => T;
  clickable: THREE.Object3D[];
  concrete: THREE.Texture | null; // the lobby walls' concrete, for the desk's body
  marble: THREE.Texture | null; // the S's plinth's marble, for the carved marks
  wallZ: number; // the face of the wall behind the desk
  sign: THREE.Material; // lettering for the wall behind
  signAspect: number;
}

const SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';

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
  // A drawn face: canvas in, texture out
  const face = (w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void) => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d')!, w, h);
    const t = track(new THREE.CanvasTexture(c));
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  };
  // A box whose front (+z) carries a drawn face
  const fronted = (side: THREE.Material, front: THREE.Material) => [side, side, side, side, front, side];
  const spaced = (g: CanvasRenderingContext2D, text: string, x: number, y: number, gap: number) => {
    const chars = [...text];
    const total = chars.reduce((a, ch) => a + g.measureText(ch).width + gap, -gap);
    let at = x - total / 2;
    g.textAlign = 'left';
    for (const ch of chars) { g.fillText(ch, at, y); at += g.measureText(ch).width + gap; }
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

  // ---------- GitHub and LinkedIn: their marks, carved in marble ----------
  // Each mark stands on a short column, like a museum's antiquities: the
  // logo's own outline, cut deep into a slab of white marble (a darker
  // slab behind makes the cut read as carved shadow)
  {
    const veined = (tint: string, repeat: number) => {
      const map = k.marble ? track(k.marble.clone()) : null;
      if (map) { map.wrapS = map.wrapT = THREE.RepeatWrapping; map.repeat.set(repeat, repeat); map.needsUpdate = true; }
      return mat({ map, color: tint, roughness: 0.42 });
    };
    const stone = veined('#ffffff', 1), carved = veined('#ffffff', 1 / 24), recess = veined('#8f8a82', 1);
    const SIZE = 0.36, S = SIZE / 24; // the marks are drawn on a 24-unit square
    const flutes = track(new THREE.CylinderGeometry(0.105, 0.115, 0.13, 18, 1));
    const sculpture = (id: AboutId, x: number, d: string, round: boolean) => {
      const g = item(id, x, 0.5);
      box([0.3, 0.03, 0.3], [0, 0.015, 0], stone, g);
      const drum = new THREE.Mesh(flutes, mat({ map: stone.map, color: '#f4f1ea', roughness: 0.5, flatShading: true }));
      drum.position.y = 0.095;
      drum.castShadow = drum.receiveShadow = true;
      g.add(drum);
      box([0.27, 0.03, 0.27], [0, 0.175, 0], stone, g);
      const shapes = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`).paths.flatMap((path) => SVGLoader.createShapes(path));
      const geo = track(new THREE.ExtrudeGeometry(shapes, { depth: 3.4, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.3, bevelOffset: -0.3, bevelSegments: 3, curveSegments: 14 }));
      geo.translate(-12, -12, -1.7);
      geo.rotateX(Math.PI); // SVG's y runs down
      geo.scale(S, S, S);
      const mark = new THREE.Mesh(geo, carved);
      mark.position.set(0, 0.19 + SIZE / 2, 0);
      mark.castShadow = mark.receiveShadow = true;
      g.add(mark);
      const back = round
        ? new THREE.Mesh(track(new THREE.CylinderGeometry(SIZE * 0.485, SIZE * 0.485, 0.02, 48)), recess)
        : new THREE.Mesh(track(new THREE.BoxGeometry(SIZE * 0.96, 0.02, SIZE * 0.96)), recess);
      back.rotation.x = Math.PI / 2;
      back.position.set(0, 0.19 + SIZE / 2, -0.02);
      g.add(back);
    };
    sculpture('github', -1.15, GITHUB_MARK, true);
    sculpture('linkedin', -0.62, LINKEDIN_MARK, false);
  }

  // ---------- Resume: a page on a clipboard ----------
  {
    const g = item('resume', -0.05);
    box([0.52, 0.04, 0.14], [0, 0.02, 0.02], walnut, g);
    const stand = new THREE.Group();
    stand.position.set(0, 0.03, 0);
    stand.rotation.x = -0.26;
    g.add(stand);
    const page = mat({
      roughness: 0.85,
      map: face(480, 640, (c, w, h) => {
        c.fillStyle = '#fdfcf9'; c.fillRect(0, 0, w, h);
        c.fillStyle = '#1d1c1a'; c.textBaseline = 'middle';
        c.font = `700 58px ${SANS}`; c.textAlign = 'left'; c.fillText('Sean Munley', 44, 96);
        c.font = `500 26px ${SANS}`; c.fillStyle = '#6b675f'; spaced(c, 'RÉSUMÉ', 112, 146, 8);
        c.fillStyle = '#1d1c1a'; c.fillRect(44, 178, w - 88, 4);
        // the text itself as rules: a heading bar, then lines
        let y = 220;
        for (const lines of [3, 4, 3, 2]) {
          c.fillStyle = '#3d3a35'; c.fillRect(44, y, 150, 12); y += 32;
          c.fillStyle = '#c4c0b8';
          for (let i = 0; i < lines; i++) { c.fillRect(44, y, (w - 88) * (i === lines - 1 ? 0.62 : 1 - 0.07 * (i % 2)), 7); y += 21; }
          y += 16;
        }
      }),
    });
    box([0.46, 0.62, 0.012], [0, 0.31, 0], mat({ color: '#6b4a2f', roughness: 0.7 }), stand);
    const sheet = new THREE.Mesh(track(new THREE.PlaneGeometry(0.4, 0.533)), page);
    sheet.position.set(0, 0.29, 0.008);
    sheet.receiveShadow = true;
    stand.add(sheet);
    box([0.17, 0.05, 0.03], [0, 0.585, 0.014], brass, stand);
  }

  // ---------- AI Philosophy: a clothbound book, cover out ----------
  {
    const g = item('ai', 0.44, 0.4);
    box([0.36, 0.035, 0.14], [0, 0.0175, 0.01], walnut, g);
    const cloth = mat({ color: '#16233a', roughness: 0.85 });
    const cover = mat({
      roughness: 0.8,
      map: face(384, 544, (c, w, h) => {
        c.fillStyle = '#16233a'; c.fillRect(0, 0, w, h);
        const gold = '#d9b45e';
        c.strokeStyle = gold; c.lineWidth = 3; c.strokeRect(22, 22, w - 44, h - 44);
        c.fillStyle = gold; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.font = `700 104px ${SANS}`; c.fillText('AI', w / 2, 150);
        c.fillRect(w / 2 - 50, 222, 100, 3);
        c.font = `500 34px ${SANS}`; spaced(c, 'PHILOSOPHY', w / 2, 274, 6);
        c.font = `400 22px ${SANS}`; c.fillStyle = 'rgba(217,180,94,0.8)';
        c.fillText('Embracing AI', w / 2, 366); c.fillText('in development', w / 2, 396);
        c.font = `500 22px ${SANS}`; c.fillStyle = gold; spaced(c, 'SEAN MUNLEY', w / 2, 482, 4);
      }),
    });
    const book = box([0.3, 0.425, 0.05], [0, 0.235, -0.03], fronted(cloth, cover), g);
    book.rotation.x = -0.22;
    // the pages, seen at the top and the fore edge
    const pages = box([0.285, 0.41, 0.036], [0.006, 0.235, -0.03], mat({ color: '#efe9da', roughness: 0.9 }), g);
    pages.rotation.x = -0.22;
    pages.scale.set(1.03, 1.03, 0.7);
  }

  // ---------- Skills: a card catalogue, a drawer per kind ----------
  {
    const g = item('skills', 1.08, 0.7);
    const W = 0.68, H = 0.46;
    const front = mat({
      roughness: 0.5,
      map: face(680, 460, (c, w, h) => {
        c.fillStyle = '#4a3323'; c.fillRect(0, 0, w, h);
        c.fillStyle = '#e9d9ad'; c.textBaseline = 'middle'; c.font = `600 30px ${SANS}`;
        spaced(c, 'SKILLS', w / 2, 34, 12);
        const names = ['AI / LLM', 'DEV', 'PLATFORMS', 'CRM', 'AI TOOLS', 'PM'];
        const cw = (w - 40) / 3, ch = (h - 84) / 2;
        names.forEach((name, i) => {
          const x = 20 + (i % 3) * cw, y = 64 + Math.floor(i / 3) * ch;
          c.fillStyle = '#2f2016'; c.fillRect(x + 5, y + 5, cw - 10, ch - 10);
          const wood = c.createLinearGradient(0, y, 0, y + ch);
          wood.addColorStop(0, '#5c4130'); wood.addColorStop(1, '#49321f');
          c.fillStyle = wood; c.fillRect(x + 9, y + 9, cw - 18, ch - 18);
          // brass label holder, a cream label in it, and a pull below
          c.fillStyle = '#c79a3e'; c.fillRect(x + 28, y + 34, cw - 56, 58);
          c.fillStyle = '#f3ecd9'; c.fillRect(x + 34, y + 40, cw - 68, 46);
          c.fillStyle = '#2b2118'; c.font = `700 25px ${SANS}`; c.textAlign = 'center'; c.fillText(name, x + cw / 2, y + 64);
          c.fillStyle = '#c79a3e'; c.beginPath(); c.arc(x + cw / 2, y + 128, 13, 0, 7); c.fill();
          c.fillStyle = '#8f6c26'; c.beginPath(); c.arc(x + cw / 2, y + 130, 7, 0, 7); c.fill();
        });
      }),
    });
    box([W, H, 0.3], [0, H / 2, -0.04], fronted(walnut, front), g);
  }
}
