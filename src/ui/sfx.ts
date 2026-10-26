// Petits sons synthétisés (Web Audio) : pas de fichiers, pas de chargement.
// Silencieux si l'audio est indisponible ou pas encore débloqué par un geste.
// Tous les effets passent par un bus « SFX » (réglage séparé de la musique :
// touche S, option de l'écran titre, ?sfx=0, mémorisé).

let audio: AudioContext | null = null;
let bus: GainNode | null = null;
const SFX_KEY = 'qj.sfx';
const SFX_LEVEL = 1;
const listeners = new Set<(on: boolean) => void>();

function readSfx(): boolean {
  const q = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('sfx');
  if (q === '0') return false;
  if (q === '1') return true;
  try {
    return localStorage.getItem(SFX_KEY) !== '0';
  } catch {
    return true;
  }
}

let sfxOn = readSfx();

/** Sortie des effets : bus partagé, coupé quand les effets sont désactivés. */
export function sfxOut(a: AudioContext): AudioNode {
  if (!bus || bus.context !== a) {
    bus = a.createGain();
    bus.gain.value = sfxOn ? SFX_LEVEL : 0;
    bus.connect(a.destination);
  }
  return bus;
}

export function sfxEnabled(): boolean {
  return sfxOn;
}

/** Coupe / remet les effets sonores (blips de texte compris). La musique n'est pas touchée. */
export function toggleSfx(): void {
  sfxOn = !sfxOn;
  try {
    localStorage.setItem(SFX_KEY, sfxOn ? '1' : '0');
  } catch {
    /* stockage indisponible : réglage pour la session seulement */
  }
  if (bus) bus.gain.setTargetAtTime(sfxOn ? SFX_LEVEL : 0, bus.context.currentTime, 0.05);
  listeners.forEach((f) => f(sfxOn));
}

export function onSfxChange(fn: (on: boolean) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    if ((e.key === 's' || e.key === 'S') && !e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey) toggleSfx();
  });
}

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

/**
 * Contexte audio seulement s'il tourne déjà (débloqué par un geste, onglet
 * visible) : pour les sons très fréquents, qui ne doivent pas le réveiller.
 */
export function runningContext(): AudioContext | null {
  return audio && audio.state === 'running' ? audio : null;
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
  osc.connect(gain).connect(sfxOut(a));
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
  src.connect(filter).connect(gain).connect(sfxOut(a));
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

/** Couinement caoutchouteux (serpillière sur du plastique, yaourt qui proteste). */
export function squeak(): void {
  const a = ctx();
  if (!a) return;
  const f = 900 + Math.random() * 500;
  tone(a, 'sine', f, f * 1.6, a.currentTime, 0.09, 0.07);
  tone(a, 'triangle', f * 1.5, f * 1.1, a.currentTime + 0.05, 0.07, 0.04);
}

/** « Splotch » : quelque chose de mou qui se décolle et tombe. */
export function splat(): void {
  const a = ctx();
  if (!a) return;
  tone(a, 'sine', 320, 70, a.currentTime, 0.22, 0.16);
  noise(a, a.currentTime, 0.16, 0.09, 700, 200);
}

/** Bip de lecteur de badge. */
export function beep(f = 1250): void {
  const a = ctx();
  if (!a) return;
  tone(a, 'square', f, f, a.currentTime, 0.1, 0.035);
}

/** Aspiration (B.O.B. avale) : souffle qui monte, petit sifflet. */
export function slurp(): void {
  const a = ctx();
  if (!a) return;
  noise(a, a.currentTime, 0.4, 0.09, 400, 3200);
  tone(a, 'sine', 300, 900, a.currentTime + 0.05, 0.3, 0.05);
}

/** Arc électrique : bzz grave et grésillement. */
export function buzz(): void {
  const a = ctx();
  if (!a) return;
  tone(a, 'sawtooth', 110, 90, a.currentTime, 0.32, 0.06);
  noise(a, a.currentTime, 0.25, 0.1, 4000, 1500);
}

/** Extinction : « bzzouiiip » qui s'effondre. */
export function powerDown(): void {
  const a = ctx();
  if (!a) return;
  tone(a, 'square', 520, 40, a.currentTime, 0.5, 0.04);
  tone(a, 'sine', 260, 30, a.currentTime, 0.55, 0.12);
}

/** Mâchouillage : croc humide, hauteur un peu au hasard. */
export function crunch(): void {
  const a = ctx();
  if (!a) return;
  noise(a, a.currentTime, 0.09, 0.1, 2200 + Math.random() * 800, 900);
  tone(a, 'sine', 180 + Math.random() * 60, 90, a.currentTime, 0.12, 0.08);
}

/** Grincement de spirale métallique qui force d'un cran (`back` : elle se revisse). */
export function creak(back = false): void {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  const [f0, f1] = back ? [420, 260] : [260, 420];
  for (let i = 0; i < 3; i++) tone(a, 'sawtooth', f0 + i * 30, f1 + i * 30, t + i * 0.09, 0.08, 0.025);
  noise(a, t, 0.3, 0.05, 2600, 1400);
}
