# Cleans a raw Meshy export for the museum: decimates millions of faces to
# a web budget (the PBR textures keep the surface detail), drops floating
# fragments, smooths shading, sets real-world size, and stands the piece
# against the wall. Optionally renders front and three-quarter previews.
#
#   Blender -b -P scripts/museum/clean_meshy.py -- IN.glb OUT.glb FACES WIDTH_M [PREVIEW_PREFIX]
#
# FACES 0 skips the cleanup and only re-exports (to recompress a file
# this script already cleaned).
#
# Output convention (same as build_art.py): faces the visitor along glTF +Z,
# back flat at z=0, bottom at y=0, centered left to right. The .glb is
# web-ready: Draco geometry (decoder in public/draco) and WebP textures,
# with the roughness/metal map halved since it carries little detail.

import bpy
import bmesh
import math
import sys
from mathutils import Vector

args = sys.argv[sys.argv.index('--') + 1:]
src, out, target_faces, width = args[0], args[1], int(args[2]), float(args[3])
preview = args[4] if len(args) > 4 else None

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
for o in bpy.context.scene.objects:
    o.select_set(o in meshes)
bpy.context.view_layer.objects.active = meshes[0]
if len(meshes) > 1:
    bpy.ops.object.join()
obj = bpy.context.active_object
cleanup = target_faces > 0
bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
start = len(obj.data.polygons)

ws = [obj.matrix_world @ Vector(c) for c in obj.bound_box]
dims = Vector((max(v.x for v in ws) - min(v.x for v in ws), max(v.y for v in ws) - min(v.y for v in ws),
               max(v.z for v in ws) - min(v.z for v in ws)))

if cleanup:
    # 1. Weld the seams Meshy leaves between patches, then decimate
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.remove_doubles(threshold=0.0004)
    bpy.ops.object.mode_set(mode='OBJECT')
    ratio = min(1.0, target_faces / max(1, len(obj.data.polygons)))
    dec = obj.modifiers.new('decimate', 'DECIMATE')
    dec.decimate_type = 'COLLAPSE'
    dec.ratio = ratio
    dec.use_collapse_triangulate = True
    bpy.ops.object.modifier_apply(modifier=dec.name)

    # 2. Drop floating fragments: islands that are tiny next to the piece
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bm.faces.ensure_lookup_table()
    seen = set()
    islands = []
    for f in bm.faces:
        if f.index in seen:
            continue
        stack, island = [f], []
        seen.add(f.index)
        while stack:
            cur = stack.pop()
            island.append(cur)
            for e in cur.edges:
                for nf in e.link_faces:
                    if nf.index not in seen:
                        seen.add(nf.index)
                        stack.append(nf)
        islands.append(island)
    total = len(bm.faces)
    drop = [isl for isl in islands if len(isl) < max(24, total * 0.0015)]
    bmesh.ops.delete(bm, geom=[f for isl in drop for f in isl], context='FACES')
    bm.to_mesh(obj.data)
    bm.free()

    # 3. Smooth shading, keeping hard creases crisp
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(40))

    # 4. Real size, standing against the wall: back at Blender y=max -> 0
    ws = [obj.matrix_world @ Vector(c) for c in obj.bound_box]
    mn = Vector((min(v.x for v in ws), min(v.y for v in ws), min(v.z for v in ws)))
    mx = Vector((max(v.x for v in ws), max(v.y for v in ws), max(v.z for v in ws)))
    s = width / (mx.x - mn.x)
    obj.scale = (s, s, s)
    bpy.ops.object.transform_apply(scale=True)
    ws = [obj.matrix_world @ Vector(c) for c in obj.bound_box]
    mn = Vector((min(v.x for v in ws), min(v.y for v in ws), min(v.z for v in ws)))
    mx = Vector((max(v.x for v in ws), max(v.y for v in ws), max(v.z for v in ws)))
    obj.location -= Vector(((mn.x + mx.x) / 2, mx.y, mn.z))
    bpy.ops.object.transform_apply(location=True)
    dims = mx - mn
    print(f'CLEANED {src.split("/")[-1]}: {start} -> {len(obj.data.polygons)} faces, '
          f'{len(drop)} fragments removed, size {dims.x:.2f} x {dims.z:.2f} x {dims.y:.2f} m (w x h x d)')


# Halve the roughness/metal map: it's mostly flat, and it's a third of the download
for m in obj.data.materials:
    if not m or not m.use_nodes:
        continue
    for link in m.node_tree.links:
        if link.from_node.type == 'TEX_IMAGE' and link.to_node.type == 'SEPARATE_COLOR':
            img = link.from_node.image
            if img and img.size[0] > 1024:
                img.scale(img.size[0] // 2, img.size[1] // 2)

bpy.ops.export_scene.gltf(
    filepath=out, export_format='GLB', use_selection=False, export_apply=True, export_yup=True,
    export_image_format='WEBP', export_image_quality=82,
    export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6,
    export_draco_position_quantization=14, export_draco_normal_quantization=10,
    export_draco_texcoord_quantization=12,
)
print('wrote', out)

# 5. Previews: front and three-quarter, textured, studio lit
if preview:
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_WORKBENCH'
    scene.display.shading.light = 'STUDIO'
    scene.display.shading.color_type = 'TEXTURE'
    scene.display.shading.show_cavity = True
    scene.render.resolution_x, scene.render.resolution_y = 900, 900
    scene.render.film_transparent = False
    scene.world = bpy.data.worlds.new('w')
    cam_data = bpy.data.cameras.new('cam')
    cam = bpy.data.objects.new('cam', cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam
    h = dims.z
    center = Vector((0, -dims.y / 2, h / 2))
    for name, yaw in (('front', 0), ('angle', 35)):
        d = max(dims.x, h) * 2.2
        a = math.radians(yaw)
        cam.location = center + Vector((d * math.sin(a), -d * math.cos(a), 0.15 * h))
        direction = center - cam.location
        cam.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
        cam_data.lens = 50
        scene.render.filepath = f'{preview}-{name}.png'
        bpy.ops.render.render(write_still=True)
