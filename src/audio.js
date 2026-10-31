/**
 * Cosmic Battlefield - Procedural Audio Engine
 * High-fidelity 100% procedural sound synthesis via Web Audio API.
 * Zero external audio file dependencies.
 */
export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.noiseBuffer = null;
    this.volume = 0.7;
    this.muted = false;
    this.boostSrc = null;
    this.boostGain = null;
    this.boostActive = false;
    this.engineSrc = null;
    this.engineGain = null;
    this.engineFilter = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    this.ctx = new AudioContextClass();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Generate 2 seconds of pink/white noise buffer for thrusters and explosions
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * 2;
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    this.startAmbientEngine();
    this.initialized = true;
  }

  unlock() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime, 0.05);
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime, 0.05);
    }
    return this.muted;
  }

  startAmbientEngine() {
    if (!this.ctx || !this.noiseBuffer) return;
    try {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 180;
      filter.Q.value = 3.0;

      const gain = this.ctx.createGain();
      gain.gain.value = 0.04;

      noise.connect(filter).connect(gain).connect(this.masterGain);
      noise.start();

      this.engineSrc = noise;
      this.engineGain = gain;
      this.engineFilter = filter;
    } catch (e) {
      console.warn('Engine hum init error', e);
    }
  }

  updateEngineHum(speedRatio) {
    if (!this.engineFilter || !this.engineGain || !this.ctx) return;
    const now = this.ctx.currentTime;
    const targetFreq = 160 + speedRatio * 320;
    const targetGain = 0.03 + speedRatio * 0.09;
    this.engineFilter.frequency.setTargetAtTime(targetFreq, now, 0.1);
    this.engineGain.gain.setTargetAtTime(targetGain, now, 0.1);
  }

  setBoost(active) {
    if (this.boostActive === active || !this.ctx || !this.noiseBuffer) return;
    this.boostActive = active;
    const now = this.ctx.currentTime;

    if (active) {
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      src.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, now);
      filter.frequency.exponentialRampToValueAtTime(2200, now + 0.35);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.25, now + 0.15);

      src.connect(filter).connect(gain).connect(this.masterGain);
      src.start();
      this.boostSrc = src;
      this.boostGain = gain;
    } else if (this.boostSrc && this.boostGain) {
      this.boostGain.gain.setTargetAtTime(0.0001, now, 0.12);
      const oldSrc = this.boostSrc;
      setTimeout(() => {
        try { oldSrc.stop(); oldSrc.disconnect(); } catch (e) {}
      }, 250);
      this.boostSrc = null;
      this.boostGain = null;
    }
  }

  shoot(isOverdrive = false) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    // Dual laser punchy tone
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isOverdrive ? 'sawtooth' : 'triangle';
    const startFreq = isOverdrive ? 880 : 660;
    const endFreq = isOverdrive ? 180 : 130;

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.11);

    gain.gain.setValueAtTime(isOverdrive ? 0.22 : 0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain).connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.13);

    // Subtle plasma zap transient
    if (this.noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const nFilter = this.ctx.createBiquadFilter();
      nFilter.type = 'bandpass';
      nFilter.frequency.setValueAtTime(3200, now);
      nFilter.Q.value = 2.5;

      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.08, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      noise.connect(nFilter).connect(nGain).connect(this.masterGain);
      noise.start(now);
      noise.stop(now + 0.06);
    }
  }

  enemyShoot() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.14);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain).connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  hit() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(940, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.04);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain).connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  shieldHit() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    // Resonant shield chime
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(550, now + 0.18);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);

    osc.connect(gain).connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  explode(isBig = true) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    // Sub-bass impact
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(isBig ? 110 : 150, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + (isBig ? 0.7 : 0.4));

    oscGain.gain.setValueAtTime(isBig ? 0.45 : 0.28, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + (isBig ? 0.75 : 0.45));

    osc.connect(oscGain).connect(this.masterGain);
    osc.start(now);
    osc.stop(now + (isBig ? 0.8 : 0.5));

    // Heavy debris & fire noise burst
    if (this.noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isBig ? 1600 : 2200, now);
      filter.frequency.exponentialRampToValueAtTime(70, now + (isBig ? 0.8 : 0.45));

      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(isBig ? 0.5 : 0.3, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + (isBig ? 0.9 : 0.5));

      noise.connect(filter).connect(nGain).connect(this.masterGain);
      noise.start(now);
      noise.stop(now + (isBig ? 0.95 : 0.55));
    }
  }

  pickup(kind = 'score') {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const freqs = kind === 'shield'
      ? [523.25, 659.25, 783.99, 1046.50]
      : [440, 554.37, 659.25, 880];

    freqs.forEach((freq, idx) => {
      const noteTime = now + idx * 0.045;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.12, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.12);

      osc.connect(gain).connect(this.masterGain);
      osc.start(noteTime);
      osc.stop(noteTime + 0.13);
    });
  }

  sectorCleared() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const notes = [392.00, 523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const t = now + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc.connect(gain).connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  waveAlert() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    [0, 0.18].forEach((offset) => {
      const t = now + offset;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(740, t);
      osc.frequency.exponentialRampToValueAtTime(440, t + 0.14);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(gain).connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.16);
    });
  }
}
