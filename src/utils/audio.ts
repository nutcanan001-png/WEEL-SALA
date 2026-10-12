/**
 * Procedural Web Audio API sound generator.
 * Works 100% offline with zero external audio assets required.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playTickSound(volume = 0.8) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // Wood/plastic peg click sound
    osc.type = 'triangle';
    const baseFreq = 700 + Math.random() * 200;
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.045);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, ctx.currentTime);
    filter.Q.setValueAtTime(3.5, ctx.currentTime);

    const safeVol = Math.max(0, Math.min(1, volume)) * 0.7;
    gain.gain.setValueAtTime(safeVol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.045);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch {
    // Ignore audio errors on non-supported browsers
  }
}

export function playSpinStartSound(volume = 0.8) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(650, ctx.currentTime + 0.4);

    const safeVol = Math.max(0, Math.min(1, volume)) * 0.5;
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(safeVol, ctx.currentTime + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch {}
}

export function playWinFanfare(volume = 0.8) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const safeVol = Math.max(0, Math.min(1, volume));

    // Celebratory melody notes: C4, E4, G4, C5 (held)
    const notes = [
      { freq: 261.63, start: 0.00, dur: 0.12 }, // C4
      { freq: 329.63, start: 0.12, dur: 0.12 }, // E4
      { freq: 392.00, start: 0.24, dur: 0.14 }, // G4
      { freq: 523.25, start: 0.38, dur: 0.65 }, // C5
      { freq: 659.25, start: 0.55, dur: 0.75 }, // E5
    ];

    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.freq, ctx.currentTime + n.start);

      const noteVol = safeVol * 0.6;
      gain.gain.setValueAtTime(0.001, ctx.currentTime + n.start);
      gain.gain.linearRampToValueAtTime(noteVol, ctx.currentTime + n.start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + n.start + n.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + n.start);
      osc.stop(ctx.currentTime + n.start + n.dur + 0.05);
    });

    // Add bright chimes in background
    [0.4, 0.55, 0.7, 0.85].forEach((delay, idx) => {
      const chime = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      const chimeFreq = 1046.5 * (1 + idx * 0.25); // high bell tones

      chime.type = 'sine';
      chime.frequency.setValueAtTime(chimeFreq, ctx.currentTime + delay);

      chimeGain.gain.setValueAtTime(safeVol * 0.35, ctx.currentTime + delay);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.5);

      chime.connect(chimeGain);
      chimeGain.connect(ctx.destination);

      chime.start(ctx.currentTime + delay);
      chime.stop(ctx.currentTime + delay + 0.6);
    });
  } catch {}
}

export function playCheerSound(volume = 0.8) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Filtered noise buffer to simulate crowd cheer applause
    const bufferSize = ctx.sampleRate * 1.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, ctx.currentTime);
    filter.Q.setValueAtTime(1.2, ctx.currentTime);

    const gain = ctx.createGain();
    const safeVol = Math.max(0, Math.min(1, volume)) * 0.45;

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(safeVol, ctx.currentTime + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
    noise.stop(ctx.currentTime + 1.5);
  } catch {}
}

export function playClickSound(volume = 0.8) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.03);

    const safeVol = Math.max(0, Math.min(1, volume)) * 0.25;
    gain.gain.setValueAtTime(safeVol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  } catch {}
}

/**
 * Mobile & Tablet Haptic Feedback helper
 * Uses Web Vibration API when supported
 */
export function triggerHaptic(
  type: 'light' | 'medium' | 'heavy' | 'win' = 'light',
  enabled: boolean = true
) {
  if (!enabled || typeof navigator === 'undefined' || !('vibrate' in navigator)) {
    return;
  }
  try {
    switch (type) {
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(25);
        break;
      case 'heavy':
        navigator.vibrate(45);
        break;
      case 'win':
        navigator.vibrate([40, 50, 60, 50, 120]);
        break;
    }
  } catch {
    // Ignore devices that block vibration without user gesture
  }
}
