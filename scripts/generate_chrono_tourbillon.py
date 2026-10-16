"""
BLENDER 4.5 CAD GENERATOR: "CHRONO-X // CALIBRE RM-026" SKELETON TOURBILLON WATCH
Follows arjun988/blender-skills (hard-surface, mechanical-rigging, lookdev)
Exports multi-layered hierarchical .glb to public/models/chrono_tourbillon.glb
"""

import bpy
import bmesh
import math
import os


def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def create_pbr_material(name, base_color, metallic=0.9, roughness=0.2, transmission=0.0, ior=1.5, emission_color=None, emission_strength=0.0, alpha=1.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (*base_color, 1.0)
        bsdf.inputs["Metallic"].default_value = metallic
        bsdf.inputs["Roughness"].default_value = roughness
        if "Transmission Weight" in bsdf.inputs:
            bsdf.inputs["Transmission Weight"].default_value = transmission
        elif "Transmission" in bsdf.inputs:
            bsdf.inputs["Transmission"].default_value = transmission
        if "IOR" in bsdf.inputs:
            bsdf.inputs["IOR"].default_value = ior
        if emission_color and "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = (*emission_color, 1.0)
            bsdf.inputs["Emission Strength"].default_value = emission_strength
        if alpha < 1.0 and "Alpha" in bsdf.inputs:
            bsdf.inputs["Alpha"].default_value = alpha
    return mat


def add_bevel_and_smooth(obj, width=0.008, segments=4):
    bevel = obj.modifiers.new(name="HardSurfaceBevel", type='BEVEL')
    bevel.width = width
    bevel.segments = segments
    bevel.limit_method = 'ANGLE'
    bevel.harden_normals = True
    for poly in obj.data.polygons:
        poly.use_smooth = True


def create_toothed_gear(name, teeth_count, inner_r, pitch_r, outer_r, thickness, location=(0, 0, 0), parent=None, material=None):
    mesh = bpy.data.meshes.new(name + "_Mesh")
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    if parent:
        obj.parent = parent

    bm = bmesh.new()
    total_steps = teeth_count * 4
    verts_top = []
    verts_bot = []

    for i in range(total_steps):
        angle = (i / total_steps) * math.pi * 2.0
        phase = i % 4
        if phase in (0, 3):
            r = pitch_r * 0.92
        else:
            r = outer_r
        x = math.cos(angle) * r
        y = math.sin(angle) * r
        verts_top.append(bm.verts.new((x, y, thickness / 2.0)))
        verts_bot.append(bm.verts.new((x, y, -thickness / 2.0)))

    inner_top = []
    inner_bot = []
    for i in range(total_steps):
        angle = (i / total_steps) * math.pi * 2.0
        x = math.cos(angle) * inner_r
        y = math.sin(angle) * inner_r
        inner_top.append(bm.verts.new((x, y, thickness / 2.0)))
        inner_bot.append(bm.verts.new((x, y, -thickness / 2.0)))

    for i in range(total_steps):
        nxt = (i + 1) % total_steps
        # Outer rim face
        bm.faces.new((verts_bot[i], verts_bot[nxt], verts_top[nxt], verts_top[i]))
        # Inner bore face
        bm.faces.new((inner_top[i], inner_top[nxt], inner_bot[nxt], inner_bot[i]))
        # Top ring face
        bm.faces.new((inner_top[i], verts_top[i], verts_top[nxt], inner_top[nxt]))
        # Bottom ring face
        bm.faces.new((verts_bot[i], inner_bot[i], inner_bot[nxt], verts_bot[nxt]))

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()

    add_bevel_and_smooth(obj, width=0.003, segments=3)
    if material:
        obj.data.materials.append(material)
    return obj


def create_cylinder_part(name, radius, depth, vertices=32, location=(0, 0, 0), rotation=(0, 0, 0), parent=None, material=None, bevel_w=0.004):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location, rotation=rotation)
    obj = bpy.context.active_object
    obj.name = name
    if parent:
        obj.parent = parent
    add_bevel_and_smooth(obj, width=bevel_w, segments=4)
    if material:
        obj.data.materials.append(material)
    return obj


def create_sword_hand(name, length, width_base, width_tip, thickness, z_offset, parent=None, material=None):
    mesh = bpy.data.meshes.new(name + "_Mesh")
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = (0, 0, z_offset)
    if parent:
        obj.parent = parent

    bm = bmesh.new()
    v_tail = bm.verts.new((0, -length * 0.22, 0))
    v_left = bm.verts.new((-width_base, 0, 0))
    v_right = bm.verts.new((width_base, 0, 0))
    v_tip = bm.verts.new((0, length, 0))
    v_ridge_base = bm.verts.new((0, 0, thickness))
    v_ridge_tip = bm.verts.new((0, length * 0.85, thickness * 0.5))

    bm.faces.new((v_tail, v_right, v_ridge_base))
    bm.faces.new((v_left, v_tail, v_ridge_base))
    bm.faces.new((v_right, v_tip, v_ridge_tip, v_ridge_base))
    bm.faces.new((v_ridge_base, v_ridge_tip, v_tip, v_left))
    bm.faces.new((v_tail, v_left, v_tip, v_right))

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()

    add_bevel_and_smooth(obj, width=0.0015, segments=2)
    if material:
        obj.data.materials.append(material)
    return obj


def build_chrono_tourbillon():
    clear_scene()

    # Materials
    mat_titanium = create_pbr_material("Mat_Case_Titanium", (0.58, 0.64, 0.72), metallic=0.92, roughness=0.24)
    mat_rosegold = create_pbr_material("Mat_Gear_18K_RoseGold", (0.90, 0.66, 0.49), metallic=0.95, roughness=0.16)
    mat_brass = create_pbr_material("Mat_Gear_Brass", (0.96, 0.62, 0.04), metallic=0.92, roughness=0.20)
    mat_ruby = create_pbr_material("Mat_Ruby_Bearing", (0.88, 0.11, 0.28), metallic=0.05, roughness=0.08, transmission=0.88, ior=1.77)
    mat_lume = create_pbr_material("Mat_Lume_SuperLumiNova", (0.92, 0.98, 0.95), metallic=0.1, roughness=0.3, emission_color=(0.0, 0.96, 0.83), emission_strength=0.6)
    mat_sapphire = create_pbr_material("Mat_Sapphire_AR", (0.88, 0.95, 1.0), metallic=0.0, roughness=0.02, transmission=0.98, ior=1.77, alpha=0.22)
    mat_bridge_dark = create_pbr_material("Mat_Bridge_Anthracite", (0.10, 0.11, 0.14), metallic=0.80, roughness=0.42)
    mat_crimson = create_pbr_material("Mat_Chrono_Crimson", (0.94, 0.22, 0.22), metallic=0.6, roughness=0.25)
    mat_strap = create_pbr_material("Mat_Strap_Rubber", (0.06, 0.07, 0.09), metallic=0.1, roughness=0.65)

    # Root Empty
    root = bpy.data.objects.new("Chrono_Root", None)
    bpy.context.collection.objects.link(root)

    # 6 Precision-Aligned Mechanical Layer Groups along Z-axis (standing watch facing +Z)
    layers = {}
    layer_names = [
        "Layer_01_Caseback_Crystal",
        "Layer_02_Mainspring_And_Gears",
        "Layer_03_Tourbillon_Cage",
        "Layer_04_Skeleton_Bridges_And_Hands",
        "Layer_05_Bezel_Crown_Pushers",
        "Layer_06_Sapphire_Crystal_Dome",
    ]
    for lname in layer_names:
        emp = bpy.data.objects.new(lname, None)
        bpy.context.collection.objects.link(emp)
        emp.parent = root
        layers[lname] = emp

    # 1. Layer_01_Caseback_Crystal
    l1 = layers["Layer_01_Caseback_Crystal"]
    create_cylinder_part("Caseback_Octagon_Ring", 1.16, 0.08, vertices=8, location=(0, 0, -0.22), parent=l1, material=mat_titanium, bevel_w=0.012)
    create_cylinder_part("Caseback_Sapphire", 0.92, 0.02, vertices=48, location=(0, 0, -0.22), parent=l1, material=mat_sapphire, bevel_w=0.002)
    for i in range(8):
        ang = (i / 8.0) * math.pi * 2.0 + math.pi / 8.0
        create_cylinder_part(f"Caseback_Screw_{i+1:02d}", 0.035, 0.09, vertices=6, location=(math.cos(ang)*1.04, math.sin(ang)*1.04, -0.22), parent=l1, material=mat_rosegold, bevel_w=0.003)

    # 2. Layer_02_Mainspring_And_Gears
    l2 = layers["Layer_02_Mainspring_And_Gears"]
    create_toothed_gear("Gear_Barrel", 36, 0.12, 0.34, 0.38, 0.05, location=(-0.38, 0.22, -0.10), parent=l2, material=mat_rosegold)
    create_cylinder_part("Mainspring_Coil", 0.24, 0.04, vertices=32, location=(-0.38, 0.22, -0.10), parent=l2, material=mat_titanium, bevel_w=0.003)
    create_toothed_gear("Gear_Center_Wheel", 48, 0.08, 0.40, 0.44, 0.04, location=(0, 0, -0.06), parent=l2, material=mat_brass)
    create_toothed_gear("Gear_Third_Wheel", 32, 0.06, 0.26, 0.295, 0.04, location=(0.38, 0.18, -0.08), parent=l2, material=mat_rosegold)
    create_cylinder_part("Center_Ruby_Jewel", 0.055, 0.055, vertices=24, location=(0, 0, -0.05), parent=l2, material=mat_ruby, bevel_w=0.004)

    # 3. Layer_03_Tourbillon_Cage (at 6 o'clock [0, -0.52, -0.02])
    l3 = layers["Layer_03_Tourbillon_Cage"]
    l3.location = (0, -0.52, -0.02)
    create_toothed_gear("Tourbillon_Outer_Carriage", 24, 0.22, 0.28, 0.31, 0.05, location=(0, 0, 0), parent=l3, material=mat_titanium)
    create_toothed_gear("Tourbillon_Balance_Wheel", 18, 0.14, 0.21, 0.235, 0.035, location=(0, 0, 0.01), parent=l3, material=mat_rosegold)
    create_cylinder_part("Tourbillon_Ruby_Jewel", 0.045, 0.06, vertices=24, location=(0, 0, 0.02), parent=l3, material=mat_ruby, bevel_w=0.004)

    # 4. Layer_04_Skeleton_Bridges_And_Hands
    l4 = layers["Layer_04_Skeleton_Bridges_And_Hands"]
    create_cylinder_part("Bridge_Main", 0.98, 0.035, vertices=12, location=(0, 0, 0.02), parent=l4, material=mat_bridge_dark, bevel_w=0.006)
    for i in range(12):
        ang = (i / 12.0) * math.pi * 2.0
        idx_x = math.sin(ang) * 0.88
        idx_y = math.cos(ang) * 0.88
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(idx_x, idx_y, 0.06), rotation=(0, 0, -ang))
        idx_obj = bpy.context.active_object
        idx_obj.name = f"Index_{i+1:02d}"
        idx_obj.scale = (0.028, 0.095, 0.018)
        idx_obj.parent = l4
        add_bevel_and_smooth(idx_obj, width=0.003, segments=3)
        idx_obj.data.materials.append(mat_lume)

    create_sword_hand("Hand_Hour", 0.56, 0.055, 0.015, 0.022, 0.08, parent=l4, material=mat_rosegold)
    create_sword_hand("Hand_Minute", 0.78, 0.042, 0.010, 0.020, 0.105, parent=l4, material=mat_rosegold)
    create_sword_hand("Hand_Chrono_Second", 0.86, 0.018, 0.005, 0.014, 0.125, parent=l4, material=mat_crimson)

    # 5. Layer_05_Bezel_Crown_Pushers
    l5 = layers["Layer_05_Bezel_Crown_Pushers"]
    create_cylinder_part("Watch_Case_Main", 1.24, 0.28, vertices=8, location=(0, 0, -0.02), parent=l5, material=mat_titanium, bevel_w=0.02)
    for i in range(8):
        ang = (i / 8.0) * math.pi * 2.0 + math.pi / 8.0
        create_cylinder_part(f"Bezel_Bolt_{i+1:02d}", 0.042, 0.04, vertices=6, location=(math.cos(ang)*1.10, math.sin(ang)*1.10, 0.13), parent=l5, material=mat_rosegold, bevel_w=0.004)

    create_toothed_gear("Crown_Winder", 20, 0.05, 0.13, 0.155, 0.16, location=(1.32, 0, 0), parent=l5, material=mat_rosegold)
    layers["Layer_05_Bezel_Crown_Pushers"].children[-1].rotation_euler = (0, math.pi / 2.0, 0)

    create_cylinder_part("Pusher_Start", 0.085, 0.18, vertices=16, location=(1.22, 0.54, 0), rotation=(0, math.pi/2.0, -0.42), parent=l5, material=mat_titanium, bevel_w=0.008)
    create_cylinder_part("Pusher_Reset", 0.085, 0.18, vertices=16, location=(1.22, -0.54, 0), rotation=(0, math.pi/2.0, 0.42), parent=l5, material=mat_titanium, bevel_w=0.008)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 1.55, -0.05), rotation=(0.18, 0, 0))
    strap_top = bpy.context.active_object
    strap_top.name = "Strap_Top"
    strap_top.scale = (0.62, 0.48, 0.09)
    strap_top.parent = l5
    add_bevel_and_smooth(strap_top, width=0.015, segments=4)
    strap_top.data.materials.append(mat_strap)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -1.55, -0.05), rotation=(-0.18, 0, 0))
    strap_bot = bpy.context.active_object
    strap_bot.name = "Strap_Bottom"
    strap_bot.scale = (0.62, 0.48, 0.09)
    strap_bot.parent = l5
    add_bevel_and_smooth(strap_bot, width=0.015, segments=4)
    strap_bot.data.materials.append(mat_strap)

    # 6. Layer_06_Sapphire_Crystal_Dome
    l6 = layers["Layer_06_Sapphire_Crystal_Dome"]
    create_cylinder_part("Sapphire_Crystal_Front", 1.04, 0.035, vertices=64, location=(0, 0, 0.16), parent=l6, material=mat_sapphire, bevel_w=0.008)

    # Export to public/models/chrono_tourbillon.glb
    out_dir = os.path.join(os.getcwd(), "public", "models")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "chrono_tourbillon.glb")

    bpy.ops.export_scene.gltf(
        filepath=out_path,
        export_format='GLB',
        export_apply=True,
        export_yup=True
    )
    print(f"SUCCESS: Exported {out_path}")


if __name__ == "__main__":
    build_chrono_tourbillon()
