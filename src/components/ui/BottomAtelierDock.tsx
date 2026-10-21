import React from 'react';
import {
  useHorologyStore,
  HOROLOGY_EDITIONS,
  CLASSIQUE_EDITIONS,
  EditionId,
  ClassiqueEditionId,
} from '../../store/useHorologyStore';

const TOURBILLON_ORDER: { id: EditionId; chipLabel: string }[] = [
  { id: 'rosegold', chipLabel: 'Rose Gold' },
  { id: 'titanium', chipLabel: 'Titanium' },
  { id: 'carbon', chipLabel: 'Carbon' },
  { id: 'platinum', chipLabel: 'Platinum' },
];

const CLASSIQUE_ORDER: { id: ClassiqueEditionId; chipLabel: string }[] = [
  { id: 'everose_diamond', chipLabel: 'Rose ◆' },
  { id: 'yellow_fluted', chipLabel: 'Champagne' },
  { id: 'steel_azure', chipLabel: 'Azure' },
  { id: 'white_mint', chipLabel: 'Mint' },
];

const SPEED_MULTIPLIERS: { value: 1 | 60 | 0.1; label: string; sub: string }[] = [
  { value: 1, label: '1×', sub: 'Live' },
  { value: 60, label: '60×', sub: 'Sweep' },
  { value: 0.1, label: '0.1×', sub: 'Slow' },
];

export const BottomAtelierDock: React.FC = () => {
  const model = useHorologyStore((s) => s.model);
  const edition = useHorologyStore((s) => s.edition);
  const classiqueEdition = useHorologyStore((s) => s.classiqueEdition);
  const explodedProgress = useHorologyStore((s) => s.explodedProgress);
  const timeMultiplier = useHorologyStore((s) => s.timeMultiplier);
  const isIntroComplete = useHorologyStore((s) => s.isIntroComplete);

  const setModel = useHorologyStore((s) => s.setModel);
  const setEdition = useHorologyStore((s) => s.setEdition);
  const setClassiqueEdition = useHorologyStore((s) => s.setClassiqueEdition);
  const setExplodedProgress = useHorologyStore((s) => s.setExplodedProgress);
  const setTimeMultiplier = useHorologyStore((s) => s.setTimeMultiplier);

  const isClassique = model === 'classique';
  const chips = isClassique
    ? CLASSIQUE_ORDER.map(({ id, chipLabel }) => {
        const cfg = CLASSIQUE_EDITIONS[id];
        return {
          id,
          chipLabel,
          title: `${cfg.name} — ${cfg.subtitle}`,
          primary: cfg.swatchPrimary,
          secondary: cfg.swatchSecondary,
          dial: cfg.dialColor,
          selected: classiqueEdition === id,
          onSelect: () => setClassiqueEdition(id),
        };
      })
    : TOURBILLON_ORDER.map(({ id, chipLabel }) => {
        const cfg = HOROLOGY_EDITIONS[id];
        return {
          id,
          chipLabel,
          title: `${cfg.name} — ${cfg.subtitle}`,
          primary: cfg.swatchPrimary,
          secondary: cfg.swatchSecondary,
          dial: cfg.bridgeColor,
          selected: edition === id,
          onSelect: () => setEdition(id),
        };
      });
  const selectedName = isClassique
    ? CLASSIQUE_EDITIONS[classiqueEdition].shortName
    : HOROLOGY_EDITIONS[edition].shortName;

  return (
    <footer
      className={`hud-reveal pointer-events-auto fixed bottom-4 left-1/2 z-30 w-[95%] max-w-[960px] -translate-x-1/2 ${
        isIntroComplete ? '' : 'hud-hidden-bottom'
      }`}
      style={{ transitionDelay: isIntroComplete ? '550ms' : '0ms' }}
    >
      {/* Compact model switch for small screens (header switch is md+) */}
      <div className="mb-2 flex justify-center md:hidden">
        <div className="glass-card flex rounded-xl border border-white/10 p-1">
          {(['classique', 'tourbillon'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setModel(m)}
              className={`rounded-lg px-3 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                model === m ? 'bg-white/10 text-white' : 'text-zinc-500'
              }`}
            >
              {m === 'classique' ? 'Classique 36' : 'Tourbillon'}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card flex flex-wrap items-center justify-between gap-x-5 gap-y-2.5 rounded-2xl border border-white/[0.08] px-4 py-2.5 md:flex-nowrap">
        {/* 1. Edition swatches */}
        <div className="flex min-w-0 shrink-0 items-center gap-3">
          <div className="hidden w-[104px] whitespace-nowrap xl:block">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500">Edition</p>
            <p key={selectedName} className="animate-hud-pop truncate font-mono text-[11px] font-semibold text-zinc-100">
              {selectedName}
            </p>
          </div>

          <div key={model} className="flex items-center gap-1.5">
            {chips.map((chip, i) => (
              <button
                key={chip.id}
                type="button"
                onClick={chip.onSelect}
                title={chip.title}
                aria-pressed={chip.selected}
                className={`animate-spec-in group relative flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border px-2 py-1.5 transition-all duration-300 hover:-translate-y-0.5 ${
                  chip.selected
                    ? 'border-amber-200/50 bg-white/[0.08] shadow-[0_0_18px_rgba(251,191,36,0.18)]'
                    : 'border-white/[0.08] bg-white/[0.02] hover:border-white/25'
                }`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {/* Miniature watch-head swatch: metal ring + dial colour */}
                <span
                  className="relative h-5 w-5 shrink-0 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.5),0_1px_3px_rgba(0,0,0,0.6)] transition-transform duration-500 group-hover:rotate-[120deg]"
                  style={{
                    background: `conic-gradient(from 210deg, ${chip.primary}, ${chip.secondary}, ${chip.primary}, ${chip.secondary}, ${chip.primary})`,
                  }}
                >
                  <span
                    className="absolute inset-[4px] rounded-full border border-black/20"
                    style={{ background: `radial-gradient(circle at 35% 30%, #ffffff55, ${chip.dial} 60%)` }}
                  />
                </span>
                <span className="hidden font-mono text-[10px] font-medium text-zinc-200 sm:inline">{chip.chipLabel}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Exploded calibre slider */}
        <div className="flex min-w-[170px] flex-1 items-center gap-3 md:max-w-[240px]">
          <div className="flex shrink-0 flex-col whitespace-nowrap">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500">Explode</span>
            <span className="font-mono text-[11px] font-bold tabular-nums text-amber-300">
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
            style={{ '--fill': `${explodedProgress * 100}%` } as React.CSSProperties}
            aria-label="Exploded calibre teardown"
          />
        </div>

        {/* 3. Time speed */}
        <div className="relative flex shrink-0 items-center whitespace-nowrap rounded-xl border border-white/10 bg-black/30 p-1">
          {SPEED_MULTIPLIERS.map((m) => {
            const active = timeMultiplier === m.value;
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => setTimeMultiplier(m.value)}
                className={`whitespace-nowrap rounded-lg px-2.5 py-1 font-mono text-[10px] transition-all duration-300 ${
                  active
                    ? 'bg-amber-300/20 font-bold text-amber-200 shadow-[inset_0_0_0_1px_rgba(252,211,77,0.4)]'
                    : 'text-zinc-400 hover:text-zinc-100'
                }`}
                title={`${m.label} (${m.sub})`}
              >
                {m.label}
                <span className="ml-1 hidden text-[9px] opacity-70 lg:inline">{m.sub}</span>
              </button>
            );
          })}
        </div>
      </div>
    </footer>
  );
};
