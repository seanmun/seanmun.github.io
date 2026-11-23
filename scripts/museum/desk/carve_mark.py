# Carves a logo mark as a weathered marble antiquity on a fluted column drum,
# for the museum's front desk (desk.ts).
#
#   Blender -b -P carve_mark.py -- <mark.svg> <out.glb> <round|square> [seed]
#
# The SVG holds the mark as one filled path on a 24-unit square. The mark is
# cut into a slab (its gaps recessed, not cut through), stood on a drum with
# a base and an abacus, and the whole thing is treated as one block of old
# stone: edges worn round, corners chipped, the surface pitted. A veined
# marble (darker in the crevices) and the fine relief are then baked onto a
# light copy, which is what gets exported.
import bpy, bmesh, sys, math, random
from mathutils import Vector, noise

svg, out, kind, *rest = sys.argv[sys.argv.index('--') + 1:]
random.seed(int(rest[0]) if rest else 7)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

def only(o):
    bpy.ops.object.select_all(action='DESELECT')
    o.select_set(True)
    bpy.context.view_layer.objects.active = o

def join(objs):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    return objs[0]

def apply(o, mod):
    only(o)
    bpy.ops.object.modifier_apply(modifier=mod.name)

# ---- the mark: SVG -> flat faces -> a slab 1 unit wide, facing -Y ----
bpy.ops.import_curve.svg(filepath=svg)
curves = [o for o in scene.objects if o.type == 'CURVE']
for c in curves:
    c.data.dimensions = '2D'; c.data.fill_mode = 'BOTH'; c.data.extrude = 0; c.data.resolution_u = 24
only(curves[0])
for c in curves: c.select_set(True)
bpy.ops.object.convert(target='MESH')
mark = join(curves)
me = mark.data
xs = [v.co.x for v in me.vertices]; ys = [v.co.y for v in me.vertices]
w = max(xs) - min(xs); cx = (max(xs) + min(xs)) / 2; cy = (max(ys) + min(ys)) / 2
for v in me.vertices:
    x, y = (v.co.x - cx) / w, (v.co.y - cy) / w
    v.co = Vector((x, 0, y))
mark.matrix_world.identity()
bm = bmesh.new(); bm.from_mesh(me); bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5); bm.to_mesh(me); bm.free()
THICK = 0.2
sol = mark.modifiers.new('sol', 'SOLIDIFY'); sol.thickness = THICK; sol.offset = 0
apply(mark, sol)

# ---- the stone behind the cut, and the column under it ----
parts = [mark]
if kind == 'round':
    bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=0.47, depth=THICK * 0.5, location=(0, THICK * 0.25, 0), rotation=(math.pi / 2, 0, 0))
else:
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, THICK * 0.25, 0)); bpy.context.object.scale = (0.93, THICK * 0.5, 0.93)
parts.append(bpy.context.object)
BASE, DRUM, ABACUS = 0.09, 0.4, 0.08
z0 = -0.5 - ABACUS - DRUM - BASE  # floor of the piece, with the mark's centre at 0
def slab(sx, sy, sz, z):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, z + sz / 2)); o = bpy.context.object; o.scale = (sx, sy, sz); parts.append(o)
slab(0.86, 0.86, BASE, z0)
slab(0.78, 0.78, ABACUS, z0 + BASE + DRUM)
# fluted drum: 20 scallops meeting in sharp arrises, tapering a little
bpy.ops.mesh.primitive_cylinder_add(vertices=240, radius=1, depth=DRUM + 0.02, location=(0, 0, z0 + BASE + DRUM / 2))
drum = bpy.context.object
for v in drum.data.vertices:
    a = math.atan2(v.co.y, v.co.x)
    t = (v.co.z + DRUM / 2) / DRUM
    r = (0.335 - 0.03 * t) - 0.028 * abs(math.sin(10 * a))
    if math.hypot(v.co.x, v.co.y) > 0.5: v.co.x, v.co.y = r * math.cos(a), r * math.sin(a)
parts.append(drum)
# a torus moulding at the foot of the drum, and a necking ring at its top
for z, R, r in ((z0 + BASE + 0.03, 0.35, 0.035), (z0 + BASE + DRUM - 0.03, 0.315, 0.022)):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=96, minor_segments=16, location=(0, 0, z)); parts.append(bpy.context.object)
for o in parts:
    only(o); bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
stone = join(parts)

def remesh(o, size):
    m = o.modifiers.new('rm', 'REMESH'); m.mode = 'VOXEL'; m.voxel_size = size; m.adaptivity = 0
    apply(o, m)
remesh(stone, 0.006)

# ---- age it ----
me = stone.data
# chips: bites out of the rim, the corners and the arrises
chips = []
for _ in range(5):
    if kind == 'round':
        a = random.uniform(0, 2 * math.pi); p = Vector((0.5 * math.cos(a), random.choice((-1, 1)) * THICK / 2, 0.5 * math.sin(a)))
    else:
        s = random.choice((-1, 1)); t = random.uniform(-0.5, 0.5)
        p = Vector((s * 0.5, 0, t)) if random.random() < 0.5 else Vector((t, 0, s * 0.5))
        p.y = random.choice((-1, 1)) * THICK / 2
    chips.append((p * 1.05, random.uniform(0.03, 0.07)))
for _ in range(5):  # the abacus and the base lose corners and edges
    top = random.random() < 0.6
    half = 0.39 if top else 0.43
    z = z0 + BASE + DRUM + ABACUS if top else z0 + BASE
    s1, s2 = random.choice((-1, 1)), random.choice((-1, 1))
    p = Vector((s1 * half, s2 * half * random.choice((1, random.uniform(-1, 1))), z))
    chips.append((p * 1.03, random.uniform(0.04, 0.1)))
for v in me.vertices:
    for c, r in chips:
        d = v.co - c
        rr = r * (1 + 0.35 * noise.noise(d.normalized() * 2.5 + c))  # a rough break, not a scoop
        if d.length < rr: v.co = c + d.normalized() * rr
# wear: round every edge off, then pit and ripple the surface
sm = stone.modifiers.new('sm', 'SMOOTH'); sm.factor = 0.8; sm.iterations = 8
apply(stone, sm)
me.update()
for v in me.vertices:
    n = v.normal
    big = noise.fractal(v.co * 3.0, 1.0, 2.0, 4)
    fine = noise.fractal(v.co * 22.0, 1.0, 2.0, 3)
    pit = max(0.0, noise.noise(v.co * 16.0 + Vector((9, 3, 5))) - 0.38)
    v.co += n * (0.0028 * big + 0.0009 * fine - 0.05 * pit * pit)
remesh(stone, 0.0055)
only(stone); bpy.ops.object.shade_smooth()

# ---- marble ----
mat = bpy.data.materials.new('marble'); mat.use_nodes = True
nt = mat.node_tree; N = nt.nodes; L = nt.links
bsdf = N['Principled BSDF']
coord = N.new('ShaderNodeTexCoord')
def ramp(src, stops):
    r = N.new('ShaderNodeValToRGB'); e = r.color_ramp.elements
    e[0].position, e[0].color = stops[0]; e[1].position, e[1].color = stops[1]
    for pos, col in stops[2:]:
        x = e.new(pos); x.color = col
    L.new(src, r.inputs['Fac']); return r
def noise_tex(scale, detail, distortion):
    t = N.new('ShaderNodeTexNoise'); t.inputs['Scale'].default_value = scale; t.inputs['Detail'].default_value = detail
    t.inputs['Distortion'].default_value = distortion; L.new(coord.outputs['Object'], t.inputs['Vector']); return t
W, G = (1, 1, 1, 1), (0, 0, 0, 1)
vein = ramp(noise_tex(1.7, 9, 2.4).outputs['Fac'], [(0.44, G), (0.5, W), (0.56, G)])       # thin grey veins
cloud = ramp(noise_tex(0.9, 4, 0.6).outputs['Fac'], [(0.3, G), (0.75, W)])                # soft mottling
speck = ramp(noise_tex(38, 2, 0).outputs['Fac'], [(0.62, G), (0.8, W)])                   # grit
ao = N.new('ShaderNodeAmbientOcclusion'); ao.inputs['Distance'].default_value = 0.12; ao.samples = 16
grime = ramp(ao.outputs['AO'], [(0.25, W), (0.92, G)])                                    # 1 in the crevices
def mix(a, b, fac, f=None):
    m = N.new('ShaderNodeMixRGB')
    for sock, val in ((m.inputs['Color1'], a), (m.inputs['Color2'], b)):
        if isinstance(val, tuple): sock.default_value = val
        else: L.new(val, sock)
    if isinstance(fac, float): m.inputs['Fac'].default_value = fac
    else:
        if f is not None:
            mul = N.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'; mul.inputs[1].default_value = f; L.new(fac, mul.inputs[0]); fac = mul.outputs[0]
        L.new(fac, m.inputs['Fac'])
    return m.outputs['Color']
col = mix((0.86, 0.84, 0.79, 1), (0.95, 0.94, 0.91, 1), cloud.outputs['Color'])
col = mix(col, (0.38, 0.39, 0.42, 1), vein.outputs['Color'], 0.8)
col = mix(col, (0.62, 0.58, 0.5, 1), speck.outputs['Color'], 0.35)
col = mix(col, (0.36, 0.29, 0.2, 1), grime.outputs['Color'], 0.85)
L.new(col, bsdf.inputs['Base Color'])
bsdf.inputs['Roughness'].default_value = 0.55
stone.data.materials.clear(); stone.data.materials.append(mat)

# ---- a light copy to carry it ----
only(stone); bpy.ops.object.duplicate(); low = bpy.context.object; low.name = 'mark'
dec = low.modifiers.new('dec', 'DECIMATE'); dec.ratio = min(1, 14000 / len(low.data.polygons) / 2)
apply(low, dec)
only(low); bpy.ops.object.shade_smooth()
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.004)
bpy.ops.object.mode_set(mode='OBJECT')
SIZE = 1024
lm = bpy.data.materials.new('marble-baked'); lm.use_nodes = True
ln = lm.node_tree
def image(name, data):
    img = bpy.data.images.new(name, SIZE, SIZE, alpha=False)
    if data: img.colorspace_settings.name = 'Non-Color'
    node = ln.nodes.new('ShaderNodeTexImage'); node.image = img; return node
cn, nn = image('color', False), image('normal', True)
low.data.materials.clear(); low.data.materials.append(lm)
scene.render.engine = 'CYCLES'; scene.cycles.device = 'CPU'; scene.cycles.samples = 48
b = scene.render.bake
b.use_selected_to_active = True; b.cage_extrusion = 0.02; b.max_ray_distance = 0.05; b.margin = 6
def bake(node, kind_, **kw):
    ln.nodes.active = node
    bpy.ops.object.select_all(action='DESELECT'); stone.select_set(True); low.select_set(True)
    bpy.context.view_layer.objects.active = low
    bpy.ops.object.bake(type=kind_, **kw)
bake(cn, 'DIFFUSE', pass_filter={'COLOR'})
bake(nn, 'NORMAL')
p = ln.nodes['Principled BSDF']
ln.links.new(cn.outputs['Color'], p.inputs['Base Color'])
nm = ln.nodes.new('ShaderNodeNormalMap'); ln.links.new(nn.outputs['Color'], nm.inputs['Color']); ln.links.new(nm.outputs['Normal'], p.inputs['Normal'])
p.inputs['Roughness'].default_value = 0.55
for n in (cn, nn): n.image.pack()

# stand it on the ground, facing -Y (which glTF turns to +Z)
for v in low.data.vertices: v.co.z -= z0
only(low)
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=True, export_yup=True, export_apply=True)
print('carved', out, len(low.data.polygons), 'faces; height', round(max(v.co.z for v in low.data.vertices), 3))
