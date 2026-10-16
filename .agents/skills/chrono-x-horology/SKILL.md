---
name: chrono-x-horology
description: Production rules from arjun988/blender-skills, blender-web-pipeline, r3f-best-practices, and creative-web-skills for luxury horology 3D web experiences.
---

# ACTIVE GITHUB AGENT SKILLS: [arjun988/blender-skills] + [blender-web-pipeline] + [r3f-luxury-lookdev] + [creative-web-skills]

## SKILL 1: `arjun988/blender-skills` (HARD-SURFACE & PROCEDURAL CAD PRECISION)
1. **NO Unbeveled Primitives:** Never render raw, sharp-edged `BoxGeometry` or `CylinderGeometry` for luxury metal parts.
   - In **Blender Python**, always append a `Bevel` modifier (`width=0.015`, `segments=4`, `limit_method='ANGLE'`, `harden_normals=True`) and enable `shade_smooth()`.
   - In **Three.js / R3F Procedural Meshes**, always use `<RoundedBox>` from `@react-three/drei` or `ExtrudeGeometry` with `bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.012, bevelSegments: 4`.
2. **True Mathematical Gear Teeth:** A gear is NEVER a flat cylinder. Generate real involute gear teeth using a mathematical loop over `toothCount` with `THREE.Shape()` (`moveTo` / `lineTo` alternating between `innerRadius`, `pitchRadius`, and `outerRadius`), plus circular/sector cutouts (spokes) inside the gear body so the movement is authentically skeletonized.
3. **Micro-Detail Layering:** Every mechanical pivot (center hands, Tourbillon axis, gear centers) must be capped with a Synthetic Ruby Jewel bearing (`CylinderGeometry` with `#e11d48`, `transmission: 0.85`, `ior: 1.77`) and a tiny gold chaton ring.

## SKILL 2: `blender-web-pipeline` (STUDIO HDRI & PBR LOOKDEV FOR METALS/GLASS)
1. **Studio Lightformers for High-Contrast Metallic Reflections:**
   - Wrap the scene in `@react-three/drei`'s `<Environment resolution={512}>` containing at least **5 procedural `<Lightformer>` studio softboxes** (Top Key Softbox, Left Warm Rim Strip, Right Cool Specular Strip, Front Fill Ring, Bottom Subtle Bounce).
2. **Sapphire Crystal Optical Physics:** Use `<MeshTransmissionMaterial backside={false} samples={6} thickness={0.12} roughness={0.02} transmission={0.99} ior={1.77} chromaticAberration={0.015} anisotropy={0.1} clearcoat={1} />` so light refracts around the beveled edge while keeping the skeleton dial razor-sharp inside.

## SKILL 3: `r3f-best-practices` (60 FPS PERFORMANCE & ZERO-ALLOCATION LOOP)
1. **Zero Object Allocation in `useFrame`:** Pre-allocate scratch vectors outside the component or via `useMemo`.
2. **6Hz Mechanical Escapement Quantization Formula:**
   - Quantize mechanical ticks to 6 beats per second (21,600 VPH / 3Hz) and damp with `THREE.MathUtils.damp(currentAngle, targetAngle, 28, delta)`.
3. **Renderer / GL Configuration:**
   - Set `dpr={[1, 2]}` and `gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}`.

## SKILL 4: `creative-web-skills` (STRICT ANTI-OVERLAP HUD ARCHITECTURE)
1. **Pointer-Events Architecture:**
   - `<Canvas>` wrapper resides at `fixed inset-0 z-0`.
   - HTML UI wrapper resides at `fixed inset-0 z-20 pointer-events-none`.
   - ONLY interactive child cards/buttons inside the HUD have `pointer-events-auto`.
2. **Viewport Safe-Zone Contract:**
   - Top Header height max `64px`.
   - Left Floating Macro Panel max width `256px`.
   - Bottom Atelier Dock max height `88px`, centered.
   - Central **70% of the screen area** remains 100% unobstructed.
