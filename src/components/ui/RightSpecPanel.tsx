import React, { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import {
  useHorologyStore,
  CLASSIQUE_EDITIONS,
  HOROLOGY_EDITIONS,
  WATCH_MODELS,
} from '../../store/useHorologyStore';

function formatChronoTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((ms % 1000) / 10);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
}

const TOURBILLON_SPECS = [
  { label: 'Case', value: '44 mm octagonal' },
  { label: 'Movement', value: 'Flying tourbillon' },
  { label: 'Complications', value: 'Chrono 30 min · PR' },
  { label: 'Jewels', value: '38 synthetic rubies' },
  { label: 'Crystal', value: 'Domed sapphire AR' },
  { label: 'Water', value: '50 m / 165 ft' },
];

/** Power-reserve ring gauge */
const ReserveRing: React.FC<{ value: number }> = ({ value }) => {
  const r = 17;
  const circumference = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 44 44" className="h-11 w-11 -rotate-90">
      <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
      <circle
        cx="22"
        cy="22"
        r={r}
        fill="none"
        stroke="url(#reserveGradient)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - value / 100)}
        style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16,1,0.3,1)' }}
      />
      <defs>
        <linearGradient id="reserveGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="100%" stopColor="#6ee7b7" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export const RightSpecPanel: React.FC = () => {
  const model = useHorologyStore((s) => s.model);
  const classiqueEdition = useHorologyStore((s) => s.classiqueEdition);
  const tourbillonEdition = useHorologyStore((s) => s.edition);
  const powerReserve = useHorologyStore((s) => s.powerReserve);
  const chronoElapsedMs = useHorologyStore((s) => s.chronoElapsedMs);
  const isChronoRunning = useHorologyStore((s) => s.isChronoRunning);
  const isIntroComplete = useHorologyStore((s) => s.isIntroComplete);
  const timeMultiplier = useHorologyStore((s) => s.timeMultiplier);
  // Blueprint callouts extend to the right, so the sheet steps aside while exploded
  const isExploded = useHorologyStore((s) => s.explodedProgress > 0.3);

  const [clock, setClock] = useState('--:--:--');
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setClock(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
      );
    };
    update();
    const id = window.setInterval(update, 250);
    return () => window.clearInterval(id);
  }, []);

  const modelCfg = WATCH_MODELS[model];
  const isClassique = model === 'classique';
  const title = isClassique
    ? CLASSIQUE_EDITIONS[classiqueEdition].name
    : HOROLOGY_EDITIONS[tourbillonEdition].name;
  const subtitle = isClassique
    ? CLASSIQUE_EDITIONS[classiqueEdition].subtitle
    : HOROLOGY_EDITIONS[tourbillonEdition].subtitle;
  const specs = isClassique ? CLASSIQUE_EDITIONS[classiqueEdition].specs : TOURBILLON_SPECS;
  const editionKey = isClassique ? classiqueEdition : tourbillonEdition;
  const reserveHours = Math.round((powerReserve / 100) * modelCfg.powerReserveHours);

  return (
    <aside
      className={`hud-reveal fixed right-5 top-1/2 z-30 hidden w-60 -translate-y-1/2 space-y-2.5 xl:block ${
        isIntroComplete && !isExploded ? 'pointer-events-auto' : 'hud-hidden-right pointer-events-none'
      }`}
      style={{ transitionDelay: isIntroComplete && !isExploded ? '400ms' : '0ms' }}
    >
      {/* Edition sheet */}
      <div className="glass-card overflow-hidden rounded-2xl border border-white/[0.08]">
        <div key={editionKey} className="relative p-3.5">
          <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-amber-200/10 blur-2xl" />
          <p className="animate-spec-in font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500">
            {modelCfg.name}
          </p>
          <h2
            className="animate-spec-in mt-1 font-display text-[13px] font-semibold leading-snug tracking-[0.08em] text-zinc-50"
            style={{ animationDelay: '60ms' }}
          >
            {title}
          </h2>
          <p className="animate-spec-in mt-0.5 font-mono text-[10px] text-amber-200/80" style={{ animationDelay: '100ms' }}>
            {subtitle}
          </p>

          <dl className="mt-3 space-y-1.5 border-t border-white/[0.07] pt-3">
            {specs.map((spec, i) => (
              <div
                key={spec.label}
                className="animate-spec-in flex items-baseline justify-between gap-3 font-mono text-[10px]"
                style={{ animationDelay: `${140 + i * 45}ms` }}
              >
                <dt className="shrink-0 uppercase tracking-wider text-zinc-500">{spec.label}</dt>
                <dd className="truncate text-right text-zinc-200">{spec.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Live telemetry */}
      <div className="glass-card rounded-2xl border border-white/[0.08] p-3.5">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-300">
            <Activity className="h-3.5 w-3.5" />
            Live Telemetry
          </span>
          {timeMultiplier !== 1 && (
            <span className="animate-hud-pop rounded-full border border-amber-300/40 bg-amber-400/10 px-1.5 py-px font-mono text-[9px] text-amber-200">
              {timeMultiplier}×
            </span>
          )}
        </div>

        <p className="font-mono text-2xl font-semibold tabular-nums tracking-wider text-white">{clock}</p>
        <p className="mb-3 font-mono text-[9px] tracking-wider text-zinc-500">{modelCfg.frequencyLabel}</p>

        <div className="flex items-center gap-3 border-t border-white/[0.07] pt-3">
          <ReserveRing value={powerReserve} />
          <div className="font-mono">
            <p className="text-[9px] uppercase tracking-wider text-zinc-500">Power reserve</p>
            <p className="text-[13px] font-semibold tabular-nums text-emerald-200">
              {reserveHours}h <span className="text-[10px] text-zinc-500">/ {modelCfg.powerReserveHours}h</span>
            </p>
          </div>
        </div>

        {!isClassique && (
          <div className="mt-3 flex items-center justify-between border-t border-white/[0.07] pt-3 font-mono">
            <span className="text-[9px] uppercase tracking-wider text-zinc-500">Chronograph</span>
            <span className={`text-[12px] font-semibold tabular-nums ${isChronoRunning ? 'text-rose-300' : 'text-zinc-300'}`}>
              {formatChronoTime(chronoElapsedMs)}
            </span>
          </div>
        )}
      </div>
    </aside>
  );
};
