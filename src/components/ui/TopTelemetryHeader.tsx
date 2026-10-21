import React from 'react';
import { Moon, Sun, Volume2, VolumeX, Layers } from 'lucide-react';
import {
  useHorologyStore,
  WATCH_MODELS,
  WatchModelId,
} from '../../store/useHorologyStore';
import { horologyAudio } from '../../utils/horologyAudioEngine';

const MODEL_TABS: { id: WatchModelId; label: string; sub: string }[] = [
  { id: 'classique', label: 'Classique 36', sub: 'Date · Jubilee' },
  { id: 'tourbillon', label: 'Tourbillon', sub: 'Skeleton RM-026' },
];

export const TopTelemetryHeader: React.FC = () => {
  const model = useHorologyStore((s) => s.model);
  const isNightLume = useHorologyStore((s) => s.isNightLume);
  const isAudioEnabled = useHorologyStore((s) => s.isAudioEnabled);
  const explodedProgress = useHorologyStore((s) => s.explodedProgress);
  const isIntroComplete = useHorologyStore((s) => s.isIntroComplete);

  const setModel = useHorologyStore((s) => s.setModel);
  const toggleNightLume = useHorologyStore((s) => s.toggleNightLume);
  const toggleAudio = useHorologyStore((s) => s.toggleAudio);
  const toggleBlueprintExplode = useHorologyStore((s) => s.toggleBlueprintExplode);

  const isExploded = explodedProgress > 0.3;
  const activeIndex = MODEL_TABS.findIndex((t) => t.id === model);

  const handleAudioClick = () => {
    toggleAudio();
    if (!isAudioEnabled) horologyAudio.playEscapementTick(false);
  };

  const toggleClass = (active: boolean, activeTone: string) =>
    `group flex h-9 items-center gap-1.5 rounded-xl border px-3 font-mono text-[10.5px] font-medium tracking-wide transition-all duration-300 hover:-translate-y-px active:translate-y-0 active:scale-[0.97] ${
      active
        ? activeTone
        : 'border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/25 hover:bg-white/[0.06] hover:text-white'
    }`;

  return (
    <header
      className={`hud-reveal pointer-events-auto fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-white/[0.07] bg-gradient-to-b from-black/70 to-black/30 px-4 backdrop-blur-md lg:px-6 ${
        isIntroComplete ? '' : 'hud-hidden-top'
      }`}
    >
      {/* Brand crest + live reference */}
      <div className="flex min-w-0 shrink-0 items-center gap-3">
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-200/30 bg-gradient-to-br from-amber-200/15 to-transparent">
          <div className="absolute inset-[3px] animate-[spin_24s_linear_infinite] rounded-full [background:repeating-conic-gradient(from_0deg,rgba(253,230,138,0.22)_0deg_2deg,transparent_2deg_10deg)]" />
          <span className="relative font-display text-[13px] font-bold text-amber-100">X</span>
        </div>
        <div className="min-w-0 whitespace-nowrap">
          <p className="text-gold-shimmer font-display text-sm font-bold tracking-[0.22em]">
            CHRONO-X // GENÈVE
          </p>
          <p
            key={model}
            className="animate-hud-pop hidden font-mono text-[9.5px] tracking-[0.18em] text-zinc-500 sm:block"
          >
            {WATCH_MODELS[model].reference}
          </p>
        </div>
      </div>

      {/* Model switch with sliding indicator */}
      <nav
        aria-label="Watch model"
        className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:block"
      >
        <div className="relative flex rounded-2xl border border-white/10 bg-black/40 p-1 shadow-inner">
          <span
            className="absolute bottom-1 top-1 w-[calc(50%-4px)] rounded-xl border border-amber-200/30 bg-gradient-to-b from-amber-100/15 to-amber-100/[0.04] shadow-[0_0_24px_rgba(251,191,36,0.15)] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ transform: `translateX(${activeIndex * 100}%)`, left: 4 }}
          />
          {MODEL_TABS.map((tab) => {
            const active = tab.id === model;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setModel(tab.id)}
                className={`relative z-10 w-[148px] rounded-xl px-4 py-1.5 text-left transition-colors duration-300 ${
                  active ? 'text-white' : 'text-zinc-500 hover:text-zinc-200'
                }`}
                aria-pressed={active}
              >
                <span className="block font-display text-[12px] font-semibold tracking-[0.12em]">
                  {tab.label}
                </span>
                <span className="block font-mono text-[9px] tracking-wider opacity-70">{tab.sub}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Lume, audio, blueprint toggles */}
      <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
        <button
          type="button"
          onClick={toggleNightLume}
          className={toggleClass(
            isNightLume,
            'border-cyan-300/50 bg-cyan-400/15 text-cyan-100 shadow-[0_0_18px_rgba(0,245,212,0.3)]'
          )}
          title="Toggle Super-LumiNova night mode"
        >
          {isNightLume ? (
            <Moon className="h-3.5 w-3.5 text-cyan-300" />
          ) : (
            <Sun className="h-3.5 w-3.5 text-amber-200 transition-transform duration-500 group-hover:rotate-45" />
          )}
          <span className="hidden xl:inline">{isNightLume ? 'NIGHT LUME' : 'DAY STUDIO'}</span>
        </button>

        <button
          type="button"
          onClick={handleAudioClick}
          className={toggleClass(
            isAudioEnabled,
            'border-amber-300/50 bg-amber-400/15 text-amber-100 shadow-[0_0_18px_rgba(245,158,11,0.28)]'
          )}
          title="Toggle mechanical escapement audio"
        >
          {isAudioEnabled ? (
            <Volume2 className="h-3.5 w-3.5 animate-pulse text-amber-300" />
          ) : (
            <VolumeX className="h-3.5 w-3.5 text-zinc-400" />
          )}
          <span className="hidden xl:inline">AUDIO</span>
        </button>

        <button
          type="button"
          onClick={toggleBlueprintExplode}
          className={toggleClass(
            isExploded,
            'border-sky-300/50 bg-sky-400/15 text-sky-100 shadow-[0_0_18px_rgba(56,189,248,0.3)]'
          )}
          title="Explode the calibre into its six layers"
        >
          <Layers className="h-3.5 w-3.5 text-sky-300" />
          <span className="hidden xl:inline">EXPLODE</span>
        </button>
      </div>
    </header>
  );
};
