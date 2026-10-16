import React from 'react';
import { useEclipseStore } from './store/useEclipseStore';
import { SanctuaryCanvas } from './components/canvas/SanctuaryCanvas';
import { AwwwardsHud } from './components/ui/AwwwardsHud';
import { StoryActsOverlay } from './components/ui/StoryActsOverlay';
import { BossCutsceneModal } from './components/ui/BossCutsceneModal';

// Preserved CHRONO-X Horology Lab Experience
import { HorologyCanvas } from './components/canvas/HorologyCanvas';
import { TopTelemetryHeader } from './components/ui/TopTelemetryHeader';
import { LeftMechanicalControls } from './components/ui/LeftMechanicalControls';
import { BottomAtelierDock } from './components/ui/BottomAtelierDock';

export function App() {
  const experienceMode = useEclipseStore((s) => s.experienceMode);

  if (experienceMode === 'chronox') {
    return (
      <main className="relative h-screen w-screen select-none overflow-hidden bg-[#07080B] text-white">
        <HorologyCanvas />
        <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between">
          <TopTelemetryHeader />
          <LeftMechanicalControls />
          <BottomAtelierDock />
        </div>
      </main>
    );
  }

  return (
    <main className="relative h-screen w-screen select-none overflow-hidden bg-[#040508] text-white">
      {/* Z-0: Interactive 3D Astral Seraphim, 3 Multiverse Portals & Mirror Sanctuary */}
      <SanctuaryCanvas />

      {/* Z-10..30: Non-Overlapping 4-Zone Awwwards Editorial HUD */}
      <AwwwardsHud />
      <StoryActsOverlay />
      <BossCutsceneModal />
    </main>
  );
}

export default App;
