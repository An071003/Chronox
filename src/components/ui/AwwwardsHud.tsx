import React from 'react';
import {
  ECLIPSE_ACTS,
  PortalRealmId,
  useEclipseStore,
  WORLD_STATE_THEMES,
  WorldStateId,
} from '../../store/useEclipseStore';
import { eclipseAudio } from '../../utils/eclipseAudioEngine';

const WORLD_STATES: { id: WorldStateId; label: string; dotClass: string }[] = [
  { id: 'solar_eclipse', label: 'SOLAR ECLIPSE', dotClass: 'bg-amber-400' },
  { id: 'crimson_valkyrie', label: 'CRIMSON VALKYRIE', dotClass: 'bg-rose-500' },
  { id: 'astral_void', label: 'ASTRAL VOID', dotClass: 'bg-teal-400' },
];

const PORTAL_SHORTCUTS: { id: PortalRealmId; numeral: string; name: string }[] = [
  { id: 'crimson_blades', numeral: 'I', name: 'Crimson Storm' },
  { id: 'golden_astrolabe', numeral: 'II', name: 'Golden Vault' },
  { id: 'neptune_void', numeral: 'III', name: 'Neptune Void' },
];

export const AwwwardsHud: React.FC = () => {
  const experienceMode = useEclipseStore((s) => s.experienceMode);
  const worldState = useEclipseStore((s) => s.worldState);
  const currentAct = useEclipseStore((s) => s.currentAct);
  const isAwakened = useEclipseStore((s) => s.isAwakened);
  const isArmorExploded = useEclipseStore((s) => s.isArmorExploded);
  const activePortalId = useEclipseStore((s) => s.activePortalId);
  const isCutscenePlaying = useEclipseStore((s) => s.isCutscenePlaying);
  const isAudioEnabled = useEclipseStore((s) => s.isAudioEnabled);

  const setExperienceMode = useEclipseStore((s) => s.setExperienceMode);
  const setWorldState = useEclipseStore((s) => s.setWorldState);
  const jumpToAct = useEclipseStore((s) => s.jumpToAct);
  const setAwakened = useEclipseStore((s) => s.setAwakened);
  const toggleArmorExploded = useEclipseStore((s) => s.toggleArmorExploded);
  const enterPortal = useEclipseStore((s) => s.enterPortal);
  const setCutscenePlaying = useEclipseStore((s) => s.setCutscenePlaying);
  const toggleAudio = useEclipseStore((s) => s.toggleAudio);

  const activeActData = ECLIPSE_ACTS[currentAct - 1];
  const theme = WORLD_STATE_THEMES[worldState];

  if (isCutscenePlaying) {
    return null;
  }

  const handleAwakenStart = () => {
    setAwakened(true);
    if (isAudioEnabled) {
      eclipseAudio.playDivineAwakeningBraaam();
    }
  };

  const handleAwakenEnd = () => {
    setAwakened(false);
  };

  return (
    <>
      {/* =====================================================================
          ZONE 1: TOP HEADER BAR (fixed top-0 inset-x-0 h-16 px-6 z-20)
         ===================================================================== */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-20 flex h-16 items-center justify-between border-b border-white/10 bg-[#05070B]/75 px-6 backdrop-blur-xl">
        {/* Left: Brand Crest + Experience Mode Switcher */}
        <div className="pointer-events-auto flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <span
              className="inline-block h-2.5 w-2.5 rotate-45 border border-amber-300"
              style={{ backgroundColor: theme.primaryHex }}
            />
            <div>
              <div className="font-serif text-xs font-bold tracking-[0.25em] text-white">
                ECLIPSE // SERAPHIM
              </div>
              <div className="font-mono text-[9px] tracking-[0.2em] text-slate-400">
                SOTY INTERACTIVE SANCTUARY
              </div>
            </div>
          </div>

          {/* Seamless Switcher between ECLIPSE and CHRONO-X */}
          <div className="hidden items-center rounded-full border border-white/10 bg-black/60 p-0.5 sm:flex">
            <button
              type="button"
              onClick={() => setExperienceMode('eclipse')}
              className={`rounded-full px-2.5 py-1 font-mono text-[9px] tracking-[0.16em] transition-all ${
                experienceMode === 'eclipse'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ECLIPSE BOSS
            </button>
            <button
              type="button"
              onClick={() => setExperienceMode('chronox')}
              className={`rounded-full px-2.5 py-1 font-mono text-[9px] tracking-[0.16em] transition-all ${
                experienceMode === 'chronox'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              CHRONO-X LAB
            </button>
          </div>
        </div>

        {/* Center: Active Chapter Indicator */}
        <div className="hidden flex-col items-center lg:flex">
          <span className="font-mono text-[9px] tracking-[0.3em] text-amber-400/90">
            {activeActData.roman} // {activeActData.tarotName}
          </span>
          <span className="font-serif text-xs font-semibold tracking-[0.22em] text-slate-100">
            {activeActData.title}
          </span>
        </div>

        {/* Right: World State Switcher + Audio Synthesizer Toggle */}
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/65 p-1">
            {WORLD_STATES.map((ws) => {
              const active = worldState === ws.id;
              return (
                <button
                  key={ws.id}
                  type="button"
                  onClick={() => {
                    setWorldState(ws.id);
                    if (isAudioEnabled) eclipseAudio.playCelestialChime(1.1);
                  }}
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[9px] tracking-[0.14em] transition-all ${
                    active
                      ? 'bg-white/15 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${ws.dotClass}`} />
                  <span className="hidden md:inline">{ws.label}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              const nextState = !isAudioEnabled;
              toggleAudio();
              if (nextState) {
                eclipseAudio.playCelestialChime(1.0);
              }
            }}
            className={`rounded-full border px-3 py-1.5 font-mono text-[9px] tracking-[0.18em] transition-all ${
              isAudioEnabled
                ? 'border-amber-400/60 bg-amber-500/20 text-amber-200'
                : 'border-white/10 bg-black/60 text-slate-400 hover:border-white/30 hover:text-white'
            }`}
          >
            {isAudioEnabled ? 'AUDIO // ON' : 'AUDIO // MUTED'}
          </button>
        </div>
      </header>

      {/* =====================================================================
          ZONE 4: RIGHT VERTICAL CHAPTER TIMELINE (fixed right-6 top-1/2 z-20)
         ===================================================================== */}
      <nav
        aria-label="Chapter Timeline"
        className="pointer-events-auto fixed right-6 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-3"
      >
        {ECLIPSE_ACTS.map((item) => {
          const isCurrent = currentAct === item.act;
          return (
            <button
              key={item.act}
              type="button"
              onClick={() => {
                jumpToAct(item.act);
                if (isAudioEnabled) eclipseAudio.playCelestialChime(0.85 + item.act * 0.08);
              }}
              title={`${item.roman}: ${item.title}`}
              className={`group relative flex h-9 w-9 items-center justify-center rounded-full border font-serif text-xs transition-all ${
                isCurrent
                  ? 'scale-110 border-amber-400 bg-amber-500/20 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.35)]'
                  : 'border-white/15 bg-black/65 text-slate-400 hover:border-white/40 hover:text-white'
              }`}
            >
              {item.roman.replace('ACT ', '')}
              <span className="pointer-events-none absolute right-12 whitespace-nowrap rounded border border-white/10 bg-black/90 px-2.5 py-1 font-mono text-[9px] tracking-[0.18em] text-slate-200 opacity-0 transition-opacity group-hover:opacity-100">
                {item.roman} — {item.title}
              </span>
            </button>
          );
        })}
      </nav>

      {/* =====================================================================
          ZONE 5: CENTERED BOTTOM INTERACTIVE PILL DOCK (fixed bottom-6 z-20)
         ===================================================================== */}
      <div className="pointer-events-auto fixed bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2.5 rounded-full border border-white/15 bg-[#06080E]/85 px-4 py-2 shadow-[0_12px_45px_rgba(0,0,0,0.85)] backdrop-blur-xl">
        {/* 1. Hold for Divine Awakening (24-Blade Sword Formation Overdrive) */}
        <button
          type="button"
          onMouseDown={handleAwakenStart}
          onMouseUp={handleAwakenEnd}
          onMouseLeave={handleAwakenEnd}
          onTouchStart={handleAwakenStart}
          onTouchEnd={handleAwakenEnd}
          className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-mono text-[10px] tracking-[0.16em] transition-all ${
            isAwakened
              ? 'scale-105 border-amber-300 bg-amber-500/30 text-amber-100 shadow-[0_0_25px_rgba(245,158,11,0.6)]'
              : 'border-amber-500/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20'
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              isAwakened ? 'animate-ping bg-amber-300' : 'bg-amber-400'
            }`}
          />
          {isAwakened ? 'OVERDRIVE // XXIV BLADES ACTIVE' : 'HOLD [SPACE] // AWAKEN BLADES'}
        </button>

        {/* 2. Explode Armor Anatomy Toggle */}
        <button
          type="button"
          onClick={() => {
            toggleArmorExploded();
            if (isAudioEnabled) eclipseAudio.playCelestialChime(1.25);
          }}
          className={`rounded-full border px-3 py-1.5 font-mono text-[10px] tracking-[0.15em] transition-all ${
            isArmorExploded
              ? 'border-sky-400/60 bg-sky-500/20 text-sky-200'
              : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/30 hover:text-white'
          }`}
        >
          {isArmorExploded ? 'ARMOR // EXPLODED' : 'DISSECT ARMOR'}
        </button>

        {/* 3. Multiverse Portal Gate Buttons */}
        <div className="hidden items-center gap-1 border-l border-r border-white/10 px-2.5 md:flex">
          <span className="mr-1 font-mono text-[9px] tracking-[0.18em] text-slate-400">
            RIFTS:
          </span>
          {PORTAL_SHORTCUTS.map((p) => {
            const active = activePortalId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  const next = active ? null : p.id;
                  enterPortal(next);
                  if (isAudioEnabled) eclipseAudio.playPortalWarpSound(next !== null);
                }}
                title={p.name}
                className={`rounded-full px-2.5 py-1 font-mono text-[9px] tracking-[0.15em] transition-all ${
                  active
                    ? 'border border-amber-400 bg-amber-500/25 text-amber-200'
                    : 'bg-white/5 text-slate-300 hover:bg-white/15 hover:text-white'
                }`}
              >
                GATE {p.numeral}
              </button>
            );
          })}
          {activePortalId && (
            <button
              type="button"
              onClick={() => enterPortal(null)}
              className="ml-1 rounded-full border border-rose-400/50 bg-rose-500/20 px-2.5 py-1 font-mono text-[9px] tracking-[0.15em] text-rose-200 hover:bg-rose-500/30"
            >
              EXIT [ESC]
            </button>
          )}
        </div>

        {/* 4. Boss Intro Cutscene Trigger */}
        <button
          type="button"
          onClick={() => {
            setCutscenePlaying(true);
            if (isAudioEnabled) eclipseAudio.playDivineAwakeningBraaam();
          }}
          className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 font-mono text-[10px] tracking-[0.15em] text-slate-200 transition-all hover:border-amber-400/50 hover:bg-amber-500/15 hover:text-amber-200"
        >
          BOSS CUTSCENE
        </button>
      </div>
    </>
  );
};
