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

function tone(a: AudioContext, type: OscillatorType, f0: number, f1: number, t: number, dur: number, vol: number, out: AudioNode = sfxOut(a)): void {
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, t);
  osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(vol, t + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(out);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function noise(a: AudioContext, t: number, dur: number, vol: number, freq: number, freq1 = freq, out: AudioNode = sfxOut(a)): void {
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
  src.connect(filter).connect(gain).connect(out);
  src.start(t);
}

/** Carillon discret : notes triangle courtes, enveloppe percussive. */
export function chime(freqs: number[]): void {
  const a = ctx();
  if (!a) return;
  freqs.forEach((f, i) => tone(a, 'triangle', f, f, a.currentTime + i * 0.07, 0.22, 0.05));
}

// ── Effets papillon : harpe / célesta cosmique ──────────────────────────────
// Glissando rapide sur un accord lydien / maj9, timbre de cloche FM douce
// (sinus modulé + partiel inharmonique bref), deux voix légèrement désaccordées
// et écartées en stéréo, un voile de souffle aigu et une courte queue d'écho
// filtrée. Tout le graphe est temporaire : les sources s'arrêtent seules et la
// boucle d'écho est déconnectée une fois éteinte.

const midiHz = (m: number): number => 440 * 2 ** ((m - 69) / 12);
const pick = <T>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)];

/** Panoramique stéréo si disponible, sinon simple passe-plat. */
function panner(a: AudioContext, pan: number): AudioNode {
  if (typeof a.createStereoPanner !== 'function') return a.createGain();
  const p = a.createStereoPanner();
  p.pan.value = pan;
  return p;
}

/** Une note de cloche FM : deux porteuses désaccordées (±cents) gauche / droite. */
function bellNote(a: AudioContext, out: AudioNode, f: number, t: number, dur: number, vol: number): void {
  const end = t + dur;
  // enveloppe d'amplitude : attaque douce (pas de clic), décroissance exponentielle
  const env = a.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(vol, t + 0.012);
  env.gain.exponentialRampToValueAtTime(0.0001, end);
  env.connect(out);

  // modulateur partagé : index qui retombe vite → attaque cristalline, queue ronde
  const mod = a.createOscillator();
  mod.frequency.value = f * 4;
  const modGain = a.createGain();
  modGain.gain.setValueAtTime(f * 1.1, t);
  modGain.gain.exponentialRampToValueAtTime(f * 0.04, t + 0.18);
  mod.connect(modGain);
  mod.start(t);
  mod.stop(end + 0.02);

  for (const [cents, pan] of [[-6, -0.45], [6, 0.45]] as const) {
    const car = a.createOscillator();
    car.frequency.value = f;
    car.detune.value = cents;
    modGain.connect(car.frequency);
    const half = a.createGain();
    half.gain.value = 0.5;
    car.connect(half).connect(panner(a, pan)).connect(env);
    car.start(t);
    car.stop(end + 0.02);
  }

  // partiel inharmonique (×2,76, façon lame de célesta) : très bref et discret
  const part = a.createOscillator();
  part.frequency.value = f * 2.76;
  const pg = a.createGain();
  pg.gain.setValueAtTime(0, t);
  pg.gain.linearRampToValueAtTime(vol * 0.18, t + 0.006);
  pg.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(0.22, dur));
  part.connect(pg).connect(out);
  part.start(t);
  part.stop(t + Math.min(0.22, dur) + 0.02);
}

/** Voile de poussière d'étoiles : bruit passe-haut, à peine audible. */
function shimmer(a: AudioContext, out: AudioNode, t: number, dur: number, vol: number): void {
  const len = Math.ceil(a.sampleRate * dur);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = a.createBufferSource();
  src.buffer = buf;
  const hp = a.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 7000;
  const g = a.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + dur * 0.3);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(hp).connect(g).connect(out);
  src.start(t);
  src.stop(t + dur + 0.02);
}

/**
 * Joue un glissando cosmique : `notes` en demi-tons au-dessus de `root` (MIDI),
 * espacées de `gap` s. Retourne immédiatement ; le graphe se nettoie seul.
 */
function cosmicHarp(notes: readonly number[], root: number, gap: number, opts: { dur: number; vol: number; shimmer: number }): void {
  const a = ctx();
  if (!a) return;
  const out = sfxOut(a);
  const t0 = a.currentTime + 0.01;

  // bus du son : sec → sortie, et envoi vers un écho court filtré
  const dry = a.createGain();
  dry.gain.value = 1;
  dry.connect(out);
  const send = a.createGain();
  send.gain.value = 0.32;
  const delay = a.createDelay(0.5);
  delay.delayTime.value = 0.13;
  const lp = a.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 2600;
  const fb = a.createGain();
  fb.gain.value = 0.3;
  const wet = a.createGain();
  wet.gain.value = 0.6;
  dry.connect(send).connect(delay).connect(lp);
  lp.connect(fb).connect(delay);
  lp.connect(panner(a, 0.25)).connect(wet).connect(out);

  let last = t0;
  notes.forEach((n, i) => {
    // léger flottement rythmique, comme une main sur les cordes
    const t = t0 + i * gap + (i ? (Math.random() - 0.5) * 0.008 : 0);
    // les notes aiguës un peu plus courtes et plus douces (perception)
    const dur = opts.dur * (1 - i * 0.06);
    bellNote(a, dry, midiHz(root + n), t, dur, opts.vol * (1 - i * 0.08));
    last = Math.max(last, t + dur);
  });
  shimmer(a, dry, t0, (last - t0) * 0.8, opts.shimmer);

  // queue d'écho : 0,3 de feedback → −30 dB après ~6 répétitions (< 1 s)
  const tailMs = (last - a.currentTime + 0.9) * 1000;
  setTimeout(() => {
    for (const node of [dry, send, delay, lp, fb, wet]) node.disconnect();
  }, tailMs);
}

/** Effet papillon : un flag posé, quelque chose se débloque (lydien suspendu). */
export function unlockCue(): void {
  // Gmaj7♯11 ouvert (G D F♯ C♯) : flottant, interrogatif, qui « s'ouvre »
  const voicings = [
    [0, 7, 11, 18],
    [0, 7, 11, 16, 18],
    [0, 4, 11, 18],
  ] as const;
  cosmicHarp(pick(voicings), 67 + pick([-2, 0, 3]), 0.045, { dur: 0.6, vol: 0.028, shimmer: 0.005 });
}

/** Effet papillon : objet obtenu (maj9 qui monte plus haut, plus brillant). */
export function pickupCue(): void {
  // Cmaj9 en arpège montant jusqu'à la 9e / 13e de l'octave au-dessus
  const voicings = [
    [0, 4, 7, 11, 14],
    [0, 7, 11, 14, 19],
    [0, 4, 11, 14, 21],
  ] as const;
  cosmicHarp(pick(voicings), 72 + pick([-1, 0, 2]), 0.038, { dur: 0.55, vol: 0.026, shimmer: 0.007 });
}

if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as unknown as { qjSfx: unknown }).qjSfx = { unlockCue, pickupCue, chime, riftCue, stampClonk, distantPlouf };
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

// ── Transitions de chapitre (docs/CHAPTERS.md §2) ───────────────────────────

/**
 * Faille : long souffle qui s'ouvre puis glissando descendant de harpe cosmique
 * (même synthé que les effets papillon) — fin de chapitre / aspiration.
 */
export function riftCue(): void {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  noise(a, t, 1.6, 0.09, 180, 3600);
  noise(a, t + 0.5, 1.2, 0.05, 5200, 400);
  tone(a, 'sine', 55, 38, t, 1.8, 0.12);
  // lydien qui se défait vers le grave, notes espacées, longues
  cosmicHarp([24, 21, 18, 14, 11, 7, 2, 0], 55, 0.11, { dur: 1.2, vol: 0.032, shimmer: 0.012 });
}

/** « CLONK » de tampon administratif : choc mat, bois et métal, petit rebond. */
export function stampClonk(): void {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  tone(a, 'sine', 180, 42, t, 0.32, 0.3);
  tone(a, 'square', 95, 60, t, 0.07, 0.08);
  noise(a, t, 0.06, 0.22, 1800, 600);
  noise(a, t + 0.004, 0.18, 0.06, 4200, 2600);
  // rebond du manche
  tone(a, 'triangle', 760, 690, t + 0.09, 0.08, 0.03);
  noise(a, t + 0.11, 0.04, 0.05, 2400, 1200);
}

/** « PLOUF » lointain : le seau, dans une autre dimension (carte d'acte). */
export function distantPlouf(): void {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  tone(a, 'sine', 380, 70, t, 0.5, 0.08);
  noise(a, t + 0.03, 0.6, 0.035, 700, 180);
  cosmicHarp([0, 7, 14], 62, 0.16, { dur: 0.9, vol: 0.016, shimmer: 0.004 });
}

const footLog: string[] = [];

/**
 * Pas sur le lino (marche du Couloir Infini B) : talon mat (sine grave) + frottement de semelle
 * (bruit court filtré), puis la pointe du pied juste après. `side` -1 / 1 = pied gauche / droit
 * (léger panoramique), pitch un peu aléatoire pour que deux pas ne sonnent jamais pareil.
 */
export function footstep(side: -1 | 1 = 1, vol = 1): void {
  if (import.meta.env.DEV) {
    footLog.push(side < 0 ? 'L' : 'R');
    console.debug(`[sfx] footstep ${side < 0 ? 'L' : 'R'} #${footLog.length}`);
  }
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  const out = a.createStereoPanner();
  out.pan.value = side * 0.22;
  out.connect(sfxOut(a));
  const p = 0.9 + Math.random() * 0.22;
  // talon
  tone(a, 'sine', 125 * p, 52 * p, t, 0.14, 0.2 * vol, out);
  noise(a, t, 0.05, 0.16 * vol, 1300 * p, 500 * p, out);
  // semelle qui frotte puis pointe du pied
  noise(a, t + 0.02, 0.09, 0.05 * vol, 2600 * p, 1500 * p, out);
  noise(a, t + 0.075, 0.035, 0.08 * vol, 1800 * p, 900 * p, out);
  tone(a, 'sine', 160 * p, 80 * p, t + 0.075, 0.06, 0.06 * vol, out);
}

if (import.meta.env.DEV && typeof window !== 'undefined') {
  Object.assign((window as unknown as { qjSfx: object }).qjSfx, { footstep, footLog });
}

// ── Props physiques (engine/propSfx.ts) : un son à CHAQUE actionnement ──────
// Volontairement plus forts et plus « médium » que le thud : audibles sur des
// haut-parleurs de portable (peu de graves), toujours via le bus SFX (réglage S / mute).

/** Petit bouton : clic sec à l'enfoncement + relâchement plus léger. */
export function click(): void {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  noise(a, t, 0.035, 0.42, 3800, 2200);
  tone(a, 'square', 1900, 1100, t, 0.03, 0.07);
  tone(a, 'sine', 420, 180, t, 0.07, 0.16);
  // relâchement
  noise(a, t + 0.085, 0.025, 0.22, 5200, 3400);
  tone(a, 'square', 2400, 1800, t + 0.085, 0.02, 0.035);
}

/** Gros bouton (STABILISER, distributeur) : « CLONK » massif et métallique. */
export function clonk(): void {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  tone(a, 'sine', 240, 62, t, 0.32, 0.4);
  tone(a, 'square', 150, 85, t, 0.09, 0.12);
  tone(a, 'triangle', 980, 860, t, 0.16, 0.06);
  noise(a, t, 0.09, 0.4, 1600, 500);
  noise(a, t + 0.004, 0.05, 0.2, 4500, 3000);
  // ressort du bouton qui remonte
  noise(a, t + 0.17, 0.03, 0.18, 3000, 2000);
  tone(a, 'square', 700, 520, t + 0.17, 0.03, 0.04);
}

/** Levier : crans de cliquet puis « chunk » en butée. */
export function lever(): void {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  for (let i = 0; i < 4; i++) {
    noise(a, t + i * 0.04, 0.02, 0.26, 2800 - i * 180, 1800);
    tone(a, 'square', 1300 - i * 90, 900, t + i * 0.04, 0.015, 0.035);
  }
  const c = t + 0.18;
  tone(a, 'sine', 190, 52, c, 0.26, 0.38);
  tone(a, 'square', 120, 70, c, 0.08, 0.1);
  noise(a, c, 0.1, 0.38, 1100, 380);
  noise(a, c + 0.003, 0.04, 0.16, 4200, 2600);
}

/** Cran de molette (roue du carnet) : tout petit « tic » sec, ne réveille pas l'audio. */
export function tick(): void {
  const a = runningContext();
  if (!a) return;
  const t = a.currentTime;
  noise(a, t, 0.014, 0.12, 3600, 2400);
  tone(a, 'square', 1500, 1100, t, 0.012, 0.018);
}

/** Écran tactile (navigateur, borne) : tap + double bip montant. */
export function touchBeep(): void {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  noise(a, t, 0.02, 0.18, 4800, 3600);
  tone(a, 'square', 1320, 1320, t + 0.005, 0.06, 0.06);
  tone(a, 'sine', 1320, 1320, t + 0.005, 0.07, 0.1);
  tone(a, 'square', 1760, 1760, t + 0.075, 0.08, 0.06);
  tone(a, 'sine', 1760, 1760, t + 0.075, 0.09, 0.1);
}

/** Clic dans le vide (hors tension, refusé) : clic sec puis petit « bonk » mort. */
export function dud(): void {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime;
  noise(a, t, 0.03, 0.4, 3200, 1800);
  tone(a, 'square', 1500, 900, t, 0.025, 0.06);
  tone(a, 'square', 170, 120, t + 0.06, 0.13, 0.07);
  tone(a, 'sine', 170, 110, t + 0.06, 0.14, 0.16);
}

const PROP_SOUNDS: Record<'click' | 'clonk' | 'lever' | 'beep' | 'dud', () => void> = { click, clonk, lever, beep: touchBeep, dud };
const propLog: string[] = [];

/** Joue le bruitage d'un prop (nom résolu par engine/propSfx.ts). */
export function propSound(name: keyof typeof PROP_SOUNDS, id = ''): void {
  if (import.meta.env.DEV) {
    propLog.push(`${id}:${name}`);
    console.debug(`[sfx] ${id} → ${name}`);
  }
  PROP_SOUNDS[name]();
}

if (import.meta.env.DEV && typeof window !== 'undefined') {
  Object.assign((window as unknown as { qjSfx: object }).qjSfx, { click, clonk, lever, touchBeep, dud, propLog });
}
