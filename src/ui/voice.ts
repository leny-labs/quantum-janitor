// Blips de texte « façon Nintendo » (Animal Crossing, Undertale) : pendant la
// frappe, un petit son par lettre (ou toutes les n lettres), espaces et
// ponctuation muets, hauteur qui varie légèrement selon la lettre, timbre
// propre à chaque personnage. 100 % Web Audio, sur le bus des effets (sfx.ts) :
// coupé avec les effets (S / écran titre), jamais joué avant le déblocage
// audio du premier geste.
import { runningContext, sfxOut } from './sfx';

interface Voice {
  wave: OscillatorType;
  /** Fréquence de base (Hz). */
  base: number;
  /** Étendue de la variation de hauteur, en demi-tons (centrée sur la base). */
  spread: number;
  /** Une lettre sur `every` fait un blip. */
  every: number;
  /** Durée d'un blip (s). */
  dur: number;
  vol: number;
  /** Glissement de hauteur pendant le blip (rapport fréquence finale / initiale). */
  glide?: number;
  /** Passe-bas (Hz) : arrondit les ondes riches. */
  lowpass?: number;
  /** Seconde oscillation désaccordée (cents) : voix « chorus » / synthétique. */
  detune?: number;
}

const VOICES: Record<string, Voice> = {
  // Gary : voix chaude, moyenne, un peu bavarde
  gary: { wave: 'triangle', base: 233, spread: 5, every: 2, dur: 0.055, vol: 0.09, glide: 0.94 },
  // B.O.B. : bip carré de robot, grave et monocorde
  bob: { wave: 'square', base: 147, spread: 2, every: 2, dur: 0.045, vol: 0.045, glide: 0.8, lowpass: 1600 },
  // SYLVIE : IA cristalline, aiguë, chorus synthétique
  sylvie: { wave: 'sine', base: 740, spread: 7, every: 2, dur: 0.06, vol: 0.045, glide: 1.04, detune: 14 },
  // la Reine des cafards : grave, rauque, lente
  reine: { wave: 'sawtooth', base: 98, spread: 3, every: 3, dur: 0.08, vol: 0.065, glide: 0.9, lowpass: 900 },
  // narrateur : doux, discret
  narrateur: { wave: 'sine', base: 392, spread: 4, every: 3, dur: 0.05, vol: 0.045 },
};
const DEFAULT: Voice = { wave: 'triangle', base: 330, spread: 4, every: 2, dur: 0.05, vol: 0.07 };

/** Écart minimal entre deux blips (s) : une frame qui rattrape plusieurs lettres ne fait pas rafale. */
const MIN_GAP = 0.045;

/** Lettre ou chiffre (accents compris) : seuls ces caractères « parlent ». */
const VOICED = /[\p{L}\p{N}]/u;

/** Blips joués depuis le chargement (lu par tools/tap-check.ts). */
export const voiceStats = { blips: 0 };

/** Voix d'un personnage pour une réplique : appeler `char()` à chaque lettre révélée. */
export class Blipper {
  private v: Voice;
  private count = 0;
  private last = 0;

  constructor(speaker: string | null | undefined) {
    this.v = (speaker && VOICES[speaker]) || DEFAULT;
  }

  char(ch: string): void {
    if (!VOICED.test(ch)) return;
    if (this.count++ % this.v.every !== 0) return;
    const a = runningContext();
    if (!a) return;
    const t = a.currentTime;
    if (t - this.last < MIN_GAP) return;
    this.last = t;
    voiceStats.blips++;
    play(a, sfxOut(a), this.v, ch, t);
  }
}

/**
 * Rendu hors ligne d'une réplique (réglage des timbres) ; ex. dans la console de dev :
 * `(await import('/src/ui/voice.ts')).renderVoice('bob', 'Bonjour, Gary.')`.
 */
export async function renderVoice(speaker: string, text: string, cps = 32): Promise<AudioBuffer> {
  const a = new OfflineAudioContext(1, Math.ceil(44100 * (text.length / cps + 0.5)), 44100);
  const v = VOICES[speaker] ?? DEFAULT;
  let n = 0;
  [...text].forEach((ch, i) => {
    if (VOICED.test(ch) && n++ % v.every === 0) play(a, a.destination, v, ch, i / cps);
  });
  return a.startRendering();
}

function play(a: BaseAudioContext, dest: AudioNode, v: Voice, ch: string, t: number): void {
  // hauteur : déterminée par la lettre (même mot = même mélodie) + un soupçon de hasard
  const code = ch.toLowerCase().codePointAt(0) ?? 0;
  const step = ((code * 7) % (v.spread * 2 + 1)) - v.spread;
  const semis = step * 0.5 + (Math.random() - 0.5) * 0.6;
  const f0 = v.base * Math.pow(2, semis / 12);
  const out = a.createGain();
  out.gain.setValueAtTime(0, t);
  out.gain.linearRampToValueAtTime(v.vol, t + 0.004);
  out.gain.exponentialRampToValueAtTime(0.0001, t + v.dur);
  let node: AudioNode = out;
  if (v.lowpass) {
    const f = a.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = v.lowpass;
    out.connect(f);
    node = f;
  }
  node.connect(dest);
  for (const cents of v.detune ? [-v.detune, v.detune] : [0]) {
    const osc = a.createOscillator();
    osc.type = v.wave;
    osc.detune.value = cents;
    osc.frequency.setValueAtTime(f0, t);
    if (v.glide) osc.frequency.exponentialRampToValueAtTime(f0 * v.glide, t + v.dur);
    osc.connect(out);
    osc.start(t);
    osc.stop(t + v.dur + 0.02);
  }
}
