import React, { useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  ContactShadows,
  Environment,
  Float,
  Lightformer,
  OrbitControls,
} from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import gsap from 'gsap';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import {
  useHorologyStore,
  CameraPresetId,
} from '../../store/useHorologyStore';
import { TourbillonWatchModel } from './TourbillonWatchModel';

const CAMERA_PRESETS: Record<
  CameraPresetId,
  { pos: [number, number, number]; target: [number, number, number] }
> = {
  dial_hero: {
    pos: [0, 0.02, 4.65],
    target: [0, 0, 0],
  },
  macro_tourbillon: {
    pos: [0.12, -0.45, 1.38],
    target: [0, -0.36, 0],
  },
  crown_pushers: {
    pos: [2.25, 0.14, 1.38],
    target: [0.75, 0, 0],
  },
  caseback: {
    pos: [0.15, 0.08, -4.35],
    target: [0, 0, -0.1],
  },
  side_profile: {
    pos: [-3.3, 0.65, 2.2],
    target: [0, 0, 0],
  },
};

const CameraMacroRig: React.FC = () => {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const cameraPreset = useHorologyStore((s) => s.cameraPreset);
  const explodedProgress = useHorologyStore((s) => s.explodedProgress);
  const prevExplodedBool = useRef(false);

  useEffect(() => {
    const preset = CAMERA_PRESETS[cameraPreset];
    if (!preset) return;

    gsap.killTweensOf(camera.position);
    gsap.to(camera.position, {
      x: preset.pos[0],
      y: preset.pos[1],
      z: preset.pos[2],
      duration: 1.35,
      ease: 'power3.inOut',
    });

    if (controlsRef.current) {
      gsap.killTweensOf(controlsRef.current.target);
      gsap.to(controlsRef.current.target, {
        x: preset.target[0],
        y: preset.target[1],
        z: preset.target[2],
        duration: 1.35,
        ease: 'power3.inOut',
        onUpdate: () => {
          controlsRef.current?.update();
        },
      });
    }
  }, [cameraPreset, camera]);

  useEffect(() => {
    const isNowExploded = explodedProgress > 0.5;
    if (isNowExploded !== prevExplodedBool.current) {
      prevExplodedBool.current = isNowExploded;
      if (isNowExploded && cameraPreset === 'dial_hero') {
        gsap.to(camera.position, {
          x: -2.85,
          y: 0.78,
          z: 3.95,
          duration: 1.25,
          ease: 'power3.out',
        });
      } else if (!isNowExploded && cameraPreset === 'dial_hero') {
        const hero = CAMERA_PRESETS.dial_hero;
        gsap.to(camera.position, {
          x: hero.pos[0],
          y: hero.pos[1],
          z: hero.pos[2],
          duration: 1.2,
          ease: 'power3.out',
        });
      }
    }
  }, [explodedProgress, cameraPreset, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableDamping
      dampingFactor={0.06}
      minDistance={1.15}
      maxDistance={7.5}
    />
  );
};

const AdaptiveStudioLighting: React.FC = () => {
  const { scene } = useThree();
  const isNightLume = useHorologyStore((s) => s.isNightLume);
  const keyLightRef = useRef<THREE.DirectionalLight>(null);
  const rimSpotRef = useRef<THREE.SpotLight>(null);
  const pointerGlintLightRef = useRef<THREE.PointLight>(null);
  const envGroupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const clampedDelta = Math.min(delta, 0.1);
    const targetEnvIntensity = isNightLume ? 0.08 : 1.45;
    if ('environmentIntensity' in scene) {
      (scene as THREE.Scene & { environmentIntensity: number }).environmentIntensity =
        THREE.MathUtils.damp(
          (scene as THREE.Scene & { environmentIntensity: number }).environmentIntensity ?? 1.45,
          targetEnvIntensity,
          6,
          clampedDelta
        );
    }

    if (keyLightRef.current) {
      keyLightRef.current.intensity = THREE.MathUtils.damp(
        keyLightRef.current.intensity,
        isNightLume ? 0.14 : 2.8,
        6,
        clampedDelta
      );
      const sweep = Math.sin(state.clock.elapsedTime * 0.5) * 1.6;
      keyLightRef.current.position.x = 2.5 + sweep;
    }

    if (rimSpotRef.current) {
      rimSpotRef.current.intensity = THREE.MathUtils.damp(
        rimSpotRef.current.intensity,
        isNightLume ? 0.1 : 2.4,
        6,
        clampedDelta
      );
    }

    if (pointerGlintLightRef.current) {
      const angle = state.clock.elapsedTime * 0.65;
      const targetX = state.pointer.x * 2.8 + Math.cos(angle) * 2.0;
      const targetY = state.pointer.y * 2.4 + Math.sin(angle) * 2.0;
      pointerGlintLightRef.current.position.x = THREE.MathUtils.damp(
        pointerGlintLightRef.current.position.x,
        targetX,
        8,
        clampedDelta
      );
      pointerGlintLightRef.current.position.y = THREE.MathUtils.damp(
        pointerGlintLightRef.current.position.y,
        targetY,
        8,
        clampedDelta
      );
      pointerGlintLightRef.current.intensity = THREE.MathUtils.damp(
        pointerGlintLightRef.current.intensity,
        isNightLume ? 0.25 : 2.6,
        6,
        clampedDelta
      );
    }
  });

  return (
    <>
      <ambientLight intensity={isNightLume ? 0.04 : 0.45} />

      {/* Main Dynamic Sweeping Studio Key Light */}
      <directionalLight
        ref={keyLightRef}
        position={[2.5, 4.2, 5.5]}
        intensity={2.8}
        color="#fffbeb"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      {/* Warm Champagne Left Front Fill Light (illuminates flat brushed metal faces) */}
      <directionalLight
        position={[-2.8, 2.5, 6.0]}
        intensity={isNightLume ? 0.08 : 2.2}
        color="#fef3c7"
      />

      {/* Cool Rhodium Silver Right Front Kicker (illuminates internal gears & bridges) */}
      <directionalLight
        position={[3.2, -2.2, 5.8]}
        intensity={isNightLume ? 0.08 : 1.9}
        color="#e0f2fe"
      />

      {/* Warm Champagne Rim Spotlight */}
      <spotLight
        ref={rimSpotRef}
        position={[-5.2, 3.2, 3.5]}
        angle={0.55}
        penumbra={0.9}
        intensity={2.4}
        color="#fde68a"
      />

      {/* Interactive Cursor-Following Metallic Specular Glint Light */}
      <pointLight
        ref={pointerGlintLightRef}
        position={[2.0, 2.0, 2.8]}
        intensity={2.6}
        distance={8}
        decay={1.6}
        color="#ffffff"
      />

      {/* Swiss Watchmaker Studio Reflection Tent (Includes Front-Axis Softboxes at z=+7.5 for Flat Metal Faces!) */}
      <Environment resolution={512}>
        <group ref={envGroupRef}>
          {/* FRONT-AXIS SOFTBOX 1 (Upper-Left behind camera: illuminates brushed bezel & gear faces with warm gold gradient) */}
          <Lightformer
            form="rect"
            intensity={2.6}
            position={[-3.2, 3.2, 7.5]}
            scale={[6.5, 4.5, 1]}
            target={[0, 0, 0]}
            color="#fff7ed"
          />
          {/* FRONT-AXIS SOFTBOX 2 (Lower-Right behind camera: illuminates opposite half of bezel & gears with crisp silver gradient) */}
          <Lightformer
            form="rect"
            intensity={2.4}
            position={[3.4, -2.8, 7.5]}
            scale={[6.5, 4.5, 1]}
            target={[0, 0, 0]}
            color="#f0f9ff"
          />
          {/* FRONT-AXIS DIFFUSED FILL RING (directly behind camera at z=+8: prevents flat metal faces from ever looking dark) */}
          <Lightformer
            form="ring"
            intensity={1.5}
            position={[0, 0, 8.0]}
            scale={6.5}
            color="#fef3c7"
          />
          {/* Top Overhead Main Studio Softbox (for 12h bezel bevels & lugs) */}
          <Lightformer
            form="rect"
            intensity={3.8}
            position={[0, 7.5, 2.5]}
            scale={[10, 3.5, 1]}
            rotation-x={Math.PI / 2}
            color="#ffffff"
          />
          {/* Left Warm 18K Champagne Rim Strip */}
          <Lightformer
            form="rect"
            intensity={3.2}
            position={[-6, 2.2, 2.0]}
            scale={[8, 2.2, 1]}
            rotation-y={Math.PI / 2}
            color="#fde68a"
          />
          {/* Right Cool Steel Specular Strip */}
          <Lightformer
            form="rect"
            intensity={3.4}
            position={[6, 1.8, 2.2]}
            scale={[8, 2.2, 1]}
            rotation-y={-Math.PI / 2}
            color="#e0f2fe"
          />
          {/* Bottom Warm Metallic Bounce (for 6h bezel bevels & Tourbillon bridge) */}
          <Lightformer
            form="rect"
            intensity={2.5}
            position={[0, -7, 2.0]}
            scale={[9, 3.5, 1]}
            rotation-x={-Math.PI / 2}
            color="#fed7aa"
          />
        </group>
      </Environment>
    </>
  );
};

export const HorologyCanvas: React.FC = () => {
  const isNightLume = useHorologyStore((s) => s.isNightLume);

  return (
    <div className="fixed inset-0 z-0 h-screen w-screen bg-[#07080B]">
      {/* Subtle studio luxury vignette & ambient halo behind 3D watch */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-700"
        style={{
          background: isNightLume
            ? 'radial-gradient(circle at 50% 50%, rgba(0, 245, 212, 0.09) 0%, rgba(7, 8, 11, 0.98) 68%)'
            : 'radial-gradient(circle at 50% 50%, rgba(223, 172, 140, 0.14) 0%, rgba(18, 22, 31, 0.5) 42%, rgba(7, 8, 11, 0.98) 74%)',
        }}
      />

      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0.02, 4.65], fov: 36, near: 0.1, far: 50 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.18,
        }}
      >
        <AdaptiveStudioLighting />
        <CameraMacroRig />

        <Float
          speed={1.2}
          rotationIntensity={0.06}
          floatIntensity={0.08}
          floatingRange={[-0.02, 0.02]}
        >
          <TourbillonWatchModel />
        </Float>

        <ContactShadows
          position={[0, -2.05, 0]}
          opacity={isNightLume ? 0.25 : 0.65}
          scale={7}
          blur={2.4}
          far={4}
        />

        {/* Controlled Optical Specular Glint & Night Lume Bloom */}
        <EffectComposer enableNormalPass={false}>
          <Bloom
            luminanceThreshold={isNightLume ? 0.35 : 0.92}
            mipmapBlur
            intensity={isNightLume ? 1.5 : 0.28}
            radius={0.55}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
};
