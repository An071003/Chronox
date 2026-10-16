import React, { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Lightformer, OrbitControls } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useEclipseStore, WORLD_STATE_THEMES } from '../../store/useEclipseStore';
import { AstralSeraphim } from './AstralSeraphim';
import { DimensionalPortals } from './DimensionalPortals';
import { ShatteredSanctuary } from './ShatteredSanctuary';
import { ReflectiveAbyssFloor } from './ReflectiveAbyssFloor';

const SplineCameraAndLightsRig: React.FC = () => {
  const worldState = useEclipseStore((s) => s.worldState);
  const scrollProgress = useEclipseStore((s) => s.scrollProgress);
  const currentAct = useEclipseStore((s) => s.currentAct);
  const isAwakened = useEclipseStore((s) => s.isAwakened);
  const activePortalId = useEclipseStore((s) => s.activePortalId);
  const isCutscenePlaying = useEclipseStore((s) => s.isCutscenePlaying);

  const theme = WORLD_STATE_THEMES[worldState];
  const coreLightRef = useRef<THREE.PointLight>(null);
  const rimSpotLightRef = useRef<THREE.SpotLight>(null);
  const smoothedProgressRef = useRef(0);

  // Pre-allocated CatmullRomCurve3 Camera Position & LookAt Splines (5 Acts)
  const { posCurve, lookCurve, scratchPos, scratchLook } = useMemo(() => {
    const posCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.25, 5.6), // Act I: Heroic wide-medium shot framing Seraphim, 3 Portals & Mirror Floor
      new THREE.Vector3(1.35, 1.05, 3.15), // Act II: Close-up on Seraphim helm, halo & 24 blade-wings
      new THREE.Vector3(-1.75, 0.72, 2.85), // Act III: Exploded Armor Anatomy & Singularity Heart
      new THREE.Vector3(0, 1.45, 6.85), // Act IV: Wide vista framing the 3 Towering Multiverse Portals
      new THREE.Vector3(0, 0.85, 4.85), // Act V: Free Orbit Sanctuary & Overdrive Stance
    ]);

    const lookCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.65, 0), // Act I target
      new THREE.Vector3(0, 0.95, 0), // Act II target
      new THREE.Vector3(0, 0.72, 0), // Act III target
      new THREE.Vector3(0, 0.75, -2.2), // Act IV target
      new THREE.Vector3(0, 0.75, 0), // Act V target
    ]);

    return {
      posCurve,
      lookCurve,
      scratchPos: new THREE.Vector3(),
      scratchLook: new THREE.Vector3(),
    };
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const dt = Math.min(delta, 0.1);
    const cam = state.camera as THREE.PerspectiveCamera;

    // 1. Dynamic Singularity Core PointLight Pulse
    if (coreLightRef.current) {
      const targetCoreIntensity = isAwakened
        ? 42 + Math.sin(t * 18) * 10
        : 25 + Math.sin(t * 4.5) * 4;
      coreLightRef.current.intensity = THREE.MathUtils.damp(
        coreLightRef.current.intensity,
        targetCoreIntensity,
        6.0,
        dt
      );
    }

    // 2. FOV Dolly Zoom during Hold-Click / Hold-SPACE Overdrive (45 -> 36)
    const targetFov = isAwakened ? 36 : isCutscenePlaying ? 38 : 45;
    if (Math.abs(cam.fov - targetFov) > 0.05) {
      cam.fov = THREE.MathUtils.damp(cam.fov, targetFov, 5.0, dt);
      cam.updateProjectionMatrix();
    }

    // 3. Camera Choreography: Cutscene vs Active Portal vs 5-Act Spline
    if (isCutscenePlaying) {
      // Dramatic sweeping Boss Intro Cutscene orbit
      const cutAngle = Math.sin(t * 0.45) * 0.85;
      const cutRadius = 3.85 + Math.cos(t * 0.35) * 0.85;
      scratchPos.set(
        Math.sin(cutAngle) * cutRadius,
        0.55 + Math.sin(t * 0.6) * 0.45,
        Math.cos(cutAngle) * cutRadius
      );
      scratchLook.set(0, 0.92, 0);

      cam.position.lerp(scratchPos, dt * 3.5);
      cam.lookAt(scratchLook);
      return;
    }

    if (activePortalId) {
      // Fly camera smoothly toward the active Multiverse Portal Archway
      const angleDeg =
        activePortalId === 'crimson_blades'
          ? -55
          : activePortalId === 'golden_astrolabe'
          ? 0
          : 55;
      const rad = THREE.MathUtils.degToRad(angleDeg);
      scratchPos.set(Math.sin(rad) * 3.3, 0.65, -Math.cos(rad) * 3.3 + 1.8);
      scratchLook.set(Math.sin(rad) * 6.2, 0.55, -Math.cos(rad) * 6.2);

      cam.position.lerp(scratchPos, dt * 3.8);
      cam.lookAt(scratchLook);
      return;
    }

    // In Act V when not scrolling, let OrbitControls handle free rotation unless awakened
    if (currentAct === 5 && !isAwakened) {
      return;
    }

    // Smooth spline progress interpolation
    smoothedProgressRef.current = THREE.MathUtils.damp(
      smoothedProgressRef.current,
      scrollProgress,
      4.5,
      dt
    );

    posCurve.getPointAt(smoothedProgressRef.current, scratchPos);
    lookCurve.getPointAt(smoothedProgressRef.current, scratchLook);

    // Subtle mouse parallax & Overdrive camera shake
    scratchPos.x += state.pointer.x * 0.28;
    scratchPos.y += state.pointer.y * 0.16;

    if (isAwakened) {
      scratchPos.x += Math.sin(t * 48.0) * 0.022;
      scratchPos.y += Math.cos(t * 54.0) * 0.022;
    }

    cam.position.lerp(scratchPos, dt * 5.0);
    cam.lookAt(scratchLook);
  });

  return (
    <>
      {/* =====================================================================
          5-POINT CINEMATIC LIGHTING SETUP (EXACT COORDINATES)
         ===================================================================== */}
      {/* Light 1: Solar Eclipse Back-Rim SpotLight [0, 4.5, -6] */}
      <spotLight
        ref={rimSpotLightRef}
        position={[0, 4.5, -6]}
        intensity={140}
        angle={0.65}
        penumbra={0.9}
        color={theme.primaryHex}
        castShadow
        shadow-bias={-0.0001}
        shadow-mapSize={[2048, 2048]}
      />

      {/* Light 2: Cold Moonlight Key Light [-5, 6, 4] */}
      <directionalLight
        position={[-5, 6, 4]}
        intensity={2.4}
        color="#93C5FD"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
      />

      {/* Light 3: Warm Abyssal Floor Under-Light [0, -1.8, 1.5] */}
      <pointLight
        position={[0, -1.8, 1.5]}
        intensity={18}
        distance={7}
        color={theme.primaryHex}
      />

      {/* Light 4: Chest Singularity Core Light [0, 0.8, 0.3] */}
      <pointLight
        ref={coreLightRef}
        position={[0, 0.8, 0.3]}
        intensity={25}
        distance={4.5}
        color={theme.secondaryHex}
      />

      {/* Subtle Ambient Fill for Deep Obsidian Shadow Detail */}
      <ambientLight intensity={0.45} color="#1E293B" />

      {/* Light 5: Studio Environment Reflection Map with Front & Rim Lightformers */}
      <Environment resolution={512}>
        <group rotation={[0, 0, 0]}>
          {/* Overhead Golden Eclipse Strip */}
          <Lightformer
            form="rect"
            intensity={4.5}
            color={theme.primaryHex}
            position={[0, 7, -3]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[12, 3, 1]}
          />
          {/* Front-Axis Specular Fill Panel so Obsidian Armor & 24 Golden Blades Gleam */}
          <Lightformer
            form="rect"
            intensity={2.8}
            color="#FFFBEB"
            position={[0, 2.2, 7.5]}
            rotation={[0, Math.PI, 0]}
            scale={[8, 4, 1]}
          />
          {/* Left Cold Moonlight Rim Strip */}
          <Lightformer
            form="rect"
            intensity={3.5}
            color="#93C5FD"
            position={[-7, 2, 2]}
            rotation={[0, Math.PI / 2, 0]}
            scale={[6, 4, 1]}
          />
          {/* Right Warm Imperial Gold Rim Strip */}
          <Lightformer
            form="rect"
            intensity={3.8}
            color={theme.goldHex}
            position={[7, 2, 2]}
            rotation={[0, -Math.PI / 2, 0]}
            scale={[6, 4, 1]}
          />
        </group>
      </Environment>

      {/* Free Orbit Controls enabled in Act V */}
      <OrbitControls
        enabled={currentAct === 5 && !isCutscenePlaying && !activePortalId}
        enablePan={false}
        enableZoom={true}
        minDistance={2.6}
        maxDistance={10.5}
        maxPolarAngle={Math.PI / 2 + 0.08}
        minPolarAngle={0.35}
        target={[0, 0.8, 0]}
      />
    </>
  );
};

export const SanctuaryCanvas: React.FC = () => {
  const worldState = useEclipseStore((s) => s.worldState);
  const setScrollProgress = useEclipseStore((s) => s.setScrollProgress);
  const setAwakened = useEclipseStore((s) => s.setAwakened);
  const enterPortal = useEclipseStore((s) => s.enterPortal);

  const theme = WORLD_STATE_THEMES[worldState];

  // Global Wheel Scroll & SPACE / ESC Key Listeners
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const state = useEclipseStore.getState();
      if (state.experienceMode !== 'eclipse') return;
      // Allow zoom in Act 5 without overriding scroll unless at boundaries
      const delta = e.deltaY * 0.00055;
      state.setScrollProgress(state.scrollProgress + delta);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const state = useEclipseStore.getState();
      if (state.experienceMode !== 'eclipse') return;
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        state.setAwakened(true);
      } else if (e.code === 'Escape') {
        if (state.activePortalId) state.enterPortal(null);
        if (state.isCutscenePlaying) state.setCutscenePlaying(false);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const state = useEclipseStore.getState();
      if (state.experienceMode !== 'eclipse') return;
      if (e.code === 'Space') {
        state.setAwakened(false);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setScrollProgress, setAwakened, enterPortal]);

  return (
    <div
      className="fixed inset-0 z-0 h-screen w-screen select-none overflow-hidden"
      onMouseDown={(e) => {
        if (e.button === 0) setAwakened(true);
      }}
      onMouseUp={() => setAwakened(false)}
      onMouseLeave={() => setAwakened(false)}
    >
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, -0.65, 8.8], fov: 45, near: 0.1, far: 80 }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.18,
        }}
      >
        <color attach="background" args={[theme.bgHex]} />
        <fogExp2 attach="fog" args={[theme.bgHex, 0.042]} />

        <Suspense fallback={null}>
          <SplineCameraAndLightsRig />
          <AstralSeraphim />
          <DimensionalPortals />
          <ShatteredSanctuary />
          <ReflectiveAbyssFloor />

          {/* Clean, Razor-Sharp Emissive Bloom (NO Chromatic Aberration Blur) */}
          <EffectComposer multisampling={4}>
            <Bloom
              luminanceThreshold={1.1}
              mipmapBlur
              intensity={0.85}
              radius={0.6}
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
};
