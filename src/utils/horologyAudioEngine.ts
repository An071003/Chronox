// Procedural Web Audio API Swiss Mechanical Horology Synthesizer
// Zero external audio asset dependencies

class HorologyAudioEngine {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (!this.noiseBuffer && this.ctx) {
      const sampleRate = this.ctx.sampleRate;
      const length = Math.floor(sampleRate * 0.05); // 50ms noise buffer
      const buffer = this.ctx.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      this.noiseBuffer = buffer;
    }
    return this.ctx;
  }

  /**
   * 21,600 VPH (3Hz / 6 beats per second) Swiss Lever Escapement Heartbeat
   * - Impulse 1 (Pallet fork unlock): Ultra-short 1.5ms high-passed noise click at 4200Hz
   * - Impulse 2 (Escape wheel tooth lock - 8ms later): Crisp metallic resonance at 6800Hz + 2900Hz bell harmonic decay over 18ms
   */
  public playEscapementTick(isMacroTourbillon = false): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.noiseBuffer) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    const baseVolume = isMacroTourbillon ? 0.34 : 0.14;
    masterGain.gain.setValueAtTime(baseVolume, now);
    masterGain.connect(ctx.destination);

    // Impulse 1: Pallet fork unlock (t = +0ms, 1.5ms high-passed noise transient at 4200Hz)
    const unlockNoise = ctx.createBufferSource();
    unlockNoise.buffer = this.noiseBuffer;

    const unlockFilter = ctx.createBiquadFilter();
    unlockFilter.type = 'bandpass';
    unlockFilter.frequency.setValueAtTime(4200, now);
    unlockFilter.Q.setValueAtTime(3.5, now);

    const unlockGain = ctx.createGain();
    unlockGain.gain.setValueAtTime(0.9, now);
    unlockGain.gain.exponentialRampToValueAtTime(0.001, now + 0.0035);

    unlockNoise.connect(unlockFilter);
    unlockFilter.connect(unlockGain);
    unlockGain.connect(masterGain);

    unlockNoise.start(now);
    unlockNoise.stop(now + 0.004);

    // Impulse 2: Escape wheel impulse pin strike (+3.5ms)
    const impulseOsc = ctx.createOscillator();
    impulseOsc.type = 'triangle';
    impulseOsc.frequency.setValueAtTime(5100, now + 0.0035);
    impulseOsc.frequency.exponentialRampToValueAtTime(3400, now + 0.007);

    const impulseGain = ctx.createGain();
    impulseGain.gain.setValueAtTime(0.0001, now);
    impulseGain.gain.setValueAtTime(0.45, now + 0.0035);
    impulseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.0075);

    impulseOsc.connect(impulseGain);
    impulseGain.connect(masterGain);
    impulseOsc.start(now + 0.0035);
    impulseOsc.stop(now + 0.008);

    // Impulse 3: Escape wheel tooth lock (+8ms, 6800Hz + 2900Hz harmonic bell resonance over 18ms)
    const lockTime = now + 0.008;

    const lockOscHigh = ctx.createOscillator();
    lockOscHigh.type = 'sine';
    lockOscHigh.frequency.setValueAtTime(6800, lockTime);
    lockOscHigh.frequency.exponentialRampToValueAtTime(6100, lockTime + 0.018);

    const lockOscBell = ctx.createOscillator();
    lockOscBell.type = 'sine';
    lockOscBell.frequency.setValueAtTime(2900, lockTime);

    const lockGain = ctx.createGain();
    lockGain.gain.setValueAtTime(0.0001, now);
    lockGain.gain.setValueAtTime(1.0, lockTime);
    lockGain.gain.exponentialRampToValueAtTime(0.001, lockTime + 0.018);

    lockOscHigh.connect(lockGain);
    lockOscBell.connect(lockGain);
    lockGain.connect(masterGain);

    lockOscHigh.start(lockTime);
    lockOscBell.start(lockTime);
    lockOscHigh.stop(lockTime + 0.02);
    lockOscBell.stop(lockTime + 0.02);
  }

  /**
   * Crown Ratchet Winding Sound:
   * Crisp spring-click transient (3100Hz bandpass impulse + 1400Hz gear tooth slide)
   */
  public playCrownWindClick(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.noiseBuffer) return;

    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.28, now);
    master.connect(ctx.destination);

    // Ratchet sequence of 3 rapid micro-clicks to simulate bevel pinion tooth engagement
    for (let i = 0; i < 3; i++) {
      const offset = i * 0.022;
      const t = now + offset;

      const noise = ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(3100 + i * 220, t);
      bp.Q.setValueAtTime(4.2, t);

      const clickGain = ctx.createGain();
      clickGain.gain.setValueAtTime(0.9, t);
      clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.012);

      noise.connect(bp);
      bp.connect(clickGain);
      clickGain.connect(master);

      noise.start(t);
      noise.stop(t + 0.014);

      // 1400Hz gear tooth slide
      const slideOsc = ctx.createOscillator();
      slideOsc.type = 'sawtooth';
      slideOsc.frequency.setValueAtTime(1400, t);
      slideOsc.frequency.exponentialRampToValueAtTime(2200, t + 0.011);

      const slideGain = ctx.createGain();
      slideGain.gain.setValueAtTime(0.25, t);
      slideGain.gain.exponentialRampToValueAtTime(0.001, t + 0.012);

      slideOsc.connect(slideGain);
      slideGain.connect(master);

      slideOsc.start(t);
      slideOsc.stop(t + 0.013);
    }
  }

  /**
   * Column-Wheel Chronograph Pusher Snap:
   * Heavy, satisfying steel lever engagement sound (850Hz mechanical thud + 5200Hz spring snap)
   */
  public playPusherSnap(isReset = false): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.noiseBuffer) return;

    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.38, now);
    master.connect(ctx.destination);

    // 850Hz steel column-wheel lever thud
    const bodyOsc = ctx.createOscillator();
    bodyOsc.type = 'triangle';
    bodyOsc.frequency.setValueAtTime(isReset ? 760 : 850, now);
    bodyOsc.frequency.exponentialRampToValueAtTime(190, now + 0.032);

    const bodyGain = ctx.createGain();
    bodyGain.gain.setValueAtTime(0.95, now);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    bodyOsc.connect(bodyGain);
    bodyGain.connect(master);
    bodyOsc.start(now);
    bodyOsc.stop(now + 0.038);

    // 5200Hz column-wheel spring snap
    const snapOsc = ctx.createOscillator();
    snapOsc.type = 'sine';
    snapOsc.frequency.setValueAtTime(5200, now + 0.004);
    snapOsc.frequency.exponentialRampToValueAtTime(3100, now + 0.024);

    const snapGain = ctx.createGain();
    snapGain.gain.setValueAtTime(0.001, now);
    snapGain.gain.setValueAtTime(0.7, now + 0.004);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.026);

    snapOsc.connect(snapGain);
    snapGain.connect(master);
    snapOsc.start(now + 0.004);
    snapOsc.stop(now + 0.028);
  }
}

export const horologyAudio = new HorologyAudioEngine();
