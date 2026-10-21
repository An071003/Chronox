import { useEffect, useState } from 'react';

const DIAL_FONTS = [
  '600 40px Cinzel',
  '700 40px Cinzel',
  '500 40px Inter',
  '600 40px Inter',
];

let fontsReadyPromise: Promise<void> | null = null;

/** Canvas dial textures must wait for web fonts, otherwise signatures render in a fallback face */
export function useFontsReady(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!('fonts' in document)) {
      setReady(true);
      return;
    }
    fontsReadyPromise ??= Promise.all(DIAL_FONTS.map((f) => document.fonts.load(f)))
      .then(() => undefined)
      .catch(() => undefined);
    let cancelled = false;
    // Never block the dial for more than 2.5 s on a slow font CDN
    const timeout = window.setTimeout(() => !cancelled && setReady(true), 2500);
    fontsReadyPromise.then(() => !cancelled && setReady(true));
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, []);

  return ready;
}
