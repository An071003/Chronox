// AAA Orchestral & Dark-Fantasy Web Audio API Synthesizer for ECLIPSE OF RESONANCE
// Synthesizes Hans Zimmer Low-Brass "BRAAAM", 24-Blade Choir Shimmer, and Multiverse Portal Warp

class EclipseAudioEngine {
  private ctx: AudioContext | null = null;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Hans Zimmer "BRAAAM" Low-Brass Horn + 24-Blade Metallic Choir Resonance
   * Triggered when the user holds Left Click or SPACE (Divine Awakening Overdrive)
   */
  public playDivineAwakeningBraaam(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.32, now);
    master.connect(ctx.destination);

    // 1. Sub-Bass & Detuned Sawtooth Brass Choir (D1 = 36.7Hz, D2 = 73.4Hz, A2 = 110Hz)
    const freqs = [36.71, 73.42, 73.85, 110.0, 146.83];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      osc.type = idx === 0 ? 'sine' : 'sawtooth';
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.exponentialRampToValueAtTime(f * 0.97, now + 1.8);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, now);
      filter.frequency.exponentialRampToValueAtTime(680, now + 0.35);
      filter.frequency.exponentialRampToValueAtTime(180, now + 1.85);
      filter.Q.setValueAtTime(3.2, now);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.35 / freqs.length, now + 0.15);
      g.gain.exponentialRampToValueAtTime(0.001, now + 1.9);

      osc.connect(filter);
      filter.connect(g);
      g.connect(master);

      osc.start(now);
      osc.stop(now + 1.95);
    });

    // 2. 24-Blade Telekinetic Metallic Choir Ring (High Crystalline Harmonics)
    const bladeHarmonics = [1174.66, 1760.0, 2349.32, 3520.0];
    bladeHarmonics.forEach((hf, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(hf, now + i * 0.04);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.08, now + i * 0.04 + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

      osc.connect(g);
      g.connect(master);
      osc.start(now + i * 0.04);
      osc.stop(now + 1.45);
    });
  }

  /**
   * Multiverse Portal Dimensional Rift Warp Sound
   */
  public playPortalWarpSound(entering = true): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.28, now);
    master.connect(ctx.destination);

    const sweepOsc = ctx.createOscillator();
    sweepOsc.type = 'triangle';
    sweepOsc.frequency.setValueAtTime(entering ? 95 : 420, now);
    sweepOsc.frequency.exponentialRampToValueAtTime(entering ? 520 : 85, now + 0.75);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.01, now);
    g.gain.linearRampToValueAtTime(0.6, now + 0.15);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    sweepOsc.connect(g);
    g.connect(master);
    sweepOsc.start(now);
    sweepOsc.stop(now + 0.82);
  }

  /**
   * Subtle Celestial Resonance Chime on Act Change or World State Switch
   */
  public playCelestialChime(pitchMultiplier = 1): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.18, now);
    master.connect(ctx.destination);

    [587.33, 880.0, 1174.66].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * pitchMultiplier, now + idx * 0.06);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.25, now + idx * 0.06 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      osc.connect(g);
      g.connect(master);
      osc.start(now + idx * 0.06);
      osc.stop(now + 0.95);
    });
  }
}

export const eclipseAudio = new EclipseAudioEngine();
