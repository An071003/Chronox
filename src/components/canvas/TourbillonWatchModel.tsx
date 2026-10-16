import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import {
  useHorologyStore,
  HOROLOGY_EDITIONS,
} from '../../store/useHorologyStore';
import {
  createGearGeometry,
  createOctagonalBezelGeometry,
  createDauphineHandGeometry,
  createSpiralSpringGeometry,
} from '../../utils/gearGeometryGenerator';
import { createHorologyDialTexture } from '../../utils/dialTextureGenerator';
import {
  createLinearSatinTexture,
  createRadialBrushedTexture,
  createCotesDeGeneveTexture,
} from '../../utils/metalTextureGenerator';
import { horologyAudio } from '../../utils/horologyAudioEngine';

// Pre-allocated colors outside useFrame (SKILL 3: Zero Allocation in useFrame)
const LUME_CYAN_COLOR = new THREE.Color('#00F5D4');
const LUME_EMERALD_COLOR = new THREE.Color('#00FF66');
const DAY_NO_EMISSIVE = new THREE.Color('#000000');

/**
 * Reusable Synthetic Ruby Jewel Bearing + 18K Gold Chaton Ring + Blued Steel Micro-Screws
 */
const RubyJewelBearing: React.FC<{
  position: [number, number, number];
  radius?: number;
  chatonColor?: string;
}> = ({ position, radius = 0.042, chatonColor = '#E5C17B' }) => {
  return (
    <group position={position}>
      {/* Polished Gold Chaton Setting */}
      <mesh>
        <torusGeometry args={[radius * 1.25, radius * 0.26, 16, 32]} />
        <meshPhysicalMaterial
          color={chatonColor}
          metalness={0.98}
          roughness={0.1}
          envMapIntensity={2.4}
          clearcoat={0.6}
        />
      </mesh>
      {/* Translucent Synthetic Corundum Ruby (#e11d48, IOR 1.77) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius, radius * 0.88, 0.026, 24]} />
        <meshPhysicalMaterial
          color="#e11d48"
          emissive="#9f1239"
          emissiveIntensity={0.55}
          metalness={0.08}
          roughness={0.05}
          transmission={0.86}
          ior={1.77}
          thickness={0.08}
          clearcoat={1}
        />
      </mesh>
    </group>
  );
};

export const TourbillonWatchModel: React.FC = () => {
  const editionId = useHorologyStore((s) => s.edition);
  const isNightLume = useHorologyStore((s) => s.isNightLume);
  const explodedProgress = useHorologyStore((s) => s.explodedProgress);
  const windMainspring = useHorologyStore((s) => s.windMainspring);
  const toggleChrono = useHorologyStore((s) => s.toggleChrono);
  const resetChrono = useHorologyStore((s) => s.resetChrono);

  const edition = HOROLOGY_EDITIONS[editionId];

  // Hover states for direct 3D interaction
  const [hoveredPart, setHoveredPart] = useState<'crown' | 'start' | 'reset' | null>(null);

  useEffect(() => {
    if (hoveredPart === 'crown') {
      document.body.style.cursor = 'ns-resize';
    } else if (hoveredPart === 'start' || hoveredPart === 'reset') {
      document.body.style.cursor = 'pointer';
    } else {
      document.body.style.cursor = 'auto';
    }
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hoveredPart]);

  // Layer Group Refs for 6-Layer Exploded Calibre Teardown
  const layer01CasebackRef = useRef<THREE.Group>(null);
  const layer02GearsRef = useRef<THREE.Group>(null);
  const layer03TourbillonRef = useRef<THREE.Group>(null);
  const layer04BridgesHandsRef = useRef<THREE.Group>(null);
  const layer05BezelCrownRef = useRef<THREE.Group>(null);
  const layer06SapphireRef = useRef<THREE.Group>(null);

  // Mechanical Moving Part Refs
  const gearBarrelRef = useRef<THREE.Mesh>(null);
  const mainspringCoilRef = useRef<THREE.Mesh>(null);
  const gearCenterWheelRef = useRef<THREE.Mesh>(null);
  const gearThirdWheelRef = useRef<THREE.Mesh>(null);
  const gearFourthWheelRef = useRef<THREE.Mesh>(null);

  // Tourbillon Refs (at 6 o'clock)
  const tourbillonCarriageRef = useRef<THREE.Group>(null);
  const tourbillonBalanceWheelRef = useRef<THREE.Group>(null);
  const hairspringSpiralRef = useRef<THREE.Mesh>(null);

  // Hands & Sub-Dial Needle Refs
  const handHourRef = useRef<THREE.Group>(null);
  const handMinuteRef = useRef<THREE.Group>(null);
  const handChronoSecondRef = useRef<THREE.Group>(null);
  const handPowerReserveRef = useRef<THREE.Group>(null);
  const handChronoMinuteRef = useRef<THREE.Group>(null);

  // Interactive 3D Crown & Pusher Refs
  const crownGroupRef = useRef<THREE.Group>(null);
  const pusherStartGroupRef = useRef<THREE.Group>(null);
  const pusherResetGroupRef = useRef<THREE.Group>(null);

  // Internal Calibre Specular Glint Light Ref
  const calibreGlintLightRef = useRef<THREE.PointLight>(null);

  // Super-LumiNova Material Refs for dynamic Night Lume transitions
  const lumeCyanMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const lumeEmeraldMatRef = useRef<THREE.MeshStandardMaterial>(null);

  // Persistent animation state (zero allocations in useFrame)
  const animState = useRef({
    simOffsetSeconds: 0,
    lastQuantizedTick: -1,
    dampedTourbillonAngle: 0,
    dampedChronoSecAngle: 0,
    lastFlybackTrigger: 0,
    dampedCrownAngle: 0,
    dampedPusherStartX: 0,
    dampedPusherResetX: 0,
    dampedPowerReserveAngle: 0,
  });

  // Procedural Metallic Grain Maps (Satin Brush, Radial Lathe, Côtes de Genève)
  const metalTextures = useMemo(() => {
    const linearSatin = createLinearSatinTexture();
    const radialBrushed = createRadialBrushedTexture();
    const geneveStripes = createCotesDeGeneveTexture();
    return { linearSatin, radialBrushed, geneveStripes };
  }, []);

  // Pre-generate Mathematical CAD Geometries (SKILL 1)
  const geometries = useMemo(() => {
    const bezelMain = createOctagonalBezelGeometry(1.32, 1.02, 0.14, 0.024, 0.02);
    const caseMiddle = createOctagonalBezelGeometry(1.36, 1.04, 0.24, 0.018, 0.015);
    const casebackRing = createOctagonalBezelGeometry(1.30, 0.96, 0.08, 0.014, 0.012);

    // True involute toothed gears with skeletonized spoke cutouts
    const gearBarrel = createGearGeometry({
      innerRadius: 0.06,
      pitchRadius: 0.34,
      outerRadius: 0.375,
      teethCount: 36,
      thickness: 0.036,
      spokeCount: 5,
      bevelThickness: 0.005,
      bevelSize: 0.004,
    });

    const gearCenter = createGearGeometry({
      innerRadius: 0.07,
      pitchRadius: 0.41,
      outerRadius: 0.445,
      teethCount: 48,
      thickness: 0.032,
      spokeCount: 6,
      bevelThickness: 0.005,
      bevelSize: 0.004,
    });

    const gearThird = createGearGeometry({
      innerRadius: 0.05,
      pitchRadius: 0.25,
      outerRadius: 0.28,
      teethCount: 32,
      thickness: 0.030,
      spokeCount: 4,
      bevelThickness: 0.0045,
      bevelSize: 0.0035,
    });

    const gearFourth = createGearGeometry({
      innerRadius: 0.045,
      pitchRadius: 0.21,
      outerRadius: 0.238,
      teethCount: 28,
      thickness: 0.028,
      spokeCount: 4,
      bevelThickness: 0.0045,
      bevelSize: 0.0035,
    });

    const tourbillonCarriageGear = createGearGeometry({
      innerRadius: 0.235,
      pitchRadius: 0.268,
      outerRadius: 0.285,
      teethCount: 24,
      thickness: 0.028,
      spokeCount: 3,
      bevelThickness: 0.0045,
      bevelSize: 0.0035,
    });

    const balanceWheelRim = createGearGeometry({
      innerRadius: 0.15,
      pitchRadius: 0.20,
      outerRadius: 0.218,
      teethCount: 16,
      thickness: 0.024,
      spokeCount: 3,
      bevelThickness: 0.004,
      bevelSize: 0.003,
    });

    const crownKnurled = createGearGeometry({
      innerRadius: 0.04,
      pitchRadius: 0.135,
      outerRadius: 0.155,
      teethCount: 22,
      thickness: 0.16,
      spokeCount: 0,
      bevelThickness: 0.008,
      bevelSize: 0.006,
    });

    const mainspringSpiral = createSpiralSpringGeometry(0.06, 0.26, 5, 0.012, 0.022);
    const hairspringSpiral = createSpiralSpringGeometry(0.03, 0.13, 5, 0.005, 0.010);

    const handHour = createDauphineHandGeometry(0.55, 0.12, 0.048, 0.016);
    const handMinute = createDauphineHandGeometry(0.79, 0.15, 0.035, 0.014);
    const handChrono = createDauphineHandGeometry(0.90, 0.22, 0.015, 0.010);
    const handSubDial = createDauphineHandGeometry(0.15, 0.035, 0.018, 0.008);

    return {
      bezelMain,
      caseMiddle,
      casebackRing,
      gearBarrel,
      gearCenter,
      gearThird,
      gearFourth,
      tourbillonCarriageGear,
      balanceWheelRim,
      crownKnurled,
      mainspringSpiral,
      hairspringSpiral,
      handHour,
      handMinute,
      handChrono,
      handSubDial,
    };
  }, []);

  // High-DPI 1024x1024 Swiss Dial & Tachymeter Texture
  const dialTexture = useMemo(() => {
    return createHorologyDialTexture(edition.caseColor, isNightLume);
  }, [edition.caseColor, isNightLume]);

  // Pre-compute 8 Bezel Bolt Positions, 8 Inner Bridge Screws & 12 Hour Index Positions
  const bezelBolts = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => {
      const angle = (i / 8) * Math.PI * 2 + Math.PI / 8;
      return {
        x: Math.cos(angle) * 1.15,
        y: Math.sin(angle) * 1.15,
        rot: angle,
      };
    });
  }, []);

  const innerBridgeScrews = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => {
      const angle = (i / 8) * Math.PI * 2 + Math.PI / 16;
      return {
        x: Math.cos(angle) * 0.74,
        y: Math.sin(angle) * 0.74,
        rot: angle,
      };
    });
  }, []);

  const hourIndices = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const angle = (i / 12) * Math.PI * 2;
      const r = 0.855;
      return {
        index: i === 0 ? 12 : i,
        x: Math.sin(angle) * r,
        y: Math.cos(angle) * r,
        rotZ: -angle,
        isDouble: i === 0,
        isTourbillonSix: i === 6,
        isSubDialThreeNine: i === 3 || i === 9,
      };
    });
  }, []);

  // Main Real-Time Horological Simulation Loop (60 FPS Zero-Allocation)
  useFrame((state, delta) => {
    const clampedDelta = Math.min(delta, 0.1);
    const store = useHorologyStore.getState();
    const st = animState.current;

    // 1. Advance simulated time offset when multiplier != 1
    if (store.timeMultiplier !== 1) {
      st.simOffsetSeconds += clampedDelta * (store.timeMultiplier - 1);
    }

    // Slowly deplete power reserve and decay crown torque indicator
    store.depletePowerReserve(clampedDelta * 0.015 * store.timeMultiplier);
    if (store.crownTorque > 0) {
      store.decayCrownTorque(clampedDelta);
    }

    // Advance chronograph if running
    if (store.isChronoRunning) {
      store.tickChrono(clampedDelta * 1000 * store.timeMultiplier);
    }

    // Orbit internal metallic glint light at a grazing angle so gear teeth & bridges shimmer without central glare
    if (calibreGlintLightRef.current) {
      const t = state.clock.elapsedTime * 0.75;
      calibreGlintLightRef.current.position.set(
        Math.cos(t) * 1.15 + state.pointer.x * 0.5,
        Math.sin(t) * 1.15 + state.pointer.y * 0.5,
        0.24
      );
      calibreGlintLightRef.current.intensity = store.isNightLume ? 0.25 : 1.35;
    }

    // 2. Real-Time System Clock + Mechanical 6Hz (21,600 VPH) Escapement Quantization
    const now = new Date();
    const rawSystemSeconds =
      now.getSeconds() + now.getMilliseconds() / 1000 + st.simOffsetSeconds;

    const tickIndex = Math.floor(rawSystemSeconds * 6);
    const mechanicalSeconds = tickIndex / 6;

    if (tickIndex !== st.lastQuantizedTick) {
      st.lastQuantizedTick = tickIndex;
      if (store.isAudioEnabled) {
        horologyAudio.playEscapementTick(
          store.cameraPreset === 'macro_tourbillon'
        );
      }
    }

    const totalMinutes =
      now.getMinutes() + (rawSystemSeconds % 60) / 60 + st.simOffsetSeconds / 60;
    const totalHours = (now.getHours() % 12) + totalMinutes / 60;

    const hourAngle = -(totalHours / 12) * Math.PI * 2;
    const minuteAngle = -(totalMinutes / 60) * Math.PI * 2;

    if (handHourRef.current) {
      handHourRef.current.rotation.z = hourAngle;
    }
    if (handMinuteRef.current) {
      handMinuteRef.current.rotation.z = minuteAngle;
    }

    // 3. Flying Tourbillon Choreography (at 6 o'clock)
    const targetTourbillonAngle = -(mechanicalSeconds / 60) * Math.PI * 2;
    st.dampedTourbillonAngle = THREE.MathUtils.damp(
      st.dampedTourbillonAngle,
      targetTourbillonAngle,
      28,
      clampedDelta
    );

    if (tourbillonCarriageRef.current) {
      tourbillonCarriageRef.current.rotation.z = st.dampedTourbillonAngle;
    }

    const elapsed = state.clock.elapsedTime * (store.timeMultiplier === 0.1 ? 0.2 : 1);
    const balanceOscillation = Math.sin(elapsed * Math.PI * 6) * 0.65;
    if (tourbillonBalanceWheelRef.current) {
      tourbillonBalanceWheelRef.current.rotation.z = balanceOscillation;
    }

    if (hairspringSpiralRef.current) {
      const breathe = 1.0 + Math.sin(elapsed * Math.PI * 6) * 0.08;
      hairspringSpiralRef.current.scale.set(breathe, breathe, 1);
    }

    // 4. Interlocking Gear Train Ratios
    const gearBaseAngle = st.dampedTourbillonAngle * 0.25;
    if (gearCenterWheelRef.current) {
      gearCenterWheelRef.current.rotation.z = gearBaseAngle;
    }
    if (gearThirdWheelRef.current) {
      gearThirdWheelRef.current.rotation.z = -gearBaseAngle * 2.5 + 0.15;
    }
    if (gearFourthWheelRef.current) {
      gearFourthWheelRef.current.rotation.z = gearBaseAngle * 3.2;
    }
    if (gearBarrelRef.current) {
      gearBarrelRef.current.rotation.z =
        -gearBaseAngle * 0.4 + store.crownWindAngle * 0.25;
    }

    if (mainspringCoilRef.current) {
      const coilScale = 1.04 - (store.powerReserve / 100) * 0.22;
      mainspringCoilRef.current.scale.set(coilScale, coilScale, 1);
      mainspringCoilRef.current.rotation.z = store.crownWindAngle * 0.6;
    }

    // 5. Power Reserve Sub-Dial Needle (at 9 o'clock)
    const targetPrAngle =
      -((-135 + (store.powerReserve / 100) * 270) * Math.PI) / 180;
    st.dampedPowerReserveAngle = THREE.MathUtils.damp(
      st.dampedPowerReserveAngle,
      targetPrAngle,
      12,
      clampedDelta
    );
    if (handPowerReserveRef.current) {
      handPowerReserveRef.current.rotation.z = st.dampedPowerReserveAngle;
    }

    // 6. Central Chronograph Sweep Hand
    if (store.flybackSnapTrigger !== st.lastFlybackTrigger) {
      st.lastFlybackTrigger = store.flybackSnapTrigger;
      st.dampedChronoSecAngle = 0.22;
    }

    const chronoSecondsQuantized =
      Math.floor((store.chronoElapsedMs / 1000) * 6) / 6;
    const targetChronoAngle = -(chronoSecondsQuantized / 60) * Math.PI * 2;
    st.dampedChronoSecAngle = THREE.MathUtils.damp(
      st.dampedChronoSecAngle,
      targetChronoAngle,
      26,
      clampedDelta
    );
    if (handChronoSecondRef.current) {
      handChronoSecondRef.current.rotation.z = st.dampedChronoSecAngle;
    }

    const chronoMinutes = (store.chronoElapsedMs / 60000) % 30;
    if (handChronoMinuteRef.current) {
      handChronoMinuteRef.current.rotation.z =
        -(chronoMinutes / 30) * Math.PI * 2;
    }

    // 7. Interactive 3D Crown Rotation & Pusher Piston Physics
    st.dampedCrownAngle = THREE.MathUtils.damp(
      st.dampedCrownAngle,
      store.crownWindAngle,
      14,
      clampedDelta
    );
    if (crownGroupRef.current) {
      crownGroupRef.current.rotation.x = st.dampedCrownAngle;
    }

    const targetStartOffset = store.pusherStartDepressed ? -0.08 : 0;
    st.dampedPusherStartX = THREE.MathUtils.damp(
      st.dampedPusherStartX,
      targetStartOffset,
      25,
      clampedDelta
    );
    if (pusherStartGroupRef.current) {
      pusherStartGroupRef.current.position.set(
        1.22 + st.dampedPusherStartX * 0.9,
        0.56 + st.dampedPusherStartX * 0.4,
        0
      );
    }

    const targetResetOffset = store.pusherResetDepressed ? -0.08 : 0;
    st.dampedPusherResetX = THREE.MathUtils.damp(
      st.dampedPusherResetX,
      targetResetOffset,
      25,
      clampedDelta
    );
    if (pusherResetGroupRef.current) {
      pusherResetGroupRef.current.position.set(
        1.22 + st.dampedPusherResetX * 0.9,
        -0.56 - st.dampedPusherResetX * 0.4,
        0
      );
    }

    // 8. 6-Layer Exploded Calibre Teardown Interpolation along Z-axis
    const exp = store.explodedProgress;
    if (layer01CasebackRef.current) {
      layer01CasebackRef.current.position.z = THREE.MathUtils.damp(
        layer01CasebackRef.current.position.z,
        -0.18 - exp * 1.62,
        10,
        clampedDelta
      );
    }
    if (layer02GearsRef.current) {
      layer02GearsRef.current.position.z = THREE.MathUtils.damp(
        layer02GearsRef.current.position.z,
        -0.06 - exp * 1.04,
        10,
        clampedDelta
      );
    }
    if (layer03TourbillonRef.current) {
      layer03TourbillonRef.current.position.z = THREE.MathUtils.damp(
        layer03TourbillonRef.current.position.z,
        0.0 - exp * 0.4,
        10,
        clampedDelta
      );
    }
    if (layer04BridgesHandsRef.current) {
      layer04BridgesHandsRef.current.position.z = THREE.MathUtils.damp(
        layer04BridgesHandsRef.current.position.z,
        0.03 + exp * 0.27,
        10,
        clampedDelta
      );
    }
    if (layer05BezelCrownRef.current) {
      layer05BezelCrownRef.current.position.z = THREE.MathUtils.damp(
        layer05BezelCrownRef.current.position.z,
        0.02 + exp * 0.98,
        10,
        clampedDelta
      );
    }
    if (layer06SapphireRef.current) {
      layer06SapphireRef.current.position.z = THREE.MathUtils.damp(
        layer06SapphireRef.current.position.z,
        0.16 + exp * 1.64,
        10,
        clampedDelta
      );
    }

    // 9. Night Super-LumiNova BGW9 Radioactive Glow Transition
    if (lumeCyanMatRef.current) {
      const targetEmissive = store.isNightLume ? 3.2 : 0.12;
      lumeCyanMatRef.current.emissive.lerp(
        store.isNightLume ? LUME_CYAN_COLOR : DAY_NO_EMISSIVE,
        clampedDelta * 6
      );
      lumeCyanMatRef.current.emissiveIntensity = THREE.MathUtils.damp(
        lumeCyanMatRef.current.emissiveIntensity,
        targetEmissive,
        8,
        clampedDelta
      );
    }
    if (lumeEmeraldMatRef.current) {
      const targetEmissive = store.isNightLume ? 3.4 : 0.15;
      lumeEmeraldMatRef.current.emissive.lerp(
        store.isNightLume ? LUME_EMERALD_COLOR : DAY_NO_EMISSIVE,
        clampedDelta * 6
      );
      lumeEmeraldMatRef.current.emissiveIntensity = THREE.MathUtils.damp(
        lumeEmeraldMatRef.current.emissiveIntensity,
        targetEmissive,
        8,
        clampedDelta
      );
    }
  });

  // Direct 3D Interaction Handlers
  const handleCrownClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    windMainspring(15);
    horologyAudio.playCrownWindClick();
  };

  const handleCrownWheel = (e: ThreeEvent<WheelEvent>) => {
    e.stopPropagation();
    windMainspring(5);
    horologyAudio.playCrownWindClick();
  };

  const handlePusherStartClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    toggleChrono();
    horologyAudio.playPusherSnap(false);
  };

  const handlePusherResetClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    resetChrono();
    horologyAudio.playPusherSnap(true);
  };

  const showBlueprintCallouts = explodedProgress > 0.4;

  return (
    <group name="Chrono_Root" scale={0.86}>
      {/* Internal Dynamic Specular Glint Light inside the mechanical movement */}
      <pointLight
        ref={calibreGlintLightRef}
        position={[0.3, 0.3, 0.38]}
        intensity={2.8}
        distance={3.2}
        decay={2}
        color="#fffbeb"
      />

      {/* =====================================================================
          LAYER 01: EXHIBITION CASEBACK & CNC RUTHENIUM METAL MAINPLATE (z -> -1.8)
      ===================================================================== */}
      <group ref={layer01CasebackRef} name="Layer_01_Caseback_Crystal" position={[0, 0, -0.18]}>
        <mesh geometry={geometries.casebackRing} castShadow receiveShadow>
          <meshPhysicalMaterial
            color={edition.caseColor}
            metalness={edition.caseMetalness}
            roughness={edition.caseRoughness}
            bumpMap={metalTextures.linearSatin}
            bumpScale={0.003}
            envMapIntensity={2.2}
            clearcoat={0.25}
          />
        </mesh>

        {/* Brushed Dark Ruthenium Metallic Movement Chamber Baseplate with Côtes de Genève */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.01]}>
          <cylinderGeometry args={[0.98, 0.98, 0.018, 64]} />
          <meshPhysicalMaterial
            color="#1B2028"
            metalness={0.92}
            roughness={0.28}
            bumpMap={metalTextures.geneveStripes}
            bumpScale={0.006}
            envMapIntensity={1.85}
            clearcoat={0.2}
          />
        </mesh>

        {/* Inner Machined Metallic Recess Ring & Radial Skeleton Cutout Frame */}
        <mesh position={[0, 0, 0.025]}>
          <torusGeometry args={[0.68, 0.022, 16, 64]} />
          <meshPhysicalMaterial
            color={edition.bridgeColor}
            metalness={0.95}
            roughness={0.2}
            envMapIntensity={2.2}
          />
        </mesh>

        {/* 8 Micro-Screw Heads on Exhibition Caseback */}
        {bezelBolts.map((b, i) => (
          <group key={`back-bolt-${i}`} position={[b.x * 0.97, b.y * 0.97, -0.05]}>
            <mesh rotation={[Math.PI / 2, b.rot, 0]}>
              <cylinderGeometry args={[0.036, 0.036, 0.025, 6]} />
              <meshPhysicalMaterial
                color={edition.bezelBoltColor}
                metalness={0.98}
                roughness={0.12}
                envMapIntensity={2.4}
              />
            </mesh>
          </group>
        ))}

        {showBlueprintCallouts && (
          <Html position={[-1.65, -0.45, 0]} center distanceFactor={6}>
            <div className="pointer-events-none whitespace-nowrap rounded-lg border border-amber-500/40 bg-zinc-950/90 px-2.5 py-1 font-mono text-[10px] text-amber-200 shadow-lg backdrop-blur-md">
              <span className="font-bold text-amber-400">L01 //</span> EXHIBITION SAPPHIRE CASEBACK
            </div>
          </Html>
        )}
      </group>

      {/* =====================================================================
          LAYER 02: MAINSPRING BARREL & INTERLOCKING METALLIC GEAR TRAIN (z -> -1.1)
      ===================================================================== */}
      <group ref={layer02GearsRef} name="Layer_02_Mainspring_And_Gears" position={[0, 0, -0.06]}>
        {/* Outer CNC-Machined Metallic Mainplate Flange Ring */}
        <mesh>
          <torusGeometry args={[0.95, 0.045, 20, 64]} />
          <meshPhysicalMaterial
            color={edition.bridgeColor}
            metalness={0.95}
            roughness={0.2}
            bumpMap={metalTextures.radialBrushed}
            bumpScale={0.004}
            envMapIntensity={2.2}
            clearcoat={0.3}
          />
        </mesh>

        {/* Inner Polished Gold/Rhodium Tension Bevel Ring */}
        <mesh position={[0, 0, 0.012]}>
          <torusGeometry args={[0.80, 0.012, 16, 64]} />
          <meshPhysicalMaterial
            color={edition.gearPrimaryColor}
            metalness={0.98}
            roughness={0.12}
            envMapIntensity={2.5}
          />
        </mesh>

        {/* 8 Polished Steel & Blued Movement Pillars around Inner Flange */}
        {innerBridgeScrews.map((s, idx) => (
          <group key={`inner-pillar-${idx}`} position={[s.x, s.y, 0.015]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.026, 0.026, 0.022, 16]} />
              <meshPhysicalMaterial
                color="#E2E8F0"
                metalness={0.98}
                roughness={0.1}
                envMapIntensity={2.5}
              />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.008]}>
              <cylinderGeometry args={[0.016, 0.016, 0.012, 12]} />
              <meshPhysicalMaterial
                color="#2563EB"
                metalness={0.96}
                roughness={0.12}
                envMapIntensity={2.4}
              />
            </mesh>
          </group>
        ))}

        {/* Gear_Barrel at [-0.36, 0.24, -0.015] (36 mathematical teeth + radial brushed metal) */}
        <group position={[-0.36, 0.24, -0.015]}>
          <mesh ref={gearBarrelRef} geometry={geometries.gearBarrel} castShadow>
            <meshPhysicalMaterial
              color={edition.gearSecondaryColor}
              metalness={0.89}
              roughness={0.19}
              bumpMap={metalTextures.radialBrushed}
              bumpScale={0.004}
              envMapIntensity={2.2}
              clearcoat={0.25}
            />
          </mesh>
          {/* Polished Steel Ratchet Wheel Hub */}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.012]}>
            <cylinderGeometry args={[0.13, 0.13, 0.018, 24]} />
            <meshPhysicalMaterial
              color="#E2E8F0"
              metalness={0.9}
              roughness={0.18}
              bumpMap={metalTextures.radialBrushed}
              bumpScale={0.003}
              envMapIntensity={2.2}
            />
          </mesh>
          {/* Internal Spiral Mainspring_Coil that tightens when wound */}
          <mesh ref={mainspringCoilRef} geometry={geometries.mainspringSpiral} position={[0, 0, 0.005]}>
            <meshPhysicalMaterial
              color="#CBD5E1"
              metalness={0.88}
              roughness={0.2}
              envMapIntensity={2.0}
            />
          </mesh>
          <RubyJewelBearing position={[0, 0, 0.025]} radius={0.042} chatonColor={edition.gearPrimaryColor} />
        </group>

        {/* Gear_Center_Wheel at [0, 0, 0.012] (48 mathematical teeth in Champagne 18K Gold) */}
        <group position={[0, 0, 0.012]}>
          <mesh ref={gearCenterWheelRef} geometry={geometries.gearCenter} castShadow>
            <meshPhysicalMaterial
              color={edition.gearPrimaryColor}
              metalness={0.89}
              roughness={0.18}
              bumpMap={metalTextures.radialBrushed}
              bumpScale={0.004}
              envMapIntensity={2.3}
              clearcoat={0.25}
            />
          </mesh>
          {/* Rhodium Steel Pinion Collar */}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.012]}>
            <cylinderGeometry args={[0.11, 0.11, 0.02, 24]} />
            <meshPhysicalMaterial
              color="#F1F5F9"
              metalness={0.9}
              roughness={0.16}
              envMapIntensity={2.3}
            />
          </mesh>
          <RubyJewelBearing position={[0, 0, 0.024]} radius={0.05} chatonColor={edition.gearSecondaryColor} />
        </group>

        {/* Gear_Third_Wheel at [0.38, 0.20, -0.008] (32 mathematical teeth, -2.5x ratio) */}
        <group position={[0.38, 0.20, -0.008]}>
          <mesh ref={gearThirdWheelRef} geometry={geometries.gearThird} castShadow>
            <meshPhysicalMaterial
              color={edition.gearSecondaryColor}
              metalness={0.89}
              roughness={0.18}
              bumpMap={metalTextures.radialBrushed}
              bumpScale={0.0035}
              envMapIntensity={2.2}
              clearcoat={0.25}
            />
          </mesh>
          <RubyJewelBearing position={[0, 0, 0.022]} radius={0.038} chatonColor={edition.gearPrimaryColor} />
        </group>

        {/* Gear_Fourth_Wheel at [-0.32, -0.22, -0.008] (28 mathematical teeth) */}
        <group position={[-0.32, -0.22, -0.008]}>
          <mesh ref={gearFourthWheelRef} geometry={geometries.gearFourth} castShadow>
            <meshPhysicalMaterial
              color={edition.gearPrimaryColor}
              metalness={0.89}
              roughness={0.18}
              bumpMap={metalTextures.radialBrushed}
              bumpScale={0.0035}
              envMapIntensity={2.2}
              clearcoat={0.25}
            />
          </mesh>
          <RubyJewelBearing position={[0, 0, 0.022]} radius={0.035} chatonColor={edition.gearSecondaryColor} />
        </group>

        {showBlueprintCallouts && (
          <Html position={[1.68, 0.28, 0]} center distanceFactor={6}>
            <div className="pointer-events-none whitespace-nowrap rounded-lg border border-amber-500/40 bg-zinc-950/90 px-2.5 py-1 font-mono text-[10px] text-amber-200 shadow-lg backdrop-blur-md">
              <span className="font-bold text-amber-400">L02 //</span> INVOLUTE GEAR TRAIN &amp; MAINSPRING BARREL
            </div>
          </Html>
        )}
      </group>

      {/* =====================================================================
          LAYER 03: FLYING TOURBILLON CAGE AT 6 O'CLOCK (z -> -0.4)
      ===================================================================== */}
      <group ref={layer03TourbillonRef} name="Layer_03_Tourbillon_Cage" position={[0, -0.42, 0.0]}>
        {/* Outer Fixed Tourbillon Metallic Beveled Chapter Ring */}
        <mesh>
          <torusGeometry args={[0.305, 0.015, 20, 64]} />
          <meshPhysicalMaterial
            color={edition.caseColor}
            metalness={0.98}
            roughness={0.1}
            envMapIntensity={2.6}
            clearcoat={0.5}
          />
        </mesh>

        {/* Tourbillon_Outer_Carriage: Mirror-Polished Grade-5 Titanium Cage */}
        <group ref={tourbillonCarriageRef} name="Tourbillon_Outer_Carriage">
          <mesh geometry={geometries.tourbillonCarriageGear} castShadow>
            <meshPhysicalMaterial
              color={edition.tourbillonCageColor}
              metalness={0.99}
              roughness={0.09}
              bumpMap={metalTextures.radialBrushed}
              bumpScale={0.003}
              envMapIntensity={2.7}
              clearcoat={0.6}
            />
          </mesh>

          {/* 3 Architectural Titanium Lyre Cage Bridges + Super-LumiNova Cage Tips */}
          {[0, 1, 2].map((idx) => {
            const ang = (idx / 3) * Math.PI * 2;
            return (
              <group key={`cage-pillar-${idx}`} rotation={[0, 0, ang]}>
                <RoundedBox
                  args={[0.026, 0.26, 0.034]}
                  radius={0.008}
                  smoothness={4}
                  position={[0, 0.13, 0.015]}
                >
                  <meshPhysicalMaterial
                    color={edition.tourbillonCageColor}
                    metalness={0.99}
                    roughness={0.08}
                    envMapIntensity={2.6}
                    clearcoat={0.5}
                  />
                </RoundedBox>
                {/* Luminous Tourbillon Cage Marker Tip */}
                <RoundedBox
                  args={[0.02, 0.042, 0.012]}
                  radius={0.004}
                  smoothness={3}
                  position={[0, 0.235, 0.03]}
                >
                  <meshStandardMaterial
                    ref={idx === 0 ? lumeEmeraldMatRef : undefined}
                    color={isNightLume ? '#00FF66' : edition.lumeDayColor}
                    emissive={isNightLume ? '#00FF66' : '#000000'}
                    emissiveIntensity={isNightLume ? 3.2 : 0.15}
                    roughness={0.25}
                  />
                </RoundedBox>
              </group>
            );
          })}

          {/* Tourbillon_Balance_Wheel: Oscillates at 3Hz (21,600 VPH) */}
          <group ref={tourbillonBalanceWheelRef} name="Tourbillon_Balance_Wheel" position={[0, 0, 0.01]}>
            <mesh geometry={geometries.balanceWheelRim}>
              <meshPhysicalMaterial
                color={edition.balanceWheelColor}
                metalness={0.99}
                roughness={0.09}
                envMapIntensity={2.7}
                clearcoat={0.6}
              />
            </mesh>
            {/* 4 Gold Regulating Micro-Timing Screws on Balance Rim */}
            {[0, 1, 2, 3].map((wIdx) => {
              const wAng = (wIdx / 4) * Math.PI * 2 + Math.PI / 4;
              return (
                <mesh
                  key={`reg-weight-${wIdx}`}
                  position={[Math.cos(wAng) * 0.20, Math.sin(wAng) * 0.20, 0]}
                  rotation={[0, 0, wAng]}
                >
                  <cylinderGeometry args={[0.016, 0.016, 0.028, 12]} />
                  <meshPhysicalMaterial
                    color={edition.gearPrimaryColor}
                    metalness={0.99}
                    roughness={0.08}
                    envMapIntensity={2.8}
                  />
                </mesh>
              );
            })}
          </group>

          {/* Breathing Blue Parachrom Hairspring Spiral */}
          <mesh
            ref={hairspringSpiralRef}
            geometry={geometries.hairspringSpiral}
            position={[0, 0, 0.02]}
          >
            <meshPhysicalMaterial
              color="#38BDF8"
              metalness={0.98}
              roughness={0.1}
              envMapIntensity={2.5}
            />
          </mesh>

          {/* Tourbillon_Ruby_Jewel Center Corundum Bearing */}
          <RubyJewelBearing
            position={[0, 0, 0.036]}
            radius={0.038}
            chatonColor={edition.balanceWheelColor}
          />
        </group>

        {showBlueprintCallouts && (
          <Html position={[-1.65, -0.1, 0]} center distanceFactor={6}>
            <div className="pointer-events-none whitespace-nowrap rounded-lg border border-cyan-500/40 bg-zinc-950/90 px-2.5 py-1 font-mono text-[10px] text-cyan-200 shadow-lg backdrop-blur-md">
              <span className="font-bold text-cyan-400">L03 //</span> 3Hz FLYING TOURBILLON &amp; RUBY SHOCK ABSORBER
            </div>
          </Html>
        )}
      </group>

      {/* =====================================================================
          LAYER 04: SKELETON METALLIC BRIDGES, 3D SUB-DIAL RINGS & HANDS (z -> +0.3)
      ===================================================================== */}
      <group ref={layer04BridgesHandsRef} name="Layer_04_Skeleton_Bridges_And_Hands" position={[0, 0, 0.03]}>
        {/* Architectural CNC-Machined Metallic Skeleton X-Bridges with Côtes de Genève & Polished Bevels */}
        <group name="Bridge_Main">
          {/* Upper V-Bridge with Brushed Metal + Polished Edge */}
          <RoundedBox
            args={[1.22, 0.068, 0.028]}
            radius={0.012}
            smoothness={4}
            position={[0, 0.18, 0]}
            rotation={[0, 0, 0.25]}
          >
            <meshPhysicalMaterial
              color={edition.bridgeColor}
              metalness={edition.bridgeMetalness}
              roughness={edition.bridgeRoughness}
              bumpMap={metalTextures.geneveStripes}
              bumpScale={0.004}
              envMapIntensity={2.3}
              clearcoat={0.35}
            />
          </RoundedBox>
          <RoundedBox
            args={[1.22, 0.068, 0.028]}
            radius={0.012}
            smoothness={4}
            position={[0, 0.18, 0]}
            rotation={[0, 0, -0.25]}
          >
            <meshPhysicalMaterial
              color={edition.bridgeColor}
              metalness={edition.bridgeMetalness}
              roughness={edition.bridgeRoughness}
              bumpMap={metalTextures.geneveStripes}
              bumpScale={0.004}
              envMapIntensity={2.3}
              clearcoat={0.35}
            />
          </RoundedBox>

          {/* Horizontal Center Calibre Bridge supporting 9h Power Reserve & 3h Chrono */}
          <RoundedBox
            args={[1.76, 0.078, 0.03]}
            radius={0.014}
            smoothness={4}
            position={[0, 0, 0.005]}
          >
            <meshPhysicalMaterial
              color={edition.bridgeColor}
              metalness={edition.bridgeMetalness}
              roughness={edition.bridgeRoughness}
              bumpMap={metalTextures.linearSatin}
              bumpScale={0.004}
              envMapIntensity={2.4}
              clearcoat={0.4}
            />
          </RoundedBox>

          {/* Lower Tourbillon Cock Bridge at 6 o'clock in Mirror-Polished Case Metal */}
          <RoundedBox
            args={[0.82, 0.048, 0.032]}
            radius={0.012}
            smoothness={4}
            position={[0, -0.42, 0.014]}
          >
            <meshPhysicalMaterial
              color={edition.caseColor}
              metalness={0.99}
              roughness={0.1}
              envMapIntensity={2.6}
              clearcoat={0.6}
            />
          </RoundedBox>

          {/* 2 Gold Bridge Locking Bolts on the Tourbillon Cock */}
          {[-0.35, 0.35].map((bx, i) => (
            <mesh
              key={`tb-cock-bolt-${i}`}
              position={[bx, -0.42, 0.032]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <cylinderGeometry args={[0.022, 0.022, 0.012, 6]} />
              <meshPhysicalMaterial
                color={edition.gearPrimaryColor}
                metalness={0.99}
                roughness={0.08}
                envMapIntensity={2.6}
              />
            </mesh>
          ))}
        </group>

        {/* 3D Machined Metallic Sub-Dial Bezel Rings at 9h (-0.45, 0) & 3h (+0.45, 0) */}
        <mesh position={[-0.45, 0, 0.038]}>
          <torusGeometry args={[0.18, 0.012, 16, 48]} />
          <meshPhysicalMaterial
            color={edition.caseColor}
            metalness={0.98}
            roughness={0.12}
            envMapIntensity={2.5}
            clearcoat={0.5}
          />
        </mesh>
        <mesh position={[0.45, 0, 0.038]}>
          <torusGeometry args={[0.18, 0.012, 16, 48]} />
          <meshPhysicalMaterial
            color={edition.caseColor}
            metalness={0.98}
            roughness={0.12}
            envMapIntensity={2.5}
            clearcoat={0.5}
          />
        </mesh>

        {/* High-DPI 1024x1024 Transparent Dial Chapter Ring & Sub-Dials */}
        <mesh position={[0, 0, 0.036]}>
          <planeGeometry args={[2.04, 2.04]} />
          <meshBasicMaterial
            map={dialTexture}
            transparent
            alphaTest={0.02}
            depthWrite={false}
          />
        </mesh>

        {/* 12 Luminous Baton Hour Indices with Diamond-Cut Metallic Frames & Super-LumiNova BGW9 */}
        {hourIndices.map((idx) => {
          if (idx.isTourbillonSix) return null;
          const length = idx.isSubDialThreeNine ? 0.058 : 0.105;
          return (
            <group
              key={`hour-idx-${idx.index}`}
              position={[idx.x, idx.y, 0.044]}
              rotation={[0, 0, idx.rotZ]}
            >
              {/* Diamond-Polished Metallic Beveled Frame */}
              <RoundedBox
                args={[idx.isDouble ? 0.066 : 0.042, length, 0.022]}
                radius={0.006}
                smoothness={4}
              >
                <meshPhysicalMaterial
                  color={edition.handColor}
                  metalness={0.99}
                  roughness={0.08}
                  envMapIntensity={2.6}
                  clearcoat={0.6}
                />
              </RoundedBox>
              {/* Super-LumiNova BGW9 Center Strip */}
              <RoundedBox
                args={[idx.isDouble ? 0.038 : 0.022, length * 0.8, 0.012]}
                radius={0.003}
                smoothness={3}
                position={[0, 0, 0.009]}
              >
                <meshStandardMaterial
                  ref={idx.index === 12 ? lumeCyanMatRef : undefined}
                  color={isNightLume ? '#00F5D4' : edition.lumeDayColor}
                  emissive={isNightLume ? '#00F5D4' : '#000000'}
                  emissiveIntensity={isNightLume ? 3.2 : 0.12}
                  roughness={0.22}
                />
              </RoundedBox>
            </group>
          );
        })}

        {/* Sub-Dial 9 o'clock (-0.45, 0): Power Reserve Needle + Ruby Bearing */}
        <group position={[-0.45, 0, 0.048]}>
          <group ref={handPowerReserveRef}>
            <mesh geometry={geometries.handSubDial}>
              <meshPhysicalMaterial
                color={isNightLume ? '#00F5D4' : edition.chronoHandColor}
                emissive={isNightLume ? '#00F5D4' : '#000000'}
                emissiveIntensity={isNightLume ? 2.8 : 0.15}
                metalness={0.9}
                roughness={0.15}
                envMapIntensity={2.2}
              />
            </mesh>
          </group>
          <RubyJewelBearing position={[0, 0, 0.012]} radius={0.022} chatonColor={edition.caseColor} />
        </group>

        {/* Sub-Dial 3 o'clock (+0.45, 0): 30-Minute Chronograph Needle + Ruby Bearing */}
        <group position={[0.45, 0, 0.048]}>
          <group ref={handChronoMinuteRef}>
            <mesh geometry={geometries.handSubDial}>
              <meshPhysicalMaterial
                color={isNightLume ? '#00FF66' : edition.handColor}
                emissive={isNightLume ? '#00FF66' : '#000000'}
                emissiveIntensity={isNightLume ? 2.5 : 0.1}
                metalness={0.98}
                roughness={0.1}
                envMapIntensity={2.5}
              />
            </mesh>
          </group>
          <RubyJewelBearing position={[0, 0, 0.012]} radius={0.022} chatonColor={edition.caseColor} />
        </group>

        {/* Central Pivot-Centered Hands at (0,0,0) */}
        {/* 1. Hand_Hour: Broad Faceted Dauphine Sword Hand + Super-LumiNova Strip */}
        <group ref={handHourRef} name="Hand_Hour" position={[0, 0, 0.062]}>
          <mesh geometry={geometries.handHour} castShadow>
            <meshPhysicalMaterial
              color={edition.handColor}
              metalness={0.99}
              roughness={0.08}
              envMapIntensity={2.8}
              clearcoat={0.7}
            />
          </mesh>
          <RoundedBox
            args={[0.02, 0.34, 0.008]}
            radius={0.003}
            smoothness={3}
            position={[0, 0.21, 0.009]}
          >
            <meshStandardMaterial
              color={isNightLume ? '#00F5D4' : edition.lumeDayColor}
              emissive={isNightLume ? '#00F5D4' : '#000000'}
              emissiveIntensity={isNightLume ? 3.4 : 0.15}
              roughness={0.2}
            />
          </RoundedBox>
        </group>

        {/* 2. Hand_Minute: Long Tapered Dauphine Sword Hand + Super-LumiNova Strip */}
        <group ref={handMinuteRef} name="Hand_Minute" position={[0, 0, 0.084]}>
          <mesh geometry={geometries.handMinute} castShadow>
            <meshPhysicalMaterial
              color={edition.handColor}
              metalness={0.99}
              roughness={0.08}
              envMapIntensity={2.8}
              clearcoat={0.7}
            />
          </mesh>
          <RoundedBox
            args={[0.015, 0.52, 0.008]}
            radius={0.003}
            smoothness={3}
            position={[0, 0.31, 0.009]}
          >
            <meshStandardMaterial
              color={isNightLume ? '#00F5D4' : edition.lumeDayColor}
              emissive={isNightLume ? '#00F5D4' : '#000000'}
              emissiveIntensity={isNightLume ? 3.4 : 0.15}
              roughness={0.2}
            />
          </RoundedBox>
        </group>

        {/* 3. Hand_Chrono_Second: Ultra-Thin Sweeping Chronograph Needle with Counterweight */}
        <group ref={handChronoSecondRef} name="Hand_Chrono_Second" position={[0, 0, 0.104]}>
          <mesh geometry={geometries.handChrono} castShadow>
            <meshPhysicalMaterial
              color={edition.chronoHandColor}
              emissive={edition.chronoHandColor}
              emissiveIntensity={isNightLume ? 1.8 : 0.25}
              metalness={0.85}
              roughness={0.15}
              envMapIntensity={2.2}
              clearcoat={0.5}
            />
          </mesh>
          <RubyJewelBearing position={[0, 0, 0.012]} radius={0.034} chatonColor={edition.handColor} />
        </group>

        {showBlueprintCallouts && (
          <Html position={[1.68, -0.05, 0]} center distanceFactor={6}>
            <div className="pointer-events-none whitespace-nowrap rounded-lg border border-emerald-500/40 bg-zinc-950/90 px-2.5 py-1 font-mono text-[10px] text-emerald-200 shadow-lg backdrop-blur-md">
              <span className="font-bold text-emerald-400">L04 //</span> PVD SKELETON BRIDGES &amp; DAUPHINE HANDS
            </div>
          </Html>
        )}
      </group>

      {/* =====================================================================
          LAYER 05: OCTAGONAL BEZEL, 8 SPLINE BOLTS, CROWN & PUSHERS (z -> +1.0)
      ===================================================================== */}
      <group ref={layer05BezelCrownRef} name="Layer_05_Bezel_Crown_Pushers" position={[0, 0, 0.02]}>
        {/* Middle Tonneau/Octagonal Case Barrel in Brushed Ruthenium / Titanium */}
        <mesh geometry={geometries.caseMiddle} position={[0, 0, -0.06]} castShadow receiveShadow>
          <meshPhysicalMaterial
            color={edition.bridgeColor}
            metalness={edition.bridgeMetalness}
            roughness={edition.bridgeRoughness}
            bumpMap={metalTextures.linearSatin}
            bumpScale={0.004}
            envMapIntensity={2.2}
            clearcoat={0.3}
          />
        </mesh>

        {/* Watch_Case_Main: Iconic Satin-Brushed Octagonal Luxury Bezel with Mirror Bevels */}
        <mesh geometry={geometries.bezelMain} position={[0, 0, 0.08]} castShadow receiveShadow>
          <meshPhysicalMaterial
            color={edition.caseColor}
            metalness={edition.caseMetalness}
            roughness={edition.caseRoughness}
            bumpMap={metalTextures.linearSatin}
            bumpScale={0.0035}
            envMapIntensity={2.5}
            clearcoat={0.45}
            clearcoatRoughness={0.1}
          />
        </mesh>

        {/* Inner Polished Metallic Rehaut / Chapter Tension Ring */}
        <mesh position={[0, 0, 0.135]}>
          <torusGeometry args={[1.015, 0.018, 20, 64]} />
          <meshPhysicalMaterial
            color={edition.caseColor}
            metalness={0.99}
            roughness={0.07}
            envMapIntensity={2.8}
            clearcoat={0.8}
          />
        </mesh>

        {/* 8 Exposed Hexagonal Spline Bezel Bolts in Brushed Rhodium / Gold */}
        {bezelBolts.map((b, i) => (
          <group key={`bezel-bolt-${i}`} position={[b.x, b.y, 0.168]}>
            {/* Recessed Dark Counterbore Collar */}
            <mesh>
              <torusGeometry args={[0.052, 0.008, 12, 24]} />
              <meshStandardMaterial color="#090A0F" metalness={0.8} roughness={0.3} />
            </mesh>
            {/* Hexagonal Spline Bolt Head */}
            <mesh rotation={[Math.PI / 2, b.rot, 0]} castShadow>
              <cylinderGeometry args={[0.046, 0.046, 0.024, 6]} />
              <meshPhysicalMaterial
                color={edition.bezelBoltColor}
                metalness={0.99}
                roughness={0.1}
                envMapIntensity={2.6}
                clearcoat={0.5}
              />
            </mesh>
            {/* Screw Slot Indentation */}
            <RoundedBox
              args={[0.062, 0.009, 0.01]}
              radius={0.002}
              position={[0, 0, 0.011]}
              rotation={[0, 0, b.rot]}
            >
              <meshStandardMaterial color="#090A0F" metalness={0.5} roughness={0.6} />
            </RoundedBox>
          </group>
        ))}

        {/* Interactive 3D Crown_Winder at 3 o'clock [1.42, 0, -0.02] */}
        <group
          ref={crownGroupRef}
          name="Crown_Winder"
          position={[1.42, 0, -0.02]}
          onClick={handleCrownClick}
          onWheel={handleCrownWheel}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHoveredPart('crown');
          }}
          onPointerOut={() => setHoveredPart(null)}
        >
          {/* Crown Stem Tube */}
          <mesh rotation={[0, 0, Math.PI / 2]} position={[-0.1, 0, 0]}>
            <cylinderGeometry args={[0.065, 0.065, 0.18, 24]} />
            <meshPhysicalMaterial
              color={edition.caseColor}
              metalness={0.98}
              roughness={0.14}
              envMapIntensity={2.4}
            />
          </mesh>
          {/* Knurled Toothed Winding Crown */}
          <mesh
            geometry={geometries.crownKnurled}
            rotation={[0, Math.PI / 2, 0]}
            castShadow
          >
            <meshPhysicalMaterial
              color={hoveredPart === 'crown' ? '#FBBF24' : edition.caseColor}
              emissive={hoveredPart === 'crown' ? '#F59E0B' : '#000000'}
              emissiveIntensity={hoveredPart === 'crown' ? 0.45 : 0}
              metalness={0.99}
              roughness={0.12}
              envMapIntensity={2.6}
              clearcoat={0.5}
            />
          </mesh>
          {/* Anodized Torque Gasket Ring */}
          <mesh rotation={[0, Math.PI / 2, 0]} position={[0.02, 0, 0]}>
            <torusGeometry args={[0.138, 0.015, 12, 32]} />
            <meshStandardMaterial color={edition.chronoHandColor} roughness={0.35} />
          </mesh>
        </group>

        {/* Interactive 3D Pusher_Start at 2 o'clock [1.22, 0.56, 0] */}
        <group
          ref={pusherStartGroupRef}
          name="Pusher_Start"
          position={[1.22, 0.56, 0]}
          rotation={[0, 0, 0.42]}
          onClick={handlePusherStartClick}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHoveredPart('start');
          }}
          onPointerOut={() => setHoveredPart(null)}
        >
          <RoundedBox
            args={[0.18, 0.24, 0.12]}
            radius={0.028}
            smoothness={4}
            castShadow
          >
            <meshPhysicalMaterial
              color={hoveredPart === 'start' ? '#38BDF8' : edition.caseColor}
              emissive={hoveredPart === 'start' ? '#0284C7' : '#000000'}
              emissiveIntensity={hoveredPart === 'start' ? 0.5 : 0}
              metalness={0.98}
              roughness={0.14}
              envMapIntensity={2.5}
              clearcoat={0.4}
            />
          </RoundedBox>
        </group>

        {/* Interactive 3D Pusher_Reset at 4 o'clock [1.22, -0.56, 0] */}
        <group
          ref={pusherResetGroupRef}
          name="Pusher_Reset"
          position={[1.22, -0.56, 0]}
          rotation={[0, 0, -0.42]}
          onClick={handlePusherResetClick}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHoveredPart('reset');
          }}
          onPointerOut={() => setHoveredPart(null)}
        >
          <RoundedBox
            args={[0.18, 0.24, 0.12]}
            radius={0.028}
            smoothness={4}
            castShadow
          >
            <meshPhysicalMaterial
              color={hoveredPart === 'reset' ? '#EF4444' : edition.caseColor}
              emissive={hoveredPart === 'reset' ? '#DC2626' : '#000000'}
              emissiveIntensity={hoveredPart === 'reset' ? 0.5 : 0}
              metalness={0.98}
              roughness={0.14}
              envMapIntensity={2.5}
              clearcoat={0.4}
            />
          </RoundedBox>
        </group>

        {/* Integrated Vulcanized Rubber / Alligator Luxury Watch Straps (Top & Bottom) */}
        <group name="Strap_Top" position={[0, 1.56, -0.08]} rotation={[-0.22, 0, 0]}>
          <RoundedBox args={[0.78, 0.68, 0.12]} radius={0.035} smoothness={4}>
            <meshStandardMaterial
              color={edition.strapColor}
              metalness={0.18}
              roughness={0.62}
            />
          </RoundedBox>
          <RoundedBox args={[0.52, 0.14, 0.135]} radius={0.02} smoothness={4} position={[0, -0.24, 0]}>
            <meshPhysicalMaterial
              color={edition.caseColor}
              metalness={edition.caseMetalness}
              roughness={edition.caseRoughness}
              envMapIntensity={2.4}
            />
          </RoundedBox>
        </group>

        <group name="Strap_Bottom" position={[0, -1.56, -0.08]} rotation={[0.22, 0, 0]}>
          <RoundedBox args={[0.78, 0.68, 0.12]} radius={0.035} smoothness={4}>
            <meshStandardMaterial
              color={edition.strapColor}
              metalness={0.18}
              roughness={0.62}
            />
          </RoundedBox>
          <RoundedBox args={[0.52, 0.14, 0.135]} radius={0.02} smoothness={4} position={[0, 0.24, 0]}>
            <meshPhysicalMaterial
              color={edition.caseColor}
              metalness={edition.caseMetalness}
              roughness={edition.caseRoughness}
              envMapIntensity={2.4}
            />
          </RoundedBox>
        </group>

        {showBlueprintCallouts && (
          <Html position={[-1.72, 0.52, 0]} center distanceFactor={6}>
            <div className="pointer-events-none whitespace-nowrap rounded-lg border border-amber-500/40 bg-zinc-950/90 px-2.5 py-1 font-mono text-[10px] text-amber-200 shadow-lg backdrop-blur-md">
              <span className="font-bold text-amber-400">L05 //</span> OCTAGONAL CASE, 8 SPLINE BOLTS &amp; CROWN
            </div>
          </Html>
        )}
      </group>

      {/* =====================================================================
          LAYER 06: DOMED ANTI-REFLECTIVE SAPPHIRE CRYSTAL (z -> +1.8)
          True curved spherical sapphire dome for authentic studio softbox arc reflection
      ===================================================================== */}
      <group ref={layer06SapphireRef} name="Layer_06_Sapphire_Crystal_Dome" position={[0, 0, 0.16]}>
        <mesh position={[0, 0, -2.38]} rotation={[Math.PI / 2, 0, 0]}>
          <sphereGeometry args={[2.6, 64, 32, 0, Math.PI * 2, 0, 0.398]} />
          <meshPhysicalMaterial
            color="#e0f2fe"
            transparent
            opacity={0.045}
            roughness={0.08}
            metalness={0.02}
            ior={1.77}
            reflectivity={0.45}
            clearcoat={0.25}
            clearcoatRoughness={0.12}
            depthWrite={false}
          />
        </mesh>

        {/* Optical Anti-Reflective (AR) Beveled Edge Seal Ring */}
        <mesh>
          <torusGeometry args={[1.015, 0.009, 16, 64]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#0284c7"
            emissiveIntensity={0.45}
            metalness={0.9}
            roughness={0.1}
            transparent
            opacity={0.6}
          />
        </mesh>

        {showBlueprintCallouts && (
          <Html position={[1.68, 0.65, 0]} center distanceFactor={6}>
            <div className="pointer-events-none whitespace-nowrap rounded-lg border border-sky-500/40 bg-zinc-950/90 px-2.5 py-1 font-mono text-[10px] text-sky-200 shadow-lg backdrop-blur-md">
              <span className="font-bold text-sky-400">L06 //</span> AR SAPPHIRE CRYSTAL DOME (IOR 1.77)
            </div>
          </Html>
        )}
      </group>
    </group>
  );
};
