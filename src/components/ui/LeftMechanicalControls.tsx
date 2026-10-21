import React from 'react';
import {
  RotateCw,
  Play,
  Square,
  RotateCcw,
  Camera,
  Gauge,
  CalendarDays,
  ChevronRight,
} from 'lucide-react';
import { useHorologyStore, WATCH_MODELS } from '../../store/useHorologyStore';
import { horologyAudio } from '../../utils/horologyAudioEngine';

function formatDisplayedDate(offsetDays: number): { day: string; label: string } {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return {
    day: String(d.getDate()),
    label: d
      .toLocaleDateString('en-GB', { weekday: 'short', month: 'short', year: 'numeric' })
      .toUpperCase(),
  };
}

const cardBase = 'glass-card rounded-2xl border border-white/[0.08] p-3.5 transition-colors duration-300';
const cardTitle = 'flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em]';

export const LeftMechanicalControls: React.FC = () => {
  const model = useHorologyStore((s) => s.model);
  const powerReserve = useHorologyStore((s) => s.powerReserve);
  const crownTorque = useHorologyStore((s) => s.crownTorque);
  const isChronoRunning = useHorologyStore((s) => s.isChronoRunning);
  const cameraPreset = useHorologyStore((s) => s.cameraPreset);
  const dateOffsetDays = useHorologyStore((s) => s.dateOffsetDays);
  const isIntroComplete = useHorologyStore((s) => s.isIntroComplete);

  const windMainspring = useHorologyStore((s) => s.windMainspring);
  const toggleChrono = useHorologyStore((s) => s.toggleChrono);
  const resetChrono = useHorologyStore((s) => s.resetChrono);
  const setCameraPreset = useHorologyStore((s) => s.setCameraPreset);
  const advanceDate = useHorologyStore((s) => s.advanceDate);
  const resetDate = useHorologyStore((s) => s.resetDate);

  const modelCfg = WATCH_MODELS[model];
  const reserveHours = Math.round((powerReserve / 100) * modelCfg.powerReserveHours);
  const shownDate = formatDisplayedDate(dateOffsetDays);

  const handleWindClick = () => {
    windMainspring(15);
    horologyAudio.playCrownWindClick();
  };

  const handleWindScroll = (e: React.WheelEvent<HTMLDivElement>) => {
    e.stopPropagation();
    windMainspring(6);
    horologyAudio.playCrownWindClick();
  };

  const handleDateQuickset = () => {
    advanceDate();
    horologyAudio.playPusherSnap(true);
    if (cameraPreset !== 'cyclops_date') setCameraPreset('cyclops_date');
  };

  return (
    <aside
      className={`hud-reveal pointer-events-auto fixed left-5 top-1/2 z-30 hidden w-60 -translate-y-1/2 space-y-2.5 lg:block ${
        isIntroComplete ? '' : 'hud-hidden-left'
      }`}
      style={{ transitionDelay: isIntroComplete ? '250ms' : '0ms' }}
    >
      {/* CARD 1: Mainspring / crown */}
      <div onWheel={handleWindScroll} className={`${cardBase} hover:border-amber-300/25`}>
        <div className="mb-2.5 flex items-center justify-between">
          <span className={`${cardTitle} text-amber-300`}>
            <Gauge className="h-3.5 w-3.5" />
            Mainspring
          </span>
          <span className="font-mono text-[10px] tabular-nums text-zinc-400">
            {reserveHours}h / {modelCfg.powerReserveHours}h
          </span>
        </div>

        <div className="mb-3 space-y-1.5">
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-300 to-emerald-300 transition-[width] duration-500 ease-out"
              style={{ width: `${powerReserve}%` }}
            />
            <div
              className="absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-white/50 to-transparent transition-opacity duration-300"
              style={{
                left: `calc(${powerReserve}% - 2.5rem)`,
                opacity: crownTorque > 2 ? 0.9 : 0,
              }}
            />
          </div>
          <div className="flex items-center justify-between font-mono text-[9px] text-zinc-500">
            <span>CROWN TORQUE</span>
            <span className="tabular-nums text-amber-200/90">{Math.round(crownTorque)} N·mm</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleWindClick}
          className="group flex w-full items-center justify-center gap-2 rounded-xl border border-amber-300/35 bg-gradient-to-b from-amber-400/20 to-amber-500/10 px-3 py-2 font-mono text-[10.5px] font-semibold text-amber-100 transition-all duration-300 hover:border-amber-300/60 hover:shadow-[0_0_22px_rgba(245,158,11,0.25)] active:scale-[0.98]"
        >
          <RotateCw className="h-3.5 w-3.5 text-amber-300 transition-transform duration-500 group-hover:rotate-180" />
          WIND CROWN +15%
        </button>
        <p className="mt-1.5 text-center font-mono text-[9px] text-zinc-500">
          Scroll here or click the 3D crown
        </p>
      </div>

      {/* CARD 2: model-specific complication */}
      {model === 'classique' ? (
        <div key="date" className={`${cardBase} animate-hud-pop hover:border-sky-300/25`}>
          <div className="mb-2.5 flex items-center justify-between">
            <span className={`${cardTitle} text-sky-300`}>
              <CalendarDays className="h-3.5 w-3.5" />
              Date Quickset
            </span>
            {dateOffsetDays !== 0 && (
              <button
                type="button"
                onClick={resetDate}
                className="font-mono text-[9px] text-zinc-500 underline-offset-2 transition-colors hover:text-sky-200 hover:underline"
              >
                TODAY
              </button>
            )}
          </div>
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-12 w-14 items-center justify-center rounded-lg border border-white/15 bg-[#F6F4EE] shadow-inner">
              <span key={shownDate.day} className="animate-hud-pop font-display text-2xl font-bold text-zinc-900">
                {shownDate.day}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[10px] text-zinc-200">{shownDate.label}</p>
              <p className="font-mono text-[9px] text-zinc-500">Cyclops 2.5× magnifier</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDateQuickset}
            className="group flex w-full items-center justify-between rounded-xl border border-sky-300/30 bg-sky-400/10 px-3 py-2 font-mono text-[10.5px] font-semibold text-sky-100 transition-all duration-300 hover:border-sky-300/55 hover:shadow-[0_0_22px_rgba(56,189,248,0.22)] active:scale-[0.98]"
          >
            ADVANCE DATE +1
            <ChevronRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
          </button>
        </div>
      ) : (
        <div key="chrono" className={`${cardBase} animate-hud-pop`}>
          <div className="mb-2.5 flex items-center justify-between">
            <span className={`${cardTitle} text-rose-300`}>Column-Wheel Chrono</span>
            <span className="relative flex h-2 w-2">
              {isChronoRunning && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
              )}
              <span className={`relative inline-flex h-2 w-2 rounded-full ${isChronoRunning ? 'bg-rose-500' : 'bg-zinc-600'}`} />
            </span>
          </div>
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => {
                toggleChrono();
                horologyAudio.playPusherSnap(false);
              }}
              className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 font-mono text-[10px] font-semibold transition-all duration-300 active:scale-[0.98] ${
                isChronoRunning
                  ? 'border-rose-400/50 bg-rose-500/20 text-rose-100'
                  : 'border-emerald-400/35 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20'
              }`}
            >
              <span className="flex items-center gap-1.5">
                {isChronoRunning ? <Square className="h-3 w-3 fill-current" /> : <Play className="h-3 w-3 fill-current" />}
                {isChronoRunning ? 'STOP' : 'START'}
              </span>
              <span className="text-[9px] opacity-70">2 O&apos;CLOCK</span>
            </button>
            <button
              type="button"
              onClick={() => {
                resetChrono();
                horologyAudio.playPusherSnap(true);
              }}
              className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-[10px] font-semibold text-zinc-300 transition-all duration-300 hover:border-white/25 hover:text-white active:scale-[0.98]"
            >
              <span className="flex items-center gap-1.5">
                <RotateCcw className="h-3 w-3 text-sky-400" />
                FLYBACK RESET
              </span>
              <span className="text-[9px] text-zinc-500">4 O&apos;CLOCK</span>
            </button>
          </div>
        </div>
      )}

      {/* CARD 3: Camera presets */}
      <div className={cardBase}>
        <div className={`${cardTitle} mb-2 text-zinc-300`}>
          <Camera className="h-3.5 w-3.5 text-zinc-400" />
          Optical Angles
        </div>
        <div key={model} className="space-y-0.5">
          {modelCfg.cameraPresets.map((opt, i) => {
            const active = cameraPreset === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setCameraPreset(opt.id)}
                className={`animate-spec-in group relative flex w-full items-center gap-2.5 overflow-hidden rounded-lg px-2.5 py-1.5 text-left font-mono text-[10px] transition-all duration-300 ${
                  active ? 'bg-white/[0.08] text-white' : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100'
                }`}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <span
                  className={`absolute inset-y-1 left-0 w-[2px] rounded-full bg-amber-300 transition-all duration-300 ${
                    active ? 'opacity-100' : 'opacity-0'
                  }`}
                />
                <span className="tabular-nums text-zinc-600">{String(i + 1).padStart(2, '0')}</span>
                <span className="flex-1">{opt.label}</span>
                <ChevronRight
                  className={`h-3 w-3 transition-all duration-300 ${
                    active ? 'text-amber-300' : '-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-60'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
