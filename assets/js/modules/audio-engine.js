/**
 * AUDIO ENGINE — Subtle ambient sounds, data flows, inspect tones.
 */
export class AudioEngine {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.audioEnabled = true;
    this.lastAudioTime = 0;
    this.ambientCore = null;
  }

  init() {
    if (this.audioContext) {
      if (this.audioContext.state === 'suspended') this.audioContext.resume().catch(() => {});
      return;
    }
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.035;
      this.masterGain.connect(this.audioContext.destination);
    } catch (e) {
      this.audioEnabled = false;
    }
  }

  playSoftTone(freq = 180, duration = 0.6, type = 'sine', vol = 0.6) {
    if (!this.audioEnabled || !this.audioContext || !this.masterGain) return;
    const now = this.audioContext.currentTime;
    if (now - this.lastAudioTime < 0.08) return;
    this.lastAudioTime = now;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    osc.type = type; osc.frequency.value = freq;
    filter.type = 'lowpass'; filter.frequency.value = 800;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.03);
    gain.gain.linearRampToValueAtTime(0.001, now + duration);
    osc.connect(filter); filter.connect(gain); gain.connect(this.masterGain);
    osc.start(now); osc.stop(now + duration + 0.1);
  }

  playDataFlow(vol = 0.5) {
    if (!this.audioEnabled || !this.audioContext || !this.masterGain) return;
    const now = this.audioContext.currentTime;
    if (now - this.lastAudioTime < 0.12) return;
    this.lastAudioTime = now;
    const bufferSize = this.audioContext.sampleRate * 0.7;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'bandpass'; filter.frequency.value = 220; filter.Q.value = 1.8;
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(vol * 0.7, now + 0.04);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.55);
    noise.connect(filter); filter.connect(gain); gain.connect(this.masterGain);
    noise.start(now);
  }

  playInspectSound() {
    this.playSoftTone(140, 0.45, 'sine', 0.55);
    setTimeout(() => this.playSoftTone(210, 0.35, 'sine', 0.4), 80);
  }

  playGraphConnection() {
    this.playSoftTone(95, 0.38, 'sine', 0.45);
    setTimeout(() => this.playSoftTone(145, 0.28, 'sine', 0.35), 60);
  }

  startAmbientCore() {
    if (!this.audioEnabled || !this.audioContext || !this.masterGain || this.ambientCore) return;
    const osc = this.audioContext.createOscillator(); osc.type = 'sine'; osc.frequency.value = 48;
    const lfo = this.audioContext.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.07;
    const lfoGain = this.audioContext.createGain(); lfoGain.gain.value = 1.2;
    const filter = this.audioContext.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 120;
    const gain = this.audioContext.createGain(); gain.gain.value = 0.018;
    lfo.connect(lfoGain); lfoGain.connect(osc.frequency); osc.connect(filter); filter.connect(gain); gain.connect(this.masterGain);
    lfo.start(); osc.start();
    this.ambientCore = { osc, lfo, gain };
  }

  stop() {
    if (this.ambientCore) {
      try { this.ambientCore.osc.stop(); this.ambientCore.lfo.stop(); } catch(e) {}
      this.ambientCore = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
  }
}