import React, { useEffect, useState } from 'react';
import { useHorologyStore } from '../../store/useHorologyStore';

const BRAND = 'CHRONO-X';
const INTRO_MS = 2100;

/** Brand curtain shown while procedural dials, bevels and lookdev textures are generated */
export const IntroOverlay: React.FC = () => {
  const isIntroComplete = useHorologyStore((s) => s.isIntroComplete);
  const setIntroComplete = useHorologyStore((s) => s.setIntroComplete);
  const [isUnmounted, setIsUnmounted] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(setIntroComplete, INTRO_MS);
    return () => window.clearTimeout(id);
  }, [setIntroComplete]);

  useEffect(() => {
    if (!isIntroComplete) return;
    const id = window.setTimeout(() => setIsUnmounted(true), 1300);
    return () => window.clearTimeout(id);
  }, [isIntroComplete]);

  if (isUnmounted) return null;

  return (
    <div
      onClick={setIntroComplete}
      className={`fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center bg-[#050608] transition-opacity duration-[1200ms] ease-out ${
        isIntroComplete ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(229,174,136,0.12),transparent_60%)]" />

      <div className="relative flex flex-col items-center">
        {/* Rotating guilloché crest */}
        <div className="relative mb-7 h-16 w-16">
          <div className="absolute inset-0 animate-[spin_9s_linear_infinite] rounded-full border border-amber-200/25 [background:repeating-conic-gradient(from_0deg,rgba(253,230,138,0.18)_0deg_3deg,transparent_3deg_9deg)]" />
          <div className="absolute inset-[22%] rounded-full border border-amber-200/50 bg-gradient-to-br from-amber-200/30 to-transparent shadow-[0_0_30px_rgba(251,191,36,0.25)]" />
        </div>

        <h1 className="flex font-display text-4xl font-semibold tracking-[0.35em] text-white sm:text-5xl">
          {BRAND.split('').map((ch, i) => (
            <span
              key={i}
              className="intro-letter inline-block"
              style={{ animationDelay: `${180 + i * 70}ms` }}
            >
              {ch}
            </span>
          ))}
        </h1>

        <div className="intro-line mt-5 h-px w-64 bg-gradient-to-r from-transparent via-amber-200/80 to-transparent" />

        <p
          className="intro-fade mt-4 font-mono text-[10px] uppercase tracking-[0.45em] text-zinc-400"
          style={{ animationDelay: '900ms' }}
        >
          Genève · Haute Horlogerie Lab
        </p>

        <div className="mt-10 h-[2px] w-40 overflow-hidden rounded-full bg-white/10">
          <div className="intro-progress h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-100" />
        </div>
      </div>
    </div>
  );
};
