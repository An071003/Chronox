import React from 'react';
import { Html } from '@react-three/drei';

const TONES = {
  amber: 'text-amber-200 border-amber-300/40',
  rose: 'text-rose-200 border-rose-300/40',
  zinc: 'text-zinc-100 border-zinc-300/40',
  cyan: 'text-cyan-200 border-cyan-300/40',
  sky: 'text-sky-200 border-sky-300/40',
  emerald: 'text-emerald-200 border-emerald-300/40',
} as const;

/**
 * Exploded-view label: a glowing anchor dot on the part, a leader line, and a compact tag
 * that always extends to the right so it never collides with the left control column.
 */
export const BlueprintCallout: React.FC<{
  position: [number, number, number];
  layer: string;
  text: string;
  tone: keyof typeof TONES;
  delayMs?: number;
}> = ({ position, layer, text, tone, delayMs = 0 }) => (
  <Html position={position} distanceFactor={3.4} zIndexRange={[20, 0]}>
    <div
      className={`animate-hud-pop pointer-events-none flex -translate-y-1/2 items-center ${TONES[tone]}`}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current shadow-[0_0_10px_currentColor]" />
      <span className="h-px w-10 shrink-0 bg-gradient-to-r from-current to-transparent opacity-70" />
      <div className={`whitespace-nowrap rounded-md border bg-black/75 px-2 py-0.5 font-mono text-[9px] tracking-wide shadow-lg backdrop-blur-md ${TONES[tone]}`}>
        <span className="font-bold">{layer}</span>
        <span className="mx-1 opacity-40">//</span>
        <span className="text-zinc-200">{text}</span>
      </div>
    </div>
  </Html>
);
