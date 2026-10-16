import * as THREE from 'three';

/**
 * Generates a High-DPI (1024x1024) transparent CanvasTexture mapped onto a 2.04x2.04 3D dial plane
 * (Scale: 501.96 px = 1.0 3D unit).
 */
export function createHorologyDialTexture(accentColor = '#E6A87C', isNightLume = false): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const cx = size / 2;
  const cy = size / 2;
  const unitPx = size / 2.04; // 501.96078 px per 1.0 3D unit

  ctx.clearRect(0, 0, size, size);

  const primaryTickColor = isNightLume ? '#00F5D4' : '#F8FAFC';
  const secondaryTickColor = isNightLume ? 'rgba(0, 245, 212, 0.58)' : 'rgba(226, 232, 240, 0.6)';
  const accentTextColor = isNightLume ? '#00FF66' : accentColor;

  // 1. Outer Chapter Ring Dark Translucent Flange (r = 396..498px)
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, 498, 0, Math.PI * 2);
  ctx.arc(cx, cy, 396, 0, Math.PI * 2, true);
  ctx.fillStyle = 'rgba(5, 7, 11, 0.95)';
  ctx.fill();

  ctx.strokeStyle = accentTextColor;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(cx, cy, 496, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = secondaryTickColor;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(cx, cy, 456, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = accentTextColor;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(cx, cy, 397, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 2. Tachymeter Scale on Outer Bezel Flange (Radius 476px)
  const tachyValues = [
    { val: '400', sec: 9 },
    { val: '300', sec: 12 },
    { val: '240', sec: 15 },
    { val: '200', sec: 18 },
    { val: '160', sec: 22.5 },
    { val: '140', sec: 25.7 },
    { val: '120', sec: 30 },
    { val: '100', sec: 36 },
    { val: '90', sec: 40 },
    { val: '80', sec: 45 },
    { val: '75', sec: 48 },
    { val: '70', sec: 51.4 },
    { val: '65', sec: 55.4 },
    { val: '60', sec: 60 },
  ];

  ctx.save();
  ctx.font = '600 13px "JetBrains Mono", monospace';
  ctx.fillStyle = accentTextColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  tachyValues.forEach(({ val, sec }) => {
    const angle = (sec / 60) * Math.PI * 2 - Math.PI / 2;
    const tx = cx + Math.cos(angle) * 476;
    const ty = cy + Math.sin(angle) * 476;
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillText(val, 0, 0);
    ctx.restore();
  });

  // "TACHYMETER" label near 1 o'clock
  const tachyLabelAngle = (4.2 / 60) * Math.PI * 2 - Math.PI / 2;
  ctx.save();
  ctx.translate(cx + Math.cos(tachyLabelAngle) * 476, cy + Math.sin(tachyLabelAngle) * 476);
  ctx.rotate(tachyLabelAngle + Math.PI / 2);
  ctx.fillStyle = '#EF4444';
  ctx.font = '700 12px "JetBrains Mono", monospace';
  ctx.fillText('TACHYMETER', 0, 0);
  ctx.restore();
  ctx.restore();

  // 3. Precision 60 Minute + 300 (1/5th sec / 6Hz) Micro-Ticks (Radius 402..452)
  ctx.save();
  for (let i = 0; i < 300; i++) {
    const angle = (i / 300) * Math.PI * 2 - Math.PI / 2;
    const isHour = i % 25 === 0;
    const isMinute = i % 5 === 0;

    const rOuter = 452;
    const rInner = isHour ? 426 : isMinute ? 434 : 442;

    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * rInner, cy + Math.sin(angle) * rInner);
    ctx.lineTo(cx + Math.cos(angle) * rOuter, cy + Math.sin(angle) * rOuter);
    ctx.strokeStyle = isHour ? accentTextColor : isMinute ? primaryTickColor : secondaryTickColor;
    ctx.lineWidth = isHour ? 2.8 : isMinute ? 1.8 : 0.9;
    ctx.stroke();

    if (isHour) {
      const minuteNum = i / 5 === 0 ? 60 : i / 5;
      if (minuteNum === 30) continue; // 6 o'clock reserved for SWISS MADE
      const numStr = minuteNum < 10 ? `0${minuteNum}` : `${minuteNum}`;
      const rText = 376;
      const nx = cx + Math.cos(angle) * rText;
      const ny = cy + Math.sin(angle) * rText;
      ctx.save();
      ctx.translate(nx, ny);
      ctx.font = '700 12.5px "JetBrains Mono", monospace';
      ctx.fillStyle = primaryTickColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(numStr, 0, 0);
      ctx.restore();
    }
  }
  ctx.restore();

  // 4. Upper Brand Cartouche & Horological Inscriptions at 12 o'clock (cy - 285px)
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(cx - 128, cy - 330, 256, 76, 10);
  ctx.fillStyle = 'rgba(5, 7, 12, 0.92)';
  ctx.fill();
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = accentTextColor;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = primaryTickColor;
  ctx.font = '700 21px "Cinzel", serif';
  ctx.fillText('CHRONO-X', cx, cy - 301);

  ctx.fillStyle = accentTextColor;
  ctx.font = '600 11px "JetBrains Mono", monospace';
  ctx.fillText('GENÈVE // CALIBRE RM-026', cx, cy - 281);

  ctx.fillStyle = secondaryTickColor;
  ctx.font = '500 9.5px "JetBrains Mono", monospace';
  ctx.fillText('21,600 VPH • 38 RUBY JEWELS', cx, cy - 265);
  ctx.restore();

  // 5. Sub-Dial at 9 o'clock: POWER RESERVE (3D x = -0.45, y = 0)
  const prX = cx - 0.45 * unitPx;
  const prY = cy;
  const prRadius = 0.18 * unitPx;

  ctx.save();
  ctx.beginPath();
  ctx.arc(prX, prY, prRadius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(5, 7, 12, 0.9)';
  ctx.fill();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = accentTextColor;
  ctx.stroke();

  const prSteps = 12;
  for (let i = 0; i <= prSteps; i++) {
    const t = i / prSteps;
    const ang = (-135 + t * 270) * (Math.PI / 180) - Math.PI / 2;
    const rIn = i % 3 === 0 ? prRadius - 15 : prRadius - 9;
    const rOut = prRadius - 3;
    ctx.beginPath();
    ctx.moveTo(prX + Math.cos(ang) * rIn, prY + Math.sin(ang) * rIn);
    ctx.lineTo(prX + Math.cos(ang) * rOut, prY + Math.sin(ang) * rOut);
    ctx.strokeStyle = i <= 2 ? '#EF4444' : primaryTickColor;
    ctx.lineWidth = i % 3 === 0 ? 2.4 : 1.2;
    ctx.stroke();
  }

  ctx.fillStyle = secondaryTickColor;
  ctx.font = '600 9.5px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('POWER RESERVE', prX, prY + 32);
  ctx.fillStyle = accentTextColor;
  ctx.font = '700 11px "JetBrains Mono", monospace';
  ctx.fillText('72 HOURS', prX, prY + 46);
  ctx.fillStyle = '#EF4444';
  ctx.fillText('0', prX - 48, prY + 44);
  ctx.fillStyle = primaryTickColor;
  ctx.fillText('72', prX + 46, prY + 44);
  ctx.restore();

  // 6. Sub-Dial at 3 o'clock: 30-MINUTE CHRONOGRAPH REGISTER (3D x = +0.45, y = 0)
  const chX = cx + 0.45 * unitPx;
  const chY = cy;
  const chRadius = 0.18 * unitPx;

  ctx.save();
  ctx.beginPath();
  ctx.arc(chX, chY, chRadius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(5, 7, 12, 0.9)';
  ctx.fill();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = accentTextColor;
  ctx.stroke();

  for (let i = 0; i < 30; i++) {
    const ang = (i / 30) * Math.PI * 2 - Math.PI / 2;
    const isMajor = i % 5 === 0;
    const rIn = isMajor ? chRadius - 15 : chRadius - 8;
    const rOut = chRadius - 3;
    ctx.beginPath();
    ctx.moveTo(chX + Math.cos(ang) * rIn, chY + Math.sin(ang) * rIn);
    ctx.lineTo(chX + Math.cos(ang) * rOut, chY + Math.sin(ang) * rOut);
    ctx.strokeStyle = isMajor ? accentTextColor : primaryTickColor;
    ctx.lineWidth = isMajor ? 2.2 : 1.1;
    ctx.stroke();

    if (isMajor) {
      const label = i === 0 ? '30' : `${i}`;
      const lx = chX + Math.cos(ang) * (chRadius - 27);
      const ly = chY + Math.sin(ang) * (chRadius - 27);
      ctx.font = '700 10.5px "JetBrains Mono", monospace';
      ctx.fillStyle = primaryTickColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, lx, ly);
    }
  }

  ctx.fillStyle = secondaryTickColor;
  ctx.font = '600 9.5px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('CHRONOGRAPH', chX, chY + 32);
  ctx.fillStyle = '#EF4444';
  ctx.font = '700 10.5px "JetBrains Mono", monospace';
  ctx.fillText('FLYBACK 30M', chX, chY + 46);
  ctx.restore();

  // 7. 6 o'clock Tourbillon Aperture Ring & Secular Seconds Track (3D x = 0, y = -0.42, r = 0.295)
  const tbX = cx;
  const tbY = cy + 0.42 * unitPx;
  const tbRadius = 0.295 * unitPx;

  ctx.save();
  ctx.beginPath();
  ctx.arc(tbX, tbY, tbRadius, 0, Math.PI * 2);
  ctx.strokeStyle = accentTextColor;
  ctx.lineWidth = 2.2;
  ctx.stroke();

  for (let i = 0; i < 60; i++) {
    const ang = (i / 60) * Math.PI * 2 - Math.PI / 2;
    const isMajor = i % 5 === 0;
    const rIn = tbRadius + 2;
    const rOut = isMajor ? tbRadius + 12 : tbRadius + 6;
    ctx.beginPath();
    ctx.moveTo(tbX + Math.cos(ang) * rIn, tbY + Math.sin(ang) * rIn);
    ctx.lineTo(tbX + Math.cos(ang) * rOut, tbY + Math.sin(ang) * rOut);
    ctx.strokeStyle = isMajor ? accentTextColor : secondaryTickColor;
    ctx.lineWidth = isMajor ? 2 : 1;
    ctx.stroke();
  }

  // Dark nameplate badge for TOURBILLON label above the aperture
  ctx.beginPath();
  ctx.roundRect(tbX - 58, tbY - tbRadius - 29, 116, 18, 4);
  ctx.fillStyle = 'rgba(5, 7, 12, 0.92)';
  ctx.fill();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = accentTextColor;
  ctx.stroke();

  ctx.fillStyle = accentTextColor;
  ctx.font = '700 11px "Cinzel", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TOURBILLON', tbX, tbY - tbRadius - 19);

  // SWISS MADE cleanly positioned at 6 o'clock chapter ring
  ctx.fillStyle = primaryTickColor;
  ctx.font = '700 11px "JetBrains Mono", monospace';
  ctx.fillText('• SWISS MADE •', cx, cy + 414);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 16;
  texture.needsUpdate = true;
  return texture;
}
