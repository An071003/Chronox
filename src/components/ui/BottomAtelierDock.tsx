import React from 'react';
import {
  useHorologyStore,
  HOROLOGY_EDITIONS,
  EditionId,
} from '../../store/useHorologyStore';

const EDITION_ORDER: { id: EditionId; chipLabel: string }[] = [
  { id: 'rosegold', chipLabel: 'Rose Gold' },
  { id: 'titanium', chipLabel: 'Titanium' },
  { id: 'carbon', chipLabel: 'Carbon' },
  { id: 'platinum', chipLabel: 'Platinum' },
];

const SPEED_MULTIPLIERS: { value: 1 | 60 | 0.1; label: string; sub: string }[] = [
  { value: 1, label: '1x', sub: 'Real-Time' },
  { value: 60, label: '60x', sub: 'Fast Sweep' },
  { value: 0.1, label: '0.1x', sub: 'SlowMo' },
];

export const BottomAtelierDock: React.FC = () => {
  const edition = useHorologyStore((s) => s.edition);
  const explodedProgress = useHorologyStore((s) => s.explodedProgress);
  const timeMultiplier = useHorologyStore((s) => s.timeMultiplier);

  const setEdition = useHorologyStore((s) => s.setEdition);
  const setExplodedProgress = useHorologyStore((s) => s.setExplodedProgress);
  const setTimeMultiplier = useHorologyStore((s) => s.setTimeMultiplier);

  return (
    <footer className="pointer-events-auto fixed bottom-4 left-1/2 z-30 w-[95%] max-w-5xl -translate-x-1/2">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-zinc-950/85 px-5 py-2.5 shadow-2xl backdrop-blur-xl md:flex-nowrap">
        {/* 1. Material Edition Selector (4 Haute Horlogerie Swatches) */}
        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden whitespace-nowrap pr-1 xl:block">
            <p className="font-mono text-[9px] uppercase tracking-widest text-zinc-500">
              ATELIER EDITION
            </p>
            <p className="font-mono text-[11px] font-semibold text-zinc-200">
              {HOROLOGY_EDITIONS[edition].shortName}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {EDITION_ORDER.map(({ id, chipLabel }) => {
              const cfg = HOROLOGY_EDITIONS[id];
              const isSelected = edition === id;
              return (
                <button
                  key={id}
                  onClick={() => setEdition(id)}
                  className={`group relative flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border px-2.5 py-1.5 transition-all ${
                    isSelected
                      ? 'border-amber-400/70 bg-white/10 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                      : 'border-white/10 bg-zinc-900/60 hover:border-white/25'
                  }`}
                  title={`${cfg.name} — ${cfg.subtitle}`}
                >
                  <span
                    className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/30 shadow-inner"
                    style={{
                      background: `linear-gradient(135deg, ${cfg.swatchPrimary} 55%, ${cfg.swatchSecondary} 55%)`,
                    }}
                  />
                  <span className="hidden font-mono text-[10px] font-medium text-zinc-200 sm:inline">
                    {chipLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Calibre Teardown Slider (EXPLODED CALIBRE: 0% -> 100%) */}
        <div className="flex min-w-[180px] flex-1 items-center gap-3 md:max-w-xs">
          <div className="flex shrink-0 flex-col whitespace-nowrap">
            <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-400">
              EXPLODED CALIBRE
            </span>
            <span className="font-mono text-[11px] font-bold text-amber-400">
              {Math.round(explodedProgress * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={explodedProgress}
            onChange={(e) => setExplodedProgress(parseFloat(e.target.value))}
            className="horology-slider w-full"
            aria-label="Exploded Calibre Teardown Slider"
          />
        </div>

        {/* 3. Time Speed Multiplier (1x | 60x | 0.1x) */}
        <div className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-xl border border-white/10 bg-zinc-900/80 p-1">
          {SPEED_MULTIPLIERS.map((m) => {
            const active = timeMultiplier === m.value;
            return (
              <button
                key={m.value}
                onClick={() => setTimeMultiplier(m.value)}
                className={`whitespace-nowrap rounded-lg px-2.5 py-1 font-mono text-[10px] transition-all ${
                  active
                    ? 'border border-amber-400/50 bg-amber-500/25 font-bold text-amber-300'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title={`${m.label} (${m.sub})`}
              >
                <span>{m.label}</span>
                <span className="ml-1 hidden text-[9px] opacity-80 lg:inline">
                  {m.sub}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </footer>
  );
};
