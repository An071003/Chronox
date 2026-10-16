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

  // Smooth GSAP transition when user switches Camera Macro Presets
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

  // Automatically swing to an oblique architectural angle when Blueprint Explode is toggled on from Dial Hero
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
  const fillLightRef = useRef<THREE.SpotLight>(null);

  useFrame((_, delta) => {
    const clampedDelta = Math.min(delta, 0.1);
    const targetEnvIntensity = isNightLume ? 0.08 : 1.2;
    if ('environmentIntensity' in scene) {
      (scene as THREE.Scene & { environmentIntensity: number }).environmentIntensity =
        THREE.MathUtils.damp(
          (scene as THREE.Scene & { environmentIntensity: number }).environmentIntensity ?? 1.2,
          targetEnvIntensity,
          6,
          clampedDelta
        );
    }

    if (keyLightRef.current) {
      keyLightRef.current.intensity = THREE.MathUtils.damp(
        keyLightRef.current.intensity,
        isNightLume ? 0.12 : 2.4,
        6,
        clampedDelta
      );
    }
    if (fillLightRef.current) {
      fillLightRef.current.intensity = THREE.MathUtils.damp(
        fillLightRef.current.intensity,
        isNightLume ? 0.08 : 1.6,
        6,
        clampedDelta
      );
    }
  });

  return (
    <>
      <ambientLight intensity={isNightLume ? 0.04 : 0.25} />
      <directionalLight
        ref={keyLightRef}
        position={[4, 6, 5]}
        intensity={2.4}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <spotLight
        ref={fillLightRef}
        position={[-5, 3, 4]}
        angle={0.5}
        penumbra={1}
        intensity={1.6}
        color="#fde68a"
      />

      {/* SKILL 2.1: 5 Procedural Studio Lightformer Softboxes for High-Contrast Metallic Specular Reflections */}
      <Environment resolution={512}>
        <group rotation={[-0.15, 0, 0]}>
          {/* 1. Top Key Softbox */}
          <Lightformer
            form="rect"
            intensity={4}
            position={[0, 8, 2]}
            scale={[10, 4, 1]}
            rotation-x={Math.PI / 2}
            color="#ffffff"
          />
          {/* 2. Left Warm Rim Strip */}
          <Lightformer
            form="rect"
            intensity={2.5}
            position={[-6, 2, -2]}
            scale={[8, 2, 1]}
            rotation-y={Math.PI / 2}
            color="#fde68a"
          />
          {/* 3. Right Cool Specular Strip */}
          <Lightformer
            form="rect"
            intensity={3}
            position={[6, 3, 2]}
            scale={[8, 2, 1]}
            rotation-y={-Math.PI / 2}
            color="#e0f2fe"
          />
          {/* 4. Front Fill Ring */}
          <Lightformer
            form="ring"
            intensity={1.5}
            position={[0, 0, 6]}
            scale={4}
            color="#ffffff"
          />
          {/* 5. Bottom Subtle Metallic Bounce */}
          <Lightformer
            form="rect"
            intensity={1.2}
            position={[0, -7, 1]}
            scale={[9, 3, 1]}
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
      {/* Subtle radial vignette backdrop behind 3D watch */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-700"
        style={{
          background: isNightLume
            ? 'radial-gradient(circle at 50% 50%, rgba(0, 245, 212, 0.07) 0%, rgba(7, 8, 11, 0.98) 68%)'
            : 'radial-gradient(circle at 50% 50%, rgba(230, 168, 124, 0.08) 0%, rgba(7, 8, 11, 0.98) 70%)',
        }}
      />

      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0.02, 4.65], fov: 36, near: 0.1, far: 50 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
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

        {/* Subtle Optical Bloom ONLY for Super-LumiNova Night Lume & Specular Highlights */}
        <EffectComposer enableNormalPass={false}>
          <Bloom
            luminanceThreshold={isNightLume ? 0.35 : 0.92}
            mipmapBlur
            intensity={isNightLume ? 1.45 : 0.2}
            radius={0.65}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
};
