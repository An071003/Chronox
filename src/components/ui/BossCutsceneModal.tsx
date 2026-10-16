import React from 'react';
import { useEclipseStore, WORLD_STATE_THEMES } from '../../store/useEclipseStore';
import { eclipseAudio } from '../../utils/eclipseAudioEngine';

export const BossCutsceneModal: React.FC = () => {
  const isCutscenePlaying = useEclipseStore((s) => s.isCutscenePlaying);
  const worldState = useEclipseStore((s) => s.worldState);
  const isAwakened = useEclipseStore((s) => s.isAwakened);
  const isAudioEnabled = useEclipseStore((s) => s.isAudioEnabled);

  const setCutscenePlaying = useEclipseStore((s) => s.setCutscenePlaying);
  const setAwakened = useEclipseStore((s) => s.setAwakened);

  if (!isCutscenePlaying) return null;

  const theme = WORLD_STATE_THEMES[worldState];

  return (
    <div className="pointer-events-none fixed inset-0 z-30 flex flex-col justify-between">
      {/* Top 2.39:1 Anamorphic Cinema Letterbox Bar */}
      <div className="pointer-events-auto flex h-24 w-full items-center justify-between border-b border-amber-500/20 bg-black/95 px-8">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
          <span className="font-mono text-[10px] tracking-[0.3em] text-amber-300">
            CINEMATIC BOSS ENCOUNTER // 2.39:1 ANAMORPHIC
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              const next = !isAwakened;
              setAwakened(next);
              if (next && isAudioEnabled) {
                eclipseAudio.playDivineAwakeningBraaam();
              }
            }}
            className={`rounded-full border px-4 py-1.5 font-mono text-[10px] tracking-[0.2em] transition-all ${
              isAwakened
                ? 'border-amber-300 bg-amber-500/30 text-amber-100'
                : 'border-amber-400/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
            }`}
          >
            {isAwakened ? 'PHASE II // SWORD HALO ACTIVE' : 'TRIGGER PHASE II OVERDRIVE'}
          </button>

          <button
            type="button"
            onClick={() => {
              setAwakened(false);
              setCutscenePlaying(false);
            }}
            className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 font-mono text-[10px] tracking-[0.2em] text-white transition-all hover:border-white/50 hover:bg-white/20"
          >
            EXIT CUTSCENE [ESC]
          </button>
        </div>
      </div>

      {/* Bottom 2.39:1 Anamorphic Cinema Letterbox Bar with Soulslike Boss Health Bar */}
      <div className="pointer-events-auto flex h-28 w-full flex-col items-center justify-center border-t border-amber-500/20 bg-black/95 px-8">
        <div className="w-full max-w-3xl">
          <div className="mb-1.5 flex items-baseline justify-between">
            <h2 className="font-serif text-lg font-bold tracking-[0.26em] text-amber-100">
              THE ASTRAL SERAPHIM, SOVEREIGN OF RESONANCE
            </h2>
            <span className="font-mono text-[10px] tracking-[0.22em] text-amber-400">
              {isAwakened ? 'PHASE II // XXIV TELEKINETIC BLADES' : 'PHASE I // ECLIPSE ALTAR'}
            </span>
          </div>

          {/* Soulslike Boss Vitality Bar */}
          <div className="h-2.5 w-full overflow-hidden rounded-sm border border-amber-500/40 bg-slate-950 p-0.5 shadow-[0_0_25px_rgba(245,158,11,0.35)]">
            <div
              className="h-full w-full transition-all duration-700"
              style={{
                background: `linear-gradient(90deg, ${theme.primaryHex} 0%, ${theme.auraHex} 50%, ${theme.primaryHex} 100%)`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
