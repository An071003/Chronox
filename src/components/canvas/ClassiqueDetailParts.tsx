import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { useHorologyStore } from '../../store/useHorologyStore';
import { createRevolvedGeometry } from '../../utils/classiqueGeometry';
import { createGearGeometry, createSpiralSpringGeometry } from '../../utils/gearGeometryGenerator';

/**
 * Secondary components that make the Classique read as a real, serviceable watch:
 * full gear train, pallet fork, balance cock, keyless works, blued screws, lume pips,
 * cannon-pinion stack, caseback grip flutes, gaskets, spring bars and a folding clasp.
 */

const LUME_GLOW = new THREE.Color('#5CF2FF');
const NO_GLOW = new THREE.Color('#000000');

/* ------------------------------ Shared helpers ----------------------------- */

const RubyCap: React.FC<{ position: [number, number, number]; radius: number; chaton: string }> = ({
  position,
  radius,
  chaton,
}) => (
  <group position={position}>
    <mesh>
      <torusGeometry args={[radius * 1.3, radius * 0.28, 10, 24]} />
      <meshPhysicalMaterial color={chaton} metalness={1} roughness={0.12} envMapIntensity={2} />
    </mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[radius, radius * 0.88, radius * 0.6, 20]} />
      <meshPhysicalMaterial color="#e11d48" emissive="#7f1029" emissiveIntensity={0.35} roughness={0.05} transmission={0.85} ior={1.77} thickness={0.05} />
    </mesh>
  </group>
);

/** Heat-blued screw: domed head with a cut slot */
const BluedScrew: React.FC<{ position: [number, number, number]; rotation?: number; geometry: THREE.BufferGeometry }> = ({
  position,
  rotation = 0,
  geometry,
}) => (
  <group position={position} rotation={[0, 0, rotation]}>
    <mesh geometry={geometry}>
      <meshPhysicalMaterial color="#1e3a8a" metalness={1} roughness={0.18} envMapIntensity={2.2} iridescence={0.35} iridescenceIOR={1.6} />
    </mesh>
    <RoundedBox args={[0.034, 0.006, 0.01]} radius={0.002} smoothness={2} position={[0, 0, 0.011]}>
      <meshStandardMaterial color="#05070d" roughness={0.8} />
    </RoundedBox>
  </group>
);

function useScrewHeadGeometry() {
  return useMemo(
    () =>
      createRevolvedGeometry(
        [
          [0, 0.012],
          [0.012, 0.011],
          [0.019, 0.006],
          [0.021, 0.0],
          [0, 0.0],
        ],
        24
      ),
    []
  );
}

/* --------------------------- L02: movement details -------------------------- */

/** Rendered inside the movement's flipped group (local +Z faces the caseback). */
export const ClassiqueMovementDetails: React.FC<{ gold: string }> = ({ gold }) => {
  const screwGeo = useScrewHeadGeometry();
  const geo = useMemo(
    () => ({
      centerWheel: createGearGeometry({ innerRadius: 0.035, pitchRadius: 0.215, outerRadius: 0.236, teethCount: 64, thickness: 0.016, spokeCount: 4 }),
      fourthWheel: createGearGeometry({ innerRadius: 0.025, pitchRadius: 0.15, outerRadius: 0.166, teethCount: 56, thickness: 0.014, spokeCount: 4 }),
      ratchet: createGearGeometry({ innerRadius: 0.03, pitchRadius: 0.2, outerRadius: 0.214, teethCount: 72, thickness: 0.014, spokeCount: 0 }),
      crownWheel: createGearGeometry({ innerRadius: 0.02, pitchRadius: 0.085, outerRadius: 0.097, teethCount: 28, thickness: 0.012, spokeCount: 0 }),
      reversers: createGearGeometry({ innerRadius: 0.018, pitchRadius: 0.07, outerRadius: 0.08, teethCount: 22, thickness: 0.01, spokeCount: 3 }),
      clickSpring: createSpiralSpringGeometry(0.05, 0.075, 0.6, 0.008, 0.006),
      palletFork: (() => {
        const s = new THREE.Shape();
        s.moveTo(-0.012, -0.11);
        s.lineTo(0.012, -0.11);
        s.lineTo(0.012, 0.0);
        s.lineTo(0.07, 0.035);
        s.lineTo(0.062, 0.05);
        s.lineTo(0.0, 0.02);
        s.lineTo(-0.062, 0.05);
        s.lineTo(-0.07, 0.035);
        s.lineTo(-0.012, 0.0);
        s.closePath();
        const g = new THREE.ExtrudeGeometry(s, { depth: 0.008, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.002, bevelSegments: 2 });
        g.computeVertexNormals();
        return g;
      })(),
    }),
    []
  );

  const centerRef = useRef<THREE.Mesh>(null);
  const fourthRef = useRef<THREE.Mesh>(null);
  const palletRef = useRef<THREE.Group>(null);
  const ratchetRef = useRef<THREE.Mesh>(null);
  const crownWheelRef = useRef<THREE.Mesh>(null);
  const reverserRef = useRef<THREE.Mesh>(null);
  const midnight = useRef(new Date().setHours(0, 0, 0, 0));

  useFrame((state) => {
    const elapsed = (Date.now() - midnight.current) / 1000;
    const wind = useHorologyStore.getState().crownWindAngle;
    if (centerRef.current) centerRef.current.rotation.z = -(elapsed / 3600) * Math.PI * 2;
    if (fourthRef.current) fourthRef.current.rotation.z = -(Math.floor(elapsed * 8) / 8 / 60) * Math.PI * 2;
    if (palletRef.current) palletRef.current.rotation.z = Math.sign(Math.sin(state.clock.elapsedTime * Math.PI * 8)) * 0.16;
    if (ratchetRef.current) ratchetRef.current.rotation.z = wind * 0.35;
    if (crownWheelRef.current) crownWheelRef.current.rotation.z = -wind * 0.8;
    if (reverserRef.current) reverserRef.current.rotation.z = state.clock.elapsedTime * 0.4;
  });

  const goldMat = <meshPhysicalMaterial color={gold} metalness={1} roughness={0.16} envMapIntensity={1.9} />;
  const steelMat = <meshPhysicalMaterial color="#E6E8EB" metalness={1} roughness={0.12} envMapIntensity={2} />;
  const bridgeMat = <meshPhysicalMaterial color="#D3D7DC" metalness={1} roughness={0.24} envMapIntensity={1.8} />;

  return (
    <group name="Movement_Details">
      {/* Center wheel (drives the minute hand) */}
      <group position={[0, 0, 0.01]}>
        <mesh ref={centerRef} geometry={geo.centerWheel}>{goldMat}</mesh>
        <RubyCap position={[0, 0, 0.014]} radius={0.022} chaton={gold} />
      </group>

      {/* Fourth wheel (carries the seconds) */}
      <group position={[0.06, -0.22, 0.022]}>
        <mesh ref={fourthRef} geometry={geo.fourthWheel}>{goldMat}</mesh>
        <RubyCap position={[0, 0, 0.014]} radius={0.016} chaton={gold} />
      </group>

      {/* Pallet fork snapping between escape wheel and balance (8 beats / s) */}
      <group ref={palletRef} position={[-0.26, -0.37, 0.03]}>
        <mesh geometry={geo.palletFork}>{steelMat}</mesh>
        {[-0.066, 0.066].map((x) => (
          <RoundedBox key={x} args={[0.012, 0.02, 0.01]} radius={0.003} smoothness={2} position={[x, 0.045, 0.006]}>
            <meshPhysicalMaterial color="#e11d48" roughness={0.05} transmission={0.7} ior={1.77} thickness={0.03} />
          </RoundedBox>
        ))}
        <RubyCap position={[0, 0, 0.014]} radius={0.01} chaton={gold} />
      </group>

      {/* Balance cock bridge with regulator index */}
      <RoundedBox args={[0.42, 0.075, 0.022]} radius={0.01} smoothness={4} position={[-0.6, -0.14, 0.075]} rotation={[0, 0, 0.42]}>
        {bridgeMat}
      </RoundedBox>
      <RoundedBox args={[0.16, 0.012, 0.008]} radius={0.003} smoothness={2} position={[-0.38, -0.25, 0.088]} rotation={[0, 0, -0.9]}>
        {steelMat}
      </RoundedBox>
      <RubyCap position={[-0.42, -0.2, 0.09]} radius={0.014} chaton={gold} />

      {/* Barrel bridge keyless works: ratchet, crown wheel, click spring */}
      <group position={[0.36, 0.3, 0.045]}>
        <mesh ref={ratchetRef} geometry={geo.ratchet}>
          <meshPhysicalMaterial color="#E6E8EB" metalness={1} roughness={0.2} envMapIntensity={2} />
        </mesh>
      </group>
      <group position={[0.6, 0.02, 0.045]}>
        <mesh ref={crownWheelRef} geometry={geo.crownWheel}>{steelMat}</mesh>
      </group>
      <mesh geometry={geo.clickSpring} position={[0.5, 0.48, 0.05]} rotation={[0, 0, 2.4]}>
        {steelMat}
      </mesh>

      {/* Automatic module: reversing wheels under the rotor */}
      <group position={[-0.2, 0.36, 0.05]}>
        <mesh ref={reverserRef} geometry={geo.reversers}>{goldMat}</mesh>
        <RubyCap position={[0, 0, 0.012]} radius={0.012} chaton={gold} />
      </group>

      {/* Heat-blued screws across the bridges */}
      {(
        [
          [-0.5, -0.05, 0.034, 0.3],
          [0.6, 0.4, 0.034, 1.1],
          [-0.47, -0.42, 0.045, 0.7],
          [-0.27, -0.16, 0.045, 1.9],
          [-0.74, -0.04, 0.086, 0.2],
          [0.52, 0.18, 0.06, 1.4],
          [0.2, 0.52, 0.06, 2.3],
          [0.35, -0.5, 0.03, 0.9],
          [-0.05, 0.62, 0.03, 0.4],
          [0.7, -0.2, 0.03, 2.6],
        ] as const
      ).map(([x, y, z, r], i) => (
        <BluedScrew key={`screw-${i}`} position={[x, y, z]} rotation={r} geometry={screwGeo} />
      ))}
    </group>
  );
};

/* ------------------------- L01: caseback & case details ------------------------ */

export const ClassiqueCasebackDetails: React.FC<{ steel: string }> = ({ steel }) => {
  const flutes = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => {
        const a = (i / 24) * Math.PI * 2;
        return { x: Math.cos(a) * 0.86, y: Math.sin(a) * 0.86, a };
      }),
    []
  );
  return (
    <group name="Caseback_Details">
      {/* Opening-tool grip flutes around the screw-down caseback */}
      {flutes.map((f, i) => (
        <RoundedBox
          key={`flute-${i}`}
          args={[0.05, 0.03, 0.022]}
          radius={0.008}
          smoothness={2}
          position={[f.x, f.y, -0.292]}
          rotation={[0, 0, f.a]}
        >
          <meshPhysicalMaterial color={steel} metalness={1} roughness={0.15} envMapIntensity={1.9} />
        </RoundedBox>
      ))}
      {/* Polished bezel ring around the sapphire window */}
      <mesh position={[0, 0, -0.278]}>
        <torusGeometry args={[0.67, 0.012, 12, 96]} />
        <meshPhysicalMaterial color={steel} metalness={1} roughness={0.06} envMapIntensity={2.2} />
      </mesh>
    </group>
  );
};

export const ClassiqueCaseDetails: React.FC<{ steel: string }> = ({ steel }) => (
  <group name="Case_Details">
    {/* Caseback O-ring gasket (visible as a dark line in profile) */}
    <mesh position={[0, 0, -0.262]}>
      <torusGeometry args={[0.885, 0.007, 8, 96]} />
      <meshStandardMaterial color="#0b0b0d" roughness={0.6} />
    </mesh>
    {/* Bezel seating gasket */}
    <mesh position={[0, 0, 0.132]}>
      <torusGeometry args={[0.975, 0.005, 8, 96]} />
      <meshStandardMaterial color="#0b0b0d" roughness={0.6} />
    </mesh>
    {/* Crown tube gasket */}
    <mesh position={[1.0, 0, -0.03]} rotation={[0, Math.PI / 2, 0]}>
      <torusGeometry args={[0.07, 0.008, 8, 32]} />
      <meshStandardMaterial color="#0b0b0d" roughness={0.6} />
    </mesh>
    {/* Spring bars between the lugs */}
    {[1, -1].map((sy) => (
      <group key={`spring-bar-${sy}`} rotation={[-0.13 * sy, 0, 0]}>
        <mesh position={[0, 1.12 * sy, -0.08]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.014, 1.1, 4, 12]} />
          <meshPhysicalMaterial color={steel} metalness={1} roughness={0.2} envMapIntensity={1.8} />
        </mesh>
      </group>
    ))}
  </group>
);

/* ---------------------------- L03: dial details ---------------------------- */

export const ClassiqueDialDetails: React.FC<{ gold: string; lumeDay: string; dialZ: number }> = ({
  gold,
  lumeDay,
  dialZ,
}) => {
  const lumeMat = useRef<THREE.MeshStandardMaterial>(null);
  const pips = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return { i, x: Math.sin(a) * 0.737, y: Math.cos(a) * 0.737 };
      }).filter((p) => p.i !== 3),
    []
  );
  const pipGeo = useMemo(
    () =>
      createRevolvedGeometry(
        [
          [0, 0.006],
          [0.007, 0.0055],
          [0.0105, 0.003],
          [0.011, 0],
          [0, 0],
        ],
        20
      ),
    []
  );
  const cannonGeo = useMemo(
    () =>
      createRevolvedGeometry(
        [
          [0, 0.06],
          [0.012, 0.06],
          [0.014, 0.046],
          [0.022, 0.044],
          [0.024, 0.03],
          [0.034, 0.028],
          [0.036, 0.0],
          [0, 0.0],
        ],
        32
      ),
    []
  );

  useFrame((_, delta) => {
    const m = lumeMat.current;
    if (!m) return;
    const night = useHorologyStore.getState().isNightLume;
    const dt = Math.min(delta, 0.1);
    m.emissive.lerp(night ? LUME_GLOW : NO_GLOW, dt * 5);
    m.emissiveIntensity = THREE.MathUtils.damp(m.emissiveIntensity, night ? 2.6 : 0, 6, dt);
  });

  return (
    <group name="Dial_Details">
      {/* Lume pips with polished gold surrounds on the minute track */}
      {pips.map((p) => (
        <group key={`pip-${p.i}`} position={[p.x, p.y, dialZ + 0.001]}>
          <mesh>
            <torusGeometry args={[0.013, 0.0028, 8, 24]} />
            <meshPhysicalMaterial color={gold} metalness={1} roughness={0.1} envMapIntensity={2} />
          </mesh>
          <mesh geometry={pipGeo}>
            <meshStandardMaterial ref={p.i === 0 ? lumeMat : undefined} color={lumeDay} roughness={0.5} emissive="#000000" />
          </mesh>
        </group>
      ))}
      {/* Cannon pinion / hour wheel stack under the hands */}
      <mesh geometry={cannonGeo} position={[0, 0, dialZ]}>
        <meshPhysicalMaterial color={gold} metalness={1} roughness={0.14} envMapIntensity={2} />
      </mesh>
    </group>
  );
};

/* --------------------------- Bracelet folding clasp -------------------------- */

/** Children of the clasp cover (local +Z points away from the wrist). */
export const ClassiqueClaspDetails: React.FC<{ steel: string; gold: string }> = ({ steel, gold }) => (
  <group name="Clasp_Details">
    {/* Polished bevelled edges of the cover */}
    {[0.33, -0.33].map((y) => (
      <RoundedBox key={`clasp-edge-${y}`} args={[0.8, 0.03, 0.02]} radius={0.008} smoothness={2} position={[0, y, 0.022]}>
        <meshPhysicalMaterial color={steel} metalness={1} roughness={0.06} envMapIntensity={2.2} />
      </RoundedBox>
    ))}
    {/* Applied crest */}
    <group position={[0, 0.04, 0.03]}>
      {[0.6, -0.6, 0].map((rz, i) => (
        <RoundedBox
          key={`clasp-crest-${i}`}
          args={[i === 2 ? 0.1 : 0.016, i === 2 ? 0.012 : 0.09, 0.012]}
          radius={0.004}
          smoothness={2}
          position={[0, i === 2 ? -0.05 : 0, 0]}
          rotation={[0, 0, rz]}
        >
          <meshPhysicalMaterial color={gold} metalness={1} roughness={0.08} envMapIntensity={2.2} />
        </RoundedBox>
      ))}
    </group>
    {/* Hinge barrels of the folding blades */}
    {[0.36, -0.36].map((y) => (
      <mesh key={`hinge-${y}`} position={[0, y, -0.03]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.022, 0.62, 4, 16]} />
        <meshPhysicalMaterial color={steel} metalness={1} roughness={0.18} envMapIntensity={1.9} />
      </mesh>
    ))}
    {/* Folding blades underneath */}
    <RoundedBox args={[0.7, 0.68, 0.02]} radius={0.008} smoothness={2} position={[0, 0, -0.06]}>
      <meshPhysicalMaterial color={steel} metalness={1} roughness={0.3} envMapIntensity={1.6} />
    </RoundedBox>
  </group>
);
