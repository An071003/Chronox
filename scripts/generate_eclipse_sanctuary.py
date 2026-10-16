"""
BLENDER 4.5 CAD & SCULPT GENERATOR: "ECLIPSE OF RESONANCE // THE ASTRAL SERAPHIM"
Follows arjun988/blender-skills (character-sculpting, hard-surface, lighting-cinematic, export-pipeline)
Generates the central Boss Entity ("The Astral Seraphim"), 24 Wing-Blades, 3 Astrolabe Rings, and 3 Portal Monoliths.
Exports to public/models/eclipse_sanctuary.glb
"""

import bpy
import bmesh
import math
import os


def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def create_pbr_mat(name, base_color, metallic=0.9, roughness=0.2, clearcoat=0.0, emission_color=None, emission_strength=0.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (*base_color, 1.0)
        bsdf.inputs["Metallic"].default_value = metallic
        bsdf.inputs["Roughness"].default_value = roughness
        if "Coat Weight" in bsdf.inputs:
            bsdf.inputs["Coat Weight"].default_value = clearcoat
        elif "Clearcoat" in bsdf.inputs:
            bsdf.inputs["Clearcoat"].default_value = clearcoat
        if emission_color and "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = (*emission_color, 1.0)
            bsdf.inputs["Emission Strength"].default_value = emission_strength
    return mat


def add_bevel(obj, width=0.015, segments=4):
    bevel = obj.modifiers.new(name="Bevel", type='BEVEL')
    bevel.width = width
    bevel.segments = segments
    bevel.limit_method = 'ANGLE'
    bevel.harden_normals = True
    for poly in obj.data.polygons:
        poly.use_smooth = True


def create_wing_blade(name, length, width, thickness, location, rotation, parent, mat):
    mesh = bpy.data.meshes.new(name + "_Mesh")
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = rotation
    if parent:
        obj.parent = parent

    bm = bmesh.new()
    v_top = bm.verts.new((0, length * 0.35, 0))
    v_bot = bm.verts.new((0, -length * 0.65, 0))
    v_left = bm.verts.new((-width, 0, 0))
    v_right = bm.verts.new((width, 0, 0))
    v_front = bm.verts.new((0, 0, thickness))
    v_back = bm.verts.new((0, 0, -thickness))

    bm.faces.new((v_top, v_right, v_front))
    bm.faces.new((v_right, v_bot, v_front))
    bm.faces.new((v_bot, v_left, v_front))
    bm.faces.new((v_left, v_top, v_front))

    bm.faces.new((v_top, v_back, v_right))
    bm.faces.new((v_right, v_back, v_bot))
    bm.faces.new((v_bot, v_back, v_left))
    bm.faces.new((v_left, v_back, v_top))

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()

    add_bevel(obj, width=0.004, segments=3)
    obj.data.materials.append(mat)
    return obj


def build_eclipse_sanctuary():
    clear_scene()

    mat_obsidian = create_pbr_mat("Mat_Obsidian_Armor", (0.035, 0.04, 0.06), metallic=0.85, roughness=0.15, clearcoat=1.0)
    mat_gold = create_pbr_mat("Mat_Ancient_Gold", (0.83, 0.686, 0.215), metallic=0.98, roughness=0.22)
    mat_emissive = create_pbr_mat("Mat_Astral_Emissive", (1.0, 0.67, 0.0), metallic=0.1, roughness=0.1, emission_color=(1.0, 0.67, 0.0), emission_strength=12.0)

    root = bpy.data.objects.new("Eclipse_Root", None)
    bpy.context.collection.objects.link(root)

    # 1. THE CENTRAL CHARACTER: "THE ASTRAL SERAPHIM" suspended at [0, 0, 0.8]
    char_root = bpy.data.objects.new("Astral_Seraphim", None)
    bpy.context.collection.objects.link(char_root)
    char_root.parent = root
    char_root.location = (0, 0, 0.8)

    # Char_Head_Crown
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=0.24, location=(0, 0, 0.68))
    head = bpy.context.active_object
    head.name = "Char_Head_Crown"
    head.scale = (0.78, 0.85, 1.25)
    head.parent = char_root
    add_bevel(head, width=0.008, segments=3)
    head.data.materials.append(mat_obsidian)

    # Halo_Ring (tilted -25 deg behind head)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.52, minor_radius=0.022, location=(0, 0.18, 0.76), rotation=(math.radians(65), 0, 0))
    halo = bpy.context.active_object
    halo.name = "Halo_Ring"
    halo.parent = char_root
    add_bevel(halo, width=0.004, segments=3)
    halo.data.materials.append(mat_gold)

    # Char_Torso_Armor
    bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=0.42, radius2=0.18, depth=0.75, location=(0, 0, 0.12))
    torso = bpy.context.active_object
    torso.name = "Char_Torso_Armor"
    torso.scale = (1.1, 0.68, 1.0)
    torso.parent = char_root
    add_bevel(torso, width=0.015, segments=4)
    torso.data.materials.append(mat_obsidian)

    # Char_Heart_Singularity
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=0.13, location=(0, -0.1, 0.18))
    heart = bpy.context.active_object
    heart.name = "Char_Heart_Singularity"
    heart.parent = char_root
    heart.data.materials.append(mat_emissive)

    # Char_Cloak_Ribbons (6 flowing metallic strips)
    for i in range(6):
        ang = (i / 6.0) * math.pi * 2.0
        rx = math.cos(ang) * 0.28
        ry = math.sin(ang) * 0.22
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(rx, ry, -0.58), rotation=(0.12 * math.sin(ang), 0.12 * math.cos(ang), ang))
        ribbon = bpy.context.active_object
        ribbon.name = f"Char_Cloak_Ribbon_{i+1:02d}"
        ribbon.scale = (0.08, 0.018, 0.65)
        ribbon.parent = char_root
        add_bevel(ribbon, width=0.005, segments=3)
        ribbon.data.materials.append(mat_obsidian if i % 2 == 0 else mat_gold)

    # 24 Floating Golden/Obsidian Sword-Feathers (Wing_Blade_L_01..12 & Wing_Blade_R_01..12)
    wings_l = bpy.data.objects.new("Char_Wings_Left", None)
    bpy.context.collection.objects.link(wings_l)
    wings_l.parent = char_root

    wings_r = bpy.data.objects.new("Char_Wings_Right", None)
    bpy.context.collection.objects.link(wings_r)
    wings_r.parent = char_root

    for i in range(12):
        t = i / 11.0
        arc_angle = math.radians(-35 + t * 95)
        radius = 0.65 + math.sin(t * math.pi) * 0.55
        blade_len = 0.85 + math.sin(t * math.pi) * 0.55
        x_l = -math.cos(arc_angle) * radius - 0.25
        z_l = math.sin(arc_angle) * radius + 0.25
        y_l = 0.22 + (i % 2) * 0.06
        mat_choice = mat_gold if i % 2 == 0 else mat_obsidian

        create_wing_blade(
            f"Wing_Blade_L_{i+1:02d}",
            blade_len,
            0.055,
            0.022,
            (x_l, y_l, z_l),
            (math.radians(90), 0, arc_angle + math.radians(45)),
            wings_l,
            mat_choice,
        )
        create_wing_blade(
            f"Wing_Blade_R_{i+1:02d}",
            blade_len,
            0.055,
            0.022,
            (-x_l, y_l, z_l),
            (math.radians(90), 0, -arc_angle - math.radians(45)),
            wings_r,
            mat_choice,
        )

    # 2. THE ARCHITECTURE & PORTAL MONOLITHS
    ring_specs = [
        ("Sanctuary_Astrolabe_Outer", 3.2, 0.05, (0.35, 0.2, 0.0)),
        ("Sanctuary_Astrolabe_Mid", 2.6, 0.04, (-0.25, 0.4, 0.2)),
        ("Sanctuary_Astrolabe_Inner", 2.0, 0.035, (0.15, -0.35, 0.1)),
    ]
    for rname, rad, tube, rot in ring_specs:
        bpy.ops.mesh.primitive_torus_add(major_radius=rad, minor_radius=tube, major_segments=64, minor_segments=16, location=(0, 0, 0.8), rotation=rot)
        ring = bpy.context.active_object
        ring.name = rname
        ring.parent = root
        add_bevel(ring, width=0.006, segments=3)
        ring.data.materials.append(mat_gold)

    portal_angles = [-55, 0, 55]
    for idx, deg in enumerate(portal_angles):
        rad_ang = math.radians(deg)
        px = math.sin(rad_ang) * 6.5
        py = math.cos(rad_ang) * 6.5
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(px, py, 0.0), rotation=(0, 0, -rad_ang))
        monolith = bpy.context.active_object
        monolith.name = f"Monolith_Portal_0{idx+1}"
        monolith.scale = (1.6, 0.35, 4.2)
        monolith.parent = root
        add_bevel(monolith, width=0.03, segments=4)
        monolith.data.materials.append(mat_obsidian)

    out_dir = os.path.join(os.getcwd(), "public", "models")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "eclipse_sanctuary.glb")

    bpy.ops.export_scene.gltf(
        filepath=out_path,
        export_format='GLB',
        export_apply=True,
        export_yup=True,
    )
    print(f"SUCCESS: Exported {out_path}")


if __name__ == "__main__":
    build_eclipse_sanctuary()
