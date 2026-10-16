import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  PortalRealmId,
  useEclipseStore,
  WORLD_STATE_THEMES,
} from '../../store/useEclipseStore';
import {
  createPortalRealmCanvas,
  createRuneDisplacementTexture,
} from '../../utils/proceduralArtGenerator';
import { eclipseAudio } from '../../utils/eclipseAudioEngine';

interface PortalGateConfig {
  id: PortalRealmId;
  code: string;
  title: string;
  subtitle: string;
  angleDeg: number;
  accentHex: string;
  secondaryHex: string;
}

const PORTAL_GATES: PortalGateConfig[] = [
  {
    id: 'crimson_blades',
    code: 'RIFT // 01',
    title: 'CRIMSON BLADE STORM',
    subtitle: 'Scarlet Greatsword Tempest',
    angleDeg: -55,
    accentHex: '#FF2E4C',
    secondaryHex: '#F97316',
  },
  {
    id: 'golden_astrolabe',
    code: 'RIFT // 02',
    title: 'GOLDEN ASTROLABE VAULT',
    subtitle: 'Celestial Sanctuary Archive',
    angleDeg: 0,
    accentHex: '#FDE047',
    secondaryHex: '#F59E0B',
  },
  {
    id: 'neptune_void',
    code: 'RIFT // 03',
    title: 'DEEP NEPTUNE ABYSS',
    subtitle: 'Bioluminescent Monolith Sea',
    angleDeg: 55,
    accentHex: '#00F5D4',
    secondaryHex: '#38BDF8',
  },
];

export const DimensionalPortals: React.FC = () => {
  const worldState = useEclipseStore((s) => s.worldState);
  const currentAct = useEclipseStore((s) => s.currentAct);
  const activePortalId = useEclipseStore((s) => s.activePortalId);
  const isAwakened = useEclipseStore((s) => s.isAwakened);
  const isAudioEnabled = useEclipseStore((s) => s.isAudioEnabled);
  const enterPortal = useEclipseStore((s) => s.enterPortal);

  const [hoveredPortal, setHoveredPortal] = useState<PortalRealmId | null>(null);
  const theme = WORLD_STATE_THEMES[worldState];

  // Refs for animated vortex discs and inner 3D realm artifacts inside each portal archway
  const vortexRefs = useRef<(THREE.Mesh | null)[]>([]);
  const innerArtifactRefs = useRef<(THREE.Group | null)[]>([]);
  const activeRealmGroupRef = useRef<THREE.Group>(null);

  // Procedural Basalt Rune Bump/Emissive maps + 3 Portal Vortex Textures
  const portalAssets = useMemo(() => {
    const runeMaps = createRuneDisplacementTexture(theme.primaryHex);

    const basaltMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#0E121B'),
      roughness: 0.35,
      metalness: 0.78,
      bumpMap: runeMaps.bumpMap,
      bumpScale: 0.04,
      emissive: new THREE.Color(theme.primaryHex),
      emissiveMap: runeMaps.emissiveMap,
      emissiveIntensity: 1.6,
    });

    const goldTrimMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(theme.goldHex),
      metalness: 0.98,
      roughness: 0.18,
      clearcoat: 0.8,
    });

    const realmTextures: Record<PortalRealmId, THREE.CanvasTexture> = {
      crimson_blades: createPortalRealmCanvas('crimson_blades'),
      golden_astrolabe: createPortalRealmCanvas('golden_astrolabe'),
      neptune_void: createPortalRealmCanvas('neptune_void'),
    };

    return { basaltMat, goldTrimMat, realmTextures };
  }, [theme.primaryHex, theme.goldHex]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const dt = Math.min(delta, 0.1);

    // Animate each portal's vortex plane & miniature 3D pocket-realm diorama
    for (let i = 0; i < PORTAL_GATES.length; i++) {
      const vortex = vortexRefs.current[i];
      if (vortex) {
        vortex.rotation.z -= dt * (isAwakened ? 1.4 : 0.45) * (i % 2 === 0 ? 1 : -1);
      }
      const artifact = innerArtifactRefs.current[i];
      if (artifact) {
        artifact.rotation.y += dt * 0.85;
        artifact.rotation.x = Math.sin(t * 1.5 + i) * 0.25;
      }
    }

    // Animate full-scale Pocket Dimension when the user has entered a Portal Rift
    if (activeRealmGroupRef.current) {
      activeRealmGroupRef.current.rotation.y += dt * 0.18;
    }
  });

  const handlePortalClick = (id: PortalRealmId) => {
    const next = activePortalId === id ? null : id;
    enterPortal(next);
    if (isAudioEnabled) {
      eclipseAudio.playPortalWarpSound(next !== null);
    }
  };

  return (
    <group>
      {/* =====================================================================
          3 TOWERING TRAPEZOIDAL BASALT PORTAL ARCHWAYS (Radius = 6.5m)
         ===================================================================== */}
      {PORTAL_GATES.map((gate, idx) => {
        const rad = THREE.MathUtils.degToRad(gate.angleDeg);
        const radius = idx === 1 ? 8.2 : 6.4;
        const px = Math.sin(rad) * radius;
        const py = idx === 1 ? 1.35 : 0.0;
        const pz = -Math.cos(rad) * radius;
        const rotY = -rad;

        const isHovered = hoveredPortal === gate.id;
        const isActive = activePortalId === gate.id;
        const showGateBadge = currentAct === 4 || isHovered || isActive;

        return (
          <group
            key={gate.id}
            position={[px, py, pz]}
            rotation={[0, rotY, 0]}
          >
            {/* Left Trapezoidal Basalt Obelisk Pillar */}
            <mesh
              position={[-1.08, 0.1, 0]}
              rotation={[0, 0, -0.055]}
              material={portalAssets.basaltMat}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[0.42, 4.4, 0.52]} />
            </mesh>

            {/* Right Trapezoidal Basalt Obelisk Pillar */}
            <mesh
              position={[1.08, 0.1, 0]}
              rotation={[0, 0, 0.055]}
              material={portalAssets.basaltMat}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[0.42, 4.4, 0.52]} />
            </mesh>

            {/* Upper Crown Lintel Beam */}
            <mesh
              position={[0, 2.25, 0]}
              material={portalAssets.basaltMat}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[2.75, 0.46, 0.64]} />
            </mesh>

            {/* Imperial Gold Archway Inner Frame */}
            <mesh position={[0, 0.15, 0]} material={portalAssets.goldTrimMat}>
              <torusGeometry args={[1.18, 0.045, 12, 48]} />
            </mesh>

            {/* Glowing Emissive Rift Ring */}
            <mesh position={[0, 0.15, 0.04]}>
              <torusGeometry args={[1.1, 0.025, 12, 48]} />
              <meshStandardMaterial
                color={gate.accentHex}
                emissive={gate.accentHex}
                emissiveIntensity={isHovered || isActive ? 9.5 : 4.5}
                toneMapped={false}
              />
            </mesh>

            {/* Interactive Portal Vortex Window */}
            <mesh
              ref={(el) => {
                vortexRefs.current[idx] = el;
              }}
              position={[0, 0.15, -0.04]}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoveredPortal(gate.id);
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={() => {
                setHoveredPortal(null);
                document.body.style.cursor = 'auto';
              }}
              onClick={(e) => {
                e.stopPropagation();
                handlePortalClick(gate.id);
              }}
            >
              <circleGeometry args={[1.08, 48]} />
              <meshBasicMaterial
                map={portalAssets.realmTextures[gate.id]}
                side={THREE.DoubleSide}
                transparent
                opacity={isActive ? 0.98 : 0.88}
              />
            </mesh>

            {/* 3D Pocket-Dimension Diorama Artifact Floating Inside Each Rift */}
            <group
              ref={(el) => {
                innerArtifactRefs.current[idx] = el;
              }}
              position={[0, 0.15, 0.18]}
            >
              {gate.id === 'crimson_blades' && (
                <group>
                  {[0, 1, 2, 3].map((b) => (
                    <mesh
                      key={b}
                      rotation={[0, 0, (b * Math.PI) / 2 + 0.4]}
                    >
                      <coneGeometry args={[0.06, 1.35, 4]} />
                      <meshStandardMaterial
                        color="#FF2E4C"
                        emissive="#FF2E4C"
                        emissiveIntensity={5.5}
                        wireframe={b % 2 === 1}
                        toneMapped={false}
                      />
                    </mesh>
                  ))}
                </group>
              )}

              {gate.id === 'golden_astrolabe' && (
                <group>
                  <mesh>
                    <torusKnotGeometry args={[0.38, 0.06, 64, 12, 2, 3]} />
                    <meshStandardMaterial
                      color="#FDE047"
                      emissive="#F59E0B"
                      emissiveIntensity={4.5}
                      metalness={0.9}
                      roughness={0.15}
                      toneMapped={false}
                    />
                  </mesh>
                </group>
              )}

              {gate.id === 'neptune_void' && (
                <group>
                  <mesh>
                    <octahedronGeometry args={[0.48, 0]} />
                    <meshStandardMaterial
                      color="#00F5D4"
                      emissive="#00F5D4"
                      emissiveIntensity={5.0}
                      wireframe
                      toneMapped={false}
                    />
                  </mesh>
                  <mesh scale={0.65}>
                    <icosahedronGeometry args={[0.42, 1]} />
                    <meshPhysicalMaterial
                      color="#38BDF8"
                      metalness={0.9}
                      roughness={0.1}
                    />
                  </mesh>
                </group>
              )}
            </group>

            {/* Dedicated Portal Rift PointLight */}
            <pointLight
              position={[0, 0.2, 0.6]}
              color={gate.accentHex}
              intensity={isHovered || isActive ? 12 : 4.5}
              distance={6}
            />

            {/* Floating Interactive 3D Portal Badge */}
            {showGateBadge && (
              <Html position={[0, 2.85, 0]} center distanceFactor={10}>
                <button
                  type="button"
                  onClick={() => handlePortalClick(gate.id)}
                  className="group pointer-events-auto flex flex-col items-center rounded-md border border-white/20 bg-black/85 px-3.5 py-1.5 text-center backdrop-blur-md transition-all hover:scale-105 hover:border-amber-400"
                >
                  <span className="font-mono text-[9px] tracking-[0.25em] text-amber-300">
                    {gate.code} // {isActive ? 'ACTIVE REALM' : 'CLICK TO ENTER'}
                  </span>
                  <span className="font-serif text-xs font-semibold tracking-[0.15em] text-white">
                    {gate.title}
                  </span>
                </button>
              </Html>
            )}
          </group>
        );
      })}

      {/* =====================================================================
          EXPANDED FULL-SCENE MULTIVERSE REALM OVERLAY WHEN A PORTAL IS ENTERED
         ===================================================================== */}
      {activePortalId && (
        <group ref={activeRealmGroupRef} position={[0, 0.5, 0]}>
          {activePortalId === 'crimson_blades' && (
            <group>
              {/* 36 Giant Orbiting Scarlet Greatswords in the Crimson Blade Storm */}
              {Array.from({ length: 36 }).map((_, i) => {
                const a = (i / 36) * Math.PI * 2;
                const r = 4.6 + (i % 3) * 1.4;
                const y = -1.0 + ((i * 7) % 10) * 0.45;
                return (
                  <mesh
                    key={i}
                    position={[Math.cos(a) * r, y, Math.sin(a) * r]}
                    rotation={[0.25, -a, Math.PI]}
                  >
                    <coneGeometry args={[0.12, 2.8, 4]} />
                    <meshStandardMaterial
                      color="#FF2E4C"
                      emissive="#FF2E4C"
                      emissiveIntensity={6.5}
                      toneMapped={false}
                    />
                  </mesh>
                );
              })}
            </group>
          )}

          {activePortalId === 'golden_astrolabe' && (
            <group>
              {/* Giant Interlocking Celestial Golden Rings */}
              {[4.2, 5.4, 6.8].map((rad, idx) => (
                <mesh
                  key={idx}
                  rotation={[idx * 0.55 + 0.4, idx * 0.35, 0]}
                >
                  <torusGeometry args={[rad, 0.045, 16, 96]} />
                  <meshStandardMaterial
                    color="#FDE047"
                    emissive="#F59E0B"
                    emissiveIntensity={5.5}
                    toneMapped={false}
                  />
                </mesh>
              ))}
            </group>
          )}

          {activePortalId === 'neptune_void' && (
            <group>
              {/* Floating Bioluminescent Cyan Crystal Obelisks */}
              {Array.from({ length: 28 }).map((_, i) => {
                const a = (i / 28) * Math.PI * 2;
                const r = 4.8 + (i % 2) * 1.6;
                const y = -0.8 + Math.sin(i * 1.7) * 1.6;
                return (
                  <mesh
                    key={i}
                    position={[Math.cos(a) * r, y, Math.sin(a) * r]}
                    rotation={[0.15, a, 0.1]}
                  >
                    <octahedronGeometry args={[0.42, 0]} />
                    <meshStandardMaterial
                      color="#00F5D4"
                      emissive="#00F5D4"
                      emissiveIntensity={6.0}
                      wireframe={i % 2 === 0}
                      toneMapped={false}
                    />
                  </mesh>
                );
              })}
            </group>
          )}
        </group>
      )}
    </group>
  );
};
