import React from 'react';
import { HorologyCanvas } from './components/canvas/HorologyCanvas';
import { TopTelemetryHeader } from './components/ui/TopTelemetryHeader';
import { LeftMechanicalControls } from './components/ui/LeftMechanicalControls';
import { RightSpecPanel } from './components/ui/RightSpecPanel';
import { BottomAtelierDock } from './components/ui/BottomAtelierDock';
import { IntroOverlay } from './components/ui/IntroOverlay';

export function App() {
  return (
    <main className="relative h-screen w-screen select-none overflow-hidden bg-[#07080B] text-white">
      {/* Z-0: Interactive 3D horology canvas */}
      <HorologyCanvas />

      {/* Z-20: HUD wrapper is pointer-events-none so the central viewport always orbits freely */}
      <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between">
        <TopTelemetryHeader />
        <LeftMechanicalControls />
        <RightSpecPanel />
        <BottomAtelierDock />
      </div>

      {/* Z-50: Brand intro curtain */}
      <IntroOverlay />
    </main>
  );
}

export default App;
