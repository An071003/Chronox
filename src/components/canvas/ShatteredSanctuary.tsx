import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { useEclipseStore, WORLD_STATE_THEMES } from '../../store/useEclipseStore';
import { createRuneDisplacementTexture } from '../../utils/proceduralArtGenerator';

interface MonolithMeta {
  position: [number, number, number];
  scale: [number, number, number];
  rotationY: number;
  tiltZ: number;
  phase: number;
}

export const ShatteredSanctuary: React.FC = () => {
  const worldState = useEclipseStore((s) => s.worldState);
  const isAwakened = useEclipseStore((s) => s.isAwakened);
  const isArmorExploded = useEclipseStore((s) => s.isArmorExploded);

  const theme = WORLD_STATE_THEMES[worldState];

  const outerAstrolabeRef = useRef<THREE.Group>(null);
  const midAstrolabeRef = useRef<THREE.Group>(null);
  const innerAstrolabeRef = useRef<THREE.Group>(null);
  const monolithGroupRef = useRef<THREE.Group>(null);
  const cursorOrbRef = useRef<THREE.Group>(null);

  // Pre-compute 60 Ancient Basalt Monolith Pillars in a grand horseshoe amphitheater (-118° to +118°)
  // Leaving the front camera sightline 100% unobstructed!
  const monoliths = useMemo<MonolithMeta[]>(() => {
    const items: MonolithMeta[] = [];
    for (let i = 0; i < 60; i++) {
      const t = i / 59; // 0 to 1
      // Map across [-118 deg, +118 deg] horseshoe arc behind & flanking the Sanctuary
      const deg = -118 + t * 236;
      const angle = THREE.MathUtils.degToRad(deg);
      const ringLayer = i % 3;
      const radius = 8.8 + ringLayer * 2.4 + Math.sin(i * 3.1) * 0.55;
      const x = Math.sin(angle) * radius;
      const z = -Math.cos(angle) * radius;

      const height = 2.8 + ((i * 7) % 5) * 0.68;
      const width = 0.36 + (i % 3) * 0.09;
      const baseY = -2.2 + height * 0.46;

      items.push({
        position: [x, baseY, z],
        scale: [width, height, width],
        rotationY: -angle,
        tiltZ: Math.sin(i * 1.9) * 0.05,
        phase: i * 0.37,
      });
    }
    return items;
  }, []);

  // Procedural Runic Basalt Material & Astrolabe Gold Material
  const materials = useMemo(() => {
    const { bumpMap, emissiveMap } = createRuneDisplacementTexture(theme.primaryHex);

    const monolithMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#0B0E16'),
      roughness: 0.32,
      metalness: 0.76,
      bumpMap,
      bumpScale: 0.045,
      emissive: new THREE.Color(theme.primaryHex),
      emissiveMap,
      emissiveIntensity: 1.5,
    });

    const astrolabeGoldMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(theme.goldHex),
      metalness: 0.98,
      roughness: 0.2,
      clearcoat: 0.75,
      clearcoatRoughness: 0.15,
      envMapIntensity: 2.6,
    });

    const coronaMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(theme.primaryHex),
      transparent: true,
      opacity: 0.85,
    });

    return { monolithMat, astrolabeGoldMat, coronaMat };
  }, [theme.primaryHex, theme.goldHex]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const dt = Math.min(delta, 0.1);
    const speedMult = isAwakened ? 3.2 : 1.0;

    // 1. 3 Concentric Astrolabe Rings Gyroscopic Rotation
    if (outerAstrolabeRef.current && midAstrolabeRef.current && innerAstrolabeRef.current) {
      outerAstrolabeRef.current.rotation.z += dt * 0.12 * speedMult;
      outerAstrolabeRef.current.rotation.y = Math.sin(t * 0.35) * 0.22;

      midAstrolabeRef.current.rotation.x += dt * 0.18 * speedMult;
      midAstrolabeRef.current.rotation.y -= dt * 0.14 * speedMult;

      innerAstrolabeRef.current.rotation.z -= dt * 0.24 * speedMult;
      innerAstrolabeRef.current.rotation.x = Math.cos(t * 0.5) * 0.32;

      const targetScale = isArmorExploded ? 1.18 : 1.0;
      outerAstrolabeRef.current.scale.setScalar(
        THREE.MathUtils.damp(outerAstrolabeRef.current.scale.x, targetScale, 4.0, dt)
      );
    }

    // 2. 60 Monolith Pillars Levitation & 4x Emissive Surge during Divine Awakening
    if (monolithGroupRef.current) {
      const targetLift = isAwakened ? 0.85 : 0.0;
      monolithGroupRef.current.position.y = THREE.MathUtils.damp(
        monolithGroupRef.current.position.y,
        targetLift,
        4.5,
        dt
      );
      materials.monolithMat.emissiveIntensity = THREE.MathUtils.damp(
        materials.monolithMat.emissiveIntensity,
        isAwakened ? 4.2 : 0.85,
        5.0,
        dt
      );
    }

    // 3. Cursor Light Orb tracking pointer across the Sanctuary
    if (cursorOrbRef.current) {
      const tx = state.pointer.x * 3.8;
      const ty = 0.6 + state.pointer.y * 2.1;
      const tz = 1.65;
      cursorOrbRef.current.position.x = THREE.MathUtils.damp(
        cursorOrbRef.current.position.x,
        tx,
        8.0,
        dt
      );
      cursorOrbRef.current.position.y = THREE.MathUtils.damp(
        cursorOrbRef.current.position.y,
        ty,
        8.0,
        dt
      );
      cursorOrbRef.current.position.z = tz;
    }
  });

  return (
    <group>
      {/* =====================================================================
          1. CELESTIAL SOLAR ECLIPSE BLACK SUN & CORONA (At [0, 4.5, -10.5])
         ===================================================================== */}
      <group position={[0, 4.5, -10.5]}>
        {/* Total Eclipse Obsidian Moon Disc */}
        <mesh>
          <circleGeometry args={[2.35, 64]} />
          <meshBasicMaterial color="#020306" />
        </mesh>
        {/* Blazing Solar Corona Ring */}
        <mesh position={[0, 0, -0.05]} material={materials.coronaMat}>
          <ringGeometry args={[2.32, 2.58, 64]} />
        </mesh>
        {/* Outer Soft Corona Halo */}
        <mesh position={[0, 0, -0.1]}>
          <ringGeometry args={[2.55, 3.25, 64]} />
          <meshBasicMaterial color={theme.primaryHex} transparent opacity={0.22} />
        </mesh>
      </group>

      {/* =====================================================================
          2. THREE CONCENTRIC ENGRAVED BRASS ASTROLABE RINGS (3.2m, 2.6m, 2.0m)
         ===================================================================== */}
      <group position={[0, 1.25, -3.8]}>
        {/* Outer Astrolabe Ring (Radius = 3.2m) + 24 Carved Celestial Notches */}
        <group ref={outerAstrolabeRef} rotation={[0.28, 0, 0]}>
          <mesh material={materials.astrolabeGoldMat} castShadow>
            <torusGeometry args={[3.2, 0.042, 16, 96]} />
          </mesh>
          {Array.from({ length: 24 }).map((_, i) => {
            const a = (i / 24) * Math.PI * 2;
            return (
              <mesh
                key={i}
                position={[Math.cos(a) * 3.2, Math.sin(a) * 3.2, 0]}
                rotation={[0, 0, a]}
                material={materials.astrolabeGoldMat}
              >
                <boxGeometry args={[0.16, 0.025, 0.09]} />
              </mesh>
            );
          })}
        </group>

        {/* Mid Astrolabe Ring (Radius = 2.6m) */}
        <group ref={midAstrolabeRef} rotation={[-0.42, 0.25, 0]}>
          <mesh material={materials.astrolabeGoldMat} castShadow>
            <torusGeometry args={[2.6, 0.032, 16, 84]} />
          </mesh>
        </group>

        {/* Inner Astrolabe Ring (Radius = 2.0m) */}
        <group ref={innerAstrolabeRef} rotation={[0.18, -0.35, 0]}>
          <mesh material={materials.astrolabeGoldMat} castShadow>
            <torusGeometry args={[2.0, 0.024, 16, 72]} />
          </mesh>
        </group>
      </group>

      {/* =====================================================================
          3. 60 ANCIENT RUNIC BASALT MONOLITH PILLARS
         ===================================================================== */}
      <group ref={monolithGroupRef}>
        {monoliths.map((m, idx) => (
          <mesh
            key={idx}
            position={m.position}
            scale={m.scale}
            rotation={[0, m.rotationY, m.tiltZ]}
            material={materials.monolithMat}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[1, 1, 1]} />
          </mesh>
        ))}
      </group>

      {/* =====================================================================
          4. INTERACTIVE CURSOR LIGHT ORB & GOLDEN EMBER SPARKLES
         ===================================================================== */}
      <group ref={cursorOrbRef} position={[0, 0.8, 1.65]}>
        <pointLight
          color={theme.primaryHex}
          intensity={isAwakened ? 6.5 : 3.2}
          distance={5.5}
          decay={2}
        />
        <mesh>
          <sphereGeometry args={[0.032, 16, 16]} />
          <meshBasicMaterial color={theme.auraHex} />
        </mesh>
      </group>

      {/* Atmospheric Zero-Gravity Ember & Astral Dust Field */}
      <Sparkles
        count={isAwakened ? 220 : 120}
        scale={[16, 8, 16]}
        position={[0, 1.2, 0]}
        size={isAwakened ? 3.2 : 1.8}
        speed={isAwakened ? 1.4 : 0.35}
        opacity={0.75}
        color={theme.primaryHex}
      />
    </group>
  );
};
