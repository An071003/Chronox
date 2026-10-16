import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useEclipseStore, WORLD_STATE_THEMES } from '../../store/useEclipseStore';

interface WingBladeMeta {
  index: number;
  side: -1 | 1; // -1 = Left, +1 = Right
  row: number; // 0..11
  idlePos: THREE.Vector3;
  idleRot: THREE.Euler;
  explodePos: THREE.Vector3;
  bladeScale: number;
}

export const AstralSeraphim: React.FC = () => {
  const worldState = useEclipseStore((s) => s.worldState);
  const isAwakened = useEclipseStore((s) => s.isAwakened);
  const isArmorExploded = useEclipseStore((s) => s.isArmorExploded);
  const currentAct = useEclipseStore((s) => s.currentAct);

  const theme = WORLD_STATE_THEMES[worldState];

  // Root & IK Groups
  const rootGroupRef = useRef<THREE.Group>(null);
  const torsoGroupRef = useRef<THREE.Group>(null);
  const headGroupRef = useRef<THREE.Group>(null);
  const haloGroupRef = useRef<THREE.Group>(null);
  const heartCoreRef = useRef<THREE.Mesh>(null);
  const heartCageOuterRef = useRef<THREE.Mesh>(null);
  const heartCageInnerRef = useRef<THREE.Mesh>(null);
  const halberdRef = useRef<THREE.Group>(null);

  // Explodable Armor Segment Refs
  const chestLeftRef = useRef<THREE.Group>(null);
  const chestRightRef = useRef<THREE.Group>(null);
  const pauldronLeftRef = useRef<THREE.Group>(null);
  const pauldronRightRef = useRef<THREE.Group>(null);
  const tassetLeftRef = useRef<THREE.Group>(null);
  const tassetRightRef = useRef<THREE.Group>(null);

  // 24 Telekinetic Wing-Blade Refs
  const wingBladeRefs = useRef<(THREE.Group | null)[]>([]);

  // Pre-compute 24 Wing-Blades metadata (12 Left + 12 Right) in a swept-up Archangel / Valkyrie Wing Arc
  const wingBlades = useMemo<WingBladeMeta[]>(() => {
    const list: WingBladeMeta[] = [];
    for (let sideIdx = 0; sideIdx < 2; sideIdx++) {
      const side: -1 | 1 = sideIdx === 0 ? -1 : 1;
      for (let i = 0; i < 12; i++) {
        const t = i / 11; // 0 = upper primary pinion, 1 = lower secondary feather
        const archX = side * (0.52 + Math.sin(t * Math.PI * 0.78) * 1.08 + (1 - t) * 0.24);
        const archY = 0.92 + Math.cos(t * Math.PI * 0.85) * 0.56 - t * 0.44;
        const archZ = -0.28 - Math.abs(i - 4) * 0.03;

        const idlePos = new THREE.Vector3(archX, archY, archZ);
        const featherAngleDeg = 30 + t * 88;
        const idleRot = new THREE.Euler(
          THREE.MathUtils.degToRad(10 + i * 1.2),
          side * THREE.MathUtils.degToRad(-16 - i * 1.5),
          -side * THREE.MathUtils.degToRad(featherAngleDeg)
        );

        const explodePos = idlePos.clone().add(new THREE.Vector3(side * 0.58, 0.22, -0.2));
        const bladeScale = 1.26 - t * 0.38;

        list.push({
          index: sideIdx * 12 + i,
          side,
          row: i,
          idlePos,
          idleRot,
          explodePos,
          bladeScale,
        });
      }
    }
    return list;
  }, []);

  const scratchVec = useMemo(() => new THREE.Vector3(), []);

  // Custom Sculpted Hard-Surface & Flowing Cloth Geometries (NO raw boxy sticks)
  const geometries = useMemo(() => {
    // 1. Diamond-faceted sword blade geometry
    const bladeGeo = new THREE.ConeGeometry(0.086, 1.58, 4, 1);
    bladeGeo.scale(1.0, 1.0, 0.24);
    bladeGeo.translate(0, 0.52, 0);

    const fullerGeo = new THREE.BoxGeometry(0.012, 1.02, 0.044);
    fullerGeo.translate(0, 0.38, 0);

    const hiltGuardGeo = new THREE.OctahedronGeometry(0.082, 0);
    hiltGuardGeo.scale(1.45, 0.42, 0.48);

    const spearRayGeo = new THREE.ConeGeometry(0.022, 0.36, 4);
    spearRayGeo.scale(1, 1, 0.35);

    // 2. Sculpted Valkyrie Breastplate Half (Ergonomic V-tapered shield-cuirass shape)
    const breastShape = new THREE.Shape();
    breastShape.moveTo(0.02, 0.34);
    breastShape.lineTo(0.24, 0.38);
    breastShape.lineTo(0.32, 0.14);
    breastShape.lineTo(0.21, -0.22);
    breastShape.lineTo(0.05, -0.34);
    breastShape.lineTo(0.01, -0.08);
    breastShape.closePath();

    const breastGeo = new THREE.ExtrudeGeometry(breastShape, {
      depth: 0.14,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.025,
      bevelThickness: 0.035,
    });
    breastGeo.center();

    // 3. Sculpted Swept Gothic Hip Tasset / Skirt Plate (Pointed V-top, no flat horizontal bar)
    const tassetShape = new THREE.Shape();
    tassetShape.moveTo(0.0, 0.36);
    tassetShape.lineTo(0.16, 0.18);
    tassetShape.lineTo(0.22, -0.22);
    tassetShape.lineTo(0.05, -0.56);
    tassetShape.lineTo(-0.08, -0.28);
    tassetShape.lineTo(-0.06, 0.16);
    tassetShape.closePath();

    const tassetGeo = new THREE.ExtrudeGeometry(tassetShape, {
      depth: 0.04,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.014,
      bevelThickness: 0.02,
    });
    tassetGeo.center();

    // 4. Curved Zero-Gravity Silk-Metal Cloak Ribbons (3D CatmullRom Tube Curves)
    const ribbonGeos: THREE.TubeGeometry[] = [];
    for (let r = 0; r < 4; r++) {
      const side = r < 2 ? -1 : 1;
      const spread = (r % 2 === 0 ? 0.22 : 0.44) * side;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.12, -0.32, -0.14),
        new THREE.Vector3(spread * 0.85, -0.68, -0.24 - (r % 2) * 0.1),
        new THREE.Vector3(spread * 1.35, -1.08, -0.15),
        new THREE.Vector3(spread * 1.75, -1.42, 0.05),
      ]);
      const tube = new THREE.TubeGeometry(curve, 24, 0.02, 6, false);
      ribbonGeos.push(tube);
    }

    return {
      bladeGeo,
      fullerGeo,
      hiltGuardGeo,
      spearRayGeo,
      breastGeo,
      tassetGeo,
      ribbonGeos,
    };
  }, []);

  // Dynamic PBR Materials driven by WorldState
  const materials = useMemo(() => {
    const obsidianArmor = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(theme.obsidianHex),
      metalness: 0.92,
      roughness: 0.14,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      reflectivity: 1.0,
      envMapIntensity: 2.8,
    });

    const imperialGold = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(theme.goldHex),
      metalness: 0.98,
      roughness: 0.18,
      clearcoat: 0.65,
      clearcoatRoughness: 0.14,
      envMapIntensity: 3.2,
    });

    const astralEmissive = new THREE.MeshStandardMaterial({
      color: new THREE.Color(theme.primaryHex),
      emissive: new THREE.Color(theme.primaryHex),
      emissiveIntensity: 2.1,
      roughness: 0.15,
      metalness: 0.3,
      toneMapped: false,
    });

    const coreWireframe = new THREE.MeshStandardMaterial({
      color: new THREE.Color(theme.auraHex),
      emissive: new THREE.Color(theme.secondaryHex),
      emissiveIntensity: 2.6,
      wireframe: true,
      toneMapped: false,
    });

    const secondaryEmissive = new THREE.MeshStandardMaterial({
      color: new THREE.Color(theme.secondaryHex),
      emissive: new THREE.Color(theme.secondaryHex),
      emissiveIntensity: 2.4,
      roughness: 0.2,
      metalness: 0.5,
      toneMapped: false,
    });

    return {
      obsidianArmor,
      imperialGold,
      astralEmissive,
      coreWireframe,
      secondaryEmissive,
    };
  }, [theme]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const dt = Math.min(delta, 0.1);
    const pointer = state.pointer;

    // 1. Floating Zero-Gravity Hover of Root Entity at [0, 0.58, 0]
    if (rootGroupRef.current) {
      const targetY = 0.58 + Math.sin(t * 1.45) * 0.08 + (isAwakened ? 0.2 : 0);
      rootGroupRef.current.position.y = THREE.MathUtils.damp(
        rootGroupRef.current.position.y,
        targetY,
        4.0,
        dt
      );
    }

    // 2. Interactive Head & Torso IK Mouse Tracking
    if (headGroupRef.current && torsoGroupRef.current) {
      const targetHeadYaw = pointer.x * 0.46;
      const targetHeadPitch = -pointer.y * 0.28 + Math.sin(t * 1.1) * 0.04;

      headGroupRef.current.rotation.y = THREE.MathUtils.damp(
        headGroupRef.current.rotation.y,
        targetHeadYaw,
        5.5,
        dt
      );
      headGroupRef.current.rotation.x = THREE.MathUtils.damp(
        headGroupRef.current.rotation.x,
        targetHeadPitch,
        5.5,
        dt
      );

      torsoGroupRef.current.rotation.y = THREE.MathUtils.damp(
        torsoGroupRef.current.rotation.y,
        targetHeadYaw * 0.5,
        4.2,
        dt
      );
      torsoGroupRef.current.rotation.x = THREE.MathUtils.damp(
        torsoGroupRef.current.rotation.x,
        targetHeadPitch * 0.35,
        4.2,
        dt
      );
    }

    // 3. 12-Spoke Solar Halo Rotation behind the Helm
    if (haloGroupRef.current) {
      const haloSpeed = isAwakened ? 2.6 : 0.38;
      haloGroupRef.current.rotation.z += dt * haloSpeed;
    }

    // 4. Singularity Heart Core Pulse & Gimbal Counter-Rotation
    if (heartCoreRef.current && heartCageOuterRef.current && heartCageInnerRef.current) {
      const beat = 1.0 + Math.sin(t * (isAwakened ? 14.0 : 4.2)) * (isAwakened ? 0.22 : 0.1);
      heartCoreRef.current.scale.setScalar(beat);
      heartCageOuterRef.current.rotation.y += dt * (isAwakened ? 3.8 : 1.1);
      heartCageOuterRef.current.rotation.x += dt * (isAwakened ? 2.4 : 0.7);
      heartCageInnerRef.current.rotation.z -= dt * (isAwakened ? 4.5 : 1.4);

      materials.astralEmissive.emissiveIntensity = THREE.MathUtils.damp(
        materials.astralEmissive.emissiveIntensity,
        isAwakened ? 7.5 : 2.1,
        6.0,
        dt
      );
    }

    // 5. Floating Imperial Spear / Halberd of Resonance
    if (halberdRef.current) {
      halberdRef.current.position.y = 0.15 + Math.sin(t * 2.0 + 1.2) * 0.09;
      halberdRef.current.rotation.z = -0.14 + Math.cos(t * 1.5) * 0.03;
    }

    // 6. Exploded Armor Dissection Transitions (Act III or Toggle Button)
    const exp = isArmorExploded ? 1.0 : 0.0;
    if (chestLeftRef.current && chestRightRef.current) {
      chestLeftRef.current.position.x = THREE.MathUtils.damp(
        chestLeftRef.current.position.x,
        -0.18 - exp * 0.42,
        5.0,
        dt
      );
      chestLeftRef.current.position.z = THREE.MathUtils.damp(
        chestLeftRef.current.position.z,
        0.13 + exp * 0.24,
        5.0,
        dt
      );

      chestRightRef.current.position.x = THREE.MathUtils.damp(
        chestRightRef.current.position.x,
        0.18 + exp * 0.42,
        5.0,
        dt
      );
      chestRightRef.current.position.z = THREE.MathUtils.damp(
        chestRightRef.current.position.z,
        0.13 + exp * 0.24,
        5.0,
        dt
      );
    }

    if (pauldronLeftRef.current && pauldronRightRef.current) {
      pauldronLeftRef.current.position.x = THREE.MathUtils.damp(
        pauldronLeftRef.current.position.x,
        -0.52 - exp * 0.48,
        5.0,
        dt
      );
      pauldronLeftRef.current.position.y = THREE.MathUtils.damp(
        pauldronLeftRef.current.position.y,
        0.38 + exp * 0.26,
        5.0,
        dt
      );

      pauldronRightRef.current.position.x = THREE.MathUtils.damp(
        pauldronRightRef.current.position.x,
        0.52 + exp * 0.48,
        5.0,
        dt
      );
      pauldronRightRef.current.position.y = THREE.MathUtils.damp(
        pauldronRightRef.current.position.y,
        0.38 + exp * 0.26,
        5.0,
        dt
      );
    }

    if (tassetLeftRef.current && tassetRightRef.current) {
      tassetLeftRef.current.position.x = THREE.MathUtils.damp(
        tassetLeftRef.current.position.x,
        -0.25 - exp * 0.35,
        5.0,
        dt
      );
      tassetRightRef.current.position.x = THREE.MathUtils.damp(
        tassetRightRef.current.position.x,
        0.25 + exp * 0.35,
        5.0,
        dt
      );
    }

    // 7. THE 24 TELEKINETIC BLADE-WINGS CHOREOGRAPHY
    for (let i = 0; i < wingBlades.length; i++) {
      const bladeGrp = wingBladeRefs.current[i];
      if (!bladeGrp) continue;
      const meta = wingBlades[i];

      if (isAwakened) {
        const wheelAngle = (i / 24) * Math.PI * 2 + t * 2.35;
        const wheelRadius = 2.65 + (i % 2) * 0.32;
        const tx = Math.cos(wheelAngle) * wheelRadius;
        const ty = 0.35 + Math.sin(wheelAngle) * wheelRadius;
        const tz = -0.45 + Math.sin(t * 4.0 + i) * 0.22;

        bladeGrp.position.x = THREE.MathUtils.damp(bladeGrp.position.x, tx, 6.5, dt);
        bladeGrp.position.y = THREE.MathUtils.damp(bladeGrp.position.y, ty, 6.5, dt);
        bladeGrp.position.z = THREE.MathUtils.damp(bladeGrp.position.z, tz, 6.5, dt);

        bladeGrp.rotation.x = THREE.MathUtils.damp(bladeGrp.position.x, 0.22, 6.5, dt);
        bladeGrp.rotation.y = THREE.MathUtils.damp(bladeGrp.rotation.y, 0.0, 6.5, dt);
        bladeGrp.rotation.z = THREE.MathUtils.damp(
          bladeGrp.rotation.z,
          wheelAngle - Math.PI / 2,
          8.0,
          dt
        );
      } else {
        const basePos = isArmorExploded ? meta.explodePos : meta.idlePos;
        const waveY = Math.sin(t * 2.2 + meta.row * 0.38) * 0.055;
        const waveZ = Math.cos(t * 1.8 + meta.row * 0.42) * 0.035;
        const waveRotZ = Math.sin(t * 2.0 + meta.row * 0.35) * 0.065 * meta.side;

        scratchVec.set(basePos.x, basePos.y + waveY, basePos.z + waveZ);

        bladeGrp.position.x = THREE.MathUtils.damp(bladeGrp.position.x, scratchVec.x, 5.0, dt);
        bladeGrp.position.y = THREE.MathUtils.damp(bladeGrp.position.y, scratchVec.y, 5.0, dt);
        bladeGrp.position.z = THREE.MathUtils.damp(bladeGrp.position.z, scratchVec.z, 5.0, dt);

        bladeGrp.rotation.x = THREE.MathUtils.damp(
          bladeGrp.rotation.x,
          meta.idleRot.x,
          5.0,
          dt
        );
        bladeGrp.rotation.y = THREE.MathUtils.damp(
          bladeGrp.rotation.y,
          meta.idleRot.y,
          5.0,
          dt
        );
        bladeGrp.rotation.z = THREE.MathUtils.damp(
          bladeGrp.rotation.z,
          meta.idleRot.z + waveRotZ,
          5.0,
          dt
        );
      }
    }
  });

  const showAnatomyCallouts = isArmorExploded || currentAct === 3;

  return (
    <group ref={rootGroupRef} position={[0, 0.58, 0]} scale={1.12}>
      {/* =====================================================================
          TORSO, HEAD & LEG ARMOR RIG
         ===================================================================== */}
      <group ref={torsoGroupRef}>
        {/* -------------------------------------------------------------------
            A. FLOATING OBSIDIAN VALKYRIE GREATHELM & 12-SPOKE SOLAR HALO
           ------------------------------------------------------------------- */}
        <group ref={headGroupRef} position={[0, 0.82, 0]}>
          {/* Sculpted Faceless Obsidian Cranium */}
          <mesh material={materials.obsidianArmor} castShadow receiveShadow scale={[0.78, 1.15, 0.88]}>
            <icosahedronGeometry args={[0.24, 3]} />
          </mesh>

          {/* Tapered Angular Valkyrie Visor Mask */}
          <mesh
            position={[0, -0.05, 0.13]}
            rotation={[Math.PI, 0, 0]}
            scale={[0.92, 1.0, 0.82]}
            material={materials.obsidianArmor}
            castShadow
          >
            <coneGeometry args={[0.17, 0.34, 4]} />
          </mesh>

          {/* Golden Brow Crown & Cheek Guards */}
          <mesh
            position={[0, 0.08, 0.15]}
            rotation={[0.25, 0, 0]}
            material={materials.imperialGold}
            castShadow
          >
            <torusGeometry args={[0.16, 0.018, 12, 32, Math.PI]} />
          </mesh>

          {/* Glowing Vertical & Cross Visor Slit */}
          <mesh position={[0, 0.01, 0.222]} material={materials.astralEmissive}>
            <boxGeometry args={[0.014, 0.19, 0.015]} />
          </mesh>
          <mesh
            position={[-0.055, 0.03, 0.21]}
            rotation={[0, 0.35, -0.28]}
            material={materials.astralEmissive}
          >
            <boxGeometry args={[0.095, 0.012, 0.012]} />
          </mesh>
          <mesh
            position={[0.055, 0.03, 0.21]}
            rotation={[0, -0.35, 0.28]}
            material={materials.astralEmissive}
          >
            <boxGeometry args={[0.095, 0.012, 0.012]} />
          </mesh>

          {/* Swept-Back Imperial Golden Valkyrie Head-Wings */}
          {[-1, 1].map((s) => (
            <group key={s} position={[s * 0.18, 0.14, -0.02]} rotation={[0.22, s * -0.18, s * -0.28]}>
              <mesh material={materials.imperialGold} castShadow>
                <coneGeometry args={[0.042, 0.56, 4]} />
              </mesh>
              <mesh position={[s * 0.04, -0.06, -0.04]} material={materials.obsidianArmor} castShadow>
                <coneGeometry args={[0.032, 0.44, 4]} />
              </mesh>
            </group>
          ))}

          {/* Center Sovereign Crown Spire */}
          <mesh
            position={[0, 0.32, 0.04]}
            rotation={[-0.1, 0, 0]}
            material={materials.imperialGold}
            castShadow
          >
            <coneGeometry args={[0.032, 0.44, 4]} />
          </mesh>

          {/* Rotating 12-Spoke Golden Solar Halo tilted behind the head */}
          <group ref={haloGroupRef} position={[0, 0.1, -0.26]} rotation={[-0.26, 0, 0]}>
            <mesh material={materials.imperialGold} castShadow>
              <torusGeometry args={[0.52, 0.018, 16, 64]} />
            </mesh>
            <mesh material={materials.astralEmissive}>
              <torusGeometry args={[0.45, 0.006, 12, 48]} />
            </mesh>
            {Array.from({ length: 12 }).map((_, idx) => {
              const ang = (idx / 12) * Math.PI * 2;
              const isMajor = idx % 3 === 0;
              return (
                <group key={idx} rotation={[0, 0, ang]}>
                  <mesh
                    position={[0, isMajor ? 0.72 : 0.64, 0]}
                    scale={isMajor ? [1.15, 1.25, 1] : [0.8, 0.8, 1]}
                    geometry={geometries.spearRayGeo}
                    material={isMajor ? materials.astralEmissive : materials.imperialGold}
                  />
                </group>
              );
            })}
          </group>

          {showAnatomyCallouts && (
            <Html position={[0.85, 0.42, 0]} center distanceFactor={8}>
              <div className="pointer-events-none select-none whitespace-nowrap rounded border border-amber-400/50 bg-black/85 px-2.5 py-1 font-mono text-[10px] tracking-[0.2em] text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.3)] backdrop-blur-md">
                <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
                CROWN // XII-SPOKE SOLAR HALO
              </div>
            </Html>
          )}
        </group>

        {/* -------------------------------------------------------------------
            B. NECK GORGET, SINGULARITY HEART CORE & WAIST FAULD BELT
           ------------------------------------------------------------------- */}
        {/* Armored Neck Gorget & Golden Collar */}
        <group position={[0, 0.56, 0.02]}>
          <mesh material={materials.obsidianArmor} castShadow>
            <cylinderGeometry args={[0.12, 0.19, 0.18, 8]} />
          </mesh>
          <mesh position={[0, -0.05, 0.02]} rotation={[1.35, 0, 0]} material={materials.imperialGold}>
            <torusGeometry args={[0.18, 0.016, 12, 32]} />
          </mesh>
        </group>

        <group position={[0, 0.2, 0.04]}>
          {/* Inner Pulsing Singularity Core */}
          <mesh ref={heartCoreRef} material={materials.astralEmissive}>
            <icosahedronGeometry args={[0.1, 2]} />
          </mesh>

          {/* Wireframe Geodesic Containment Matrix */}
          <mesh ref={heartCageOuterRef} material={materials.coreWireframe}>
            <icosahedronGeometry args={[0.17, 1]} />
          </mesh>

          {/* Counter-Rotating Golden Astrolabe Gimbal Ring */}
          <mesh ref={heartCageInnerRef} material={materials.imperialGold}>
            <torusGeometry args={[0.21, 0.012, 12, 48]} />
          </mesh>

          {/* Sculpted Tapered Obsidian Spine & Hourglass Waist Corslet */}
          <mesh position={[0, -0.24, -0.06]} material={materials.obsidianArmor} castShadow>
            <cylinderGeometry args={[0.22, 0.14, 0.44, 8]} />
          </mesh>
          {/* Sculpted Pelvis Armor & Golden Fauld Belt */}
          <mesh position={[0, -0.48, -0.02]} material={materials.obsidianArmor} castShadow>
            <cylinderGeometry args={[0.15, 0.23, 0.22, 8]} />
          </mesh>
          <mesh position={[0, -0.38, 0.0]} rotation={[1.45, 0, 0]} material={materials.imperialGold} castShadow>
            <torusGeometry args={[0.18, 0.018, 12, 32]} />
          </mesh>
          {/* Center Golden Belt Buckle Crest */}
          <mesh position={[0, -0.44, 0.17]} rotation={[Math.PI, 0, 0]} material={materials.imperialGold} castShadow>
            <coneGeometry args={[0.075, 0.26, 4]} />
          </mesh>

          {showAnatomyCallouts && (
            <Html position={[-1.05, -0.05, 0.25]} center distanceFactor={8}>
              <div className="pointer-events-none select-none whitespace-nowrap rounded border border-sky-400/50 bg-black/85 px-2.5 py-1 font-mono text-[10px] tracking-[0.2em] text-sky-200 shadow-[0_0_20px_rgba(56,189,248,0.3)] backdrop-blur-md">
                <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-ping rounded-full bg-sky-400" />
                SINGULARITY HEART // 14,200K
              </div>
            </Html>
          )}
        </group>

        {/* -------------------------------------------------------------------
            C. SCULPTED VALKYRIE CUIRASS & LAYERED PAULDRONS (Explodable)
           ------------------------------------------------------------------- */}
        {/* Left Beveled Cuirass Plate */}
        <group ref={chestLeftRef} position={[-0.18, 0.22, 0.13]}>
          <mesh
            rotation={[0.08, -0.25, 0.05]}
            scale={[-1, 1, 1]}
            geometry={geometries.breastGeo}
            material={materials.obsidianArmor}
            castShadow
            receiveShadow
          />
          <mesh
            position={[0.12, 0.02, 0.09]}
            rotation={[0, 0, 0.15]}
            material={materials.imperialGold}
          >
            <boxGeometry args={[0.026, 0.48, 0.028]} />
          </mesh>
          {/* Golden Filigree Rib Trim */}
          {[0, 1].map((r) => (
            <mesh
              key={r}
              position={[-0.02, -0.1 - r * 0.1, 0.085]}
              rotation={[0, -0.2, -0.32]}
              material={materials.imperialGold}
            >
              <boxGeometry args={[0.2, 0.022, 0.02]} />
            </mesh>
          ))}
        </group>

        {/* Right Beveled Cuirass Plate */}
        <group ref={chestRightRef} position={[0.18, 0.22, 0.13]}>
          <mesh
            rotation={[0.08, 0.25, -0.05]}
            geometry={geometries.breastGeo}
            material={materials.obsidianArmor}
            castShadow
            receiveShadow
          />
          <mesh
            position={[-0.12, 0.02, 0.09]}
            rotation={[0, 0, -0.15]}
            material={materials.imperialGold}
          >
            <boxGeometry args={[0.026, 0.48, 0.028]} />
          </mesh>
          {/* Golden Filigree Rib Trim */}
          {[0, 1].map((r) => (
            <mesh
              key={r}
              position={[0.02, -0.1 - r * 0.1, 0.085]}
              rotation={[0, 0.2, 0.32]}
              material={materials.imperialGold}
            >
              <boxGeometry args={[0.2, 0.022, 0.02]} />
            </mesh>
          ))}
        </group>

        {/* Left Multi-Tiered Valkyrie Pauldron & Articulated Arm */}
        <group ref={pauldronLeftRef} position={[-0.52, 0.38, 0.0]}>
          {[0, 1, 2].map((tier) => (
            <mesh
              key={tier}
              position={[-tier * 0.08, -tier * 0.07, 0]}
              rotation={[0, 0, 0.42 + tier * 0.15]}
              scale={[1.15 - tier * 0.12, 0.48, 0.85 - tier * 0.08]}
              material={tier === 1 ? materials.imperialGold : materials.obsidianArmor}
              castShadow
            >
              <octahedronGeometry args={[0.25, 0]} />
            </mesh>
          ))}
          <mesh
            position={[-0.16, -0.32, 0.05]}
            rotation={[0.2, 0, 0.22]}
            material={materials.obsidianArmor}
            castShadow
          >
            <cylinderGeometry args={[0.072, 0.052, 0.36, 8]} />
          </mesh>
          <mesh
            position={[-0.25, -0.62, 0.18]}
            rotation={[0.55, 0.2, 0.18]}
            material={materials.imperialGold}
            castShadow
          >
            <coneGeometry args={[0.068, 0.44, 6]} />
          </mesh>
        </group>

        {/* Right Multi-Tiered Valkyrie Pauldron & Articulated Arm */}
        <group ref={pauldronRightRef} position={[0.52, 0.38, 0.0]}>
          {[0, 1, 2].map((tier) => (
            <mesh
              key={tier}
              position={[tier * 0.08, -tier * 0.07, 0]}
              rotation={[0, 0, -0.42 - tier * 0.15]}
              scale={[1.15 - tier * 0.12, 0.48, 0.85 - tier * 0.08]}
              material={tier === 1 ? materials.imperialGold : materials.obsidianArmor}
              castShadow
            >
              <octahedronGeometry args={[0.25, 0]} />
            </mesh>
          ))}
          <mesh
            position={[0.16, -0.32, 0.05]}
            rotation={[0.2, 0, -0.22]}
            material={materials.obsidianArmor}
            castShadow
          >
            <cylinderGeometry args={[0.072, 0.052, 0.36, 8]} />
          </mesh>
          <mesh
            position={[0.25, -0.62, 0.18]}
            rotation={[0.55, -0.2, -0.18]}
            material={materials.imperialGold}
            castShadow
          >
            <coneGeometry args={[0.068, 0.44, 6]} />
          </mesh>
        </group>

        {/* Floating Telekinetic Spear / Halberd of Resonance beside Right Gauntlet */}
        <group ref={halberdRef} position={[0.88, 0.15, 0.28]} rotation={[0.12, 0, -0.14]}>
          <mesh material={materials.imperialGold} castShadow>
            <cylinderGeometry args={[0.016, 0.012, 2.85, 12]} />
          </mesh>
          <mesh position={[0, 1.55, 0]} geometry={geometries.bladeGeo} scale={0.55} material={materials.imperialGold} />
          <mesh position={[0, 1.35, 0]} material={materials.astralEmissive}>
            <octahedronGeometry args={[0.075, 0]} />
          </mesh>
        </group>

        {/* -------------------------------------------------------------------
            D. SCULPTED GOTHIC HIP TASSETS, VALKYRIE GREAVES & CURVED RIBBONS
           ------------------------------------------------------------------- */}
        {/* Left Swept Hip Tasset Plate */}
        <group ref={tassetLeftRef} position={[-0.25, -0.54, 0.05]} rotation={[0.06, 0.25, 0.26]}>
          <mesh geometry={geometries.tassetGeo} material={materials.obsidianArmor} castShadow />
          <mesh position={[-0.06, 0.0, 0.03]} rotation={[0, 0, 0.22]} material={materials.imperialGold}>
            <boxGeometry args={[0.022, 0.64, 0.02]} />
          </mesh>
        </group>

        {/* Right Swept Hip Tasset Plate */}
        <group ref={tassetRightRef} position={[0.25, -0.54, 0.05]} rotation={[0.06, -0.25, -0.26]}>
          <mesh
            scale={[-1, 1, 1]}
            geometry={geometries.tassetGeo}
            material={materials.obsidianArmor}
            castShadow
          />
          <mesh position={[0.06, 0.0, 0.03]} rotation={[0, 0, -0.22]} material={materials.imperialGold}>
            <boxGeometry args={[0.022, 0.64, 0.02]} />
          </mesh>
        </group>

        {/* Articulated Armored Valkyrie Legs & Sabatons in Zero-Gravity Hover Pose */}
        {/* Left Leg */}
        <group position={[-0.14, -0.46, 0.02]} rotation={[0.06, 0, 0.04]}>
          <mesh position={[0, -0.2, 0]} material={materials.obsidianArmor} castShadow>
            <cylinderGeometry args={[0.105, 0.072, 0.44, 8]} />
          </mesh>
          <mesh position={[0, -0.42, 0.05]} scale={[0.85, 1.25, 0.85]} material={materials.imperialGold} castShadow>
            <octahedronGeometry args={[0.075, 0]} />
          </mesh>
          <mesh
            position={[0, -0.74, -0.03]}
            rotation={[Math.PI + 0.1, 0, 0]}
            material={materials.obsidianArmor}
            castShadow
          >
            <coneGeometry args={[0.074, 0.62, 6]} />
          </mesh>
        </group>

        {/* Right Leg (Poised slightly forward) */}
        <group position={[0.14, -0.44, 0.08]} rotation={[-0.18, 0, -0.05]}>
          <mesh position={[0, -0.18, 0]} material={materials.obsidianArmor} castShadow>
            <cylinderGeometry args={[0.105, 0.072, 0.42, 8]} />
          </mesh>
          <mesh position={[0, -0.38, 0.05]} scale={[0.85, 1.25, 0.85]} material={materials.imperialGold} castShadow>
            <octahedronGeometry args={[0.075, 0]} />
          </mesh>
          <mesh
            position={[0, -0.68, -0.06]}
            rotation={[Math.PI + 0.28, 0, 0]}
            material={materials.obsidianArmor}
            castShadow
          >
            <coneGeometry args={[0.074, 0.6, 6]} />
          </mesh>
        </group>

        {/* Curved Zero-Gravity Silk-Metal Cloak Ribbons */}
        <group>
          {geometries.ribbonGeos.map((tubeGeo, rIdx) => (
            <mesh
              key={rIdx}
              geometry={tubeGeo}
              material={rIdx % 2 === 0 ? materials.imperialGold : materials.obsidianArmor}
              castShadow
            />
          ))}
        </group>
      </group>

      {/* =====================================================================
          E. THE 24 TELEKINETIC BLADE-WINGS (12 LEFT + 12 RIGHT)
         ===================================================================== */}
      <group>
        {wingBlades.map((meta, idx) => (
          <group
            key={meta.index}
            ref={(el) => {
              wingBladeRefs.current[idx] = el;
            }}
            position={meta.idlePos.toArray()}
            rotation={[meta.idleRot.x, meta.idleRot.y, meta.idleRot.z]}
            scale={meta.bladeScale}
          >
            {/* Diamond-Faceted Obsidian-Gold Blade Body */}
            <mesh
              geometry={geometries.bladeGeo}
              material={idx % 3 === 0 ? materials.imperialGold : materials.obsidianArmor}
              castShadow
              receiveShadow
            />

            {/* Glowing Runic Energy Fuller Core along the center of each sword */}
            <mesh geometry={geometries.fullerGeo} material={materials.astralEmissive} />

            {/* Sculpted Imperial Gold Crossguard / Hilt */}
            <mesh geometry={geometries.hiltGuardGeo} material={materials.imperialGold} castShadow />
          </group>
        ))}

        {showAnatomyCallouts && (
          <Html position={[1.65, 0.55, -0.2]} center distanceFactor={8}>
            <div className="pointer-events-none select-none whitespace-nowrap rounded border border-amber-400/50 bg-black/85 px-2.5 py-1 font-mono text-[10px] tracking-[0.2em] text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.3)] backdrop-blur-md">
              <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
              BLADE WINGS // XXIV TELEKINETIC SWORDS
            </div>
          </Html>
        )}
      </group>
    </group>
  );
};
