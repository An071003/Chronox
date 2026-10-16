import React, { useMemo } from 'react';
import {
  ECLIPSE_ACTS,
  useEclipseStore,
  WORLD_STATE_THEMES,
} from '../../store/useEclipseStore';
import { createBossTarotCardImage } from '../../utils/proceduralArtGenerator';

export const StoryActsOverlay: React.FC = () => {
  const currentAct = useEclipseStore((s) => s.currentAct);
  const worldState = useEclipseStore((s) => s.worldState);
  const scrollProgress = useEclipseStore((s) => s.scrollProgress);
  const isCutscenePlaying = useEclipseStore((s) => s.isCutscenePlaying);

  const theme = WORLD_STATE_THEMES[worldState];
  const actData = ECLIPSE_ACTS[currentAct - 1];

  // Generate the procedural Gold-Foil Tarot Card image for the current Act
  const tarotDataUrl = useMemo(() => {
    return createBossTarotCardImage(currentAct, theme.primaryHex);
  }, [currentAct, theme.primaryHex]);

  if (isCutscenePlaying) {
    return null;
  }

  return (
    <aside
      aria-label="Chapter Lore Card"
      className="pointer-events-none fixed bottom-24 left-6 z-10 flex w-[310px] flex-col justify-end sm:w-[330px]"
    >
      <div className="pointer-events-auto overflow-hidden rounded-xl border border-amber-500/25 bg-[#080A10]/80 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-xl transition-all duration-500">
        {/* Top Row: Tarot Card Thumbnail + Act Title */}
        <div className="flex items-start gap-3.5">
          <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded border border-amber-400/40 bg-black shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <img
              src={tarotDataUrl}
              alt={actData.tarotName}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="flex flex-col">
            <span className="font-mono text-[9px] tracking-[0.26em] text-amber-400">
              {actData.roman} // {actData.tarotName}
            </span>
            <h2 className="mt-1 font-serif text-base font-bold leading-snug tracking-[0.12em] text-white">
              {actData.title}
            </h2>
            <p className="mt-0.5 font-serif text-xs italic text-amber-200/80">
              {actData.subtitle}
            </p>
          </div>
        </div>

        {/* Editorial Lore Paragraph */}
        <p className="mt-3 border-t border-white/10 pt-2.5 text-xs leading-relaxed text-slate-300">
          {actData.description}
        </p>

        {/* Bottom Telemetry & Scroll Spline Progress Bar */}
        <div className="mt-3 flex flex-col gap-1.5 border-t border-white/10 pt-2">
          <div className="flex items-center justify-between font-mono text-[9px] tracking-[0.15em] text-slate-400">
            <span>{actData.telemetry.split('//')[0]}</span>
            <span className="text-amber-300">
              SPLINE {(scrollProgress * 100).toFixed(0)}%
            </span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{
                width: `${Math.max(6, scrollProgress * 100)}%`,
                backgroundColor: theme.primaryHex,
              }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
};
