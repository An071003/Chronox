import React from 'react';
import {
  RotateCw,
  Play,
  Square,
  RotateCcw,
  Camera,
  Gauge,
} from 'lucide-react';
import {
  useHorologyStore,
  CameraPresetId,
} from '../../store/useHorologyStore';
import { horologyAudio } from '../../utils/horologyAudioEngine';

const CAMERA_MACRO_OPTIONS: { id: CameraPresetId; label: string }[] = [
  { id: 'dial_hero', label: '01. Dial Hero' },
  { id: 'macro_tourbillon', label: '02. Macro Tourbillon (6h)' },
  { id: 'crown_pushers', label: '03. Crown & Pushers (3h)' },
  { id: 'caseback', label: '04. Exhibition Caseback' },
  { id: 'side_profile', label: '05. Side Calibre Profile' },
];

export const LeftMechanicalControls: React.FC = () => {
  const powerReserve = useHorologyStore((s) => s.powerReserve);
  const crownTorque = useHorologyStore((s) => s.crownTorque);
  const isChronoRunning = useHorologyStore((s) => s.isChronoRunning);
  const cameraPreset = useHorologyStore((s) => s.cameraPreset);

  const windMainspring = useHorologyStore((s) => s.windMainspring);
  const toggleChrono = useHorologyStore((s) => s.toggleChrono);
  const resetChrono = useHorologyStore((s) => s.resetChrono);
  const setCameraPreset = useHorologyStore((s) => s.setCameraPreset);

  const handleWindClick = () => {
    windMainspring(15);
    horologyAudio.playCrownWindClick();
  };

  const handleWindScroll = (e: React.WheelEvent<HTMLDivElement>) => {
    e.stopPropagation();
    windMainspring(6);
    horologyAudio.playCrownWindClick();
  };

  const handleStartStop = () => {
    toggleChrono();
    horologyAudio.playPusherSnap(false);
  };

  const handleFlybackReset = () => {
    resetChrono();
    horologyAudio.playPusherSnap(true);
  };

  return (
    <aside className="pointer-events-auto fixed left-5 top-1/2 z-30 hidden w-60 -translate-y-1/2 space-y-2.5 lg:block">
      {/* CARD 1: WINDING CROWN CONTROL */}
      <div
        onWheel={handleWindScroll}
        className="rounded-xl border border-white/10 bg-zinc-950/80 p-3.5 shadow-2xl backdrop-blur-xl transition-colors hover:border-amber-500/30"
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400">
            <Gauge className="h-3.5 w-3.5" />
            01 // Mainspring Barrel
          </span>
          <span className="font-mono text-[10px] text-zinc-400">
            {Math.round(powerReserve)}% ({Math.round((powerReserve / 100) * 72)}h)
          </span>
        </div>

        {/* Live Power Reserve & Torque Bar */}
        <div className="mb-2.5 space-y-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-200"
              style={{ width: `${powerReserve}%` }}
            />
          </div>
          <div className="flex items-center justify-between font-mono text-[9px] text-zinc-500">
            <span>TORQUE PULSE</span>
            <span className="text-amber-300">{Math.round(crownTorque)} N·mm</span>
          </div>
        </div>

        <button
          onClick={handleWindClick}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/15 px-3 py-2 font-mono text-[11px] font-semibold text-amber-200 transition-all hover:bg-amber-500/25 active:scale-[0.98]"
        >
          <RotateCw className="h-3.5 w-3.5 text-amber-400" />
          <span>WIND MAINSPRING (+15%)</span>
        </button>
        <p className="mt-1.5 text-center font-mono text-[9px] text-zinc-500">
          Scroll here or on 3D Crown (3h)
        </p>
      </div>

      {/* CARD 2: CHRONOGRAPH PUSHERS */}
      <div className="rounded-xl border border-white/10 bg-zinc-950/80 p-3.5 shadow-2xl backdrop-blur-xl">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-rose-400">
            02 // Column-Wheel Chrono
          </span>
          <span
            className={`h-2 w-2 rounded-full ${
              isChronoRunning ? 'bg-rose-500 animate-ping' : 'bg-zinc-600'
            }`}
          />
        </div>

        <div className="space-y-1.5">
          <button
            onClick={handleStartStop}
            className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 font-mono text-[10px] font-semibold transition-all active:scale-[0.98] ${
              isChronoRunning
                ? 'border-rose-500/50 bg-rose-500/20 text-rose-200'
                : 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25'
            }`}
          >
            <span className="flex items-center gap-1.5">
              {isChronoRunning ? (
                <Square className="h-3 w-3 fill-current" />
              ) : (
                <Play className="h-3 w-3 fill-current" />
              )}
              {isChronoRunning ? 'STOP CHRONO' : 'START / STOP'}
            </span>
            <span className="text-[9px] opacity-75">2 O&apos;CLOCK</span>
          </button>

          <button
            onClick={handleFlybackReset}
            className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-zinc-900/90 px-3 py-2 font-mono text-[10px] font-semibold text-zinc-300 transition-all hover:border-white/25 hover:text-white active:scale-[0.98]"
          >
            <span className="flex items-center gap-1.5">
              <RotateCcw className="h-3 w-3 text-sky-400" />
              FLYBACK RESET
            </span>
            <span className="text-[9px] text-zinc-500">4 O&apos;CLOCK</span>
          </button>
        </div>
      </div>

      {/* CARD 3: CAMERA MACRO PRESETS */}
      <div className="rounded-xl border border-white/10 bg-zinc-950/80 p-3.5 shadow-2xl backdrop-blur-xl">
        <div className="mb-2 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-sky-400">
          <Camera className="h-3.5 w-3.5" />
          <span>03 // Optical Macro Angles</span>
        </div>

        <div className="space-y-1">
          {CAMERA_MACRO_OPTIONS.map((opt) => {
            const active = cameraPreset === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setCameraPreset(opt.id)}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left font-mono text-[10px] transition-all ${
                  active
                    ? 'border border-sky-400/50 bg-sky-500/20 font-semibold text-sky-200'
                    : 'border border-transparent text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                }`}
              >
                <span>{opt.label}</span>
                {active && (
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
