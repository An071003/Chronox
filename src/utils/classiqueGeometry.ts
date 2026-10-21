import * as THREE from 'three';

/**
 * Procedural CAD geometry for the CHRONO-X Classique Date 36.
 * Units: 1.0 = 18 mm (case radius), case axis = +Z (crystal faces the camera).
 */

export type ProfilePoint = [r: number, z: number];

/**
 * Revolves a closed (r, z) cross-section around the Z axis.
 * `displace(theta, index)` returns an offset (in profile units) applied along the
 * local profile normal, used for fluting / knurling.
 */
export function createRevolvedGeometry(
  profile: ProfilePoint[],
  segments: number,
  displace?: (theta: number, profileIndex: number) => number
): THREE.BufferGeometry {
  const rows = profile.length;
  const cols = segments + 1;
  const positions = new Float32Array(rows * cols * 3);
  const uvs = new Float32Array(rows * cols * 2);

  // 2D outward normals of the profile polyline (used for displacement)
  const profileNormals: [number, number][] = profile.map((_, i) => {
    const prev = profile[Math.max(0, i - 1)];
    const next = profile[Math.min(rows - 1, i + 1)];
    const dr = next[0] - prev[0];
    const dz = next[1] - prev[1];
    const len = Math.hypot(dr, dz) || 1;
    return [dz / len, -dr / len];
  });

  for (let c = 0; c < cols; c++) {
    const theta = (c / segments) * Math.PI * 2;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    for (let r = 0; r < rows; r++) {
      let [radius, z] = profile[r];
      if (displace) {
        const d = displace(theta, r);
        radius += profileNormals[r][0] * d;
        z += profileNormals[r][1] * d;
      }
      const idx = (c * rows + r) * 3;
      positions[idx] = cos * radius;
      positions[idx + 1] = sin * radius;
      positions[idx + 2] = z;
      const uvIdx = (c * rows + r) * 2;
      uvs[uvIdx] = c / segments;
      uvs[uvIdx + 1] = r / (rows - 1);
    }
  }

  const indices: number[] = [];
  for (let c = 0; c < segments; c++) {
    for (let r = 0; r < rows - 1; r++) {
      const a = c * rows + r;
      const b = (c + 1) * rows + r;
      const d = c * rows + r + 1;
      const e = (c + 1) * rows + r + 1;
      indices.push(a, b, d, b, e, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  // Weld the seam normals so polished surfaces have no visible crease at theta = 0
  const normals = geo.getAttribute('normal') as THREE.BufferAttribute;
  for (let r = 0; r < rows; r++) {
    const first = r;
    const last = segments * rows + r;
    const nx = normals.getX(first) + normals.getX(last);
    const ny = normals.getY(first) + normals.getY(last);
    const nz = normals.getZ(first) + normals.getZ(last);
    const len = Math.hypot(nx, ny, nz) || 1;
    normals.setXYZ(first, nx / len, ny / len, nz / len);
    normals.setXYZ(last, nx / len, ny / len, nz / len);
  }
  return geo;
}

/** Concave flute profile: 0 on the sharp ridge, 1 at the bottom of the groove */
function fluteGroove(theta: number, count: number): number {
  const phase = (theta * count) / (Math.PI * 2);
  const f = phase - Math.floor(phase);
  return 1 - (2 * f - 1) * (2 * f - 1);
}

export function createCaseMiddleGeometry(): THREE.BufferGeometry {
  return createRevolvedGeometry(
    [
      [0.84, 0.13],
      [0.84, -0.235],
      [0.875, -0.268],
      [0.93, -0.258],
      [0.966, -0.205],
      [0.984, -0.11],
      [0.99, 0.0],
      [0.986, 0.07],
      [0.968, 0.112],
      [0.93, 0.13],
      [0.84, 0.13],
    ],
    192
  );
}

export function createBezelGeometry(style: 'diamond' | 'fluted' | 'smooth'): THREE.BufferGeometry {
  if (style === 'diamond') {
    return createRevolvedGeometry(
      [
        [0.83, 0.13],
        [0.975, 0.13],
        [0.99, 0.15],
        [0.988, 0.178],
        [0.968, 0.2],
        [0.94, 0.212],
        [0.87, 0.226],
        [0.842, 0.229],
        [0.832, 0.222],
        [0.83, 0.13],
      ],
      192
    );
  }

  if (style === 'fluted') {
    const profile: ProfilePoint[] = [
      [0.83, 0.13],
      [0.975, 0.13],
      [0.99, 0.15],
      [0.985, 0.17],
      [0.968, 0.19],
      [0.945, 0.208],
      [0.918, 0.224],
      [0.89, 0.236],
      [0.862, 0.244],
      [0.842, 0.247],
      [0.832, 0.24],
      [0.83, 0.13],
    ];
    // Flute depth weighting along the sloped crown of the bezel
    const weights = [0, 0, 0.2, 0.75, 1, 1, 1, 1, 0.85, 0.35, 0, 0];
    const fluteCount = 48;
    return createRevolvedGeometry(profile, fluteCount * 14, (theta, i) => {
      const w = weights[i] ?? 0;
      if (w === 0) return 0;
      return -0.026 * w * fluteGroove(theta, fluteCount);
    });
  }

  // Smooth domed bezel
  return createRevolvedGeometry(
    [
      [0.83, 0.13],
      [0.975, 0.13],
      [0.99, 0.15],
      [0.986, 0.18],
      [0.965, 0.212],
      [0.93, 0.235],
      [0.885, 0.248],
      [0.848, 0.25],
      [0.833, 0.243],
      [0.83, 0.13],
    ],
    192
  );
}

/** Sloped inner flange between the dial and crystal (engraved rehaut) */
export function createRehautGeometry(): THREE.BufferGeometry {
  return createRevolvedGeometry(
    [
      [0.798, 0.05],
      [0.812, 0.1],
      [0.826, 0.15],
      [0.834, 0.19],
    ],
    192
  );
}

/** Sapphire crystal disc with a chamfered top edge */
export function createCrystalGeometry(): THREE.BufferGeometry {
  return createRevolvedGeometry(
    [
      [0.0, 0.236],
      [0.6, 0.236],
      [0.8, 0.234],
      [0.826, 0.226],
      [0.834, 0.21],
      [0.834, 0.19],
      [0.0, 0.19],
    ],
    128
  );
}

/** Caseback ring with an exhibition window */
export function createCasebackGeometry(): THREE.BufferGeometry {
  return createRevolvedGeometry(
    [
      [0.66, -0.27],
      [0.7, -0.29],
      [0.8, -0.295],
      [0.86, -0.285],
      [0.89, -0.262],
      [0.86, -0.255],
      [0.66, -0.255],
      [0.66, -0.27],
    ],
    128
  );
}

/** Rounded lug horn (top-right); mirror via scale for the other three */
export function createLugGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0.57, 0.62);
  shape.lineTo(0.87, 0.46);
  // Outer flank flows out of the case and tapers toward the spring-bar tip
  shape.bezierCurveTo(0.86, 0.78, 0.8, 1.02, 0.7, 1.17);
  shape.quadraticCurveTo(0.67, 1.2, 0.63, 1.2);
  shape.lineTo(0.59, 1.2);
  shape.quadraticCurveTo(0.565, 1.19, 0.565, 1.16);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.14,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.03,
    bevelSegments: 6,
    curveSegments: 32,
  });
  geo.translate(0, 0, -0.14);

  // Crown the top surface (rounded across its width) and let the tip droop toward the wrist,
  // so polished lugs carry a reflection gradient instead of reading as flat slabs
  const pos = geo.getAttribute('position') as THREE.BufferAttribute;
  const zMin = -0.19;
  const zMax = 0.05;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const topWeight = Math.max(0, Math.min(1, (z - zMin) / (zMax - zMin)));
    const across = (x - 0.69) / 0.17;
    const crown = 0.05 * across * across * topWeight;
    const droop = 0.06 * Math.max(0, y - 0.75) * topWeight;
    pos.setZ(i, z - crown - droop);
  }
  geo.computeVertexNormals();
  return geo;
}

/** Faceted baton hand with a pointed tip; pivot at the origin */
export function createBatonHandGeometry(
  length: number,
  width: number,
  tipLength: number,
  tail: number,
  thickness: number
): THREE.ExtrudeGeometry {
  const hw = width / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-hw, -tail);
  shape.lineTo(-hw, length - tipLength);
  shape.lineTo(0, length);
  shape.lineTo(hw, length - tipLength);
  shape.lineTo(hw, -tail);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness * 0.4,
    bevelEnabled: true,
    bevelThickness: thickness * 0.3,
    bevelSize: hw * 0.42,
    bevelSegments: 2,
  });
  geo.translate(0, 0, -thickness * 0.2);
  geo.computeVertexNormals();
  return geo;
}

/** Ultra-thin seconds needle with a counterweight tail */
export function createSecondsHandGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-0.006, -0.17);
  shape.lineTo(-0.0035, 0.76);
  shape.lineTo(0, 0.775);
  shape.lineTo(0.0035, 0.76);
  shape.lineTo(0.006, -0.17);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.004,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.0015,
    bevelSegments: 2,
  });
  geo.computeVertexNormals();
  return geo;
}

/** Applied hour baton with polished chamfers */
export function createIndexGeometry(width: number, length: number): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const hw = width / 2;
  const hl = length / 2;
  shape.moveTo(-hw, -hl);
  shape.lineTo(hw, -hl);
  shape.lineTo(hw, hl);
  shape.lineTo(-hw, hl);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.008,
    bevelEnabled: true,
    bevelThickness: 0.009,
    bevelSize: Math.min(hw * 0.55, 0.009),
    bevelSegments: 2,
  });
  geo.computeVertexNormals();
  return geo;
}

/**
 * Round brilliant cut (57 facets simplified to 8-fold symmetry), flat-shaded.
 * Table faces +Z, girdle radius = r.
 */
export function createBrilliantGeometry(r: number): THREE.BufferGeometry {
  const pts: number[] = [];
  const polar = (radius: number, angleDeg: number, z: number): THREE.Vector3 =>
    new THREE.Vector3(
      Math.cos((angleDeg * Math.PI) / 180) * radius,
      Math.sin((angleDeg * Math.PI) / 180) * radius,
      z
    );

  const tableCenter = new THREE.Vector3(0, 0, 0.3 * r);
  const T = Array.from({ length: 8 }, (_, k) => polar(0.56 * r, k * 45, 0.3 * r));
  const K = Array.from({ length: 8 }, (_, k) => polar(0.8 * r, k * 45 + 22.5, 0.17 * r));
  const Gt = Array.from({ length: 16 }, (_, j) => polar(r, j * 22.5, 0.02 * r));
  const Gb = Array.from({ length: 16 }, (_, j) => polar(r, j * 22.5, -0.02 * r));
  const M = Array.from({ length: 8 }, (_, k) => polar(0.46 * r, k * 45, -0.47 * r));
  const culet = new THREE.Vector3(0, 0, -0.86 * r);

  const tri = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) => {
    // Orient every facet outward (the stone is convex around the origin)
    const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a));
    const centroid = new THREE.Vector3().add(a).add(b).add(c).divideScalar(3);
    if (n.dot(centroid) < 0) {
      pts.push(a.x, a.y, a.z, c.x, c.y, c.z, b.x, b.y, b.z);
    } else {
      pts.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    }
  };

  for (let k = 0; k < 8; k++) {
    const kn = (k + 1) % 8;
    const kp = (k + 7) % 8;
    // Table
    tri(tableCenter, T[k], T[kn]);
    // Star facets
    tri(T[k], T[kn], K[k]);
    // Bezel (kite) facets
    tri(T[k], K[kp], Gt[2 * k]);
    tri(T[k], Gt[2 * k], K[k]);
    // Upper girdle facets
    tri(K[k], Gt[2 * k], Gt[2 * k + 1]);
    tri(K[k], Gt[2 * k + 1], Gt[(2 * k + 2) % 16]);
    // Lower girdle + pavilion mains
    tri(Gb[2 * k], Gb[2 * k + 1], M[k]);
    tri(Gb[2 * k + 1], Gb[(2 * k + 2) % 16], M[kn]);
    tri(M[k], Gb[2 * k + 1], M[kn]);
    tri(M[k], M[kn], culet);
  }
  // Girdle band
  for (let j = 0; j < 16; j++) {
    const jn = (j + 1) % 16;
    tri(Gt[j], Gb[j], Gb[jn]);
    tri(Gt[j], Gb[jn], Gt[jn]);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  geo.computeVertexNormals(); // non-indexed -> crisp flat facets
  return geo;
}

/** Half-disc oscillating weight (rotor) for the automatic movement */
export function createRotorGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const outer = 0.74;
  const inner = 0.5;
  shape.absarc(0, 0, outer, Math.PI * 0.02, Math.PI * 0.98, false);
  shape.absarc(0, 0, 0.09, Math.PI * 0.98, Math.PI * 2.02, false);
  shape.closePath();
  const window = new THREE.Path();
  window.absarc(0, 0, inner, Math.PI * 0.14, Math.PI * 0.86, false);
  window.absarc(0, 0, 0.2, Math.PI * 0.86, Math.PI * 0.14, true);
  window.closePath();
  shape.holes.push(window);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.018,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.006,
    bevelSegments: 3,
    curveSegments: 48,
  });
  geo.computeVertexNormals();
  return geo;
}

/* -------------------------------------------------------------------------- */
/*                        JUBILEE BRACELET PATH SOLVER                         */
/* -------------------------------------------------------------------------- */

/**
 * The bracelet wraps an elliptical "wrist" loop behind the case (closed) and can
 * morph into an open, straight presentation (for the caseback / exploded views).
 */
export const BRACELET_LOOP = {
  semiY: 1.55,
  semiZ: 1.25,
  centerZ: -0.9,
  lugY: 1.2,
};

export interface BraceletPathSampler {
  halfLength: number;
  /** Writes the top-half centerline point at arc length s into `out` */
  sample: (s: number, morph: number, out: THREE.Vector3) => THREE.Vector3;
}

export function createBraceletPathSampler(): BraceletPathSampler {
  const { semiY, semiZ, centerZ, lugY } = BRACELET_LOOP;
  const phi0 = Math.asin(lugY / semiY);
  const steps = 512;
  const phis = new Float32Array(steps + 1);
  const lengths = new Float32Array(steps + 1);

  let acc = 0;
  let prevY = semiY * Math.sin(phi0);
  let prevZ = centerZ + semiZ * Math.cos(phi0);
  phis[0] = phi0;
  lengths[0] = 0;
  for (let i = 1; i <= steps; i++) {
    const phi = phi0 + (i / steps) * (Math.PI - phi0);
    const y = semiY * Math.sin(phi);
    const z = centerZ + semiZ * Math.cos(phi);
    acc += Math.hypot(y - prevY, z - prevZ);
    phis[i] = phi;
    lengths[i] = acc;
    prevY = y;
    prevZ = z;
  }
  const halfLength = acc;

  const startY = semiY * Math.sin(phi0);
  const startZ = centerZ + semiZ * Math.cos(phi0);
  // Open pose: the bracelet falls almost straight away from the lug with a gentle droop
  const openDirY = 0.97;
  const openDirZ = -0.24;

  const sample = (s: number, morph: number, out: THREE.Vector3) => {
    const clamped = Math.max(0, Math.min(halfLength, s));
    // Binary search the arc-length LUT (no allocations)
    let lo = 0;
    let hi = steps;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (lengths[mid] < clamped) lo = mid;
      else hi = mid;
    }
    const span = lengths[hi] - lengths[lo] || 1;
    const t = (clamped - lengths[lo]) / span;
    const phi = phis[lo] + (phis[hi] - phis[lo]) * t;
    const closedY = semiY * Math.sin(phi);
    const closedZ = centerZ + semiZ * Math.cos(phi);

    const openY = startY + openDirY * clamped;
    const openZ = startZ + openDirZ * clamped - 0.035 * clamped * clamped;

    out.set(0, closedY + (openY - closedY) * morph, closedZ + (openZ - closedZ) * morph);
    return out;
  };

  return { halfLength, sample };
}
