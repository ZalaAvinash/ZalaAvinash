/**
 * AUDIO — Zero-asset procedural space audio (drone + warp whoosh + UI blips)
 * Extracted for clean separation in the from-scratch version.
 */
let audioCtx = null, master = null, drone = null, droneGain = null, lastBlipTime = 0;

function initAudio() {
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    master = audioCtx.createGain();
    master.gain.value = 0.032;

    const lp = audioCtx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 880;
    master.connect(lp);
    lp.connect(audioCtx.destination);

    // Deep space drone
    drone = audioCtx.createOscillator();
    drone.type = 'sine';
    drone.frequency.value = 36;

    droneGain = audioCtx.createGain();
    droneGain.gain.value = 0.55;

    const lfo = audioCtx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.065;
    const lfoG = audioCtx.createGain();
    lfoG.gain.value = 7.5;
    lfo.connect(lfoG);
    lfoG.connect(drone.frequency);

    const df = audioCtx.createBiquadFilter();
    df.type = 'lowpass';
    df.frequency.value = 130;

    drone.connect(droneGain);
    droneGain.connect(df);
    df.connect(master);

    drone.start();
    lfo.start();
  } catch (e) {}
}

function playWarpWhoosh() {
  if (!audioCtx) return;
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    const noise = audioCtx.createBufferSource();
    const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 1.5, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buf;

    const bp = audioCtx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 380;
    bp.Q.value = 2.6;

    const g = audioCtx.createGain();
    g.gain.value = 0.0001;

    bp.frequency.setValueAtTime(380, now);
    bp.frequency.linearRampToValueAtTime(1680, now + 0.85);

    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.72, now + 0.055);
    g.gain.linearRampToValueAtTime(0.0001, now + 1.28);

    const comp = audioCtx.createDynamicsCompressor();
    noise.connect(bp); bp.connect(g); g.connect(comp); comp.connect(master);
    noise.start(now);
    setTimeout(() => { try { noise.stop(); } catch (_) {} }, 1600);
  } catch (_) {}
}

function playUIBlip(success = true) {
  if (!audioCtx || Date.now() - lastBlipTime < 55) return;
  lastBlipTime = Date.now();
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    o.type = success ? 'triangle' : 'sawtooth';
    o.frequency.value = success ? 1180 : 380;
    const g = audioCtx.createGain();
    g.gain.value = 0.55;
    const f = audioCtx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 2100;
    o.connect(g); g.connect(f); f.connect(master);
    o.start(now);
    g.gain.linearRampToValueAtTime(0.0001, now + (success ? 0.16 : 0.29));
    setTimeout(() => { try { o.stop(); } catch (_) {} }, 380);
  } catch (_) {}
}

window.initAudio = initAudio;
window.playWarpWhoosh = playWarpWhoosh;
window.playUIBlip = playUIBlip;