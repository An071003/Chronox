---
name: visual-qa
description: Automated Playwright / Puppeteer Screenshot & WebGL Horology Visual QA Skill for verifying 3-zone HUD non-overlap, PBR metallic contrast, and Night Lume bloom.
---

# SKILL 5: `visual-qa` (AUTOMATED SCREENSHOT & WEBGL LOOKDEV AUDIT)

Use this skill after starting the Vite dev server (`npm run dev`) to capture and inspect multi-state screenshots of the 3D Horology Lab and guarantee zero UI overlap or black-metal lookdev regressions.

## 1. 4-State Visual Verification Matrix
Always capture and inspect 4 canonical states at `1920x1080` and `1440x900`:
1. **State A — Day Studio Hero (`01. Dial Hero`, `18K Rose Gold & Obsidian`):**
   - Verify the 8 octagonal bezel spline bolts catch warm left-rim and cool right-strip specular highlights.
   - Verify the central 70% viewport has zero overlapping HTML cards.
2. **State B — Night Super-LumiNova BGW9 (`[ 🌙 NIGHT LUME ]` active):**
   - Verify studio `<Lightformer>` reflections dim to `0.08` while the 12 hour baton indices, Dauphine hands, Power Reserve needle, and Tourbillon cage markers glow in Ice Cyan (`#00F5D4`) and Emerald (`#00FF66`).
3. **State C — Macro Tourbillon (`02. Macro Tourbillon (6h)`):**
   - Verify the 3-spoke Flying Tourbillon carriage, oscillating gold balance wheel, breathing hairspring spiral, and crimson Ruby Jewel (`#e11d48`) are centered and sharp.
4. **State D — 100% Exploded Calibre Blueprint (`[ 📐 BLUEPRINT EXPLODE ]` active):**
   - Verify all 6 mechanical layers (`L01` to `L06`) separate cleanly along the Z-axis and all `<Html>` engineering callouts remain legible without clipping off-screen.

## 2. Automated Bounding-Box Anti-Collision Check
In automated DOM assertions:
```ts
const headerBox = await page.locator('header').boundingBox();
const leftPanelBox = await page.locator('aside').boundingBox();
const bottomDockBox = await page.locator('footer').boundingBox();
// Assert zero intersection between header, left mechanical panel, bottom atelier dock, and the central watch dial circle
```
