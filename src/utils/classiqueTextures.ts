import * as THREE from 'three';
import type { ClassiqueEditionConfig } from '../store/useHorologyStore';

/**
 * Procedural lookdev textures for the CHRONO-X Classique Date 36.
 * Dial geometry: CircleGeometry(radius 0.8) -> UV [0,1] spans [-0.8, 0.8] dial units.
 */

export const DIAL_RADIUS = 0.8;
export const DATE_WINDOW = { x: 0.6, y: 0, w: 0.15, h: 0.112 };

const DIAL_TEX_SIZE = 2048;
const DIAL_UNIT_PX = DIAL_TEX_SIZE / (DIAL_RADIUS * 2);
const RELIEF_TEX_SIZE = 1024;

let flutedReliefCache: { normal: THREE.DataTexture; cavity: HTMLCanvasElement } | null = null;
let sunrayAnisotropyCache: THREE.DataTexture | null = null;

function smoothstep(e0: number, e1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

/** Height field of the stepped diagonal "fluted motif" guilloché (0..1) */
function flutedMotifHeight(x: number, y: number): number {
  const a = 0.5;
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const u = x * ca + y * sa;
  const v = -x * sa + y * ca;
  const zigPeriod = 0.11;
  const zz = u / zigPeriod - Math.floor(u / zigPeriod);
  const tri = 1 - Math.abs(2 * zz - 1);
  const f0 = v / 0.046 + 0.55 * tri;
  const f = f0 - Math.floor(f0);
  const flute = (2 * f - 1) * (2 * f - 1);
  const r = Math.hypot(x, y);
  // The minute track and the center hub remain flat
  const mask = 1 - smoothstep(0.715, 0.735, r);
  return flute * mask;
}

function getFlutedRelief() {
  if (flutedReliefCache) return flutedReliefCache;
  const size = RELIEF_TEX_SIZE;
  const unit = size / (DIAL_RADIUS * 2);
  const heights = new Float32Array(size * size);
  for (let py = 0; py < size; py++) {
    const y = -(py + 0.5 - size / 2) / unit;
    for (let px = 0; px < size; px++) {
      const x = (px + 0.5 - size / 2) / unit;
      heights[py * size + px] = flutedMotifHeight(x, y);
    }
  }

  const normalData = new Uint8Array(size * size * 4);
  const cavity = document.createElement('canvas');
  cavity.width = size;
  cavity.height = size;
  const cctx = cavity.getContext('2d')!;
  const cavityImg = cctx.createImageData(size, size);
  const strength = 2.4;

  for (let py = 0; py < size; py++) {
    const ym = Math.max(0, py - 1);
    const yp = Math.min(size - 1, py + 1);
    for (let px = 0; px < size; px++) {
      const xm = Math.max(0, px - 1);
      const xp = Math.min(size - 1, px + 1);
      const dhdx = (heights[py * size + xp] - heights[py * size + xm]) * 0.5;
      // Canvas rows grow downward while texture V grows upward (flipY)
      const dhdy = (heights[ym * size + px] - heights[yp * size + px]) * 0.5;
      let nx = -dhdx * strength;
      let ny = -dhdy * strength;
      let nz = 1;
      const len = Math.hypot(nx, ny, nz);
      nx /= len;
      ny /= len;
      nz /= len;
      // DataTexture rows are bottom-up, so write the flipped row
      const di = ((size - 1 - py) * size + px) * 4;
      normalData[di] = (nx * 0.5 + 0.5) * 255;
      normalData[di + 1] = (ny * 0.5 + 0.5) * 255;
      normalData[di + 2] = (nz * 0.5 + 0.5) * 255;
      normalData[di + 3] = 255;

      const ci = (py * size + px) * 4;
      const h = heights[py * size + px];
      const patternMask = 1 - smoothstep(0.715, 0.735, Math.hypot(px - size / 2, py - size / 2) / unit);
      cavityImg.data[ci + 3] = (1 - h) * 70 * patternMask;
    }
  }
  cctx.putImageData(cavityImg, 0, 0);

  const normal = new THREE.DataTexture(normalData, size, size, THREE.RGBAFormat);
  normal.wrapS = THREE.ClampToEdgeWrapping;
  normal.wrapT = THREE.ClampToEdgeWrapping;
  normal.magFilter = THREE.LinearFilter;
  normal.minFilter = THREE.LinearMipmapLinearFilter;
  normal.generateMipmaps = true;
  normal.anisotropy = 8;
  normal.needsUpdate = true;

  flutedReliefCache = { normal, cavity };
  return flutedReliefCache;
}

/**
 * Sunray brushing as a KHR anisotropy direction map: RG = tangential direction, B = strength.
 * Produces the rotating bow-tie light streak of a real soleil dial.
 */
function getSunrayAnisotropyMap(): THREE.DataTexture {
  if (sunrayAnisotropyCache) return sunrayAnisotropyCache;
  const size = 512;
  const data = new Uint8Array(size * size * 4);
  for (let row = 0; row < size; row++) {
    const y = (row + 0.5 - size / 2) / (size / 2);
    for (let px = 0; px < size; px++) {
      const x = (px + 0.5 - size / 2) / (size / 2);
      const ang = Math.atan2(y, x);
      const r = Math.hypot(x, y);
      const tx = -Math.sin(ang);
      const ty = Math.cos(ang);
      const i = (row * size + px) * 4;
      data[i] = (tx * 0.5 + 0.5) * 255;
      data[i + 1] = (ty * 0.5 + 0.5) * 255;
      data[i + 2] = 255 * smoothstep(0.02, 0.12, r);
      data[i + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  sunrayAnisotropyCache = tex;
  return tex;
}

function drawSpacedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacingPx: number
) {
  (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${spacingPx}px`;
  // Compensate trailing spacing so the string stays optically centered
  ctx.fillText(text, x + spacingPx / 2, y);
  (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '0px';
}

export interface ClassiqueDialTextures {
  map: THREE.CanvasTexture;
  normalMap: THREE.Texture | null;
  anisotropyMap: THREE.Texture | null;
}

export function createClassiqueDialTextures(edition: ClassiqueEditionConfig): ClassiqueDialTextures {
  const size = DIAL_TEX_SIZE;
  const u = DIAL_UNIT_PX;
  const c = size / 2;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const toPx = (x: number, y: number): [number, number] => [c + x * u, c - y * u];

  // 1. Base lacquer / galvanic finish with a soft dégradé toward the edge
  const isSunray = edition.dialStyle === 'sunray';
  const base = ctx.createRadialGradient(c, c, 0, c, c, c);
  base.addColorStop(0, edition.dialColor);
  base.addColorStop(isSunray ? 0.55 : 0.7, edition.dialColor);
  base.addColorStop(1, edition.dialEdgeColor);
  ctx.fillStyle = base;
  ctx.beginPath();
  ctx.arc(c, c, c, 0, Math.PI * 2);
  ctx.fill();

  if (isSunray) {
    // Fine radial brushing variation (the anisotropy map provides the moving streak)
    ctx.save();
    ctx.translate(c, c);
    for (let i = 0; i < 2400; i++) {
      const ang = (i / 2400) * Math.PI * 2;
      const light = Math.random() > 0.5;
      ctx.strokeStyle = light ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.05)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * 40, Math.sin(ang) * 40);
      ctx.lineTo(Math.cos(ang) * c, Math.sin(ang) * c);
      ctx.stroke();
    }
    ctx.restore();
  } else {
    // Bake ambient occlusion of the fluted motif grooves into the albedo
    const relief = getFlutedRelief();
    ctx.globalAlpha = 0.55;
    ctx.drawImage(relief.cavity, 0, 0, size, size);
    ctx.globalAlpha = 1;
  }

  // 2. Printed railway minute track
  ctx.save();
  ctx.translate(c, c);
  ctx.strokeStyle = edition.printSecondaryColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 0.787 * u, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, 0, 0.748 * u, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 300; i++) {
    const minute = i / 5;
    if (Math.abs(minute - 30) < 1.6) continue; // SWISS MADE gap at 6
    const ang = (i / 300) * Math.PI * 2 - Math.PI / 2;
    const isMinute = i % 5 === 0;
    const isFive = i % 25 === 0;
    const rIn = isFive ? 0.748 : isMinute ? 0.756 : 0.775;
    ctx.strokeStyle = isMinute ? edition.printColor : edition.printSecondaryColor;
    ctx.lineWidth = isFive ? 4.2 : isMinute ? 2.6 : 1.1;
    ctx.beginPath();
    ctx.moveTo(Math.cos(ang) * rIn * u, Math.sin(ang) * rIn * u);
    ctx.lineTo(Math.cos(ang) * 0.787 * u, Math.sin(ang) * 0.787 * u);
    ctx.stroke();
  }
  ctx.restore();

  // 3. Dial signatures
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = edition.printColor;
  ctx.font = `600 ${0.072 * u}px Cinzel, Georgia, serif`;
  drawSpacedText(ctx, 'CHRONO-X', ...toPx(0, 0.392), 0.012 * u);

  ctx.font = `600 ${0.031 * u}px Inter, Arial, sans-serif`;
  drawSpacedText(ctx, 'CLASSIQUE', ...toPx(0, 0.326), 0.008 * u);
  ctx.font = `700 ${0.042 * u}px Cinzel, Georgia, serif`;
  drawSpacedText(ctx, 'DATE', ...toPx(0, 0.282), 0.01 * u);

  ctx.fillStyle = edition.printSecondaryColor;
  ctx.font = `500 ${0.0235 * u}px Inter, Arial, sans-serif`;
  drawSpacedText(ctx, 'SUPERLATIF CHRONOMÈTRE', ...toPx(0, -0.3), 0.004 * u);
  drawSpacedText(ctx, 'CERTIFIÉ GENÈVE', ...toPx(0, -0.336), 0.004 * u);

  ctx.fillStyle = edition.printColor;
  ctx.font = `600 ${0.019 * u}px Inter, Arial, sans-serif`;
  drawSpacedText(ctx, 'SWISS', ...toPx(-0.06, -0.768), 0.003 * u);
  drawSpacedText(ctx, 'MADE', ...toPx(0.06, -0.768), 0.003 * u);

  // 4. Date aperture (punched through; the date disc sits underneath)
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  const [wx, wy] = toPx(DATE_WINDOW.x - DATE_WINDOW.w / 2, DATE_WINDOW.y + DATE_WINDOW.h / 2);
  ctx.beginPath();
  ctx.roundRect(wx, wy, DATE_WINDOW.w * u, DATE_WINDOW.h * u, 0.008 * u);
  ctx.fill();
  ctx.restore();

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 16;
  map.needsUpdate = true;

  return {
    map,
    normalMap: isSunray ? null : getFlutedRelief().normal,
    anisotropyMap: isSunray ? getSunrayAnisotropyMap() : null,
  };
}

/** Date disc strip: 31 numerals stacked vertically, scrolled via texture.offset.y */
export function createDateWheelTexture(): THREE.CanvasTexture {
  const cell = 128;
  const width = 192;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = cell * 31;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#F6F4EE';
  ctx.fillRect(0, 0, width, canvas.height);
  ctx.fillStyle = '#121214';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 118px Cinzel, Georgia, serif`;
  for (let i = 0; i < 31; i++) {
    ctx.fillText(String(i + 1), width / 2, i * cell + cell / 2 + 8);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 1 / 31);
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/** Laser-engraved inner flange (rehaut) signature strip */
export function createRehautTexture(): THREE.CanvasTexture {
  const width = 4096;
  const height = 96;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#5c5c5c';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `600 38px Cinzel, Georgia, serif`;
  const repeats = 15;
  for (let i = 0; i < repeats; i++) {
    const x = ((i + 0.5) / repeats) * width;
    ctx.save();
    ctx.translate(x, height / 2);
    ctx.scale(-1, -1);
    drawSpacedText(ctx, 'CHRONO-X', 0, 0, 10);
    ctx.restore();
  }
  // Minute notches
  for (let i = 0; i < 60; i++) {
    const x = (i / 60) * width;
    ctx.fillRect(x - 1.5, i % 5 === 0 ? 0 : 0, 3, i % 5 === 0 ? 22 : 12);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/** Four-point star glint used for diamond scintillation sprites */
export function createGlintTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const c = size / 2;

  const core = ctx.createRadialGradient(c, c, 0, c, c, c * 0.35);
  core.addColorStop(0, 'rgba(255,255,255,1)');
  core.addColorStop(0.3, 'rgba(255,250,240,0.7)');
  core.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = core;
  ctx.fillRect(0, 0, size, size);

  const spike = (angle: number, length: number, width: number) => {
    ctx.save();
    ctx.translate(c, c);
    ctx.rotate(angle);
    const g = ctx.createLinearGradient(-length, 0, length, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.95)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-length, 0);
    ctx.lineTo(0, -width);
    ctx.lineTo(length, 0);
    ctx.lineTo(0, width);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };
  spike(0, c, 2.6);
  spike(Math.PI / 2, c, 2.6);
  spike(Math.PI / 4, c * 0.55, 1.4);
  spike(-Math.PI / 4, c * 0.55, 1.4);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}
