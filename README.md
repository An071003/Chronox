# ⌚ CHRONO-X // GENÈVE — Calibre RM-026 Tourbillon Horology Lab

> **Awwwards-grade Haute Horlogerie 3D Experience & Real-Time Mechanical Simulator**  
> Inspired by Richard Mille, Audemars Piguet, and high-complication Swiss mechanical watchmaking.

[![Deploy CHRONO-X Horology Lab to GitHub Pages](https://github.com/An071003/Chronox/actions/workflows/deploy.yml/badge.svg)](https://github.com/An071003/Chronox/actions/workflows/deploy.yml)

🌐 **Live Product URL:** [https://an071003.github.io/Chronox/](https://an071003.github.io/Chronox/)

---

## ✨ Key Complications & Features

- **True Mathematical Involute Gears:** Procedurally generated gear teeth (`ExtrudeGeometry` with `bevelSegments: 4`) with skeletonized weight-reduction spokes and concentric ruby jewel pivots.
- **3Hz Flying Tourbillon (21,600 VPH):** 1 RPM outer carriage with 6 micro-impulses per second, 3Hz oscillating balance wheel with 4 gold regulating micro-screws, and breathing hairspring spiral.
- **Procedural Web Audio API Synthesizer:** Real-time 21,600 VPH Swiss lever escapement sound (Pallet fork unlock `4200Hz` + tooth lock `6800Hz` resonance), ratchet winding clicks, and column-wheel chronograph snaps.
- **Night Super-LumiNova BGW9 Mode:** Seamless dimming of studio `<Lightformer>` softboxes down to `0.08` while igniting radioactive Ice Cyan (`#00F5D4`) & Emerald (`#00FF66`) lume bloom.
- **6-Layer Exploded Calibre Teardown:** Smooth 0% -> 100% mechanical stratum separation along the Z-axis with 3D `<Html>` Swiss technical telemetry callouts.
- **Direct 3D Mechanical Interaction:** 
  - Click or scroll on the 3D Crown (3h) to wind the mainspring and sweep the 72h power reserve sub-dial.
  - Interactive 3D Chronograph Pushers (2h Start/Stop, 4h Flyback Reset with spring overshoot physics).
- **Curated Haute Horlogerie Editions:**
  - `18K Rose Gold & Obsidian` (Flagship Dress Edition)
  - `Grade-5 Titanium & Cyber Blue` (Sport Calibre)
  - `Forged Carbon & Crimson` (Racing Concept)
  - `950 Platinum Ice & Emerald` (Haute Joaillerie)

---

## 🛠️ Tech Stack & Active Skills

- **3D & Graphics:** Three.js, React Three Fiber (R3F), `@react-three/drei`, `@react-three/postprocessing`
- **Audio:** Web Audio API Procedural Mechanical Synthesizer
- **Animation:** GSAP, R3F Zero-Allocation `useFrame`
- **UI & State:** React 18, TypeScript, Tailwind CSS, Zustand, Lucide React
- **CAD & Lookdev:** Blender 4.5 LTS headless CAD automation (`scripts/generate_chrono_tourbillon.py`)

---

## 🚀 Local Development

```bash
# Clone the repository
git clone https://github.com/An071003/Chronox.git
cd Chronox

# Install dependencies
npm install

# Start Vite local development server
npm run dev

# Build production bundle
npm run build
```

---

## 📜 License

MIT License. Crafted with precision for haute horlogerie enthusiasts.
