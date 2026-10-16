import React, { useEffect, useState } from 'react';
import { Moon, Volume2, VolumeX, Layers, Sparkles } from 'lucide-react';
import { useHorologyStore } from '../../store/useHorologyStore';
import { useEclipseStore } from '../../store/useEclipseStore';
import { horologyAudio } from '../../utils/horologyAudioEngine';

function formatChronoTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((ms % 1000) / 10);
  const mm = minutes < 10 ? `0${minutes}` : `${minutes}`;
  const ss = seconds < 10 ? `0${seconds}` : `${seconds}`;
  const cc = centiseconds < 10 ? `0${centiseconds}` : `${centiseconds}`;
  return `${mm}:${ss}.${cc}`;
}

export const TopTelemetryHeader: React.FC = () => {
  const isNightLume = useHorologyStore((s) => s.isNightLume);
  const isAudioEnabled = useHorologyStore((s) => s.isAudioEnabled);
  const explodedProgress = useHorologyStore((s) => s.explodedProgress);
  const powerReserve = useHorologyStore((s) => s.powerReserve);
  const chronoElapsedMs = useHorologyStore((s) => s.chronoElapsedMs);
  const isChronoRunning = useHorologyStore((s) => s.isChronoRunning);

  const toggleNightLume = useHorologyStore((s) => s.toggleNightLume);
  const toggleAudio = useHorologyStore((s) => s.toggleAudio);
  const toggleBlueprintExplode = useHorologyStore((s) => s.toggleBlueprintExplode);
  const setExperienceMode = useEclipseStore((s) => s.setExperienceMode);

  const [localTimeStr, setLocalTimeStr] = useState('00:00:00.0');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      const d = Math.floor(now.getMilliseconds() / 100);
      setLocalTimeStr(`${hh}:${mm}:${ss}.${d}`);
    };
    updateClock();
    const id = setInterval(updateClock, 100);
    return () => clearInterval(id);
  }, []);

  const powerHours = Math.round((powerReserve / 100) * 72);
  const isExploded = explodedProgress > 0.3;

  const handleAudioClick = () => {
    toggleAudio();
    if (!isAudioEnabled) {
      horologyAudio.playEscapementTick(false);
    }
  };

  return (
    <header className="pointer-events-auto fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-white/10 bg-black/55 px-5 backdrop-blur-md lg:px-7">
      {/* Left: Brand Crest + Calibre Reference */}
      <div className="flex shrink-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-500/40 bg-gradient-to-br from-amber-500/20 to-zinc-900 shadow-inner">
          <Sparkles className="h-4 w-4 text-amber-400" />
        </div>
        <div className="whitespace-nowrap">
          <div className="flex items-center gap-2">
            <span className="font-display text-sm font-bold tracking-[0.18em] text-white">
              CHRONO-X // GENÈVE
            </span>
            <button
              type="button"
              onClick={() => setExperienceMode('eclipse')}
              className="rounded-full border border-amber-400/50 bg-amber-500/15 px-2.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-amber-200 transition-all hover:bg-amber-500/30"
            >
              SWITCH TO ECLIPSE BOSS
            </button>
          </div>
          <p className="font-mono text-[10px] tracking-widest text-zinc-400">
            REF. RM-026 SKELETON TOURBILLON
          </p>
        </div>
      </div>

      {/* Center: Single-Line Live Horological Telemetry Readout */}
      <div className="hidden shrink-0 items-center gap-3.5 whitespace-nowrap rounded-xl border border-white/10 bg-zinc-950/80 px-4 py-1.5 font-mono text-[11px] xl:flex">
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-500">LOCAL TIME:</span>
          <span className="font-semibold text-amber-300">{localTimeStr}</span>
        </div>
        <span className="text-white/15">|</span>
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-500">FREQ:</span>
          <span className="text-zinc-200">3.0 Hz / 21,600 VPH</span>
        </div>
        <span className="text-white/15">|</span>
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-500">RESERVE:</span>
          <span className="font-semibold text-emerald-400">
            {powerHours}h [{Math.round(powerReserve)}%]
          </span>
        </div>
        <span className="text-white/15">|</span>
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-500">CHRONO:</span>
          <span
            className={`font-semibold ${
              isChronoRunning ? 'text-rose-400' : 'text-zinc-300'
            }`}
          >
            {formatChronoTime(chronoElapsedMs)}
          </span>
        </div>
      </div>

      {/* Right: Night Lume, Mechanical Audio, Blueprint Explode Toggles */}
      <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
        <button
          onClick={toggleNightLume}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-[11px] font-medium transition-all ${
            isNightLume
              ? 'border-cyan-400/60 bg-cyan-500/20 text-cyan-200 shadow-[0_0_16px_rgba(0,245,212,0.35)]'
              : 'border-white/10 bg-zinc-900/80 text-zinc-300 hover:border-white/25 hover:text-white'
          }`}
          title="Toggle Super-LumiNova BGW9 Night Mode"
        >
          <Moon className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
          <span>NIGHT LUME</span>
        </button>

        <button
          onClick={handleAudioClick}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-[11px] font-medium transition-all ${
            isAudioEnabled
              ? 'border-amber-400/60 bg-amber-500/20 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
              : 'border-white/10 bg-zinc-900/80 text-zinc-300 hover:border-white/25 hover:text-white'
          }`}
          title="Toggle 21,600 VPH Swiss Lever Escapement Audio"
        >
          {isAudioEnabled ? (
            <Volume2 className="h-3.5 w-3.5 shrink-0 text-amber-400 animate-pulse" />
          ) : (
            <VolumeX className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
          )}
          <span className="hidden sm:inline">MECHANICAL AUDIO</span>
        </button>

        <button
          onClick={toggleBlueprintExplode}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-[11px] font-medium transition-all ${
            isExploded
              ? 'border-sky-400/60 bg-sky-500/20 text-sky-200 shadow-[0_0_15px_rgba(56,189,248,0.3)]'
              : 'border-white/10 bg-zinc-900/80 text-zinc-300 hover:border-white/25 hover:text-white'
          }`}
          title="Explode 6-Layer Horological Calibre"
        >
          <Layers className="h-3.5 w-3.5 shrink-0 text-sky-400" />
          <span className="hidden md:inline">BLUEPRINT EXPLODE</span>
        </button>
      </div>
    </header>
  );
};
