export class AudioManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  ensureContext() {
    if (!this.enabled) return null;
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  playTone({ type = 'sine', freq = 440, duration = 0.1, gain = 0.08, slide = 0 }) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const vol = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slide !== 0) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), now + duration);
    }

    vol.gain.setValueAtTime(gain, now);
    vol.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(vol);
    vol.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  shoot() {
    this.playTone({ type: 'square', freq: 560, duration: 0.06, gain: 0.05, slide: -140 });
  }

  explosion(isBoss = false) {
    this.playTone({ type: 'sawtooth', freq: isBoss ? 120 : 180, duration: isBoss ? 0.45 : 0.22, gain: 0.11, slide: -70 });
  }

  powerup() {
    this.playTone({ type: 'triangle', freq: 420, duration: 0.18, gain: 0.08, slide: 260 });
  }

  hit() {
    this.playTone({ type: 'square', freq: 220, duration: 0.08, gain: 0.06, slide: -60 });
  }
}
