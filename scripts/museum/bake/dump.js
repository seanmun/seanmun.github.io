// Exports one room's geometry from the running museum, for Blender to light.
//
//   node scripts/museum/bake/dump.js <museum url> <room index> <out.json>
//
// Opens the page with ?bake (which exposes the three.js scene), walks to the
// room so its dressing is built, then writes every solid mesh that touches
// the room as world-space triangles, with what Blender needs to light it:
// its colour (the material's, times its texture's average), whether it's
// part of the shell (floor, walls, ceiling: light-mapped), its bake name
// (meshes that get per-vertex baked light), and whether it glows or is
// see-through. Run with NODE_PATH pointing at a playwright-core install.
const { chromium } = require('playwright-core');
const fs = require('fs');
const [url, roomIndex = '0', out = 'room.json'] = process.argv.slice(2);

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME || undefined,
    args: ['--enable-gpu', '--use-angle=metal', '--ignore-gpu-blocklist'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  // never record a tool run as a visit
  await page.route('**/api/track', (r) => r.fulfill({ status: 200, body: '{}' }));
  await page.goto(url + (url.includes('?') ? '&' : '?') + 'bake', { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForFunction(() => !document.body.innerText.includes('Opening the museum'), null, { timeout: 90000 });
  const data = await page.evaluate(async (roomIndex) => {
    const bake = window.__museumBake;
    if (!bake) throw new Error('no scene: is ?bake supported by this build?');
    const scene = bake.scene;
    const bounds = bake.rooms[roomIndex];
    if (!bounds) throw new Error('no such room');
    const { x0, x1, z0, z1, h } = bounds;
    const M = 1.2; // reach a little past the walls, for the reveals and the neighbours' door frames
    const inRoom = (b) => b.max.x > x0 - M && b.min.x < x1 + M && b.max.z > z1 - M && b.min.z < z0 + M && b.max.y > -0.5 && b.min.y < h + 1;
    const avgOf = (tex) => {
      try {
        const img = tex?.image;
        if (!img || !(img.width > 0)) return null;
        const c = document.createElement('canvas'); c.width = c.height = 8;
        const g = c.getContext('2d', { willReadFrequently: true });
        g.drawImage(img, 0, 0, 8, 8);
        const d = g.getImageData(0, 0, 8, 8).data;
        let r = 0, gg = 0, b = 0;
        for (let i = 0; i < d.length; i += 4) { r += d[i]; gg += d[i + 1]; b += d[i + 2]; }
        const n = d.length / 4, lin = (v) => Math.pow(v / n / 255, 2.2);
        return [lin(r), lin(gg), lin(b)];
      } catch { return null; }
    };
    const meshes = [];
    scene.updateMatrixWorld(true);
    scene.traverse((o) => {
      if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || !o.visible) return;
      const g = o.geometry;
      if (!g?.attributes?.position) return;
      if (!g.boundingBox) g.computeBoundingBox();
      const b = g.boundingBox.clone().applyMatrix4(o.matrixWorld);
      if (!inRoom(b)) return;
      const size = [b.max.x - b.min.x, b.max.y - b.min.y, b.max.z - b.min.z];
      if (Math.max(...size) > 400) return; // sky, sea, terrain
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      const m = mats[mats.length > 4 ? 4 : 0];
      if (!m || m.isShaderMaterial || m.isSpriteMaterial) return;
      const basic = !!m.isMeshBasicMaterial;
      if (basic && (m.transparent || m.blending !== 1)) return; // beams, glares, glows
      const tint = avgOf(m.map);
      const col = m.color ? [m.color.r, m.color.g, m.color.b] : [0.8, 0.8, 0.8];
      const color = tint ? col.map((v, i) => v * tint[i]) : col;
      const pos = g.attributes.position, e = o.matrixWorld.elements;
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
        color, basic, opacity: m.transparent ? m.opacity : 1, twoSided: m.side === 2,
        emissive: basic ? 1 : 0, verts: pos.count, P, idx,
      });
    });
    return { room: bounds, wallT: bake.wallT, sun: bake.sun, meshes };
  }, +roomIndex);
  fs.writeFileSync(out, JSON.stringify(data));
  const tris = data.meshes.reduce((n, m) => n + m.idx.length / 3, 0);
  console.log(`room ${roomIndex}: ${data.meshes.length} meshes, ${tris} triangles, ${data.meshes.filter((m) => m.shell).length} shell, ${data.meshes.filter((m) => m.bake).map((m) => `${m.bake}:${m.verts}`).join(' ')}`);
  await browser.close();
})();
