// Petits sons synthétisés (Web Audio) : pas de fichiers, pas de chargement.
// Silencieux si l'audio est indisponible ou pas encore débloqué par un geste.

let audio: AudioContext | null = null;

function ctx(): AudioContext | null {
  try {
    audio ??= new AudioContext();
    if (audio.state === 'suspended') void audio.resume();
    return audio;
  } catch {
    return null;
  }
}

/** Contexte audio partagé (la musique s'y branche avec son propre volume). */
export function audioContext(): AudioContext | null {
  return ctx();
}

function tone(a: AudioContext, type: OscillatorType, f0: number, f1: number, t: number, dur: number, vol: number): void {
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, t);
  osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(vol, t + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function noise(a: AudioContext, t: number, dur: number, vol: number, freq: number, freq1 = freq): void {
  const len = Math.ceil(a.sampleRate * dur);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = a.createBufferSource();
  src.buffer = buf;
  const filter = a.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 1.2;
  filter.frequency.setValueAtTime(freq, t);
  filter.frequency.exponentialRampToValueAtTime(freq1, t + dur);
  const gain = a.createGain();
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter).connect(gain).connect(a.destination);
  src.start(t);
}

/** Carillon discret : notes triangle courtes, enveloppe percussive. */
export function chime(freqs: number[]): void {
  const a = ctx();
  if (!a) return;
  freqs.forEach((f, i) => tone(a, 'triangle', f, f, a.currentTime + i * 0.07, 0.22, 0.05));
}

/** Tampon administratif : coup sourd. */
export function thud(): void {
  const a = ctx();
  if (!a) return;
  tone(a, 'sine', 140, 48, a.currentTime, 0.25, 0.22);
  noise(a, a.currentTime, 0.08, 0.12, 900);
}

/** Souffle de transition. */
export function whoosh(): void {
  const a = ctx();
  if (!a) return;
  noise(a, a.currentTime, 0.45, 0.07, 300, 2400);
}

/**
 * Travel caméra : souffle doux qui monte (aller) ou descend (retour),
 * plus discret que `whoosh`.
 */
export function swoosh(dir: 'in' | 'out' = 'in', dur = 1.1): void {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  const [f0, f1] = dir === 'in' ? [380, 1500] : [1300, 340];
  const len = Math.ceil(a.sampleRate * dur);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = a.createBufferSource();
  src.buffer = buf;
  const filter = a.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 0.9;
  filter.frequency.setValueAtTime(f0, t);
  filter.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.8);
  const gain = a.createGain();
  // enveloppe en cloche : monte avec la caméra, retombe à l'arrivée
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.035, t + dur * 0.45);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter).connect(gain).connect(a.destination);
  src.start(t);
}

/** Grésillement numérique. */
export function glitch(): void {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  for (let i = 0; i < 4; i++) tone(a, 'square', 180 + Math.random() * 900, 60 + Math.random() * 200, t + i * 0.035, 0.05, 0.035);
  noise(a, t, 0.18, 0.06, 3000, 600);
}

/** Bip de télétype (sous-titres). */
export function blip(pitch = 1): void {
  const a = ctx();
  if (!a) return;
  tone(a, 'square', 620 * pitch, 560 * pitch, a.currentTime, 0.035, 0.012);
}

/** « PLOUF ». */
export function plouf(): void {
  const a = ctx();
  if (!a) return;
  tone(a, 'sine', 520, 90, a.currentTime, 0.32, 0.18);
  noise(a, a.currentTime + 0.02, 0.35, 0.08, 1200, 300);
}
