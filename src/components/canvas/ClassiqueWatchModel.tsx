import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html, MeshTransmissionMaterial, RoundedBox } from '@react-three/drei';
import { BlueprintCallout } from './BlueprintCallout';
import {
  ClassiqueCaseDetails,
  ClassiqueCasebackDetails,
  ClassiqueClaspDetails,
  ClassiqueDialDetails,
  ClassiqueMovementDetails,
} from './ClassiqueDetailParts';
import { RoundedBoxGeometry } from 'three-stdlib';
import * as THREE from 'three';
import {
  useHorologyStore,
  CLASSIQUE_EDITIONS,
  WATCH_MODELS,
} from '../../store/useHorologyStore';
import {
  createBatonHandGeometry,
  createBezelGeometry,
  createBraceletPathSampler,
  createBrilliantGeometry,
  createCaseMiddleGeometry,
  createCasebackGeometry,
  createCrystalGeometry,
  createIndexGeometry,
  createLugGeometry,
  createRehautGeometry,
  createRevolvedGeometry,
  createRotorGeometry,
  createSecondsHandGeometry,
} from '../../utils/classiqueGeometry';
import {
  DATE_WINDOW,
  DIAL_RADIUS,
  createClassiqueDialTextures,
  createDateWheelTexture,
  createGlintTexture,
  createRehautTexture,
} from '../../utils/classiqueTextures';
import { createGearGeometry, createSpiralSpringGeometry } from '../../utils/gearGeometryGenerator';
import {
  createCotesDeGeneveTexture,
  createLinearSatinTexture,
  createRadialBrushedTexture,
} from '../../utils/metalTextureGenerator';
import { horologyAudio } from '../../utils/horologyAudioEngine';
import { useFontsReady } from '../../utils/useFontsReady';

/* ----------------------------- Layout constants ---------------------------- */
const DIAL_Z = 0.05;
const DIAMOND_COUNT = 52;
const DIAMOND_RING_R = 0.905;
const DIAMOND_Z = 0.218;
const GLINT_COUNT = 14;
const BRACELET_PITCH = 0.235;
const BRACELET_START = 0.2;
const LUME_COLOR = new THREE.Color('#5CF2FF');
const NO_EMISSIVE = new THREE.Color('#000000');
const DIAL_NORMAL_SCALE = new THREE.Vector2(0.55, 0.55);
const GLINT_HDR_COLOR = new THREE.Color(2.6, 2.5, 2.3);

// Pre-allocated scratch objects (SKILL 3: zero allocation inside useFrame)
const _p = new THREE.Vector3();
const _p2 = new THREE.Vector3();
const _t = new THREE.Vector3();
const _n = new THREE.Vector3();
const _side = new THREE.Vector3();
const _m = new THREE.Matrix4();
const _scale = new THREE.Vector3();

/** Synthetic ruby jewel in a polished gold chaton (SKILL 1 · rule 3) */
const RubyJewel: React.FC<{ position: [number, number, number]; radius?: number; chaton: string }> = ({
  position,
  radius = 0.02,
  chaton,
}) => (
  <group position={position}>
    <mesh>
      <torusGeometry args={[radius * 1.3, radius * 0.28, 12, 32]} />
      <meshPhysicalMaterial color={chaton} metalness={1} roughness={0.12} envMapIntensity={2} />
    </mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[radius, radius * 0.88, radius * 0.6, 24]} />
      <meshPhysicalMaterial
        color="#e11d48"
        emissive="#7f1029"
        emissiveIntensity={0.35}
        roughness={0.05}
        transmission={0.85}
        ior={1.77}
        thickness={0.05}
        clearcoat={1}
      />
    </mesh>
  </group>
);

export const ClassiqueWatchModel: React.FC = () => {
  const fontsReady = useFontsReady();
  // Dial signatures are rasterised from web fonts; wait so they never flash in a fallback face
  if (!fontsReady) return null;
  return <ClassiqueWatchAssembly />;
};

const ClassiqueWatchAssembly: React.FC = () => {
  const editionId = useHorologyStore((s) => s.classiqueEdition);
  const isNightLume = useHorologyStore((s) => s.isNightLume);
  const explodedProgress = useHorologyStore((s) => s.explodedProgress);
  const windMainspring = useHorologyStore((s) => s.windMainspring);
  const advanceDate = useHorologyStore((s) => s.advanceDate);
  const edition = CLASSIQUE_EDITIONS[editionId];

  const [hoveredPart, setHoveredPart] = useState<'crown' | 'date' | 'bezel' | null>(null);

  useEffect(() => {
    document.body.style.cursor =
      hoveredPart === 'crown' ? 'ns-resize' : hoveredPart ? 'pointer' : 'auto';
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hoveredPart]);

  /* ------------------------------ Geometry (CAD) ----------------------------- */
  const geo = useMemo(() => {
    const bracelet = createBraceletPathSampler();
    const rowsPerHalf = Math.floor((bracelet.halfLength - BRACELET_START - 0.05) / BRACELET_PITCH);
    return {
      caseMiddle: createCaseMiddleGeometry(),
      rehaut: createRehautGeometry(),
      crystal: createCrystalGeometry(),
      caseback: createCasebackGeometry(),
      lug: createLugGeometry(),
      hourHand: createBatonHandGeometry(0.47, 0.052, 0.075, 0.07, 0.016),
      minuteHand: createBatonHandGeometry(0.71, 0.042, 0.07, 0.07, 0.014),
      secondsHand: createSecondsHandGeometry(),
      index: createIndexGeometry(0.032, 0.112),
      indexDouble: createIndexGeometry(0.022, 0.112),
      brilliant: createBrilliantGeometry(0.049),
      rotor: createRotorGeometry(),
      hub: createRevolvedGeometry(
        [
          [0, 0.014],
          [0.02, 0.014],
          [0.028, 0.009],
          [0.03, 0.0],
          [0.03, -0.004],
          [0, -0.004],
        ],
        48
      ),
      crownTube: createRevolvedGeometry(
        [
          [0, -0.06],
          [0.072, -0.06],
          [0.078, -0.05],
          [0.078, 0.05],
          [0.07, 0.06],
          [0, 0.06],
        ],
        48
      ),
      crownBody: createGearGeometry({
        innerRadius: 0.02,
        pitchRadius: 0.118,
        outerRadius: 0.13,
        teethCount: 34,
        thickness: 0.13,
        spokeCount: 0,
        bevelThickness: 0.018,
        bevelSize: 0.012,
      }),
      crownCap: createRevolvedGeometry(
        [
          [0, 0.03],
          [0.06, 0.026],
          [0.098, 0.014],
          [0.112, 0.0],
          [0.11, -0.01],
          [0, -0.01],
        ],
        64
      ),
      dateFrame: (() => {
        const w = DATE_WINDOW.w + 0.02;
        const h = DATE_WINDOW.h + 0.02;
        const shape = new THREE.Shape();
        shape.moveTo(-w / 2, -h / 2);
        shape.lineTo(w / 2, -h / 2);
        shape.lineTo(w / 2, h / 2);
        shape.lineTo(-w / 2, h / 2);
        shape.closePath();
        const hole = new THREE.Path();
        hole.moveTo(-DATE_WINDOW.w / 2, -DATE_WINDOW.h / 2);
        hole.lineTo(-DATE_WINDOW.w / 2, DATE_WINDOW.h / 2);
        hole.lineTo(DATE_WINDOW.w / 2, DATE_WINDOW.h / 2);
        hole.lineTo(DATE_WINDOW.w / 2, -DATE_WINDOW.h / 2);
        hole.closePath();
        shape.holes.push(hole);
        const g = new THREE.ExtrudeGeometry(shape, {
          depth: 0.004,
          bevelEnabled: true,
          bevelThickness: 0.004,
          bevelSize: 0.0035,
          bevelSegments: 2,
        });
        g.computeVertexNormals();
        return g;
      })(),
      cyclops: new RoundedBoxGeometry(0.2, 0.16, 0.052, 6, 0.024),
      linkOuter: new RoundedBoxGeometry(0.265, BRACELET_PITCH - 0.018, 0.086, 3, 0.034),
      linkSmall: new RoundedBoxGeometry(0.135, BRACELET_PITCH / 2 - 0.012, 0.078, 3, 0.036),
      endLink: new RoundedBoxGeometry(1.08, 0.2, 0.1, 4, 0.04),
      clasp: new RoundedBoxGeometry(0.86, 0.62, 0.05, 4, 0.022),
      barrel: createGearGeometry({
        innerRadius: 0.04,
        pitchRadius: 0.25,
        outerRadius: 0.272,
        teethCount: 40,
        thickness: 0.026,
        spokeCount: 0,
      }),
      thirdWheel: createGearGeometry({
        innerRadius: 0.03,
        pitchRadius: 0.17,
        outerRadius: 0.188,
        teethCount: 30,
        thickness: 0.018,
        spokeCount: 4,
      }),
      escapeWheel: createGearGeometry({
        innerRadius: 0.018,
        pitchRadius: 0.09,
        outerRadius: 0.108,
        teethCount: 20,
        thickness: 0.014,
        spokeCount: 4,
      }),
      balanceRim: createGearGeometry({
        innerRadius: 0.13,
        pitchRadius: 0.168,
        outerRadius: 0.176,
        teethCount: 18,
        thickness: 0.02,
        spokeCount: 2,
      }),
      hairspring: createSpiralSpringGeometry(0.025, 0.12, 6, 0.004, 0.008),
      bracelet,
      rowsPerHalf,
    };
  }, []);

  const bezelGeometry = useMemo(() => createBezelGeometry(edition.bezelStyle), [edition.bezelStyle]);

  // Cushion pillow the bracelet is wrapped around (velvet presentation box)
  const cushionGeometry = useMemo(() => {
    const g = new THREE.SphereGeometry(1, 96, 64);
    const pos = g.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i) * 1.8;
      const y = pos.getY(i) * 1.42;
      let z = pos.getZ(i);
      z = z > 0 ? z * 1.15 : z * 0.98;
      if (z > 0.62) z = 0.62 + (z - 0.62) * 0.25;
      // Slightly squarer silhouette like a real watch pillow
      x *= 1 + 0.06 * Math.cos(y * 1.2);
      pos.setXYZ(i, x, y, z);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  /* --------------------------------- Textures -------------------------------- */
  const dialTextures = useMemo(() => createClassiqueDialTextures(edition), [edition]);
  const misc = useMemo(
    () => ({
      dateWheel: createDateWheelTexture(),
      rehaut: createRehautTexture(),
      glint: createGlintTexture(),
      satin: createLinearSatinTexture(),
      radial: createRadialBrushedTexture(),
      geneve: createCotesDeGeneveTexture(),
    }),
    []
  );

  useEffect(() => () => dialTextures.map.dispose(), [dialTextures]);

  /* ---------------------------- Instanced layouts ---------------------------- */
  const diamondLayout = useMemo(() => {
    const matrices: THREE.Matrix4[] = [];
    const beads: THREE.Matrix4[] = [];
    const glintSpots = new Float32Array(DIAMOND_COUNT * 3);
    const q = new THREE.Quaternion();
    const qTilt = new THREE.Quaternion();
    const zAxis = new THREE.Vector3(0, 0, 1);
    const yAxis = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < DIAMOND_COUNT; i++) {
      const a = (i / DIAMOND_COUNT) * Math.PI * 2;
      q.setFromAxisAngle(zAxis, a).multiply(qTilt.setFromAxisAngle(yAxis, 0.2));
      const pos = new THREE.Vector3(Math.cos(a) * DIAMOND_RING_R, Math.sin(a) * DIAMOND_RING_R, DIAMOND_Z);
      matrices.push(new THREE.Matrix4().compose(pos, q.clone(), new THREE.Vector3(1, 1, 1)));
      glintSpots[i * 3] = pos.x;
      glintSpots[i * 3 + 1] = pos.y;
      glintSpots[i * 3 + 2] = pos.z + 0.022;

      // Two grain-set beads between neighbouring stones
      const ab = a + Math.PI / DIAMOND_COUNT;
      for (const [r, z] of [
        [0.852, 0.229],
        [0.956, 0.21],
      ] as const) {
        beads.push(
          new THREE.Matrix4().makeTranslation(Math.cos(ab) * r, Math.sin(ab) * r, z)
        );
      }
    }
    return { matrices, beads, glintSpots };
  }, []);

  const flutedGlintSpots = useMemo(() => {
    const spots = new Float32Array(48 * 3);
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      spots[i * 3] = Math.cos(a) * 0.93;
      spots[i * 3 + 1] = Math.sin(a) * 0.93;
      spots[i * 3 + 2] = 0.225;
    }
    return spots;
  }, []);

  const hourIndices = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const r = 0.666;
        return { i, x: Math.sin(angle) * r, y: Math.cos(angle) * r, rotZ: -angle };
      }).filter((h) => h.i !== 3),
    []
  );

  /* ---------------------------------- Refs ---------------------------------- */
  const casebackRef = useRef<THREE.Group>(null);
  const movementRef = useRef<THREE.Group>(null);
  const dialGroupRef = useRef<THREE.Group>(null);
  const handsGroupRef = useRef<THREE.Group>(null);
  const bezelGroupRef = useRef<THREE.Group>(null);
  const crystalGroupRef = useRef<THREE.Group>(null);

  const hourRef = useRef<THREE.Group>(null);
  const minuteRef = useRef<THREE.Group>(null);
  const secondsRef = useRef<THREE.Group>(null);
  const crownRef = useRef<THREE.Group>(null);
  const rotorRef = useRef<THREE.Group>(null);
  const balanceRef = useRef<THREE.Group>(null);
  const hairspringRef = useRef<THREE.Mesh>(null);
  const escapeRef = useRef<THREE.Mesh>(null);
  const thirdRef = useRef<THREE.Mesh>(null);
  const barrelRef = useRef<THREE.Mesh>(null);

  const outerLinksRef = useRef<THREE.InstancedMesh>(null);
  const smallLinksRef = useRef<THREE.InstancedMesh>(null);
  const endLinksRef = useRef<THREE.InstancedMesh>(null);
  const claspRef = useRef<THREE.Mesh>(null);
  const cushionMatRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const cushionRef = useRef<THREE.Mesh>(null);
  const diamondsRef = useRef<THREE.InstancedMesh>(null);
  const beadsRef = useRef<THREE.InstancedMesh>(null);
  const glintRefs = useRef<(THREE.Sprite | null)[]>([]);
  const lumeMatRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);

  const anim = useRef({
    midnightMs: new Date().setHours(0, 0, 0, 0),
    tzOffsetMs: new Date().getTimezoneOffset() * 60000,
    simOffsetSeconds: 0,
    pendingReserveDrain: 0,
    lastTick: -1,
    dampedSeconds: -1,
    dampedCrown: 0,
    crownPull: 0,
    braceletMorph: -1,
    rotorAngle: 0.4,
    rotorVelocity: 0,
    lastPointerX: 0,
    lastLocalDay: -1,
    dateWheelTarget: -1,
    dateWheelShown: -1,
    glintPhase: new Float32Array(GLINT_COUNT).map(() => Math.random()),
    glintSpeed: new Float32Array(GLINT_COUNT).map(() => 0.35 + Math.random() * 0.6),
    glintSpot: new Int16Array(GLINT_COUNT).map(() => Math.floor(Math.random() * DIAMOND_COUNT)),
    burst: 0,
  });

  /* ------------------------- Bracelet instance solver ------------------------ */
  const writeBracelet = (morph: number) => {
    const outer = outerLinksRef.current;
    const small = smallLinksRef.current;
    const ends = endLinksRef.current;
    if (!outer || !small || !ends) return;
    const { bracelet, rowsPerHalf } = geo;
    let oi = 0;
    let si = 0;

    const place = (
      mesh: THREE.InstancedMesh,
      index: number,
      s: number,
      xOffset: number,
      half: 1 | -1,
      widthScale: number
    ) => {
      bracelet.sample(s, morph, _p);
      bracelet.sample(s + 0.01, morph, _p2);
      _p.y *= half;
      _p2.y *= half;
      _t.subVectors(_p2, _p).normalize();
      _side.set(half, 0, 0);
      _n.crossVectors(_side, _t);
      _m.makeBasis(_side, _t, _n);
      _m.scale(_scale.set(widthScale, 1, 1));
      _m.setPosition(_p.x + xOffset, _p.y, _p.z);
      mesh.setMatrixAt(index, _m);
    };

    for (const half of [1, -1] as const) {
      place(ends, half === 1 ? 0 : 1, 0.1, 0, half, 1);
      for (let k = 0; k < rowsPerHalf; k++) {
        const s = BRACELET_START + BRACELET_PITCH * (k + 0.5);
        const taper = 1 - 0.17 * (s / bracelet.halfLength);
        place(outer, oi++, s, 0.405 * taper, half, taper);
        place(outer, oi++, s, -0.405 * taper, half, taper);
        place(small, si++, s - BRACELET_PITCH / 4, 0, half, taper);
        place(small, si++, s + BRACELET_PITCH / 4, 0, half, taper);
        place(small, si++, s, 0.17 * taper, half, taper);
        place(small, si++, s, -0.17 * taper, half, taper);
        place(small, si++, s + BRACELET_PITCH / 2, 0.17 * taper, half, taper);
        place(small, si++, s + BRACELET_PITCH / 2, -0.17 * taper, half, taper);
      }
    }
    outer.instanceMatrix.needsUpdate = true;
    small.instanceMatrix.needsUpdate = true;
    ends.instanceMatrix.needsUpdate = true;
    outer.computeBoundingSphere();
    small.computeBoundingSphere();
    ends.computeBoundingSphere();

    if (claspRef.current) {
      const s = bracelet.halfLength - 0.02;
      bracelet.sample(s, morph, _p);
      bracelet.sample(s + 0.01, morph, _p2);
      _t.subVectors(_p2, _p).normalize();
      _side.set(1, 0, 0);
      _n.crossVectors(_side, _t);
      claspRef.current.matrix.makeBasis(_side, _t, _n);
      claspRef.current.matrix.setPosition(
        _p.x + _n.x * 0.06,
        _p.y + _n.y * 0.06 - 0.3 * morph,
        _p.z + _n.z * 0.06
      );
      claspRef.current.matrixWorldNeedsUpdate = true;
    }
  };

  const outerCount = geo.rowsPerHalf * 2 * 2;
  const smallCount = geo.rowsPerHalf * 6 * 2;

  // Freshly (re)created instanced meshes start with identity matrices: force a full re-solve
  useEffect(() => {
    anim.current.braceletMorph = -1;
  }, [geo, outerCount, smallCount]);

  useEffect(() => {
    const d = diamondsRef.current;
    const b = beadsRef.current;
    if (d) {
      diamondLayout.matrices.forEach((m, i) => d.setMatrixAt(i, m));
      d.instanceMatrix.needsUpdate = true;
      d.computeBoundingSphere();
    }
    if (b) {
      diamondLayout.beads.forEach((m, i) => b.setMatrixAt(i, m));
      b.instanceMatrix.needsUpdate = true;
      b.computeBoundingSphere();
    }
  }, [diamondLayout, edition.bezelStyle]);

  // Hover state is read inside useFrame without re-subscribing
  const hoveredRef = useRef(hoveredPart);
  hoveredRef.current = hoveredPart;

  /* ----------------------------- Simulation loop ----------------------------- */
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const store = useHorologyStore.getState();
    const st = anim.current;
    const t = state.clock.elapsedTime;

    if (store.timeMultiplier !== 1) {
      st.simOffsetSeconds += dt * (store.timeMultiplier - 1);
    }
    // Batch the slow reserve drain so HUD panels re-render a few times per minute, not every frame
    st.pendingReserveDrain += dt * 0.015 * store.timeMultiplier;
    if (st.pendingReserveDrain > 0.05) {
      store.depletePowerReserve(st.pendingReserveDrain);
      st.pendingReserveDrain = 0;
    }
    if (store.crownTorque > 0) store.decayCrownTorque(dt);

    // 1. Continuous local time since mount-day midnight (never wraps -> no backward sweeps)
    const nowMs = Date.now();
    const elapsed = (nowMs - st.midnightMs) / 1000 + st.simOffsetSeconds;
    const bps = WATCH_MODELS.classique.beatsPerSecond;
    const tick = Math.floor(elapsed * bps);
    const mechanicalSeconds = tick / bps;
    if (tick !== st.lastTick) {
      st.lastTick = tick;
      if (store.isAudioEnabled && tick % 2 === 0) horologyAudio.playEscapementTick(false);
    }
    if (st.dampedSeconds < 0) st.dampedSeconds = mechanicalSeconds;
    st.dampedSeconds = THREE.MathUtils.damp(st.dampedSeconds, mechanicalSeconds, 28, dt);

    if (hourRef.current) hourRef.current.rotation.z = -(elapsed / 43200) * Math.PI * 2;
    if (minuteRef.current) minuteRef.current.rotation.z = -(elapsed / 3600) * Math.PI * 2;
    if (secondsRef.current) secondsRef.current.rotation.z = -(st.dampedSeconds / 60) * Math.PI * 2;

    // 2. Date wheel: rolls forward like a real instantaneous date change
    const localDay = Math.floor((nowMs - st.tzOffsetMs + st.simOffsetSeconds * 1000) / 86400000) + store.dateOffsetDays;
    if (localDay !== st.lastLocalDay) {
      st.lastLocalDay = localDay;
      const dayOfMonth = new Date(localDay * 86400000 + st.tzOffsetMs + 43200000).getDate();
      const targetIndex = dayOfMonth - 1;
      if (st.dateWheelTarget < 0) {
        st.dateWheelTarget = targetIndex;
        st.dateWheelShown = targetIndex;
      } else {
        const current = ((st.dateWheelTarget % 31) + 31) % 31;
        st.dateWheelTarget += (targetIndex - current + 31) % 31;
      }
    }
    st.dateWheelShown = THREE.MathUtils.damp(st.dateWheelShown, st.dateWheelTarget, 7, dt);
    misc.dateWheel.offset.y = 1 - (st.dateWheelShown + 1) / 31;

    // 3. Movement: 4 Hz balance, hairspring breathing, gear train, self-winding rotor
    const balance = Math.sin(t * Math.PI * 2 * 4 * (store.timeMultiplier === 0.1 ? 0.15 : 1)) * 1.25;
    if (balanceRef.current) balanceRef.current.rotation.z = balance;
    if (hairspringRef.current) {
      const breathe = 1 + Math.sin(t * Math.PI * 8) * 0.06;
      hairspringRef.current.scale.set(breathe, breathe, 1);
    }
    if (escapeRef.current) escapeRef.current.rotation.z = -(st.dampedSeconds / 60) * Math.PI * 2 * 4;
    if (thirdRef.current) thirdRef.current.rotation.z = (st.dampedSeconds / 60) * Math.PI * 2 * 0.5;
    if (barrelRef.current) barrelRef.current.rotation.z = -(elapsed / 3600) * 0.3 + store.crownWindAngle * 0.2;

    const pointerDx = state.pointer.x - st.lastPointerX;
    st.lastPointerX = state.pointer.x;
    st.rotorVelocity += pointerDx * 9 - Math.sin(st.rotorAngle) * 4 * dt - st.rotorVelocity * 1.6 * dt;
    st.rotorAngle += st.rotorVelocity * dt;
    if (rotorRef.current) rotorRef.current.rotation.z = st.rotorAngle;

    // 4. Crown winding + hover pull-out
    st.dampedCrown = THREE.MathUtils.damp(st.dampedCrown, store.crownWindAngle, 14, dt);
    const hovered = hoveredRef.current === 'crown';
    st.crownPull = THREE.MathUtils.damp(st.crownPull, hovered ? 0.035 : 0, 12, dt);
    if (crownRef.current) {
      crownRef.current.rotation.x = st.dampedCrown;
      crownRef.current.position.x = 1.0 + st.crownPull;
    }

    // 5. Exploded calibre (six layers along Z)
    const exp = store.explodedProgress;
    const layer = (g: THREE.Group | null, target: number) => {
      if (g) g.position.z = THREE.MathUtils.damp(g.position.z, target, 10, dt);
    };
    layer(casebackRef.current, -exp * 1.15);
    layer(movementRef.current, -exp * 0.62);
    layer(dialGroupRef.current, exp * 0.3);
    layer(handsGroupRef.current, exp * 0.6);
    layer(bezelGroupRef.current, exp * 0.92);
    layer(crystalGroupRef.current, exp * 1.3);

    // 6. Bracelet opens for the caseback / blueprint views, cushion fades away
    const wantOpen = exp > 0.05 || store.cameraPreset === 'caseback';
    const morphTarget = wantOpen ? 1 : 0;
    const nextMorph =
      st.braceletMorph < 0 ? morphTarget : THREE.MathUtils.damp(st.braceletMorph, morphTarget, 4.5, dt);
    if (Math.abs(nextMorph - st.braceletMorph) > 1e-4) {
      st.braceletMorph = nextMorph;
      writeBracelet(nextMorph);
    }
    if (cushionMatRef.current && cushionRef.current) {
      const o = THREE.MathUtils.damp(cushionMatRef.current.opacity, wantOpen ? 0 : 1, 6, dt);
      cushionMatRef.current.opacity = o;
      cushionMatRef.current.transparent = o < 0.99;
      cushionMatRef.current.depthWrite = o > 0.5;
      cushionRef.current.visible = o > 0.01;
    }

    // 7. Diamond scintillation glints (bloom-picked HDR sprites)
    st.burst = Math.max(0, st.burst - dt * 0.8);
    const isDiamond = edition.bezelStyle === 'diamond';
    const spots = isDiamond ? diamondLayout.glintSpots : flutedGlintSpots;
    const spotCount = isDiamond ? DIAMOND_COUNT : 48;
    const activeGlints = isDiamond ? GLINT_COUNT : edition.bezelStyle === 'fluted' ? 5 : 3;
    const glintSize = (isDiamond ? 0.1 : 0.07) * (store.isNightLume ? 0.35 : 1);
    for (let i = 0; i < GLINT_COUNT; i++) {
      const sprite = glintRefs.current[i];
      if (!sprite) continue;
      if (i >= activeGlints) {
        sprite.visible = false;
        continue;
      }
      const prev = st.glintPhase[i];
      st.glintPhase[i] += dt * st.glintSpeed[i] * (1 + st.burst * 4);
      if (Math.floor(st.glintPhase[i]) !== Math.floor(prev)) {
        st.glintSpot[i] = Math.floor(Math.random() * spotCount);
      }
      const life = st.glintPhase[i] % 1;
      const spot = st.glintSpot[i] % spotCount;
      const pulse = Math.pow(Math.sin(life * Math.PI), 10);
      sprite.visible = pulse > 0.01;
      sprite.position.set(spots[spot * 3], spots[spot * 3 + 1], spots[spot * 3 + 2]);
      sprite.scale.setScalar(glintSize * pulse * (1 + st.burst * 0.6));
      sprite.material.rotation = t * 0.6 + i;
    }

    // 8. Night lume
    for (const mat of lumeMatRefs.current) {
      if (!mat) continue;
      mat.emissive.lerp(store.isNightLume ? LUME_COLOR : NO_EMISSIVE, dt * 5);
      mat.emissiveIntensity = THREE.MathUtils.damp(mat.emissiveIntensity, store.isNightLume ? 3.2 : 0, 6, dt);
    }
  });

  /* ------------------------------ Interactions ------------------------------ */
  const onCrownClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    windMainspring(15);
    horologyAudio.playCrownWindClick();
    anim.current.rotorVelocity += 2.5;
  };
  const onCrownWheel = (e: ThreeEvent<WheelEvent>) => {
    e.stopPropagation();
    windMainspring(5);
    horologyAudio.playCrownWindClick();
  };
  const onDateClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    advanceDate();
    horologyAudio.playPusherSnap(true);
  };
  const onBezelClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    anim.current.burst = 1.6;
    horologyAudio.playPusherSnap(false);
  };
  const hoverHandlers = (part: 'crown' | 'date' | 'bezel') => ({
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      setHoveredPart(part);
    },
    onPointerOut: () => setHoveredPart(null),
  });

  /* -------------------------------- Materials -------------------------------- */
  const goldProps = {
    color: edition.goldColor,
    metalness: 1,
    roughness: 0.11,
    envMapIntensity: 1.9,
  };
  const steelPolishedProps = {
    color: edition.caseColor,
    metalness: 1,
    roughness: 0.13,
    envMapIntensity: 1.8,
  };

  const showCallouts = explodedProgress > 0.4;
  return (
    <group name="Classique_Root" scale={0.86}>
      {/* =============================== CASE BODY =============================== */}
      <group name="Case_Body">
        <mesh geometry={geo.caseMiddle}>
          <meshPhysicalMaterial {...steelPolishedProps} />
        </mesh>

        {/* Four polished lugs (mirrored) gently sloping toward the wrist */}
        {([
          [1, 1],
          [-1, 1],
          [1, -1],
          [-1, -1],
        ] as const).map(([sx, sy]) => (
          <group key={`lug-${sx}-${sy}`} rotation={[-0.13 * sy, 0, 0]}>
            <mesh geometry={geo.lug} scale={[sx, sy, 1]}>
              <meshPhysicalMaterial {...steelPolishedProps} />
            </mesh>
          </group>
        ))}

        {/* Engraved rehaut */}
        <mesh geometry={geo.rehaut}>
          <meshPhysicalMaterial
            color={edition.caseColor}
            map={misc.rehaut}
            metalness={1}
            roughness={0.22}
            envMapIntensity={1.5}
          />
        </mesh>

        {/* Winding crown at 3 o'clock */}
        <group
          ref={crownRef}
          name="Crown"
          position={[1.0, 0, -0.03]}
          onClick={onCrownClick}
          onWheel={onCrownWheel}
          {...hoverHandlers('crown')}
        >
          <mesh geometry={geo.crownTube} rotation={[0, Math.PI / 2, 0]} position={[0.03, 0, 0]}>
            <meshPhysicalMaterial {...steelPolishedProps} />
          </mesh>
          <mesh geometry={geo.crownBody} rotation={[0, Math.PI / 2, 0]} position={[0.16, 0, 0]}>
            <meshPhysicalMaterial {...goldProps} roughness={0.16} />
          </mesh>
          <mesh geometry={geo.crownCap} rotation={[0, Math.PI / 2, 0]} position={[0.235, 0, 0]}>
            <meshPhysicalMaterial {...goldProps} />
          </mesh>
          {/* Crest emblem on the crown */}
          {[0.6, -0.6].map((rz) => (
            <RoundedBox
              key={`crest-${rz}`}
              args={[0.012, 0.11, 0.012]}
              radius={0.004}
              smoothness={3}
              position={[0.268, 0, 0]}
              rotation={[rz, 0, 0]}
            >
              <meshPhysicalMaterial {...goldProps} />
            </RoundedBox>
          ))}
          {hoveredPart === 'crown' && (
            <Html position={[0.32, 0.22, 0]} center distanceFactor={5}>
              <div className="pointer-events-none whitespace-nowrap rounded-full border border-amber-300/40 bg-black/80 px-3 py-1 font-mono text-[10px] text-amber-100 shadow-[0_0_20px_rgba(251,191,36,0.25)] backdrop-blur animate-hud-pop">
                CLICK / SCROLL · WIND MAINSPRING
              </div>
            </Html>
          )}
        </group>

        {/* ============================ JUBILEE BRACELET ============================ */}
        <instancedMesh ref={endLinksRef} args={[geo.endLink, undefined, 2]}>
          <meshPhysicalMaterial
            color={edition.braceletOuterColor}
            metalness={1}
            roughness={0.28}
            bumpMap={misc.satin}
            bumpScale={0.002}
            envMapIntensity={1.7}
          />
        </instancedMesh>
        <instancedMesh ref={outerLinksRef} args={[geo.linkOuter, undefined, outerCount]}>
          <meshPhysicalMaterial
            color={edition.braceletOuterColor}
            metalness={1}
            roughness={0.3}
            bumpMap={misc.satin}
            bumpScale={0.002}
            envMapIntensity={1.7}
          />
        </instancedMesh>
        <instancedMesh ref={smallLinksRef} args={[geo.linkSmall, undefined, smallCount]}>
          <meshPhysicalMaterial
            color={edition.braceletCenterColor}
            metalness={1}
            roughness={0.1}
            envMapIntensity={2.1}
          />
        </instancedMesh>
        <mesh ref={claspRef} geometry={geo.clasp} matrixAutoUpdate={false}>
          <meshPhysicalMaterial
            color={edition.braceletOuterColor}
            metalness={1}
            roughness={0.26}
            bumpMap={misc.satin}
            bumpScale={0.002}
            envMapIntensity={1.7}
          />
          <ClassiqueClaspDetails steel={edition.braceletOuterColor} gold={edition.goldColor} />
        </mesh>

        <ClassiqueCaseDetails steel={edition.caseColor} />

        {/* Velvet presentation cushion */}
        <mesh ref={cushionRef} geometry={cushionGeometry} position={[0, 0, -1.06]}>
          <meshPhysicalMaterial
            ref={cushionMatRef}
            color={isNightLume ? '#0b0a09' : '#1d1916'}
            roughness={1}
            metalness={0}
            sheen={1}
            sheenRoughness={0.5}
            sheenColor={isNightLume ? '#16130f' : '#5b4c3e'}
            envMapIntensity={0.15}
          />
        </mesh>
      </group>

      {/* ===================== L01: EXHIBITION CASEBACK ===================== */}
      <group ref={casebackRef} name="L01_Caseback">
        <mesh geometry={geo.caseback}>
          <meshPhysicalMaterial {...steelPolishedProps} roughness={0.2} bumpMap={misc.radial} bumpScale={0.0015} />
        </mesh>
        <mesh position={[0, 0, -0.272]} rotation={[0, Math.PI, 0]}>
          <circleGeometry args={[0.67, 96]} />
          <meshPhysicalMaterial
            color="#eef6ff"
            transparent
            opacity={0.12}
            roughness={0.03}
            metalness={0}
            clearcoat={1}
            envMapIntensity={1.6}
            depthWrite={false}
          />
        </mesh>
        <ClassiqueCasebackDetails steel={edition.caseColor} />
        {showCallouts && (
          <BlueprintCallout
            position={[0.47, -0.85, -0.28]}
            layer="L01"
            text="SAPPHIRE EXHIBITION CASEBACK"
            tone="amber"
            delayMs={250}
          />
        )}
      </group>

      {/* ===================== L02: CALIBRE CX-3235 MOVEMENT ===================== */}
      <group ref={movementRef} name="L02_Movement">
        <group position={[0, 0, -0.17]} rotation={[0, Math.PI, 0]}>
          {/* Baseplate with perlage-like Côtes de Genève */}
          <mesh>
            <circleGeometry args={[0.82, 96]} />
            <meshPhysicalMaterial
              color="#C8CCD2"
              metalness={1}
              roughness={0.3}
              bumpMap={misc.geneve}
              bumpScale={0.004}
              envMapIntensity={1.6}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Bridges */}
          <RoundedBox args={[1.25, 0.2, 0.03]} radius={0.012} smoothness={4} position={[0.05, 0.18, 0.018]} rotation={[0, 0, 0.35]}>
            <meshPhysicalMaterial color="#D3D7DC" metalness={1} roughness={0.24} bumpMap={misc.geneve} bumpScale={0.004} envMapIntensity={1.8} />
          </RoundedBox>
          <RoundedBox args={[0.5, 0.12, 0.03]} radius={0.012} smoothness={4} position={[-0.4, -0.3, 0.03]} rotation={[0, 0, -0.5]}>
            <meshPhysicalMaterial color="#D3D7DC" metalness={1} roughness={0.24} bumpMap={misc.geneve} bumpScale={0.004} envMapIntensity={1.8} />
          </RoundedBox>

          <group position={[0.36, 0.3, 0.012]}>
            <mesh ref={barrelRef} geometry={geo.barrel}>
              <meshPhysicalMaterial color={edition.goldColor} metalness={1} roughness={0.2} bumpMap={misc.radial} bumpScale={0.003} envMapIntensity={1.9} />
            </mesh>
            <RubyJewel position={[0, 0, 0.02]} radius={0.026} chaton={edition.goldColor} />
          </group>
          <group position={[0.3, -0.25, 0.012]}>
            <mesh ref={thirdRef} geometry={geo.thirdWheel}>
              <meshPhysicalMaterial color={edition.goldColor} metalness={1} roughness={0.16} envMapIntensity={1.9} />
            </mesh>
            <RubyJewel position={[0, 0, 0.016]} radius={0.02} chaton={edition.goldColor} />
          </group>
          <group position={[-0.12, -0.46, 0.014]}>
            <mesh ref={escapeRef} geometry={geo.escapeWheel}>
              <meshPhysicalMaterial color="#E6E8EB" metalness={1} roughness={0.14} envMapIntensity={2} />
            </mesh>
            <RubyJewel position={[0, 0, 0.014]} radius={0.016} chaton={edition.goldColor} />
          </group>
          {/* 4 Hz balance wheel with breathing hairspring */}
          <group ref={balanceRef} position={[-0.42, -0.2, 0.04]}>
            <mesh geometry={geo.balanceRim}>
              <meshPhysicalMaterial color={edition.goldColor} metalness={1} roughness={0.1} envMapIntensity={2.1} />
            </mesh>
            <mesh ref={hairspringRef} geometry={geo.hairspring} position={[0, 0, 0.012]}>
              <meshPhysicalMaterial color="#3B82F6" metalness={1} roughness={0.15} envMapIntensity={1.8} />
            </mesh>
            <RubyJewel position={[0, 0, 0.022]} radius={0.016} chaton={edition.goldColor} />
          </group>

          <ClassiqueMovementDetails gold={edition.goldColor} />

          {/* Self-winding rotor */}
          <group ref={rotorRef} position={[0, 0, 0.07]}>
            <mesh geometry={geo.rotor}>
              <meshPhysicalMaterial
                color={edition.goldColor}
                metalness={1}
                roughness={0.2}
                bumpMap={misc.geneve}
                bumpScale={0.004}
                envMapIntensity={2}
                clearcoat={0.4}
              />
            </mesh>
            <RubyJewel position={[0, 0, 0.026]} radius={0.028} chaton={edition.goldColor} />
          </group>
        </group>
        {showCallouts && (
          <BlueprintCallout
            position={[0.81, -0.53, -0.2]}
            layer="L02"
            text="CALIBRE CX-3235 · 31 JEWELS · BLUED SCREWS · 70H"
            tone="rose"
            delayMs={200}
          />
        )}
      </group>

      {/* ===================== L03: DIAL, INDICES & DATE ===================== */}
      <group ref={dialGroupRef} name="L03_Dial">
        <mesh position={[0, 0, DIAL_Z]} receiveShadow>
          <circleGeometry args={[DIAL_RADIUS, 160]} />
          <meshPhysicalMaterial
            key={edition.dialStyle}
            map={dialTextures.map}
            normalMap={dialTextures.normalMap ?? undefined}
            normalScale={DIAL_NORMAL_SCALE}
            anisotropy={dialTextures.anisotropyMap ? 0.9 : 0}
            anisotropyMap={dialTextures.anisotropyMap ?? undefined}
            metalness={edition.dialStyle === 'sunray' ? 0.55 : 0.4}
            roughness={edition.dialStyle === 'sunray' ? 0.28 : 0.34}
            clearcoat={0.35}
            clearcoatRoughness={0.2}
            envMapIntensity={1.35}
            alphaTest={0.5}
          />
        </mesh>

        {/* Applied 18K hour batons */}
        {hourIndices.map((h) => (
          <group key={`idx-${h.i}`} position={[h.x, h.y, DIAL_Z + 0.009]} rotation={[0, 0, h.rotZ]}>
            {h.i === 0 ? (
              <>
                <mesh geometry={geo.indexDouble} position={[-0.02, 0, 0]} castShadow>
                  <meshPhysicalMaterial {...goldProps} roughness={0.07} />
                </mesh>
                <mesh geometry={geo.indexDouble} position={[0.02, 0, 0]} castShadow>
                  <meshPhysicalMaterial {...goldProps} roughness={0.07} />
                </mesh>
              </>
            ) : (
              <mesh geometry={geo.index} castShadow>
                <meshPhysicalMaterial {...goldProps} roughness={0.07} />
              </mesh>
            )}
          </group>
        ))}

        {/* Applied crest under the 12 o'clock signature */}
        <group position={[0, 0.47, DIAL_Z + 0.006]}>
          {[0.62, -0.62, 0].map((rz, i) => (
            <RoundedBox
              key={`crest-dial-${i}`}
              args={[i === 2 ? 0.07 : 0.012, i === 2 ? 0.008 : 0.06, 0.008]}
              radius={0.003}
              smoothness={3}
              position={[0, i === 2 ? -0.034 : 0, 0]}
              rotation={[0, 0, rz]}
            >
              <meshPhysicalMaterial {...goldProps} roughness={0.08} />
            </RoundedBox>
          ))}
        </group>

        <ClassiqueDialDetails gold={edition.goldColor} lumeDay={edition.lumeDayColor} dialZ={DIAL_Z} />

        {/* Date disc + polished frame + click target */}
        <mesh position={[DATE_WINDOW.x, DATE_WINDOW.y, DIAL_Z - 0.012]}>
          <planeGeometry args={[DATE_WINDOW.w * 1.08, DATE_WINDOW.h * 1.08]} />
          <meshStandardMaterial map={misc.dateWheel} roughness={0.55} metalness={0} />
        </mesh>
        <mesh geometry={geo.dateFrame} position={[DATE_WINDOW.x, DATE_WINDOW.y, DIAL_Z]}>
          <meshPhysicalMaterial {...goldProps} roughness={0.08} />
        </mesh>
        <mesh
          position={[DATE_WINDOW.x, DATE_WINDOW.y, 0.26]}
          onClick={onDateClick}
          {...hoverHandlers('date')}
        >
          <planeGeometry args={[0.22, 0.18]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
        {hoveredPart === 'date' && (
          <Html position={[DATE_WINDOW.x + 0.05, 0.2, 0.3]} center distanceFactor={5}>
            <div className="pointer-events-none whitespace-nowrap rounded-full border border-sky-300/40 bg-black/80 px-3 py-1 font-mono text-[10px] text-sky-100 shadow-[0_0_20px_rgba(56,189,248,0.25)] backdrop-blur animate-hud-pop">
              CLICK · DATE QUICKSET +1
            </div>
          </Html>
        )}
        {showCallouts && (
          <BlueprintCallout
            position={[0.96, -0.14, 0.05]}
            layer="L03"
            text={edition.dialStyle === 'sunray' ? 'SUNRAY DIAL · 18K BATONS' : 'FLUTED MOTIF DIAL · 18K BATONS'}
            tone="zinc"
            delayMs={150}
          />
        )}
      </group>

      {/* ===================== L04: HANDS ===================== */}
      <group ref={handsGroupRef} name="L04_Hands">
        <group ref={hourRef} position={[0, 0, 0.084]}>
          <mesh geometry={geo.hourHand} castShadow>
            <meshPhysicalMaterial {...goldProps} roughness={0.08} />
          </mesh>
          <RoundedBox args={[0.02, 0.29, 0.006]} radius={0.0025} smoothness={2} position={[0, 0.22, 0.01]}>
            <meshStandardMaterial
              ref={(m) => (lumeMatRefs.current[0] = m)}
              color={edition.lumeDayColor}
              roughness={0.5}
              emissive="#000000"
            />
          </RoundedBox>
        </group>
        <group ref={minuteRef} position={[0, 0, 0.098]}>
          <mesh geometry={geo.minuteHand} castShadow>
            <meshPhysicalMaterial {...goldProps} roughness={0.08} />
          </mesh>
          <RoundedBox args={[0.016, 0.48, 0.006]} radius={0.0025} smoothness={2} position={[0, 0.34, 0.009]}>
            <meshStandardMaterial
              ref={(m) => (lumeMatRefs.current[1] = m)}
              color={edition.lumeDayColor}
              roughness={0.5}
              emissive="#000000"
            />
          </RoundedBox>
        </group>
        <group ref={secondsRef} position={[0, 0, 0.112]}>
          <mesh geometry={geo.secondsHand} castShadow>
            <meshPhysicalMaterial {...goldProps} roughness={0.12} />
          </mesh>
          <mesh position={[0, -0.12, 0.003]}>
            <circleGeometry args={[0.016, 32]} />
            <meshPhysicalMaterial {...goldProps} roughness={0.12} />
          </mesh>
        </group>
        <mesh geometry={geo.hub} position={[0, 0, 0.116]}>
          <meshPhysicalMaterial {...goldProps} roughness={0.06} />
        </mesh>
        <RubyJewel position={[0, 0, 0.133]} radius={0.008} chaton={edition.goldColor} />
        {showCallouts && (
          <BlueprintCallout
            position={[0.96, 0.14, 0.05]}
            layer="L04"
            text="BATON HANDS · BLUE LUMINESCENCE"
            tone="cyan"
            delayMs={100}
          />
        )}
      </group>

      {/* ===================== L05: BEZEL (+ DIAMONDS) ===================== */}
      <group ref={bezelGroupRef} name="L05_Bezel">
        <mesh geometry={bezelGeometry} onClick={onBezelClick} {...hoverHandlers('bezel')}>
          <meshPhysicalMaterial {...goldProps} roughness={edition.bezelStyle === 'fluted' ? 0.07 : 0.1} />
        </mesh>

        {edition.bezelStyle === 'diamond' && (
          <>
            <instancedMesh
              ref={diamondsRef}
              args={[geo.brilliant, undefined, DIAMOND_COUNT]}
              onClick={onBezelClick}
              {...hoverHandlers('bezel')}
            >
              <meshPhysicalMaterial
                color="#ffffff"
                metalness={1}
                roughness={0}
                envMapIntensity={4.2}
                iridescence={0.7}
                iridescenceIOR={2.1}
                iridescenceThicknessRange={[180, 620]}
                flatShading
              />
            </instancedMesh>
            <instancedMesh ref={beadsRef} args={[undefined, undefined, DIAMOND_COUNT * 2]}>
              <sphereGeometry args={[0.011, 12, 8]} />
              <meshPhysicalMaterial {...goldProps} roughness={0.12} />
            </instancedMesh>
          </>
        )}

        {Array.from({ length: GLINT_COUNT }, (_, i) => (
          <sprite
            key={`glint-${i}`}
            ref={(s) => (glintRefs.current[i] = s)}
            visible={false}
          >
            <spriteMaterial
              map={misc.glint}
              color={GLINT_HDR_COLOR}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </sprite>
        ))}

        {hoveredPart === 'bezel' && (
          <Html position={[-0.75, 0.95, 0.3]} center distanceFactor={5}>
            <div className="pointer-events-none whitespace-nowrap rounded-full border border-white/30 bg-black/80 px-3 py-1 font-mono text-[10px] text-white shadow-[0_0_20px_rgba(255,255,255,0.2)] backdrop-blur animate-hud-pop">
              CLICK · SCINTILLATE
            </div>
          </Html>
        )}
        {showCallouts && (
          <BlueprintCallout
            position={[0.81, 0.53, 0.22]}
            layer="L05"
            text={
              edition.bezelStyle === 'diamond'
                ? '18K BEZEL · 52 BRILLIANT-CUT DIAMONDS'
                : edition.bezelStyle === 'fluted'
                  ? '18K FLUTED BEZEL · 48 FLUTES'
                  : 'POLISHED DOMED BEZEL'
            }
            tone="amber"
            delayMs={50}
          />
        )}
      </group>

      {/* ===================== L06: SAPPHIRE CRYSTAL + CYCLOPS ===================== */}
      <group ref={crystalGroupRef} name="L06_Crystal">
        <mesh geometry={geo.crystal}>
          <MeshTransmissionMaterial
            // Built-in transmission pass: it is cleared every frame, unlike MTM's own FBO,
            // which the EffectComposer (autoClear=false) would otherwise smear into ghost trails
            transmissionSampler
            backside={false}
            samples={6}
            thickness={0.12}
            roughness={0.02}
            transmission={0.99}
            ior={1.77}
            chromaticAberration={0.015}
            anisotropy={0.1}
            clearcoat={1}
            clearcoatRoughness={0.02}
            specularIntensity={0.55}
            envMapIntensity={1.2}
            color="#ffffff"
          />
        </mesh>
        <mesh geometry={geo.cyclops} position={[DATE_WINDOW.x, DATE_WINDOW.y, 0.25]}>
          <meshPhysicalMaterial
            color="#ffffff"
            transmission={1}
            thickness={0.35}
            roughness={0}
            ior={1.77}
            metalness={0}
            clearcoat={1}
            specularIntensity={0.8}
            envMapIntensity={1.4}
          />
        </mesh>
        {showCallouts && (
          <BlueprintCallout
            position={[0.47, 0.85, 0.24]}
            layer="L06"
            text="SAPPHIRE CRYSTAL · CYCLOPS 2.5×"
            tone="sky"
            delayMs={0}
          />
        )}
      </group>
    </group>
  );
};
