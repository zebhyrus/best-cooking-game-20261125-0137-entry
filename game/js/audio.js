// Sizzle Rush audio: every sound is synthesized live with WebAudio, so the
// game ships no audio files and makes no network request. All calls are safe
// before the audio context exists (headless runs, muted tabs).
export function createAudio() {
  let ctx = null;
  let sizzleNodes = null;
  let muted = false;

  function ensure() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      return ctx;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    } catch {
      return null;
    }
    return ctx;
  }

  function tone(freq, dur, type, vol, slideTo) {
    const c = ensure();
    if (!c || muted) return;
    try {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, c.currentTime);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + dur);
      gain.gain.setValueAtTime(vol, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
      osc.connect(gain).connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + dur);
    } catch { /* sound is decoration, never a crash */ }
  }

  function noiseBurst(dur, vol, lowpass) {
    const c = ensure();
    if (!c || muted) return;
    try {
      const len = Math.floor(c.sampleRate * dur);
      const buf = c.createBuffer(1, len, c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = c.createBufferSource();
      src.buffer = buf;
      const filter = c.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = lowpass;
      const gain = c.createGain();
      gain.gain.value = vol;
      src.connect(filter).connect(gain).connect(c.destination);
      src.start();
    } catch { /* ignore */ }
  }

  return {
    unlock() { ensure(); },
    toggleMute() { muted = !muted; return muted; },
    get muted() { return muted; },
    chop() { noiseBurst(0.08, 0.5, 900); tone(180, 0.07, 'square', 0.12, 90); },
    pickup() { tone(520, 0.08, 'sine', 0.15, 700); },
    place() { tone(300, 0.09, 'triangle', 0.18, 210); },
    ding() { tone(880, 0.35, 'sine', 0.22); tone(1318, 0.45, 'sine', 0.15); },
    fail() { tone(220, 0.3, 'sawtooth', 0.14, 110); },
    alarm() { tone(660, 0.16, 'square', 0.1, 660); tone(520, 0.16, 'square', 0.1, 520); },
    burn() { noiseBurst(0.25, 0.3, 500); tone(140, 0.3, 'sawtooth', 0.12, 70); },
    win() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.3, 'triangle', 0.2), i * 130)); },
    sizzleStart() {
      const c = ensure();
      if (!c || muted || sizzleNodes) return;
      try {
        const len = c.sampleRate;
        const buf = c.createBuffer(1, len, c.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
        const src = c.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        const filter = c.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 4200;
        filter.Q.value = 0.6;
        const gain = c.createGain();
        gain.gain.value = 0.05;
        src.connect(filter).connect(gain).connect(c.destination);
        src.start();
        sizzleNodes = { src, gain };
      } catch { /* ignore */ }
    },
    sizzleStop() {
      if (!sizzleNodes) return;
      try { sizzleNodes.src.stop(); } catch { /* ignore */ }
      sizzleNodes = null;
    },
  };
}
