// Exports one space's geometry and lights from the running museum, for
// Blender to light.
//
//   node scripts/museum/bake/dump.js <museum url> <space> <out.json> [stops to walk]
//
// <space> is lobby, gallery, salon or a room's slug. Opens the page with
// ?bake (which exposes the three.js scene) and ?nobake (so nothing is
// already baked), walks the first stops so the models there have loaded,
// then writes:
// - every solid mesh that touches the space, as world-space triangles, with
//   what Blender needs to light it: its colour (the material's, times its
//   texture's average), its bake name (meshes that get per-vertex baked
//   light), and whether it glows, is see-through or is a cut-out (leaves)
// - the whole building's shell (floors, walls, ceilings of every room), so
//   light only gets in where the building really has an opening
// - the museum's own lamps and spotlights near the space
// Run with NODE_PATH pointing at a playwright-core install, and CHROME at a
// Chrome binary if playwright's own isn't installed.
const { chromium } = require('playwright-core');
const fs = require('fs');
const [url, space = 'salon', out = 'room.json', walk = '12'] = process.argv.slice(2);

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME || undefined,
    args: ['--enable-gpu', '--use-angle=metal', '--ignore-gpu-blocklist'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  // never record a tool run as a visit
  await page.route('**/api/track', (r) => r.fulfill({ status: 200, body: '{}' }));
  await page.goto(url + (url.includes('?') ? '&' : '?') + 'bake&nobake', { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForFunction(() => !document.body.innerText.includes('Opening the museum'), null, { timeout: 90000 });
  for (let i = 1; i <= +walk; i++) {
    await page.evaluate((i) => scrollTo(0, i * innerHeight), i);
    await page.waitForTimeout(1200);
  }
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2500);
  const data = await page.evaluate((space) => {
    const bake = window.__museumBake;
    if (!bake) throw new Error('no scene: is ?bake supported by this build?');
    const scene = bake.scene;
    const bounds = bake.spaces[space];
    if (!bounds) throw new Error(`no such space: ${space} (have ${Object.keys(bake.spaces).join(', ')})`);
    const { x0, x1, z0, z1, h } = bounds;
    const M = 1.2; // reach a little past the walls, for the reveals and the neighbours' door frames
    const inRoom = (b) => b.max.x > x0 - M && b.min.x < x1 + M && b.max.z > z1 - M && b.min.z < z0 + M && b.max.y > -0.5 && b.min.y < h + 14; // (trees stand over the gallery's glass roof)
    const avgOf = (tex) => {
      try {
        const img = tex?.image;
        if (!img || !(img.width > 0)) return null;
        const c = document.createElement('canvas'); c.width = c.height = 8;
        const g = c.getContext('2d', { willReadFrequently: true });
        g.drawImage(img, 0, 0, 8, 8);
        const d = g.getImageData(0, 0, 8, 8).data;
        let r = 0, gg = 0, b = 0, n = 0;
        for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 128) continue; r += d[i]; gg += d[i + 1]; b += d[i + 2]; n++; }
        if (!n) return null;
        const lin = (v) => Math.pow(v / n / 255, 2.2);
        return [lin(r), lin(gg), lin(b)];
      } catch { return null; }
    };
    const meshes = [];
    scene.updateMatrixWorld(true);
    const add = (o, world) => {
      const g = o.geometry;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      const m = mats[mats.length > 4 ? 4 : 0];
      if (!m || m.isShaderMaterial || m.isSpriteMaterial) return;
      const basic = !!m.isMeshBasicMaterial;
      const cutout = m.alphaTest > 0;
      if (basic && !cutout && (m.transparent || m.blending !== 1)) return; // beams, glares, glows
      const tint = avgOf(m.map);
      const col = m.color ? [m.color.r, m.color.g, m.color.b] : [0.8, 0.8, 0.8];
      const color = tint ? col.map((v, i) => v * tint[i]) : col;
      const pos = g.attributes.position, e = world.elements;
      const P = new Array(pos.count * 3);
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        P[i * 3] = +(e[0] * x + e[4] * y + e[8] * z + e[12]).toFixed(4);
        P[i * 3 + 1] = +(e[1] * x + e[5] * y + e[9] * z + e[13]).toFixed(4);
        P[i * 3 + 2] = +(e[2] * x + e[6] * y + e[10] * z + e[14]).toFixed(4);
      }
      const idx = g.index ? Array.from(g.index.array) : Array.from({ length: pos.count }, (_, i) => i);
      meshes.push({
        shell: !!o.userData.shell, bake: o.userData.bake ?? null,
        color, basic, opacity: cutout ? 0.5 : m.transparent ? m.opacity : 1, twoSided: m.side === 2,
        cutout, emissive: basic && !cutout ? 1 : 0, verts: pos.count, P, idx,
      });
    };
    scene.traverse((o) => {
      if (!o.isMesh || o.isSkinnedMesh || !o.visible) return;
      const g = o.geometry;
      if (!g?.attributes?.position) return;
      if (!g.boundingBox) g.computeBoundingBox();
      if (o.isInstancedMesh) {
        // (a tree's leaves): each instance is its own copy
        const m4 = o.matrixWorld.clone(), one = m4.clone();
        for (let i = 0; i < o.count; i++) {
          o.getMatrixAt(i, one);
          one.premultiply(o.matrixWorld);
          if (inRoom(g.boundingBox.clone().applyMatrix4(one))) add(o, one);
        }
        return;
      }
      const b = g.boundingBox.clone().applyMatrix4(o.matrixWorld);
      const size = [b.max.x - b.min.x, b.max.y - b.min.y, b.max.z - b.min.z];
      if (Math.max(...size) > 400) return; // sky, sea, terrain
      if (!o.userData.shell && !inRoom(b)) return;
      add(o, o.matrixWorld);
    });
    // Lamps and spotlights within reach of the space
    const lights = [];
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, reach = Math.hypot(x1 - x0, z0 - z1) / 2 + 30;
    scene.traverse((o) => {
      if (!(o.isPointLight || o.isSpotLight) || !o.visible || !(o.intensity > 0)) return;
      const p = o.getWorldPosition(o.position.clone());
      if (Math.hypot(p.x - cx, p.z - cz) > reach) return;
      const l = { kind: o.isSpotLight ? 'spot' : 'point', pos: p.toArray(), color: [o.color.r, o.color.g, o.color.b], intensity: o.intensity, distance: o.distance };
      if (o.isSpotLight) Object.assign(l, { target: o.target.getWorldPosition(o.position.clone()).toArray(), angle: o.angle, penumbra: o.penumbra });
      lights.push(l);
    });
    return { name: space, room: bounds, wallT: bake.wallT, sun: bake.sun, meshes, lights };
  }, space);
  fs.writeFileSync(out, JSON.stringify(data));
  const tris = data.meshes.reduce((n, m) => n + m.idx.length / 3, 0);
  console.log(`${space}: ${data.meshes.length} meshes, ${tris} triangles, ${data.meshes.filter((m) => m.shell).length} shell slabs, ${data.lights.length} lights, ${data.meshes.filter((m) => m.bake).length} named meshes`);
  await browser.close();
})();
