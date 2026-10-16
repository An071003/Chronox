import React from 'react';
import { HorologyCanvas } from './components/canvas/HorologyCanvas';
import { TopTelemetryHeader } from './components/ui/TopTelemetryHeader';
import { LeftMechanicalControls } from './components/ui/LeftMechanicalControls';
import { BottomAtelierDock } from './components/ui/BottomAtelierDock';

export function App() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#07080B] text-white select-none">
      {/* Z-0: Interactive 3D Skeleton Tourbillon Horology Canvas */}
      <HorologyCanvas />

      {/* Z-20: Non-Overlapping Swiss Luxury HUD Wrapper (pointer-events-none so central 70% viewport orbits freely) */}
      <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between">
        <TopTelemetryHeader />
        <LeftMechanicalControls />
        <BottomAtelierDock />
      </div>
    </main>
  );
}

export default App;
