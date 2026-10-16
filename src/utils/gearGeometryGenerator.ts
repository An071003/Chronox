import * as THREE from 'three';

export interface GearGeometryOptions {
  innerRadius: number;
  pitchRadius: number;
  outerRadius: number;
  teethCount: number;
  thickness: number;
  spokeCount?: number;
  bevelThickness?: number;
  bevelSize?: number;
}

/**
 * SKILL 1 (`arjun988/blender-skills`):
 * True Mathematical Gear Teeth + Skeletonized Cutout Spokes + 4-Segment Bevel
 * Preserves exact (0,0) rotational axis so gears never wobble eccentrically.
 */
export function createGearGeometry({
  innerRadius,
  pitchRadius,
  outerRadius,
  teethCount,
  thickness,
  spokeCount = 5,
  bevelThickness = 0.0035,
  bevelSize = 0.0025,
}: GearGeometryOptions): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const rootRadius = pitchRadius * 0.91;
  const stepAngle = (Math.PI * 2) / teethCount;

  for (let i = 0; i < teethCount; i++) {
    const baseAngle = i * stepAngle;
    const a0 = baseAngle;
    const a1 = baseAngle + stepAngle * 0.18;
    const a2 = baseAngle + stepAngle * 0.30;
    const a3 = baseAngle + stepAngle * 0.52;
    const a4 = baseAngle + stepAngle * 0.64;
    const a5 = baseAngle + stepAngle * 0.88;

    const p0x = Math.cos(a0) * rootRadius;
    const p0y = Math.sin(a0) * rootRadius;
    if (i === 0) {
      shape.moveTo(p0x, p0y);
    } else {
      shape.lineTo(p0x, p0y);
    }

    shape.lineTo(Math.cos(a1) * pitchRadius, Math.sin(a1) * pitchRadius);
    shape.lineTo(Math.cos(a2) * outerRadius, Math.sin(a2) * outerRadius);
    shape.lineTo(Math.cos(a3) * outerRadius, Math.sin(a3) * outerRadius);
    shape.lineTo(Math.cos(a4) * pitchRadius, Math.sin(a4) * pitchRadius);
    shape.lineTo(Math.cos(a5) * rootRadius, Math.sin(a5) * rootRadius);
  }
  shape.closePath();

  // Center pivot bore hole
  const centerHole = new THREE.Path();
  centerHole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
  shape.holes.push(centerHole);

  // Skeletonized weight-reduction sector cutouts (spokes)
  const rimInner = rootRadius * 0.80;
  const hubOuter = innerRadius * 1.65;
  if (spokeCount > 0 && rimInner > hubOuter + 0.03) {
    const spokeSector = (Math.PI * 2) / spokeCount;
    const spokeHalfWidthAngle = 0.14;

    for (let s = 0; s < spokeCount; s++) {
      const startAng = s * spokeSector + spokeHalfWidthAngle;
      const endAng = (s + 1) * spokeSector - spokeHalfWidthAngle;
      if (endAng > startAng + 0.1) {
        const hole = new THREE.Path();
        const segs = 12;
        hole.moveTo(Math.cos(startAng) * hubOuter, Math.sin(startAng) * hubOuter);
        for (let k = 0; k <= segs; k++) {
          const a = startAng + (k / segs) * (endAng - startAng);
          hole.lineTo(Math.cos(a) * rimInner, Math.sin(a) * rimInner);
        }
        for (let k = segs; k >= 0; k--) {
          const a = startAng + (k / segs) * (endAng - startAng);
          hole.lineTo(Math.cos(a) * hubOuter, Math.sin(a) * hubOuter);
        }
        hole.closePath();
        shape.holes.push(hole);
      }
    }
  }

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness,
    bevelSize,
    bevelSegments: 4,
    curveSegments: 24,
  };

  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  // Center ONLY along Z so X=0, Y=0 remains the true mathematical pivot axis!
  geo.translate(0, 0, -thickness / 2);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Creates an Iconic Royal Oak / RM Octagonal Bezel / Case Geometry with circular crystal bore
 */
export function createOctagonalBezelGeometry(
  outerRadius: number,
  innerRadius: number,
  depth: number,
  bevelThickness = 0.018,
  bevelSize = 0.015
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const sides = 8;
  for (let i = 0; i < sides; i++) {
    const ang = (i / sides) * Math.PI * 2 + Math.PI / 8;
    const x = Math.cos(ang) * outerRadius;
    const y = Math.sin(ang) * outerRadius;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();

  const bore = new THREE.Path();
  bore.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
  shape.holes.push(bore);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness,
    bevelSize,
    bevelSegments: 4,
    curveSegments: 48,
  });
  geo.translate(0, 0, -depth / 2);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Creates a razor-sharp faceted Dauphine Sword Hand Geometry with diamond bevels
 */
export function createDauphineHandGeometry(
  length: number,
  tailLength: number,
  halfWidth: number,
  thickness: number
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, -tailLength);
  shape.lineTo(halfWidth, 0);
  shape.lineTo(halfWidth * 0.24, length * 0.88);
  shape.lineTo(0, length);
  shape.lineTo(-halfWidth * 0.24, length * 0.88);
  shape.lineTo(-halfWidth, 0);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: thickness * 0.35,
    bevelSize: halfWidth * 0.12,
    bevelSegments: 3,
  });
  geo.translate(0, 0, -thickness / 2);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Creates a clean, non-self-intersecting spiral Hairspring / Mainspring Geometry
 */
export function createSpiralSpringGeometry(
  innerR: number,
  outerR: number,
  turns: number,
  ribbonWidth: number,
  ribbonThickness: number
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const steps = turns * 40;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = t * turns * Math.PI * 2;
    const r = innerR + t * (outerR - innerR);
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }

  for (let i = steps; i >= 0; i--) {
    const t = i / steps;
    const angle = t * turns * Math.PI * 2;
    const r = Math.max(0.01, innerR + t * (outerR - innerR) - ribbonWidth);
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    shape.lineTo(x, y);
  }
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: ribbonThickness,
    bevelEnabled: false,
    curveSegments: 16,
  });
  geo.translate(0, 0, -ribbonThickness / 2);
  geo.computeVertexNormals();
  return geo;
}
