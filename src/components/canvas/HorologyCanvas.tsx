import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  ContactShadows,
  Environment,
  Lightformer,
  OrbitControls,
  PerformanceMonitor,
} from '@react-three/drei';
import { EffectComposer, Bloom, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';
import gsap from 'gsap';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import {
  useHorologyStore,
  CameraPresetId,
  WatchModelId,
} from '../../store/useHorologyStore';
import { TourbillonWatchModel } from './TourbillonWatchModel';
import { ClassiqueWatchModel } from './ClassiqueWatchModel';

const CAMERA_PRESETS: Record<
  CameraPresetId,
  { pos: [number, number, number]; target: [number, number, number] }
> = {
  dial_hero: { pos: [0, 0.02, 4.65], target: [0, 0, 0] },
  macro_tourbillon: { pos: [0.12, -0.45, 1.38], target: [0, -0.36, 0] },
  crown_pushers: { pos: [2.25, 0.14, 1.38], target: [0.75, 0, 0] },
  caseback: { pos: [0.15, 0.08, -4.35], target: [0, 0, -0.1] },
  side_profile: { pos: [-3.3, 0.65, 2.2], target: [0, 0, 0] },
  cyclops_date: { pos: [0.98, 0.16, 1.32], target: [0.6, 0, 0.12] },
  bezel_macro: { pos: [-0.95, 1.45, 1.55], target: [-0.3, 0.55, 0.1] },
  bracelet: { pos: [2.6, 2.7, 2.3], target: [0, 0.9, -0.5] },
};

const INTRO_CAMERA: [number, number, number] = [-3.4, 2.1, 8.6];

/** Shared, mutable showcase motion (read by lighting + stage without React re-renders) */
const showcaseMotion = { spin: 0 };

/** 'balanced' drops pixel ratio, MSAA and contact shadows when an integrated GPU falls below 40 fps */
type RenderQuality = 'high' | 'balanced';

const CameraMacroRig: React.FC = () => {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const cameraPreset = useHorologyStore((s) => s.cameraPreset);
  const explodedProgress = useHorologyStore((s) => s.explodedProgress);
  const isIntroComplete = useHorologyStore((s) => s.isIntroComplete);
  const prevExplodedBool = useRef(false);
  const introPlayed = useRef(false);

  useEffect(() => {
    if (!isIntroComplete) return;
    const preset = CAMERA_PRESETS[cameraPreset];
    if (!preset) return;
    const firstReveal = !introPlayed.current;
    introPlayed.current = true;
    const duration = firstReveal ? 2.6 : 1.35;
    const ease = firstReveal ? 'expo.out' : 'power3.inOut';

    gsap.killTweensOf(camera.position);
    const crossesWatch = !firstReveal && camera.position.z * preset.pos[2] < 0;
    if (crossesWatch) {
      // Front <-> back moves orbit around the side instead of flying through the case
      const side = camera.position.x + preset.pos[0] >= 0 ? 1 : -1;
      gsap.to(camera.position, {
        keyframes: [
          { x: side * 4.6, y: 0.9, z: 0, duration: duration * 0.55, ease: 'power2.in' },
          { x: preset.pos[0], y: preset.pos[1], z: preset.pos[2], duration: duration * 0.75, ease: 'power3.out' },
        ],
      });
    } else {
      gsap.to(camera.position, {
        x: preset.pos[0],
        y: preset.pos[1],
        z: preset.pos[2],
        duration,
        ease,
      });
    }

    if (controlsRef.current) {
      gsap.killTweensOf(controlsRef.current.target);
      gsap.to(controlsRef.current.target, {
        x: preset.target[0],
        y: preset.target[1],
        z: preset.target[2],
        duration,
        ease,
        onUpdate: () => {
          controlsRef.current?.update();
        },
      });
    }
  }, [cameraPreset, camera, isIntroComplete]);

  useEffect(() => {
    const isNowExploded = explodedProgress > 0.5;
    if (isNowExploded === prevExplodedBool.current) return;
    prevExplodedBool.current = isNowExploded;
    if (cameraPreset !== 'dial_hero') return;
    const hero = CAMERA_PRESETS.dial_hero;
    gsap.to(camera.position, {
      // Seen from the crown side, front layers drift left and leave room for right-hand callouts
      x: isNowExploded ? 3.2 : hero.pos[0],
      y: isNowExploded ? 0.95 : hero.pos[1],
      z: isNowExploded ? 4.3 : hero.pos[2],
      duration: 1.25,
      ease: 'power3.out',
    });
  }, [explodedProgress, cameraPreset, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableDamping
      dampingFactor={0.06}
      rotateSpeed={0.7}
      zoomSpeed={0.8}
      minDistance={1.05}
      maxDistance={9}
    />
  );
};

const AdaptiveStudioLighting: React.FC = () => {
  const { scene } = useThree();
  const isNightLume = useHorologyStore((s) => s.isNightLume);
  const keyLightRef = useRef<THREE.DirectionalLight>(null);
  const pointerGlintLightRef = useRef<THREE.PointLight>(null);
  const envYaw = useRef(0);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const targetEnvIntensity = isNightLume ? 0.06 : 1.0;
    scene.environmentIntensity = THREE.MathUtils.damp(
      scene.environmentIntensity,
      targetEnvIntensity,
      5,
      dt
    );

    // Studio reflections drift with the cursor and race across metal during showcase spins
    const targetYaw =
      Math.sin(state.clock.elapsedTime * 0.11) * 0.45 +
      state.pointer.x * 0.5 +
      showcaseMotion.spin * 0.35;
    envYaw.current = THREE.MathUtils.damp(envYaw.current, targetYaw, 3, dt);
    scene.environmentRotation.set(state.pointer.y * -0.18, envYaw.current, 0);

    if (keyLightRef.current) {
      keyLightRef.current.intensity = THREE.MathUtils.damp(
        keyLightRef.current.intensity,
        isNightLume ? 0.1 : 2.2,
        6,
        dt
      );
      keyLightRef.current.position.x = 2.5 + Math.sin(state.clock.elapsedTime * 0.5) * 1.6;
    }

    if (pointerGlintLightRef.current) {
      const angle = state.clock.elapsedTime * 0.65;
      const light = pointerGlintLightRef.current;
      light.position.x = THREE.MathUtils.damp(
        light.position.x,
        state.pointer.x * 2.8 + Math.cos(angle) * 1.6,
        8,
        dt
      );
      light.position.y = THREE.MathUtils.damp(
        light.position.y,
        state.pointer.y * 2.4 + Math.sin(angle) * 1.6,
        8,
        dt
      );
      light.intensity = THREE.MathUtils.damp(light.intensity, isNightLume ? 0.2 : 2.0, 6, dt);
    }
  });

  return (
    <>
      {/* Only two analytic lights: the Lightformer tent below carries the metal reflections,
          which keeps per-pixel physical shading affordable on integrated GPUs */}
      <ambientLight intensity={isNightLume ? 0.03 : 0.35} />

      {/* Sweeping studio key light: casts the hand & baton shadows onto the dial */}
      <directionalLight
        ref={keyLightRef}
        position={[2.5, 4.2, 5.5]}
        intensity={2.2}
        color="#fffbeb"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.01}
        shadow-camera-left={-1.4}
        shadow-camera-right={1.4}
        shadow-camera-top={1.4}
        shadow-camera-bottom={-1.4}
        shadow-camera-near={2}
        shadow-camera-far={14}
      />
      {/* Cursor-following specular glint */}
      <pointLight ref={pointerGlintLightRef} position={[2, 2, 2.8]} intensity={2} distance={8} decay={1.6} color="#ffffff" />

      {/* SKILL 2: watchmaker reflection tent built from procedural Lightformer softboxes */}
      <Environment resolution={512}>
        {/* Top key softbox */}
        <Lightformer form="rect" intensity={4} position={[0, 8, 2]} scale={[10, 4, 1]} rotation-x={Math.PI / 2} color="#ffffff" />
        {/* Left warm rim strip */}
        <Lightformer form="rect" intensity={2.5} position={[-6, 2, -2]} scale={[8, 2, 1]} rotation-y={Math.PI / 2} color="#fde68a" />
        {/* Right cool specular strip */}
        <Lightformer form="rect" intensity={3} position={[6, 3, 2]} scale={[8, 2, 1]} rotation-y={-Math.PI / 2} color="#e0f2fe" />
        {/* Front fill ring */}
        <Lightformer form="ring" intensity={1.5} position={[0, 0, 6]} scale={2.5} color="#ffffff" />
        {/* Front-axis softboxes for flat brushed faces (offset so polished flats keep a gradient) */}
        <Lightformer form="rect" intensity={1.3} position={[-4.2, 3.6, 7]} scale={[4, 3, 1]} target={[0, 0, 0]} color="#fff7ed" />
        <Lightformer form="rect" intensity={1.1} position={[4.4, -3.2, 7]} scale={[4, 3, 1]} target={[0, 0, 0]} color="#f0f9ff" />
        {/* Thin vertical strip lights: crisp bright lines on polished bezels & diamonds */}
        <Lightformer form="rect" intensity={6} position={[-2.2, 0, 6]} scale={[0.35, 9, 1]} target={[0, 0, 0]} color="#ffffff" />
        <Lightformer form="rect" intensity={5} position={[2.6, 0.5, 5.5]} scale={[0.25, 9, 1]} target={[0, 0, 0]} color="#ffffff" />
        {/* Rear softboxes so the exhibition caseback and movement read in back views */}
        <Lightformer form="rect" intensity={2.4} position={[-2, 3, -7]} scale={[6, 4, 1]} target={[0, 0, 0]} color="#fff7ed" />
        <Lightformer form="rect" intensity={4} position={[2.4, -0.5, -6]} scale={[0.3, 8, 1]} target={[0, 0, 0]} color="#ffffff" />
        {/* Bottom warm bounce */}
        <Lightformer form="rect" intensity={2.2} position={[0, -7, 2]} scale={[9, 3.5, 1]} rotation-x={-Math.PI / 2} color="#fed7aa" />
      </Environment>
    </>
  );
};

/**
 * Hosts the active watch. Handles model swaps (scale-out / scale-in), edition
 * turntable spins, the intro reveal and a subtle pointer-parallax tilt.
 */
const ShowcaseStage: React.FC = () => {
  const model = useHorologyStore((s) => s.model);
  const spinTrigger = useHorologyStore((s) => s.showcaseSpinTrigger);
  const isIntroComplete = useHorologyStore((s) => s.isIntroComplete);
  const [shownModel, setShownModel] = useState<WatchModelId>(model);
  const stageRef = useRef<THREE.Group>(null);
  const tiltRef = useRef<THREE.Group>(null);
  const spin = useRef({ value: -0.9 });
  const isFirstShown = useRef(true);
  const isFirstSpin = useRef(true);

  // Intro: rotate in from a three-quarter angle
  useEffect(() => {
    if (!isIntroComplete) return;
    gsap.to(spin.current, { value: 0, duration: 2.8, ease: 'expo.out' });
  }, [isIntroComplete]);

  // Edition change: one full turntable revolution
  useEffect(() => {
    if (isFirstSpin.current) {
      isFirstSpin.current = false;
      return;
    }
    const base = Math.round(spin.current.value / (Math.PI * 2)) * Math.PI * 2;
    gsap.killTweensOf(spin.current);
    gsap.to(spin.current, {
      value: base + Math.PI * 2,
      duration: 1.7,
      ease: 'power3.inOut',
      onComplete: () => {
        spin.current.value = 0;
      },
    });
  }, [spinTrigger]);

  // Model change: shrink + swap + grow back with a spin
  useEffect(() => {
    if (model === shownModel) return;
    const g = stageRef.current;
    if (!g) {
      setShownModel(model);
      return;
    }
    gsap.killTweensOf(g.scale);
    gsap.to(g.scale, {
      x: 0.001,
      y: 0.001,
      z: 0.001,
      duration: 0.45,
      ease: 'power3.in',
      onComplete: () => setShownModel(model),
    });
  }, [model, shownModel]);

  useEffect(() => {
    if (isFirstShown.current) {
      isFirstShown.current = false;
      return;
    }
    const g = stageRef.current;
    if (!g) return;
    gsap.fromTo(
      g.scale,
      { x: 0.001, y: 0.001, z: 0.001 },
      { x: 1, y: 1, z: 1, duration: 1.15, ease: 'back.out(1.35)' }
    );
    spin.current.value = -Math.PI * 0.6;
    gsap.to(spin.current, { value: 0, duration: 1.5, ease: 'power3.out' });
  }, [shownModel]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    showcaseMotion.spin = spin.current.value;
    if (stageRef.current) {
      stageRef.current.rotation.y = spin.current.value;
      // Gentle breathing float
      stageRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.9) * 0.018;
    }
    if (tiltRef.current) {
      tiltRef.current.rotation.x = THREE.MathUtils.damp(
        tiltRef.current.rotation.x,
        -state.pointer.y * 0.09,
        3.5,
        dt
      );
      tiltRef.current.rotation.y = THREE.MathUtils.damp(
        tiltRef.current.rotation.y,
        state.pointer.x * 0.14,
        3.5,
        dt
      );
    }
  });

  return (
    <group ref={tiltRef}>
      <group ref={stageRef}>
        {shownModel === 'classique' ? <ClassiqueWatchModel /> : <TourbillonWatchModel />}
      </group>
    </group>
  );
};

export const HorologyCanvas: React.FC = () => {
  const isNightLume = useHorologyStore((s) => s.isNightLume);
  const model = useHorologyStore((s) => s.model);
  const [quality, setQuality] = useState<RenderQuality>('high');

  return (
    <div className="fixed inset-0 z-0 h-screen w-screen bg-[#07080B]">
      {/* Studio backdrop: warm halo + floor glow behind the watch */}
      <div
        className="pointer-events-none absolute inset-0 transition-[background] duration-1000"
        style={{
          background: isNightLume
            ? 'radial-gradient(ellipse 60% 55% at 50% 48%, rgba(0, 245, 212, 0.08) 0%, rgba(7, 8, 11, 0.98) 70%)'
            : 'radial-gradient(ellipse 62% 58% at 50% 46%, rgba(236, 196, 160, 0.16) 0%, rgba(26, 24, 28, 0.55) 45%, rgba(7, 8, 11, 0.98) 78%)',
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_115%,rgba(255,236,210,0.07),transparent_55%)]" />

      <Canvas
        shadows
        dpr={quality === 'high' ? [1, 2] : 1}
        camera={{ position: INTRO_CAMERA, fov: 36, near: 0.1, far: 60 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
          powerPreference: 'high-performance',
        }}
        onCreated={(state) => {
          if (import.meta.env.DEV) {
            (window as unknown as { __chronox?: unknown }).__chronox = state;
          }
        }}
      >
        {/* One-way downgrade: flipping back would remount ContactShadows and recompile shaders */}
        <PerformanceMonitor
          bounds={() => [40, 58]}
          flipflops={Infinity}
          onDecline={() => setQuality('balanced')}
        />
        <AdaptiveStudioLighting />
        <CameraMacroRig />
        <ShowcaseStage />

        {quality === 'high' && (
          <ContactShadows
            position={[0, model === 'classique' ? -1.55 : -2.05, 0]}
            opacity={isNightLume ? 0.2 : 0.55}
            scale={8}
            blur={2.6}
            far={4}
            resolution={256}
          />
        )}

        <EffectComposer enableNormalPass={false} multisampling={quality === 'high' ? 4 : 2}>
          <Bloom
            luminanceThreshold={isNightLume ? 0.35 : 1.05}
            luminanceSmoothing={0.2}
            mipmapBlur
            intensity={isNightLume ? 1.5 : 0.65}
            radius={0.6}
          />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          <Vignette eskil={false} offset={0.22} darkness={0.62} />
        </EffectComposer>
      </Canvas>
    </div>
  );
};
