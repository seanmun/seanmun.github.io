# Builds the museum's basketball sculptures, recreated from photos in the
# mood gallery, and exports each one as a .glb for the /museum page.
#
#   /Applications/Blender.app/Contents/MacOS/Blender -b -P scripts/museum/build_art.py -- public/models/museum
#
# Conventions: meters; each piece faces Blender -Y (glTF +Z, toward the
# visitor); wall pieces have their back on y=0 and their bottom on z=0;
# floor pieces sit centered on the origin.

import bpy
import bmesh
import math
import os
import random
import sys
from mathutils import Vector

OUT = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else 'public/models/museum'
os.makedirs(OUT, exist_ok=True)


# ---------- helpers ----------

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


MATS = {}


def mat(name, color, rough=0.6, metal=0.0):
    if name in MATS:
        return MATS[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = (*srgb(color), 1)
    bsdf.inputs['Roughness'].default_value = rough
    bsdf.inputs['Metallic'].default_value = metal
    MATS[name] = m
    return m


def srgb(hexstr):
    h = hexstr.lstrip('#')
    out = []
    for i in (0, 2, 4):
        c = int(h[i:i + 2], 16) / 255
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return out


def assign(obj, m):
    obj.data.materials.clear()
    obj.data.materials.append(m)
    return obj


def box(size, loc, m, bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.active_object
    o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    if bevel:
        mod = o.modifiers.new('bevel', 'BEVEL')
        mod.width = bevel
        mod.segments = 2
    return assign(o, m)


def cyl(r, depth, loc, m, verts=24, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=depth, location=loc, vertices=verts, rotation=rot)
    return assign(bpy.context.active_object, m)


def sphere(r, loc, m, seg=32, rings=16):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=seg, ring_count=rings)
    o = bpy.context.active_object
    bpy.ops.object.shade_smooth()
    return assign(o, m)


def torus(major, minor, loc, m, rot=(0, 0, 0), seg=48):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor, location=loc, rotation=rot,
                                     major_segments=seg, minor_segments=8)
    o = bpy.context.active_object
    bpy.ops.object.shade_smooth()
    return assign(o, m)


def wire_net(r_top, r_bot, depth, top, m, segs=14, rings=6, thick=0.006, sway=0.0):
    """A basketball net: a tapered tube of quads turned into strands."""
    me = bpy.data.meshes.new('net')
    bm = bmesh.new()
    grid = []
    for j in range(rings + 1):
        t = j / rings
        r = r_top + (r_bot - r_top) * t
        z = top[2] - depth * t
        ring = []
        for i in range(segs):
            a = 2 * math.pi * (i + 0.5 * (j % 2)) / segs
            ring.append(bm.verts.new((top[0] + r * math.cos(a) + sway * t * t, top[1] + r * math.sin(a), z)))
        grid.append(ring)
    for j in range(rings):
        for i in range(segs):
            a, b = grid[j][i], grid[j][(i + 1) % segs]
            c, d = grid[j + 1][(i + 1) % segs], grid[j + 1][i]
            bm.faces.new((a, b, c, d))
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new('net', me)
    bpy.context.collection.objects.link(o)
    w = o.modifiers.new('wire', 'WIREFRAME')
    w.thickness = thick
    w.use_replace = True
    return assign(o, m)


def lumpy(obj, strength, size=0.08, seed=0):
    tex = bpy.data.textures.new(f'lump{seed}', 'CLOUDS')
    tex.noise_scale = size
    d = obj.modifiers.new('lump', 'DISPLACE')
    d.texture = tex
    d.strength = strength
    d.mid_level = 0.5
    return obj


def ball_seams(center, r, m, rot):
    """Basketball seams: two great circles plus two curved seams."""
    parts = []
    parts.append(torus(r * 1.004, r * 0.035, center, m, rot=rot))
    parts.append(torus(r * 1.004, r * 0.035, center, m, rot=(rot[0] + math.pi / 2, rot[1], rot[2])))
    for side in (-1, 1):
        t = torus(r * 0.72, r * 0.035, center, m, rot=(rot[0], rot[1] + math.pi / 2, rot[2]))
        t.location = Vector(center) + Vector((side * r * 0.69, 0, 0))
        parts.append(t)
    return parts


def export(name):
    for o in bpy.context.scene.objects:
        o.select_set(o.type == 'MESH')
    path = os.path.join(OUT, f'{name}.glb')
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True,
                              export_apply=True, export_yup=True)
    print('wrote', path, os.path.getsize(path) // 1024, 'KB')


# ---------- 1. Stack: five navy basketballs balanced in a column ----------

def build_stack():
    reset()
    random.seed(7)
    navy = mat('navy', '#1f2f73', 0.85)
    seam = mat('seam', '#0b1233', 0.9)
    r = 0.125
    z = r
    for i in range(5):
        o = sphere(r, (random.uniform(-0.006, 0.006), random.uniform(-0.006, 0.006), z), navy, 40, 20)
        o.scale = (1.0, 1.0, 0.94)
        lumpy(o, 0.012, 0.05, i)
        ball_seams(o.location, r * 0.98, seam, (random.uniform(0, 3), random.uniform(0, 3), random.uniform(0, 3)))
        z += r * 1.86
    export('stack')


# ---------- 2. Flat Ball: deflated balls in a 4x6 grid on walnut ----------

def build_flatball():
    reset()
    random.seed(3)
    walnut = mat('walnut', '#5b3a24', 0.55)
    W, H = 1.5, 1.04
    box((W, 0.05, H), (0, 0.025, H / 2), walnut, 0.008)
    cols, rows = 6, 4
    # left columns burnt orange, fading to peach and pink on the right
    palette = ['#b85a24', '#c86a30', '#d27d45', '#d98f62', '#dd9b7f', '#d99a8c']
    for c in range(cols):
        for rr in range(rows):
            x = -W / 2 + W * (c + 0.5) / cols
            zc = H * (rr + 0.5) / rows
            m = mat(f'ball{c}', palette[c], 0.8)
            bpy.ops.mesh.primitive_uv_sphere_add(radius=0.095, segments=28, ring_count=14, location=(0, 0, 0))
            o = bpy.context.active_object
            assign(o, m)
            # Crush the front half back into the rear half: a cupped, deflated shell
            for v in o.data.vertices:
                if v.co.y < 0:
                    v.co.y = -v.co.y * 0.35
                v.co.y *= 0.55
                v.co.x *= 1.06 + random.uniform(-0.04, 0.04)
            lumpy(o, 0.018, 0.04, c * 10 + rr)
            o.rotation_euler = (0, random.uniform(-0.6, 0.6), 0)
            o.location = (x + random.uniform(-0.01, 0.01), -0.07, zc + random.uniform(-0.01, 0.01))
            bpy.ops.object.shade_smooth()
    export('flatball')


# ---------- 3. Hoop Garden: a painted backboard over plant shelves ----------

def build_hoopgarden():
    reset()
    random.seed(11)
    red = mat('red', '#c8312c', 0.5)
    white = mat('white', '#f2f0ea', 0.7)
    rim = mat('rim', '#d2462e', 0.35, 0.4)
    netm = mat('net', '#f4f4f4', 0.9)
    pot = mat('terracotta', '#b8643c', 0.85)
    leaf = mat('leaf', '#3f7d3a', 0.6)
    leaf2 = mat('leaf2', '#5d9a45', 0.6)
    # painted backboard: an outer frame and the inner shooter's square
    bw, bh, bz = 0.9, 0.6, 1.55
    t = 0.035
    for (sx, sz, x, z) in [(bw, t, 0, bz + bh / 2), (bw, t, 0, bz - bh / 2),
                           (t, bh, -bw / 2, bz), (t, bh, bw / 2, bz)]:
        box((sx, 0.006, sz), (x, -0.003, z), red)
    iw, ih, iz = 0.3, 0.22, bz - bh / 2 + 0.17
    for (sx, sz, x, z) in [(iw, t, 0, iz + ih / 2), (iw, t, 0, iz - ih / 2),
                           (t, ih, -iw / 2, iz), (t, ih, iw / 2, iz)]:
        box((sx, 0.006, sz), (x, -0.003, z), red)
    # rim and net, projecting off the wall
    rz = iz - ih / 2 - 0.01
    torus(0.115, 0.009, (0, -0.15, rz), rim)
    box((0.05, 0.04, 0.03), (0, -0.02, rz), rim)
    wire_net(0.115, 0.07, 0.2, (0, -0.15, rz), netm)
    # floating shelves, each with a row of potted plants
    shelves = [(0.95, 1.0, 3), (1.1, 0.68, 4), (1.25, 0.36, 5), (0.7, 0.08, 2)]
    for (sw, sz, n) in shelves:
        box((sw, 0.16, 0.025), (0, -0.08, sz), white, 0.004)
        for k in range(n):
            x = -sw / 2 + sw * (k + 0.5) / n + random.uniform(-0.03, 0.03)
            ph = random.uniform(0.07, 0.11)
            p = cyl(0.045, ph, (x, -0.08, sz + 0.0125 + ph / 2), pot, 20)
            for v in p.data.vertices:  # taper toward the base
                if v.co.z < 0:
                    v.co.x *= 0.78
                    v.co.y *= 0.78
            for q in range(random.randint(4, 7)):
                a = random.uniform(0, 2 * math.pi)
                spread = random.uniform(0.0, 0.07)
                bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=random.uniform(0.03, 0.05),
                                                      location=(x + spread * math.cos(a), -0.08 + spread * 0.6 * math.sin(a),
                                                                sz + ph + random.uniform(0.03, 0.12)))
                lf = bpy.context.active_object
                lf.scale = (0.7, 0.5, 1.6)
                lf.rotation_euler = (random.uniform(-0.5, 0.5), random.uniform(-0.6, 0.6), a)
                assign(lf, random.choice([leaf, leaf2]))
    export('hoopgarden')


# ---------- 4. Bronze Hoop: a hoop rising out of a field of bronze rods ----------

def build_bronzehoop():
    reset()
    random.seed(5)
    bronze = mat('bronze', '#8a6a3c', 0.38, 0.9)
    dark = mat('bronzeDark', '#3d2e1c', 0.6, 0.6)
    W, H = 1.3, 0.95
    box((W, 0.04, H), (0, 0.02, H / 2), dark, 0.006)
    n = 46
    for i in range(n):
        x = -W / 2 + 0.05 + (W - 0.1) * i / (n - 1)
        top = random.uniform(0.45, 0.92)
        base = random.uniform(0.04, 0.2)
        r = random.uniform(0.006, 0.011)
        c = cyl(r, top - base, (x, -0.035, (top + base) / 2), bronze, 8)
        sphere(r * 1.7, (x, -0.035, top), bronze, 10, 6)
    torus(0.13, 0.008, (0, -0.16, 0.42), bronze)
    box((0.05, 0.12, 0.02), (0, -0.07, 0.42), bronze)
    wire_net(0.13, 0.085, 0.22, (0, -0.16, 0.42), bronze, thick=0.005)
    export('bronzehoop')


# ---------- 5. All Net: nets in team colors hanging from a brass rod ----------

def build_allnet():
    reset()
    random.seed(19)
    brass = mat('brass', '#b08d4a', 0.3, 1.0)
    colors = [mat('netRed', '#b8322c', 0.85), mat('netWhite', '#ece8df', 0.85),
              mat('netNavy', '#28396e', 0.85), mat('netTan', '#c7a575', 0.85),
              mat('netOrange', '#d0662e', 0.85)]
    W = 1.4
    rz = 1.25
    cyl(0.013, W, (0, -0.06, rz), brass, 16, rot=(0, math.pi / 2, 0))
    for side in (-1, 1):
        sphere(0.026, (side * W / 2, -0.06, rz), brass, 16, 8)
        box((0.02, 0.06, 0.02), (side * (W / 2 - 0.08), -0.03, rz), brass)
    for k in range(13):
        x = -W / 2 + 0.12 + (W - 0.24) * k / 12 + random.uniform(-0.03, 0.03)
        depth = random.uniform(0.75, 1.15)
        o = wire_net(random.uniform(0.07, 0.1), random.uniform(0.03, 0.06), depth,
                     (x, -0.06 - random.uniform(0.0, 0.03), rz - 0.01), random.choice(colors),
                     segs=10, rings=9, thick=0.007, sway=random.uniform(-0.06, 0.06))
        o.scale = (1, 0.35, 1)  # hung flat against the wall
    export('allnet')


build_stack()
build_flatball()
build_hoopgarden()
build_bronzehoop()
build_allnet()
