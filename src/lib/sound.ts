/**
 * Ultra-crisp synthetic audio micro-haptics using Web Audio API.
 * Zero external audio assets, sub-millisecond latency, zero-bundle overhead.
 */
let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      ctx = new AudioCtx();
    }
  }
  if (ctx && ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

/** Crisp mechanical keyboard-style micro-click (keypad, buttons) */
export function sfxClick() {
  const c = getContext();
  if (!c) return;
  try {
    const t = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(1400, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.035);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);

    osc.connect(gain);
    gain.connect(c.destination);

    osc.start(t);
    osc.stop(t + 0.038);
  } catch {}
}

/** Soft aquatic pop (tab navigation, pill selection) */
export function sfxTab() {
  const c = getContext();
  if (!c) return;
  try {
    const t = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(580, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.045);

    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);

    osc.connect(gain);
    gain.connect(c.destination);

    osc.start(t);
    osc.stop(t + 0.048);
  } catch {}
}

/** Melodic chime / celebration sparkle (milestones, no-spend checkin) */
export function sfxChime() {
  const c = getContext();
  if (!c) return;
  try {
    const t = c.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 chord
    freqs.forEach((f, idx) => {
      const osc = c.createOscillator();
      const gain = c.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(f, t + idx * 0.05);

      const noteTime = t + idx * 0.05;
      gain.gain.setValueAtTime(0.07, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.35);

      osc.connect(gain);
      gain.connect(c.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.38);
    });
  } catch {}
}
