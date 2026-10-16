import * as THREE from 'three';

/**
 * Generates procedural high-res metallic micro-grain textures for authentic Swiss horology lookdev:
 * 1. Linear Satin Brushed Metal (for Octagonal Bezel & Case flanks)
 * 2. Radial Circular Lathe Brushed Metal (for Toothed Gears, Barrels & Sub-dial rings)
 * 3. Côtes de Genève & Perlage Engine-Turned Metal (for Inner Movement Mainplate & Skeleton Bridges)
 */

export function createLinearSatinTexture(): THREE.CanvasTexture {
  const width = 512;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, width, height);

  // Fine vertical brushed hairline grain
  for (let i = 0; i < 4200; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const len = 30 + Math.random() * 140;
    const shade = Math.floor(105 + Math.random() * 55);
    ctx.strokeStyle = `rgba(${shade}, ${shade}, ${shade}, 0.28)`;
    ctx.lineWidth = 0.6 + Math.random() * 1.1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + len);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

export function createRadialBrushedTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const cx = size / 2;
  const cy = size / 2;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  // Concentric lathe micro-grooves + sunray radial sheen
  for (let r = 8; r < size / 2; r += 1.2) {
    const shade = Math.floor(110 + Math.sin(r * 0.9) * 28 + (Math.random() - 0.5) * 25);
    ctx.strokeStyle = `rgba(${shade}, ${shade}, ${shade}, 0.35)`;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Sunray radial brush lines
  for (let i = 0; i < 720; i++) {
    const ang = (i / 720) * Math.PI * 2 + (Math.random() - 0.5) * 0.01;
    const shade = Math.floor(115 + (Math.random() - 0.5) * 40);
    ctx.strokeStyle = `rgba(${shade}, ${shade}, ${shade}, 0.16)`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(ang) * 12, cy + Math.sin(ang) * 12);
    ctx.lineTo(cx + Math.cos(ang) * (size / 2), cy + Math.sin(ang) * (size / 2));
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

export function createCotesDeGeneveTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#787878';
  ctx.fillRect(0, 0, size, size);

  const stripeCount = 14;
  const stripeW = size / stripeCount;

  // Classic Swiss Geneva Stripes (Côtes de Genève) with micro-swirl texture
  for (let s = 0; s < stripeCount; s++) {
    const x0 = s * stripeW;
    const grad = ctx.createLinearGradient(x0, 0, x0 + stripeW, 0);
    grad.addColorStop(0, '#555555');
    grad.addColorStop(0.15, '#989898');
    grad.addColorStop(0.5, '#b8b8b8');
    grad.addColorStop(0.85, '#888888');
    grad.addColorStop(1, '#484848');
    ctx.fillStyle = grad;
    ctx.fillRect(x0, 0, stripeW, size);

    // Subtle circular abrasive marks along the stripe
    for (let y = 0; y < size; y += 8) {
      ctx.strokeStyle = 'rgba(220, 220, 220, 0.12)';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.arc(x0 + stripeW / 2, y, stripeW * 0.65, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}
