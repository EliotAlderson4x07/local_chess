// Synthesized Audio via Web Audio API - Zero external asset latency

class SoundSystem {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  constructor() {
    // Lazy initialized upon first user action
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  private playTone(freq: number, type: OscillatorType, duration: number, gainVal: number = 0.15) {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Ignore audio synthesis errors on autoplay restrictions
    }
  }

  public playMove() {
    this.playTone(320, 'triangle', 0.08, 0.2);
  }

  public playCapture() {
    this.playTone(180, 'square', 0.12, 0.25);
  }

  public playCheck() {
    this.playTone(680, 'sine', 0.18, 0.28);
    setTimeout(() => this.playTone(840, 'sine', 0.2, 0.22), 100);
  }

  public playDrawReject() {
    this.playTone(260, 'sawtooth', 0.15, 0.22);
    setTimeout(() => this.playTone(190, 'sawtooth', 0.2, 0.22), 110);
  }

  public playDrawAccept() {
    this.playTone(440, 'triangle', 0.16, 0.2);
    setTimeout(() => this.playTone(554.37, 'triangle', 0.22, 0.2), 110);
  }

  public playGameOver(isWin: boolean) {
    if (isWin) {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        setTimeout(() => this.playTone(freq, 'triangle', 0.25, 0.2), idx * 110);
      });
    } else {
      [440, 392, 349, 293].forEach((freq, idx) => {
        setTimeout(() => this.playTone(freq, 'sawtooth', 0.3, 0.2), idx * 140);
      });
    }
  }

  public playPowerUp() {
    [440, 554.37, 659.25, 880, 1108.73, 1318.51].forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'triangle', 0.18, 0.25), idx * 60);
    });
  }

  public playObliterate() {
    this.playTone(880, 'sawtooth', 0.08, 0.3);
    setTimeout(() => this.playTone(440, 'square', 0.1, 0.35), 40);
    setTimeout(() => this.playTone(180, 'sawtooth', 0.2, 0.4), 80);
    setTimeout(() => this.playTone(90, 'sine', 0.3, 0.45), 140);
  }

  public playPurchaseSuccess() {
    [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98].forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'sine', 0.25, 0.22), idx * 90);
    });
  }

  public playRevivePiece() {
    if (this.muted) return;
    // Celestial resurrection arpeggio
    [329.63, 415.3, 493.88, 659.25, 830.61, 987.77, 1318.51].forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'sine', 0.35, 0.28), idx * 70);
    });
  }

  public playNukeSiren() {
    if (this.muted) return;
    // Nuclear alarm siren
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.playTone(850, 'sawtooth', 0.35, 0.25);
        setTimeout(() => this.playTone(600, 'sawtooth', 0.35, 0.25), 250);
      }, i * 500);
    }
  }

  public playNukeExplosion() {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // 1. Initial Shockwave Noise Burst & Rumble
      const sampleRate = this.ctx.sampleRate;
      const duration = 2.8;
      const buffer = this.ctx.createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < buffer.length; i++) {
        // White noise with exponential decay
        const t = i / sampleRate;
        data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 1.4);
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = buffer;

      // Dynamic low-pass filter for explosion body
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, now);
      filter.frequency.exponentialRampToValueAtTime(50, now + duration);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.65, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noiseSource.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noiseSource.start(now);

      // 2. Heavy Sub-Bass Core Oscillator
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sawtooth';
      subOsc.frequency.setValueAtTime(140, now);
      subOsc.frequency.exponentialRampToValueAtTime(25, now + 2.2);

      subGain.gain.setValueAtTime(0.55, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 2.4);

      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 2.5);

      // 3. Shockwave crackle
      setTimeout(() => {
        this.playTone(90, 'square', 0.4, 0.35);
        this.playTone(45, 'sine', 0.8, 0.4);
      }, 150);
    } catch {
      // Fallback in case of audio context limitation
      this.playTone(100, 'sawtooth', 0.8, 0.4);
    }
  }
}

export const soundService = new SoundSystem();
