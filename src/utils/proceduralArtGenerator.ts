import * as THREE from 'three';
import { PortalRealmId } from '../store/useEclipseStore';

/**
 * 1. createRuneDisplacementTexture()
 * Draws glowing geometric alchemy circles, ancient vertical runic glyphs, and weathered basalt noise
 * onto a 1024x1024 canvas for emissiveMap and bumpMap on the 60 Monolith Pillars and Astrolabe Rings.
 */
export function createRuneDisplacementTexture(glowColor = '#F59E0B'): {
  bumpMap: THREE.CanvasTexture;
  emissiveMap: THREE.CanvasTexture;
} {
  const size = 1024;

  // Bump Canvas
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d')!;

  bCtx.fillStyle = '#383838';
  bCtx.fillRect(0, 0, size, size);

  // Fine weathered basalt stone grain & horizontal carved architectural joints
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const w = 2 + Math.random() * 16;
    const h = 2 + Math.random() * 12;
    const v = Math.floor(42 + Math.random() * 48);
    bCtx.fillStyle = `rgb(${v},${v},${v})`;
    bCtx.fillRect(x, y, w, h);
  }

  // Carved horizontal stone relief bands
  bCtx.strokeStyle = '#181818';
  bCtx.lineWidth = 6;
  for (let y = 64; y < size; y += 128) {
    bCtx.beginPath();
    bCtx.moveTo(0, y);
    bCtx.lineTo(size, y);
    bCtx.stroke();
  }

  // Emissive Rune Canvas (subtle, crisp, fine architectural inlays)
  const emCanvas = document.createElement('canvas');
  emCanvas.width = size;
  emCanvas.height = size;
  const eCtx = emCanvas.getContext('2d')!;

  eCtx.fillStyle = '#000000';
  eCtx.fillRect(0, 0, size, size);

  eCtx.strokeStyle = glowColor;
  eCtx.fillStyle = glowColor;
  eCtx.lineWidth = 2.5;

  // Crisp vertical border trim lines along pillar edges
  [96, size - 96].forEach((lx) => {
    eCtx.globalAlpha = 0.45;
    eCtx.beginPath();
    eCtx.moveTo(lx, 32);
    eCtx.lineTo(lx, size - 32);
    eCtx.stroke();
  });

  // Fine Vertical Column of Ancient Runic Glyphs down the center
  eCtx.globalAlpha = 0.85;
  const cols = [256, 512, 768];
  cols.forEach((colX) => {
    for (let y = 64; y < size - 48; y += 64) {
      eCtx.save();
      eCtx.translate(colX, y);
      // Scale Y by 0.28 so when mapped on a 4m tall pillar, glyphs are perfectly 1:1 proportional!
      eCtx.scale(1.0, 0.28);
      eCtx.lineWidth = 4.0;
      eCtx.beginPath();
      eCtx.moveTo(0, -24);
      eCtx.lineTo(0, 24);
      const seed = (colX + y) % 5;
      if (seed === 0) {
        eCtx.moveTo(0, -18);
        eCtx.lineTo(18, -2);
        eCtx.lineTo(0, 14);
      } else if (seed === 1) {
        eCtx.moveTo(-16, -14);
        eCtx.lineTo(16, 14);
        eCtx.moveTo(0, -22);
        eCtx.lineTo(14, -22);
      } else if (seed === 2) {
        eCtx.moveTo(-16, 0);
        eCtx.lineTo(0, -18);
        eCtx.lineTo(16, 0);
        eCtx.lineTo(0, 18);
        eCtx.closePath();
      } else if (seed === 3) {
        eCtx.moveTo(-14, -18);
        eCtx.lineTo(0, 0);
        eCtx.lineTo(14, -18);
      } else {
        eCtx.moveTo(-14, 16);
        eCtx.lineTo(0, -16);
        eCtx.lineTo(14, 16);
      }
      eCtx.stroke();
      eCtx.restore();
    }
  });

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.needsUpdate = true;

  const emissiveMap = new THREE.CanvasTexture(emCanvas);
  emissiveMap.wrapS = THREE.RepeatWrapping;
  emissiveMap.wrapT = THREE.RepeatWrapping;
  emissiveMap.needsUpdate = true;

  return { bumpMap, emissiveMap };
}

/**
 * 2. createPortalRealmCanvas(realmId)
 * Generates rich 1024x1024 cosmic nebula, golden sacred geometry, or crimson storm textures
 * for the 3 Dimensional Portals.
 */
export function createPortalRealmCanvas(realmId: PortalRealmId): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const cx = size / 2;
  const cy = size / 2;

  const palette =
    realmId === 'crimson_blades'
      ? { inner: '#FF2E4C', mid: '#7F1D1D', outer: '#090204', accent: '#FCA5A5' }
      : realmId === 'golden_astrolabe'
      ? { inner: '#FDE047', mid: '#92400E', outer: '#070502', accent: '#F59E0B' }
      : { inner: '#00F5D4', mid: '#1E1B4B', outer: '#020617', accent: '#38BDF8' };

  const radGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, size * 0.52);
  radGrad.addColorStop(0, palette.inner);
  radGrad.addColorStop(0.45, palette.mid);
  radGrad.addColorStop(1, palette.outer);

  ctx.fillStyle = radGrad;
  ctx.fillRect(0, 0, size, size);

  // Swirling vortex rings & sacred geometry inside the portal
  ctx.strokeStyle = palette.accent;
  for (let r = 45; r < 460; r += 32) {
    ctx.lineWidth = r % 64 === 0 ? 2.5 : 1.2;
    ctx.globalAlpha = 0.45;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Starfield / energy embers
  ctx.globalAlpha = 0.85;
  for (let i = 0; i < 240; i++) {
    const ang = Math.random() * Math.PI * 2;
    const dist = Math.random() * 480;
    const x = cx + Math.cos(ang) * dist;
    const y = cy + Math.sin(ang) * dist;
    const rad = 1 + Math.random() * 3.2;
    ctx.fillStyle = i % 3 === 0 ? '#FFFFFF' : palette.accent;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/**
 * 3. createBossTarotCardImage(actNumber)
 * Renders intricate Gold-Foil Tarot / Lore Illustrations (data URL) displayed inside the Left Editorial Lore Cards.
 */
export function createBossTarotCardImage(
  actNumber: 1 | 2 | 3 | 4 | 5,
  accentHex = '#F59E0B'
): string {
  const w = 420;
  const h = 580;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const cx = w / 2;
  const cy = h / 2 - 15;

  // Obsidian Velvet Card Background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0, '#0C0F17');
  bgGrad.addColorStop(0.5, '#06080D');
  bgGrad.addColorStop(1, '#0B0D14');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Ornate Double Gold-Foil Tarot Border
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(16, 16, w - 32, h - 32);
  ctx.lineWidth = 1;
  ctx.strokeRect(24, 24, w - 48, h - 48);

  // Corner Celestial Rosettes
  [
    [32, 32],
    [w - 32, 32],
    [32, h - 32],
    [w - 32, h - 32],
  ].forEach(([rx, ry]) => {
    ctx.beginPath();
    ctx.arc(rx, ry, 8, 0, Math.PI * 2);
    ctx.stroke();
  });

  ctx.save();
  ctx.strokeStyle = accentHex;
  ctx.fillStyle = accentHex;

  if (actNumber === 1) {
    // ACT I TAROT: THE SHATTERED SANCTUARY & BLACK MIRROR SUN
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy - 30, 82, 0, Math.PI * 2);
    ctx.stroke();

    // Solar Eclipse black disc
    ctx.fillStyle = '#05070B';
    ctx.beginPath();
    ctx.arc(cx, cy - 30, 64, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Monolith Pillars rising from mirror horizon
    ctx.fillStyle = accentHex;
    [-110, -75, -40, 40, 75, 110].forEach((offset, idx) => {
      const ph = 70 + (idx % 3) * 28;
      ctx.strokeRect(cx + offset - 8, cy + 45 - ph, 16, ph);
      // Mirror reflection below
      ctx.globalAlpha = 0.35;
      ctx.strokeRect(cx + offset - 8, cy + 55, 16, ph * 0.65);
      ctx.globalAlpha = 1;
    });
  } else if (actNumber === 2) {
    // ACT II TAROT: THE XXIV-WINGED ASTRAL SERAPHIM
    ctx.lineWidth = 1.8;
    // 12-Spoke Halo
    ctx.beginPath();
    ctx.arc(cx, cy - 65, 52, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * 52, cy - 65 + Math.sin(a) * 52);
      ctx.lineTo(cx + Math.cos(a) * 78, cy - 65 + Math.sin(a) * 78);
      ctx.stroke();
    }
    // 24 Wing-Blades fanning out
    for (let i = 0; i < 12; i++) {
      const a = (-45 + i * 11) * (Math.PI / 180);
      ctx.beginPath();
      ctx.moveTo(cx - 20, cy);
      ctx.lineTo(cx - Math.cos(a) * 145, cy - Math.sin(a) * 120);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx + 20, cy);
      ctx.lineTo(cx + Math.cos(a) * 145, cy - Math.sin(a) * 120);
      ctx.stroke();
    }
  } else if (actNumber === 3) {
    // ACT III TAROT: THE SINGULARITY HEART & EXPLODED ASTROLABE
    [45, 78, 112, 142].forEach((r, i) => {
      ctx.lineWidth = i === 0 ? 3 : 1.5;
      ctx.setLineDash(i % 2 === 1 ? [8, 6] : []);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.setLineDash([]);
    // Sacred Geometry Triangles
    for (let k = 0; k < 2; k++) {
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2 + (k * Math.PI) / 3 - Math.PI / 2;
        const px = cx + Math.cos(a) * 112;
        const py = cy + Math.sin(a) * 112;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }
  } else if (actNumber === 4) {
    // ACT IV TAROT: THE THREE MULTIVERSE PORTAL GATES
    [-95, 0, 95].forEach((ox, i) => {
      const gh = i === 1 ? 185 : 145;
      const gw = i === 1 ? 68 : 52;
      ctx.lineWidth = 2.2;
      ctx.strokeRect(cx + ox - gw / 2, cy - gh / 2, gw, gh);
      ctx.beginPath();
      ctx.arc(cx + ox, cy, gw * 0.35, 0, Math.PI * 2);
      ctx.stroke();
    });
  } else {
    // ACT V TAROT: THE CROWN OF ETERNITY (24-BLADE WHEEL FORMATION)
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 130, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * 38, cy + Math.sin(a) * 38);
      ctx.lineTo(cx + Math.cos(a) * 145, cy + Math.sin(a) * 145);
      ctx.stroke();
    }
  }
  ctx.restore();

  // Bottom Tarot Numeral Cartouche
  ctx.fillStyle = accentHex;
  ctx.font = '700 14px "Cinzel", serif';
  ctx.textAlign = 'center';
  ctx.fillText(`ARCANA // ACT 0${actNumber}`, cx, h - 42);

  return canvas.toDataURL('image/png');
}
