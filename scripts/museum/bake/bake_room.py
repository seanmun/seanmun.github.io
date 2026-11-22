# Bakes a museum space's light in Blender (Cycles).
#
#   Blender -b -P scripts/museum/bake/bake_room.py -- ROOM.json OUT_DIR [SAMPLES] [preview]
#
# (bake.sh runs the whole thing: export, bake, compress, install.)
#
# ROOM.json comes from dump.js: the space's real geometry, the building's
# shell and the museum's own lamps, exported from the running museum. This
# lights it the way the museum's daylight would fall (the same sun
# direction, a sky, the lamps and spotlights) and writes, for a space NAME:
#
#   OUT_DIR/NAME-light.png   the light map for the shell (floor, ceiling and
#                            four walls in one atlas; see ATLAS below, which
#                            bake.ts mirrors). Light only, no surface colour.
#   OUT_DIR/NAME-verts.bin   one baked RGB per vertex for every named mesh
#                            (mouldings, fireplace...), in the engine's own
#                            vertex order
#   OUT_DIR/NAME-probe.png   what the room looks like from its middle, all
#                            round (equirectangular): what shiny surfaces
#                            reflect
#   OUT_DIR/NAME-bake.json   the manifest: value ranges, atlas size, the
#                            probe's position, and where each mesh's colours
#                            sit in the .bin
#
# rooms.json (beside this file) holds each space's light balance: the sun
# and sky strengths, a scale on the museum's lamps, the light map's size and
# the highlight shoulder.
#
# Values are stored as sqrt(light / RANGE) in 8 bits: more steps in the
# shadows, where banding would show, and room for a sun patch several times
# brighter than the walls.
#
# Coordinates: the museum is y-up (three.js); Blender is z-up. A museum point
# (x, y, z) is Blender (x, -z, y).

import bpy
import bmesh
import json
import math
import os
import sys
import numpy as np
from mathutils import Vector

args = sys.argv[sys.argv.index('--') + 1:]
src, out_dir = args[0], args[1]
SAMPLES = int(args[2]) if len(args) > 2 else 1024
PREVIEW = len(args) > 3 and args[3] == 'preview'
RANGE = 8.0

data = json.load(open(src))
name = data['name']
room, T, sun_dir = data['room'], data['wallT'], data['sun']
CFG = {'sun': 6.5, 'sky': 1.2, 'lights': 1.0, 'size': 1024, 'knee': 0.8, 'peak': 1.6, 'desaturate': 0.4}
CFG.update(json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'rooms.json'))).get(name, {}))
for key in list(CFG):  # e.g. SKY=3 on the command line, to try a value
    if key.upper() in os.environ and not isinstance(CFG[key], list):
        CFG[key] = float(os.environ[key.upper()])
SIZE = int(CFG['size'])
print('baking', name, CFG)
x0, x1, z0, z1, H = room['x0'], room['x1'], room['z0'], room['z1'], room['h']
zc = (z0 + z1) / 2
B = lambda x, y, z: Vector((x, -z, y))  # museum -> Blender

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = SAMPLES
scene.cycles.use_denoising = True
scene.cycles.max_bounces = 8
scene.cycles.diffuse_bounces = 6
try:
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'METAL'
    prefs.get_devices()
    for d in prefs.devices:
        d.use = True
    scene.cycles.device = 'GPU'
except Exception as e:  # CPU is fine, just slower
    print('GPU not used:', e)

# ---------- the atlas: where each shell surface sits in the light map ----------
# Rectangles are in a 1024 grid (scaled to SIZE), origin bottom-left. Each maps
# two world axes onto itself, a little past the room so slab faces that run
# under the walls stay inside their own rectangle. bake.ts has the same table.
PAD = 3
ATLAS = {
    'floor': (0, 0, 512, 512),
    'ceil': (512, 0, 256, 256),
    'left': (0, 512, 512, 216),    # the wall at x0, facing +x
    'right': (512, 512, 512, 216),  # the wall at x1, facing -x
    'back': (0, 728, 512, 216),    # the wall at z1, facing +z
    'front': (512, 728, 512, 216),  # the wall at z0, facing -z
}
XR = (x0 - T, x1 + T)
ZR = (z1 - T, z0 + T)
YR = (0.0, H)


def atlas_uv(surface, a, b, ra, rb):
    rx, ry, rw, rh = ATLAS[surface]
    ta = (a - ra[0]) / (ra[1] - ra[0])
    tb = (b - rb[0]) / (rb[1] - rb[0])
    return ((rx + PAD + ta * (rw - 2 * PAD)) / 1024, (ry + PAD + tb * (rh - 2 * PAD)) / 1024)


def surface_of(center, normal):
    """Which shell surface a face lies on (museum coordinates), or None."""
    x, y, z = center
    nx, ny, nz = normal
    inside = x0 - T - 0.01 < x < x1 + T + 0.01 and z1 - T - 0.01 < z < z0 + T + 0.01 and -0.01 < y < H + 0.01
    if not inside:
        return None
    e = 2e-3
    if ny > 0.9 and abs(y) < e:
        return 'floor'
    if ny < -0.9 and abs(y - H) < e:
        return 'ceil'
    if nx > 0.9 and abs(x - x0) < e:
        return 'left'
    if nx < -0.9 and abs(x - x1) < e:
        return 'right'
    if nz > 0.9 and abs(z - (z1 + T / 2)) < e:
        return 'back'
    if nz < -0.9 and abs(z - (z0 - T / 2)) < e:
        return 'front'
    return None


def uv_for(surface, p):
    x, y, z = p
    if surface in ('floor', 'ceil'):
        return atlas_uv(surface, x, z, XR, ZR)
    if surface in ('left', 'right'):
        return atlas_uv(surface, z, y, ZR, YR)
    return atlas_uv(surface, x, y, XR, YR)


# ---------- materials ----------
def material(m):
    mat = bpy.data.materials.new('m')
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes['Principled BSDF']
    r, g, b = m['color']
    if m['emissive']:
        # screens and candle flames: a little glow of their own
        em = nt.nodes.new('ShaderNodeEmission')
        em.inputs['Color'].default_value = (r, g, b, 1)
        em.inputs['Strength'].default_value = 1.0
        nt.links.new(em.outputs['Emission'], nt.nodes['Material Output'].inputs['Surface'])
        return mat
    # (pulled toward grey: a strongly coloured floor would otherwise tint
    # every wall with its bounce more than reads as natural on screen)
    lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
    r, g, b = (c + (lum - c) * CFG['desaturate'] for c in (r, g, b))
    bsdf.inputs['Base Color'].default_value = (r, g, b, 1)
    bsdf.inputs['Roughness'].default_value = 0.8
    if m.get('cutout'):
        # leaf cards: the museum cuts leaf shapes out of each card with a
        # texture. Here a noise does the same job, so the canopy lets
        # dapples of sun through instead of casting one solid shadow.
        noise = nt.nodes.new('ShaderNodeTexNoise')
        noise.inputs['Scale'].default_value = 9.0
        ramp = nt.nodes.new('ShaderNodeMath')
        ramp.operation = 'GREATER_THAN'
        ramp.inputs[1].default_value = 0.52
        nt.links.new(noise.outputs['Fac'], ramp.inputs[0])
        nt.links.new(ramp.outputs['Value'], bsdf.inputs['Alpha'])
    elif m['opacity'] < 1:
        bsdf.inputs['Alpha'].default_value = m['opacity']
    return mat


shell_objs, baked_objs = [], []
for i, m in enumerate(data['meshes']):
    if m['opacity'] < 0.35:
        continue  # window glass: lets the light through
    P = m['P']
    verts = [B(P[k], P[k + 1], P[k + 2]) for k in range(0, len(P), 3)]
    idx = m['idx']
    faces = [(idx[k], idx[k + 1], idx[k + 2]) for k in range(0, len(idx), 3)]
    me = bpy.data.meshes.new(m['bake'] or f'mesh{i}')
    me.from_pydata(verts, [], faces)
    me.validate(clean_customdata=False)
    me.update()
    ob = bpy.data.objects.new(me.name, me)
    scene.collection.objects.link(ob)
    me.materials.append(material(m))
    if m['shell']:
        shell_objs.append(ob)
    elif m['bake'] and m['bake'].startswith(name + '-') and not m['emissive']:
        if len(me.vertices) != m['verts']:
            print('WARNING vertex count changed for', m['bake'], len(me.vertices), m['verts'])
        baked_objs.append(ob)

# ---------- the shell: one object, with its light-map UVs ----------
for o in bpy.context.scene.objects:
    o.select_set(o in shell_objs)
bpy.context.view_layer.objects.active = shell_objs[0]
bpy.ops.object.join()
shell = bpy.context.active_object
shell.name = 'shell'
# The shell is the whole building's. Cut it along this space's bounds, so
# every face lies wholly inside the light map's rectangles or wholly outside
bm = bmesh.new()
bm.from_mesh(shell.data)
for co, no in ((B(x0 - T, 0, 0), (1, 0, 0)), (B(x1 + T, 0, 0), (1, 0, 0)), (B(0, 0, z1 - T), (0, 1, 0)), (B(0, 0, z0 + T), (0, 1, 0)), (B(0, H, 0), (0, 0, 1)), (B(0, 0, 0), (0, 0, 1))):
    bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], dist=1e-5, plane_co=co, plane_no=no)
bm.to_mesh(shell.data)
bm.free()
shell.data.update()
uv = shell.data.uv_layers.new(name='light')
mapped = 0
for poly in shell.data.polygons:
    c = poly.center
    centre = (c.x, c.z, -c.y)  # back to museum coordinates
    n = poly.normal
    normal = (n.x, n.z, -n.y)
    s = surface_of(centre, normal)
    for li in poly.loop_indices:
        if s is None:
            uv.data[li].uv = (1.0, 1.0)  # not light-mapped: collapsed, so never baked
        else:
            v = shell.data.vertices[shell.data.loops[li].vertex_index].co
            uv.data[li].uv = uv_for(s, (v.x, v.z, -v.y))
    mapped += s is not None
print(f'shell: {len(shell.data.polygons)} triangles, {mapped} light-mapped')

# ---------- light ----------
# The sun, from the museum's own direction
S = B(*sun_dir).normalized()
sun = bpy.data.lights.new('sun', 'SUN')
sun.energy = float(CFG['sun'])
sun.angle = math.radians(1.6)
sun.color = (1.0, 0.96, 0.9)
so = bpy.data.objects.new('sun', sun)
so.rotation_euler = (-S).to_track_quat('-Z', 'Y').to_euler()
scene.collection.objects.link(so)

# The sky: a soft blue dome
world = bpy.data.worlds.new('sky')
world.use_nodes = True
bg = world.node_tree.nodes['Background']
bg.inputs['Color'].default_value = (*CFG.get('skyColor', (0.82, 0.89, 1.0)), 1)
bg.inputs['Strength'].default_value = float(CFG['sky'])
scene.world = world

# The ground outside: a muted olive, so its bounce warms a ceiling without turning it green
bpy.ops.mesh.primitive_plane_add(size=1200, location=B(0, -0.35, -60))
lawn = bpy.context.active_object
lm = bpy.data.materials.new('lawn')
lm.use_nodes = True
lm.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.17, 0.2, 0.13, 1)
lawn.data.materials.append(lm)

# The museum's own lamps and spotlights. three.js lights are in candela; a
# Blender point light of P watts shades like one of P / (4 pi^2) candela.
for i, l in enumerate(data.get('lights', [])):
    kind = 'SPOT' if l['kind'] == 'spot' else 'POINT'
    ld = bpy.data.lights.new(f'light{i}', kind)
    ld.energy = l['intensity'] * 4 * math.pi ** 2 * float(CFG['lights'])
    ld.color = l['color']
    ld.shadow_soft_size = 0.12
    lob = bpy.data.objects.new(f'light{i}', ld)
    lob.location = B(*l['pos'])
    if kind == 'SPOT':
        ld.spot_size = min(math.pi, 2 * l['angle'])
        ld.spot_blend = l['penumbra']
        aim = B(*l['target']) - lob.location
        lob.rotation_euler = aim.to_track_quat('-Z', 'Y').to_euler()
    scene.collection.objects.link(lob)

os.makedirs(out_dir, exist_ok=True)

# ---------- a preview render, to judge the light by eye ----------
if PREVIEW:
    cam_d = bpy.data.cameras.new('cam')
    cam_d.lens = 18
    cam = bpy.data.objects.new('cam', cam_d)
    scene.collection.objects.link(cam)
    cam.location = B(x0 + 2.0, 1.75, z0 - 1.5)
    look = B(x1 - 2, 2.2, z1 + 3) - cam.location
    cam.rotation_euler = look.to_track_quat('-Z', 'Y').to_euler()
    scene.camera = cam
    scene.render.resolution_x, scene.render.resolution_y = 960, 600
    scene.view_settings.view_transform = 'Standard'
    scene.cycles.samples = 96
    scene.render.filepath = os.path.join(out_dir, f'{name}-preview.png')
    bpy.ops.render.render(write_still=True)
    print('preview written')
    sys.exit(0)

# ---------- bake the light map ----------
# Direct light (the sun patch, the sky and the chandelier, with their
# shadows) and bounced light are baked apart. Bounced light is smooth but
# noisy to compute, so it's blurred; direct light keeps its edges.
img = bpy.data.images.new('light', SIZE, SIZE, alpha=False, float_buffer=True)
img.colorspace_settings.name = 'Non-Color'
for mat in shell.data.materials:
    nt = mat.node_tree
    node = nt.nodes.new('ShaderNodeTexImage')
    node.image = img
    nt.nodes.active = node
shell.data.uv_layers.active = uv
scene.render.bake.margin = 0
scene.render.bake.use_pass_color = False
scene.render.bake.target = 'IMAGE_TEXTURES'


def bake_shell(direct, indirect):
    for o in bpy.context.scene.objects:
        o.select_set(False)
    shell.select_set(True)
    bpy.context.view_layer.objects.active = shell
    scene.render.bake.use_pass_direct = direct
    scene.render.bake.use_pass_indirect = indirect
    img.pixels.foreach_set(np.zeros(SIZE * SIZE * 4, dtype=np.float32))
    bpy.ops.object.bake(type='DIFFUSE')
    a = np.zeros(SIZE * SIZE * 4, dtype=np.float32)
    img.pixels.foreach_get(a)
    return a.reshape(SIZE, SIZE, 4)[:, :, :3].copy()


def gauss(a, sigma):
    """Separable Gaussian blur of an (h, w) or (h, w, c) array, edges clamped."""
    if sigma <= 0:
        return a
    rad = max(1, int(sigma * 3))
    k = np.exp(-0.5 * (np.arange(-rad, rad + 1) / sigma) ** 2)
    k /= k.sum()
    out = a.astype(np.float64)
    for axis in (0, 1):
        pad = [(0, 0)] * out.ndim
        pad[axis] = (rad, rad)
        p = np.pad(out, pad, mode='edge')
        acc = np.zeros_like(out)
        for i, w in enumerate(k):
            sl = [slice(None)] * out.ndim
            sl[axis] = slice(i, i + out.shape[axis])
            acc += w * p[tuple(sl)]
        out = acc
    return out


def smooth(a, valid, sigma):
    """Blur only among baked texels, and fill the unbaked ones (hidden behind
    a moulding or a frame) from their neighbours, so no dark fringe shows
    along the edge of whatever hides them."""
    w = gauss(valid.astype(np.float64), sigma)
    b = gauss(a * valid[:, :, None], sigma) / np.maximum(w, 1e-6)[:, :, None]
    return np.where((w > 1e-4)[:, :, None], b, a)


direct = bake_shell(True, False)
bounce = bake_shell(False, True)
px = np.zeros_like(direct)
k = SIZE / 1024
for surface, (rx, ry, rw, rh) in ATLAS.items():
    # one surface at a time, so nothing bleeds between neighbours in the atlas
    sl = (slice(int(ry * k), int((ry + rh) * k)), slice(int(rx * k), int((rx + rw) * k)))
    d, i = direct[sl], bounce[sl]
    valid = (d + i).sum(axis=2) > 1e-7
    filled_d = np.where(valid[:, :, None], d, smooth(d, valid, 2.5 * k))
    px[sl] = smooth(filled_d, np.ones_like(valid), 1.0 * k) + smooth(i, valid, 7.0 * k)
    lit = (d + i)[valid]
    print(f'{surface}: median light {float(np.median(lit.mean(axis=1))):.3f} (direct {float(np.median(d[valid].mean(axis=1))):.3f}, bounce {float(np.median(i[valid].mean(axis=1))):.3f}), max {float(lit.max()):.2f}')


KNEE, PEAK = float(CFG['knee']), float(CFG['peak'])


def encode(a):
    # A shoulder on the brightest light: full sun on the floor is 20-30x the
    # walls, which on a screen just bleaches the surface. Above KNEE, light
    # eases toward PEAK, so a sun patch stays the brightest thing in the room
    # and still shows the wood it falls on.
    a = np.where(a > KNEE, KNEE + (PEAK - KNEE) * (1 - np.exp(-(a - KNEE) / (PEAK - KNEE))), a)
    return np.sqrt(np.clip(a / RANGE, 0, 1))


enc = np.ones((SIZE, SIZE, 4), dtype=np.float32)
enc[:, :, :3] = encode(px)
out = bpy.data.images.new('out', SIZE, SIZE, alpha=False)
out.colorspace_settings.name = 'Non-Color'
out.pixels.foreach_set(enc.ravel())
out.filepath_raw = os.path.join(out_dir, f'{name}-light.png')
out.file_format = 'PNG'
out.save()

# ---------- bake the named meshes, one colour per vertex ----------
# Blender samples a vertex's light right at the vertex, which for a moulding
# is in the crease where it meets the wall: nearly black. So each mesh is
# baked on a copy whose vertices sit a little in from their face's edges and
# a hair off the surface (same vertices, same order).
scene.render.bake.target = 'VERTEX_COLORS'
scene.render.bake.use_pass_direct = True
scene.render.bake.use_pass_indirect = True
scene.cycles.samples = max(SAMPLES, 512)
manifest = {'range': RANGE, 'size': SIZE, 'room': room, 'meshes': {}}
blob = bytearray()
for ob in baked_objs:
    src_me = ob.data
    me = src_me.copy()
    n = len(me.vertices)
    co = np.zeros(n * 3, dtype=np.float64)
    me.vertices.foreach_get('co', co)
    co = co.reshape(n, 3)
    toward = np.zeros((n, 3))
    normal = np.zeros((n, 3))
    uses = np.zeros(n)
    for poly in me.polygons:
        c = np.array(poly.center)
        nn = np.array(poly.normal)
        for v in poly.vertices:
            toward[v] += c
            normal[v] += nn
            uses[v] += 1
    uses = np.maximum(uses, 1)[:, None]
    toward /= uses
    ln = np.linalg.norm(normal, axis=1)[:, None]
    normal = normal / np.maximum(ln, 1e-9)
    step = toward - co
    # In along each axis on its own (a cornice face is 10 cm tall and metres
    # long): 30% of the way to the face's middle, at most 1.5 cm. Out by 3 mm.
    co2 = co + step * np.minimum(0.3, 0.015 / np.maximum(np.abs(step), 1e-9)) + normal * 0.003
    me.vertices.foreach_set('co', co2.ravel())
    me.update()
    proxy = bpy.data.objects.new(ob.name + '-probe', me)
    scene.collection.objects.link(proxy)
    attr = me.color_attributes.new('bake', 'FLOAT_COLOR', 'CORNER')
    me.color_attributes.active_color = attr
    me.color_attributes.render_color_index = me.color_attributes.find('bake')
    for o in bpy.context.scene.objects:
        o.select_set(False)
    proxy.select_set(True)
    bpy.context.view_layer.objects.active = proxy
    bpy.ops.object.bake(type='DIFFUSE')
    acc = np.zeros((n, 3), dtype=np.float64)
    cnt = np.zeros(n, dtype=np.float64)
    cols = np.zeros(len(me.loops) * 4, dtype=np.float32)
    me.color_attributes['bake'].data.foreach_get('color', cols)
    cols = cols.reshape(-1, 4)[:, :3]
    vi = np.zeros(len(me.loops), dtype=np.int32)
    me.loops.foreach_get('vertex_index', vi)
    np.add.at(acc, vi, cols)
    np.add.at(cnt, vi, 1)
    per = (acc / np.maximum(cnt, 1)[:, None]).astype(np.float32)
    # A vertex buried in a neighbour (where two cornices cross in a corner)
    # bakes black; give it the light of the lit vertices on its own face
    tri = np.zeros(len(me.polygons) * 3, dtype=np.int32)
    me.polygons.foreach_get('vertices', tri)
    tri = tri.reshape(-1, 3)
    for _ in range(2):
        v = per[tri]                                  # (faces, 3, 3)
        dark = v.sum(axis=2) < 1e-4                    # (faces, 3)
        some = dark.any(axis=1) & ~dark.all(axis=1)
        lit_mean = (v * ~dark[:, :, None]).sum(axis=1) / np.maximum((~dark).sum(axis=1), 1)[:, None]
        for f in np.nonzero(some)[0]:
            for c in range(3):
                if dark[f, c]:
                    per[tri[f, c]] = lit_mean[f]
    manifest['meshes'][ob.name] = [len(blob), n]
    blob += (encode(per) * 255 + 0.5).astype(np.uint8).tobytes()
    print(f'{ob.name}: {n} vertices, median light {float(np.median(per.mean(axis=1))):.3f}')
    bpy.data.objects.remove(proxy)
open(os.path.join(out_dir, f'{name}-verts.bin'), 'wb').write(blob)

# ---------- the reflection probe ----------
# Six square views from the middle of the room, each with a camera whose
# axes are read back from Blender, then resampled into one equirectangular
# image in three.js's own convention (u from atan2(z, x), v from asin(y), in
# museum coordinates). Doing the resampling here means no guessing at either
# program's cube-map or panorama orientation.
PROBE_RANGE = 8.0
FACE, PW, PH = 192, 512, 256
probe_at = (0.5 * (x0 + x1), min(1.6, H / 2), zc)
cam_d = bpy.data.cameras.new('probe')
cam_d.sensor_fit = 'HORIZONTAL'
cam_d.angle = math.radians(90)
cam_d.clip_start = 0.05
cam = bpy.data.objects.new('probe', cam_d)
scene.collection.objects.link(cam)
cam.location = B(*probe_at)
scene.camera = cam
scene.render.resolution_x = scene.render.resolution_y = FACE
scene.render.resolution_percentage = 100
scene.cycles.samples = 96
scene.render.image_settings.file_format = 'OPEN_EXR'
scene.view_settings.view_transform = 'Raw'
faces = []
for fi, d in enumerate(((1, 0, 0), (-1, 0, 0), (0, 1, 0), (0, -1, 0), (0, 0, 1), (0, 0, -1))):
    cam.rotation_euler = Vector(d).to_track_quat('-Z', 'Y').to_euler()
    bpy.context.view_layer.update()
    mw = cam.matrix_world
    right, up, fwd = Vector(mw.col[0][:3]), Vector(mw.col[1][:3]), -Vector(mw.col[2][:3])
    path = os.path.join(out_dir, f'_probe{fi}.exr')
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    im = bpy.data.images.load(path)
    a = np.zeros(FACE * FACE * 4, dtype=np.float32)
    im.pixels.foreach_get(a)
    faces.append((np.array(right), np.array(up), np.array(fwd), a.reshape(FACE, FACE, 4)[:, :, :3].copy()))
    bpy.data.images.remove(im)
    os.remove(path)
u = (np.arange(PW) + 0.5) / PW
v = (np.arange(PH) + 0.5) / PH
lon, lat = np.meshgrid((u - 0.5) * 2 * np.pi, (v - 0.5) * np.pi)
# museum direction, then Blender's
dm = np.stack([np.cos(lat) * np.cos(lon), np.sin(lat), np.cos(lat) * np.sin(lon)], axis=-1)
db = np.stack([dm[..., 0], -dm[..., 2], dm[..., 1]], axis=-1)
pano = np.zeros((PH, PW, 3), dtype=np.float32)
best = np.full((PH, PW), -1.0)
for right, up, fwd, pix in faces:
    f = db @ fwd
    ok = f > best  # the face this direction points most squarely into
    best = np.where(ok, f, best)
    fx = (db @ right) / np.maximum(f, 1e-6)
    fy = (db @ up) / np.maximum(f, 1e-6)
    ix = np.clip(((fx + 1) / 2 * FACE).astype(int), 0, FACE - 1)
    iy = np.clip(((fy + 1) / 2 * FACE).astype(int), 0, FACE - 1)
    pano = np.where(ok[..., None], pix[iy, ix], pano)
penc = np.ones((PH, PW, 4), dtype=np.float32)
penc[:, :, :3] = np.sqrt(np.clip(pano / PROBE_RANGE, 0, 1))
pimg = bpy.data.images.new('probe', PW, PH, alpha=False)
pimg.colorspace_settings.name = 'Non-Color'
pimg.pixels.foreach_set(penc.ravel())
pimg.filepath_raw = os.path.join(out_dir, f'{name}-probe.png')
pimg.file_format = 'PNG'
pimg.save()
manifest['probe'] = {'at': probe_at, 'range': PROBE_RANGE}
print('probe: median', float(np.median(pano)), 'max', float(pano.max()))

json.dump(manifest, open(os.path.join(out_dir, f'{name}-bake.json'), 'w'))
print('baked', name)
