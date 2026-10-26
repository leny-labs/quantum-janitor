// Musique d'ambiance : jazz cartoon de point & click, 100 % synthétisé en Web
// Audio (aucun fichier, aucun sample). Composition originale : grilles,
// mélodies et arrangements écrits ici ; basse walking, comp et chorus
// improvisés sont générés à la volée (graine fixe → mêmes variations à
// chaque partie).
//
// Un petit séquenceur planifie une mesure d'avance sur AudioContext.currentTime.
// Chaque thème est joué par une « platine » (gain propre) : changer de thème
// fait un fondu enchaîné. Démarre au premier geste (politique autoplay),
// coupure persistante (localStorage), touche M, `?music=0`.
import { audioContext } from './sfx';

// ── écriture ─────────────────────────────────────────────────────────────

/** Note de mélodie : [croche de départ 0-7, note, durée en croches]. */
type Mel = [e: number, note: string, len: number];

interface Tune {
  /** Une chaîne par mesure : un accord, ou deux (une demi-mesure chacun). */
  bars: string[];
  melody: Mel[][];
  /** Tonique grave (MIDI) pour la basse pédale. */
  tonic: number;
}

/**
 * Thème d'exploration « Lounge du Secteur C » (ré mineur, 16 mesures AB).
 * Un walking lounge un peu bancal : demi-tons de travers, #11 et b9 partout.
 */
const LOUNGE: Tune = {
  tonic: 38,
  bars: [
    'Dm9', 'Ebmaj7#11', 'Dm9', 'E7#9 A7b13', 'Gm9', 'C13', 'Fmaj9 Bb7', 'E7 A7',
    'Bbmaj7', 'A7alt', 'Dm9', 'Db7#11', 'Cm9 F13', 'Bbmaj9', 'Em7b5 A7b9', 'Dm6',
  ],
  melody: [
    [[1, 'A4', 1], [2, 'C5', 1], [3, 'E5', 3], [7, 'D5', 1]],
    [[0, 'D5', 2], [2, 'Bb4', 1], [3, 'A4', 3]],
    [[1, 'F4', 1], [2, 'A4', 1], [3, 'C5', 1], [4, 'E5', 1], [5, 'F5', 2]],
    [[0, 'G5', 1], [1, 'E5', 1], [2, 'D5', 1], [3, 'B4', 1], [4, 'C#5', 2], [6, 'Bb4', 2]],
    [[0, 'A4', 3], [3, 'Bb4', 1], [4, 'D5', 1], [5, 'F5', 3]],
    [[0, 'E5', 2], [2, 'D5', 1], [3, 'A4', 1], [4, 'Bb4', 4]],
    [[1, 'G4', 1], [2, 'A4', 1], [3, 'C5', 1], [4, 'Ab4', 2], [6, 'F4', 1], [7, 'D4', 1]],
    [[0, 'E4', 1], [1, 'G#4', 1], [2, 'B4', 1], [3, 'D5', 1], [4, 'C#5', 3]],
    [[0, 'D5', 3], [3, 'C5', 1], [4, 'A4', 2], [6, 'F4', 2]],
    [[0, 'G4', 1], [1, 'Bb4', 1], [2, 'C#5', 1], [3, 'F5', 3]],
    [[0, 'E5', 4], [5, 'D5', 1], [6, 'A4', 2]],
    [[1, 'F4', 1], [2, 'Ab4', 1], [3, 'B4', 1], [4, 'G5', 2], [6, 'F5', 2]],
    [[0, 'Eb5', 2], [2, 'D5', 1], [3, 'Bb4', 1], [4, 'D5', 2], [6, 'C5', 2]],
    [[0, 'A4', 6]],
    [[0, 'G4', 1], [1, 'Bb4', 1], [2, 'D5', 2], [4, 'C#5', 1], [5, 'E5', 1], [6, 'G5', 2]],
    [[0, 'F5', 1], [1, 'E5', 1], [2, 'D5', 3]],
  ],
};

/** Thème de titre « Klepsydra Swing » (fa majeur) : fanfare de poche, cuivre bouché. */
const TITLE: Tune = {
  tonic: 41,
  bars: [
    'Fmaj7 D7', 'Gm7 C7', 'Am7 D7b9', 'Gm7 C7', 'F7', 'Bb7', 'Bdim7', 'F6 D7',
    'Gm7', 'C7', 'Am7 Abdim7', 'Gm7 C7', 'F6 D7', 'Gm7 C7#5', 'Fmaj7 Db7', 'C7 F6',
  ],
  melody: [
    [[0, 'C5', 1], [1, 'A4', 1], [2, 'C5', 1], [3, 'F5', 1], [4, 'F#5', 2], [6, 'D5', 1], [7, 'C5', 1]],
    [[0, 'Bb4', 2], [2, 'D5', 1], [3, 'G4', 1], [4, 'E5', 3]],
    [[0, 'C5', 1], [1, 'E5', 1], [2, 'G5', 2], [4, 'F#5', 1], [5, 'Eb5', 1], [6, 'C5', 2]],
    [[0, 'D5', 3], [4, 'Bb4', 1], [5, 'G4', 1], [6, 'E4', 2]],
    [[1, 'A4', 1], [2, 'C5', 1], [3, 'Eb5', 3], [6, 'D5', 1], [7, 'C5', 1]],
    [[0, 'D5', 2], [2, 'Ab4', 2], [4, 'F4', 4]],
    [[0, 'B4', 1], [1, 'D5', 1], [2, 'F5', 1], [3, 'Ab5', 3], [6, 'G5', 2]],
    [[0, 'F5', 2], [2, 'C5', 2], [4, 'A4', 1], [5, 'F#4', 3]],
    [[0, 'G4', 1], [1, 'Bb4', 1], [2, 'D5', 1], [3, 'F5', 3], [6, 'E5', 2]],
    [[0, 'E5', 3], [3, 'Db5', 1], [4, 'C5', 2], [6, 'Bb4', 2]],
    [[0, 'C5', 2], [2, 'E5', 2], [4, 'D5', 2], [6, 'B4', 2]],
    [[0, 'Bb4', 1], [1, 'A4', 1], [2, 'G4', 2], [4, 'E4', 2], [6, 'G4', 2]],
    [[0, 'A4', 3], [3, 'F4', 1], [4, 'F#4', 1], [5, 'A4', 1], [6, 'C5', 2]],
    [[0, 'Bb4', 2], [2, 'D5', 2], [4, 'E5', 1], [5, 'G#5', 3]],
    [[0, 'A5', 3], [4, 'Ab5', 2], [6, 'F5', 2]],
    [[0, 'G5', 1], [1, 'E5', 1], [2, 'C5', 1], [3, 'Bb4', 1], [4, 'A4', 4]],
  ],
};

type Inst = 'bass' | 'vibes' | 'rhodes' | 'horn' | 'clari' | 'piano' | 'theremin' | 'ride' | 'brush' | 'hat' | 'kick' | 'rim';

interface Arrangement {
  tune: Tune;
  bpm: number;
  /** Place de la croche « swinguée » dans le temps (0.5 = droit, 0.66 = ternaire). */
  swing: number;
  lead: Inst;
  leadOct: number;
  /** Second soliste : chorus improvisé, puis réponse au thème. */
  counter: Inst;
  counterOct: number;
  comp: Inst;
  compStyle: 'charleston' | 'pads' | 'stabs';
  drums: 'ride' | 'brushes' | 'soft' | 'sparse';
  bass: 'walk' | 'two' | 'pedal';
  /** Coupure du passe-bas général (Hz) : plus bas = plus feutré. */
  tone: number;
  level: number;
}

/**
 * Thèmes : un thème de titre, un thème d'exploration décliné par pièce
 * (même grille, autre orchestration). Un gros plan garde le thème de sa pièce.
 */
const THEMES = {
  /** Écran titre / intro : version pleine, cuivre bouché + vibraphone + piano bastringue. */
  title: { tune: TITLE, bpm: 120, swing: 0.62, lead: 'horn', leadOct: 0, counter: 'vibes', counterOct: 0, comp: 'piano', compStyle: 'stabs', drums: 'ride', bass: 'walk', tone: 9000, level: 1 },
  /** Couloir : walking lounge, vibraphone devant, balais. */
  couloir: { tune: LOUNGE, bpm: 108, swing: 0.66, lead: 'vibes', leadOct: 0, counter: 'horn', counterOct: 0, comp: 'rhodes', compStyle: 'charleston', drums: 'brushes', bass: 'walk', tone: 6500, level: 0.9 },
  /** Placard : version feutrée, Rhodes et clarinette, basse en blanches. */
  placard: { tune: LOUNGE, bpm: 92, swing: 0.66, lead: 'rhodes', leadOct: 0, counter: 'clari', counterOct: -12, comp: 'rhodes', compStyle: 'pads', drums: 'soft', bass: 'two', tone: 2600, level: 0.85 },
  /** Labo : même grille, tendue — basse pédale, clarinette grave, thérémine. */
  labo: { tune: LOUNGE, bpm: 100, swing: 0.64, lead: 'clari', leadOct: -12, counter: 'theremin', counterOct: 0, comp: 'vibes', compStyle: 'pads', drums: 'sparse', bass: 'pedal', tone: 4500, level: 0.85 },
  /** Cliffhanger : le thème du titre au ralenti, vibraphone seul devant. */
  fin: { tune: TITLE, bpm: 92, swing: 0.66, lead: 'vibes', leadOct: 0, counter: 'rhodes', counterOct: 0, comp: 'rhodes', compStyle: 'charleston', drums: 'brushes', bass: 'two', tone: 3800, level: 0.8 },
} satisfies Record<string, Arrangement>;

export type ThemeId = keyof typeof THEMES;

/** Thème d'une scène YAML (les gros plans suivent leur pièce hôte). */
const SCENE_THEME: Record<string, ThemeId> = { placard: 'placard', couloir: 'couloir', labo: 'labo', panneau: 'labo' };
export function themeForScene(id: string): ThemeId {
  return SCENE_THEME[id] ?? 'couloir';
}

// ── solfège ──────────────────────────────────────────────────────────────

const PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const acc = (s: string) => (s === '#' ? 1 : s === 'b' ? -1 : 0);

function midi(note: string): number {
  const m = /^([A-G])([b#]?)(-?\d)$/.exec(note);
  if (!m) throw new Error(`[music] note illisible « ${note} »`);
  return 12 * (Number(m[3]) + 1) + PC[m[1]] + acc(m[2]);
}

const hz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

/** Qualités d'accord : voicing sans fondamentale (comp) et notes de l'accord (basse, chorus). */
const QUAL: Record<string, { v: number[]; t: number[] }> = {
  m9: { v: [3, 7, 10, 14], t: [3, 7, 10] },
  m7: { v: [3, 7, 10, 14], t: [3, 7, 10] },
  m6: { v: [3, 7, 9, 14], t: [3, 7, 9] },
  m7b5: { v: [3, 6, 10, 15], t: [3, 6, 10] },
  maj7: { v: [4, 7, 11, 14], t: [4, 7, 11] },
  maj9: { v: [4, 7, 11, 14], t: [4, 7, 11] },
  'maj7#11': { v: [4, 6, 11, 14], t: [4, 7, 11] },
  '6': { v: [4, 7, 9, 14], t: [4, 7, 9] },
  '7': { v: [4, 7, 10, 14], t: [4, 7, 10] },
  '13': { v: [4, 10, 14, 21], t: [4, 7, 10] },
  '7b9': { v: [4, 10, 13, 19], t: [4, 7, 10] },
  '7#9': { v: [4, 10, 15, 19], t: [4, 7, 10] },
  '7alt': { v: [4, 10, 13, 20], t: [4, 8, 10] },
  '7#11': { v: [4, 10, 14, 18], t: [4, 7, 10] },
  '7b13': { v: [4, 10, 14, 20], t: [4, 7, 10] },
  '7#5': { v: [4, 8, 10, 14], t: [4, 8, 10] },
  dim7: { v: [3, 6, 9, 12], t: [3, 6, 9] },
};

interface Chord {
  root: number;
  v: number[];
  t: number[];
}

const chordCache = new Map<string, Chord>();
function chord(name: string): Chord {
  let c = chordCache.get(name);
  if (!c) {
    const m = /^([A-G])([b#]?)(.*)$/.exec(name);
    const q = m && QUAL[m[3]];
    if (!m || !q) throw new Error(`[music] accord inconnu « ${name} »`);
    c = { root: (PC[m[1]] + acc(m[2]) + 12) % 12, ...q };
    chordCache.set(name, c);
  }
  return c;
}

/** Accords d'une mesure avec leur temps de départ (en noires). */
function barChords(tune: Tune, bar: number): { c: Chord; at: number; len: number }[] {
  const names = tune.bars[((bar % tune.bars.length) + tune.bars.length) % tune.bars.length].split(' ');
  const len = 4 / names.length;
  return names.map((n, i) => ({ c: chord(n), at: i * len, len }));
}

/** Hauteur de classe `pc` la plus proche de `near` dans [lo, hi]. */
function nearest(pc: number, near: number, lo: number, hi: number): number {
  let best = lo + ((pc - lo) % 12 + 12) % 12;
  for (let m = best; m <= hi; m += 12) if (Math.abs(m - near) < Math.abs(best - near)) best = m;
  return best;
}

/** PRNG déterministe (mulberry32) : les « improvisations » reviennent identiques. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── génération d'une mesure ──────────────────────────────────────────────

interface Ev {
  /** Départ en noires depuis le début de la mesure. */
  t: number;
  /** Durée en noires. */
  d: number;
  inst: Inst;
  m: number;
  v: number;
}

const RHYTHMS = [[0, 1, 2, 3], [1, 2, 4, 5, 6], [0, 3, 4], [2, 3, 5, 6, 7], [0, 2, 3], [4, 5, 6, 7], [1, 3, 5], [], [0, 1, 2, 3, 4, 5]];
const COMP_RHYTHMS = [[0, 3], [0, 3], [0, 5], [1, 4], [0, 3, 6], [3, 7]];

/**
 * Forme sur 4 passages de 16 mesures (64 mesures avant de boucler) :
 *   0 = thème, 1 = chorus improvisé du second soliste,
 *   2 = thème en question/réponse, 3 = version dépouillée (fragments + relances).
 */
function barEvents(arr: Arrangement, bar: number, prevBass: number): { evs: Ev[]; lastBass: number } {
  const tune = arr.tune;
  const n = tune.bars.length;
  const form = bar % n;
  const pass = Math.floor(bar / n) % 4;
  const r = rng(bar * 7919 + 13);
  const e2b = (e: number) => Math.floor(e / 2) + (e % 2 ? arr.swing : 0);
  const evs: Ev[] = [];
  const chords = barChords(tune, bar);
  const nextRoot = barChords(tune, bar + 1)[0].c.root;

  // ── basse ──
  let last = prevBass;
  const bass = (t: number, d: number, pc: number, v: number) => {
    last = nearest(pc, last, 33, 52);
    evs.push({ t, d, inst: 'bass', m: last, v });
  };
  if (arr.bass === 'pedal') {
    const tonic = tune.tonic % 12;
    bass(0, 1.5, tonic, 0.9);
    bass(e2b(3), 0.3, tonic + 1, 0.5);
    bass(2, 1, tonic, 0.8);
    bass(3, 1, chords[chords.length - 1].c.root, 0.7);
  } else if (arr.bass === 'two') {
    for (const { c, at, len } of chords) {
      bass(at, Math.min(2, len) * 0.95, c.root, 0.9);
      if (len > 2) bass(at + 2, 1.9, (c.root + (r() < 0.6 ? 7 : c.t[0])) % 12, 0.75);
    }
  } else {
    chords.forEach(({ c, at, len }, i) => {
      const target = i + 1 < chords.length ? chords[i + 1].c.root : nextRoot;
      for (let k = 0; k < len; k++) {
        let pc: number;
        if (k === 0) pc = c.root;
        else if (k === len - 1) pc = target + (r() < 0.5 ? 1 : -1) + (r() < 0.2 ? 6 : 0);
        else pc = c.root + c.t[Math.floor(r() * c.t.length)];
        bass(at + k, 0.92, (pc + 24) % 12, k % 2 ? 0.72 : 0.9);
        // croche fantôme swinguée de temps en temps
        if (k === len - 2 && r() < 0.18) evs.push({ t: at + k + arr.swing, d: 0.25, inst: 'bass', m: last, v: 0.4 });
      }
    });
  }

  // ── comp ──
  const voicing = (c: Chord) => {
    let root = 48 + c.root;
    if (root > 55) root -= 12;
    return c.v.map((i) => root + i);
  };
  const hit = (t: number, d: number, c: Chord, v: number) => voicing(c).forEach((m, i) => evs.push({ t: t + i * 0.012, d, inst: arr.comp, m, v: v * (i === 3 ? 0.85 : 1) }));
  if (arr.compStyle === 'pads') {
    for (const { c, at, len } of chords) hit(at, len * 0.96, c, 0.55);
  } else if (arr.compStyle === 'stabs') {
    for (const { c, at, len } of chords) {
      const es = len > 2 ? (r() < 0.5 ? [0, 3, 7] : [0, 3, 5]) : [0, r() < 0.5 ? 3 : 1];
      for (const e of es) if (e2b(e) < len) hit(at + e2b(e), 0.3, c, e ? 0.6 : 0.8);
      evs.push({ t: at, d: 0.4, inst: arr.comp, m: 36 + c.root, v: 0.5 });
    }
  } else {
    if (chords.length === 1) {
      const pat = COMP_RHYTHMS[Math.floor(r() * COMP_RHYTHMS.length)];
      for (const e of pat) hit(e2b(e), e === 0 ? 0.8 : 0.45, chords[0].c, e === 0 ? 0.7 : 0.55);
    } else {
      hit(0, 0.8, chords[0].c, 0.7);
      hit(2, 0.7, chords[1].c, 0.65);
      if (r() < 0.4) hit(e2b(7), 0.3, chords[1].c, 0.45);
    }
  }

  // ── batterie ──
  const drum = (inst: Inst, e: number, v: number) => evs.push({ t: e2b(e), d: 0.2, inst, m: 0, v });
  if (arr.drums === 'ride' || arr.drums === 'brushes') {
    const soft = arr.drums === 'brushes' ? 0.55 : 1;
    for (const e of [0, 2, 3, 4, 6, 7]) if (e % 2 === 0 || r() < 0.85) drum('ride', e, (e === 2 || e === 6 ? 0.9 : 0.6) * soft);
    drum('hat', 2, 0.7);
    drum('hat', 6, 0.7);
    if (arr.drums === 'brushes') for (let b = 0; b < 4; b++) drum('brush', b * 2, b % 2 ? 0.9 : 0.6);
    else {
      drum('kick', 0, 0.45);
      drum('kick', 4, 0.35);
    }
    if (form % 8 === 7) for (const t of [3, 3 + 1 / 3, 3 + 2 / 3]) evs.push({ t, d: 0.1, inst: 'rim', m: 0, v: 0.6 + (t - 3) * 0.5 });
    else if (r() < 0.25) drum('rim', 7, 0.45);
  } else if (arr.drums === 'soft') {
    drum('brush', 2, 0.7);
    drum('brush', 6, 0.7);
    drum('hat', 2, 0.4);
    drum('hat', 6, 0.4);
    if (r() < 0.5) drum('ride', 0, 0.35);
  } else {
    // labo : battement de cœur + charleston étouffé
    drum('kick', 0, 0.55);
    drum('kick', 1, 0.3);
    drum('hat', 2, 0.35);
    drum('hat', 6, 0.35);
    if (form % 2 === 0) drum('ride', 0, 0.4);
    if (r() < 0.2) drum('rim', 5, 0.35);
  }

  // ── mélodie ──
  const play = (inst: Inst, oct: number, v: number) => {
    for (const [e, note, len] of tune.melody[form]) {
      const t = e2b(e);
      evs.push({ t, d: Math.max(0.3, e2b(e + len) - t) * 0.95, inst, m: midi(note) + oct, v: v * (len >= 3 ? 1 : 0.85) });
    }
  };
  const solo = (inst: Inst, center: number, v: number) => {
    const pat = RHYTHMS[Math.floor(r() * RHYTHMS.length)];
    let pitch = center + Math.round((r() - 0.5) * 6);
    pat.forEach((e, i) => {
      const t = e2b(e);
      const { c } = chords.find((ch) => t >= ch.at && t < ch.at + ch.len) ?? chords[0];
      const pcs = new Set([0, ...c.t, ...c.v].map((x) => (c.root + x) % 12));
      // marche aléatoire dans les notes de l'accord, rappelée vers le centre
      const step = Math.round((r() - 0.5 + (center - pitch) * 0.04) * 6);
      let m = pitch + step;
      for (let k = 0; k < 12 && !pcs.has(((m % 12) + 12) % 12); k++) m += step >= 0 ? 1 : -1;
      pitch = m;
      const next = pat[i + 1] ?? 8;
      evs.push({ t, d: Math.max(0.25, e2b(next) - t) * 0.9, inst, m, v: v * (0.75 + r() * 0.25) });
    });
  };
  if (pass === 0) play(arr.lead, arr.leadOct, 0.9);
  else if (pass === 1) solo(arr.counter, 72 + arr.counterOct, 0.8);
  else if (pass === 2) {
    if (form < 8) play(arr.counter, arr.counterOct, 0.8);
    else play(arr.lead, arr.leadOct, 0.9);
  } else if (form % 4 < 2) play(arr.lead, arr.leadOct, 0.75);
  else if (form % 4 === 3) solo(arr.comp, 70, 0.5);
  return { evs, lastBass: last };
}

// ── instruments ──────────────────────────────────────────────────────────

/** Volume relatif de chaque instrument dans le mélange. */
const MIX: Record<Inst, number> = {
  bass: 0.5,
  vibes: 0.2,
  rhodes: 0.13,
  horn: 0.11,
  clari: 0.1,
  piano: 0.1,
  theremin: 0.07,
  ride: 0.035,
  brush: 0.05,
  hat: 0.05,
  kick: 0.3,
  rim: 0.05,
};

let noiseBuf: AudioBuffer | null = null;

/** Enveloppe exponentielle attaque / déclin / maintien / relâchement. */
function env(p: AudioParam, t: number, peak: number, attack: number, decay: number, sustain: number, end: number, release: number): number {
  const s = Math.max(peak * sustain, 0.0001);
  p.setValueAtTime(0.0001, t);
  p.exponentialRampToValueAtTime(peak, t + attack);
  p.exponentialRampToValueAtTime(s, t + attack + decay);
  const hold = Math.max(end, t + attack + decay);
  p.setValueAtTime(s, hold);
  p.exponentialRampToValueAtTime(0.0001, hold + release);
  return hold + release + 0.02;
}

function osc(a: BaseAudioContext, type: OscillatorType, f: number, t: number, stop: number): OscillatorNode {
  const o = a.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  o.start(t);
  o.stop(stop);
  return o;
}

function gain(a: BaseAudioContext, v = 1): GainNode {
  const g = a.createGain();
  g.gain.value = v;
  return g;
}

function filter(a: BaseAudioContext, type: BiquadFilterType, f: number, q = 0.7): BiquadFilterNode {
  const b = a.createBiquadFilter();
  b.type = type;
  b.frequency.value = f;
  b.Q.value = q;
  return b;
}

/** Vibrato (en cents) qui s'installe après `delay`. */
function vibrato(a: BaseAudioContext, target: AudioParam, t: number, stop: number, rate: number, cents: number, delay: number): void {
  const lfo = osc(a, 'sine', rate, t, stop);
  const depth = a.createGain();
  depth.gain.setValueAtTime(0, t);
  depth.gain.linearRampToValueAtTime(0, t + delay);
  depth.gain.linearRampToValueAtTime(cents, t + delay + 0.3);
  lfo.connect(depth).connect(target);
}

function noiseHit(a: BaseAudioContext, out: AudioNode, t: number, v: number, type: BiquadFilterType, f: number, q: number, attack: number, decay: number): void {
  if (!noiseBuf) return;
  const src = a.createBufferSource();
  src.buffer = noiseBuf;
  const g = gain(a, 0);
  src.connect(filter(a, type, f, q)).connect(g).connect(out);
  const stop = env(g.gain, t, v, attack, decay, 0.01, t + attack + decay, 0.02);
  src.start(t, Math.random() * 1.5);
  src.stop(stop);
}

/** Joue une note d'un instrument synthétisé. `t`, `d` en secondes. */
function voice(a: BaseAudioContext, out: AudioNode, inst: Inst, t: number, d: number, m: number, vel: number): void {
  const v = vel * MIX[inst];
  const f = hz(m);
  switch (inst) {
    case 'bass': {
      const g = gain(a, 0);
      const lp = filter(a, 'lowpass', Math.min(1400, f * 7 + 150), 1.2);
      const stop = env(g.gain, t, v, 0.006, 0.22, 0.5, t + d * 0.9, 0.07);
      osc(a, 'triangle', f, t, stop).connect(lp);
      osc(a, 'sine', f * 2, t, stop).connect(gain(a, 0.25)).connect(lp);
      lp.connect(g).connect(out);
      return;
    }
    case 'vibes': {
      const g = gain(a, 0);
      const trem = gain(a, 0.75);
      const stop = env(g.gain, t, v, 0.003, 0.5, 0.35, t + d, 0.9);
      osc(a, 'sine', f, t, stop).connect(g);
      const bell = gain(a, 0);
      env(bell.gain, t, 0.35, 0.002, 0.07, 0.01, t + 0.08, 0.02);
      osc(a, 'sine', f * 3.98, t, stop).connect(bell).connect(g);
      // moteur du vibraphone : trémolo d'amplitude
      osc(a, 'sine', 5.4, t, stop).connect(gain(a, 0.25)).connect(trem.gain);
      g.connect(trem).connect(out);
      return;
    }
    case 'rhodes': {
      const g = gain(a, 0);
      const stop = env(g.gain, t, v, 0.005, 0.6, 0.45, t + d, 0.3);
      const car = osc(a, 'sine', f, t, stop);
      const mod = osc(a, 'sine', f, t, stop);
      const idx = a.createGain();
      idx.gain.setValueAtTime(f * 1.4, t);
      idx.gain.exponentialRampToValueAtTime(f * 0.15, t + 0.45);
      mod.connect(idx).connect(car.frequency);
      car.connect(g).connect(out);
      return;
    }
    case 'horn': {
      // cuivre bouché : dent de scie filtrée, petit glissé d'attaque, « wah » de sourdine
      const g = gain(a, 0);
      const stop = env(g.gain, t, v, 0.03, 0.2, 0.7, t + d * 0.95, 0.09);
      const o = osc(a, 'sawtooth', f, t, stop);
      o.detune.setValueAtTime(-40, t);
      o.detune.linearRampToValueAtTime(0, t + 0.07);
      vibrato(a, o.detune, t, stop, 5.3, 10, 0.3);
      const lp = filter(a, 'lowpass', 600, 2);
      lp.frequency.setValueAtTime(600, t);
      lp.frequency.exponentialRampToValueAtTime(2600, t + 0.08);
      lp.frequency.exponentialRampToValueAtTime(1500, t + 0.4);
      o.connect(filter(a, 'bandpass', 1200, 0.9)).connect(lp).connect(g).connect(out);
      return;
    }
    case 'clari': {
      const g = gain(a, 0);
      const stop = env(g.gain, t, v, 0.04, 0.15, 0.8, t + d * 0.95, 0.1);
      const o = osc(a, 'square', f, t, stop);
      vibrato(a, o.detune, t, stop, 4.8, 7, 0.35);
      o.connect(filter(a, 'lowpass', 1500, 0.5)).connect(g).connect(out);
      osc(a, 'sine', f, t, stop).connect(gain(a, 0.6)).connect(g);
      return;
    }
    case 'piano': {
      // piano bastringue : deux cordes désaccordées
      const g = gain(a, 0);
      const stop = env(g.gain, t, v, 0.003, 1.1, 0.06, t + d, 0.15);
      osc(a, 'triangle', f * Math.pow(2, 9 / 1200), t, stop).connect(g);
      osc(a, 'triangle', f * Math.pow(2, -9 / 1200), t, stop).connect(g);
      osc(a, 'sine', f * 2, t, stop).connect(gain(a, 0.2)).connect(g);
      g.connect(out);
      return;
    }
    case 'theremin': {
      const g = gain(a, 0);
      const stop = env(g.gain, t, v, 0.15, 0.2, 0.85, t + d, 0.3);
      const o = osc(a, 'sine', f * 0.97, t, stop);
      o.frequency.exponentialRampToValueAtTime(f, t + 0.14);
      vibrato(a, o.detune, t, stop, 6.2, 18, 0);
      o.connect(g).connect(out);
      return;
    }
    case 'ride':
      noiseHit(a, out, t, v, 'highpass', 6500, 0.5, 0.002, 0.4);
      return;
    case 'brush':
      noiseHit(a, out, t, v, 'bandpass', 2800, 0.7, 0.035, 0.2);
      return;
    case 'hat':
      noiseHit(a, out, t, v, 'highpass', 8000, 0.7, 0.001, 0.045);
      return;
    case 'rim': {
      const g = gain(a, 0);
      const stop = env(g.gain, t, v, 0.001, 0.035, 0.01, t + 0.04, 0.01);
      osc(a, 'triangle', 1750, t, stop).connect(g).connect(out);
      noiseHit(a, out, t, v * 0.6, 'bandpass', 2500, 1, 0.001, 0.025);
      return;
    }
    case 'kick': {
      const g = gain(a, 0);
      const stop = env(g.gain, t, v, 0.003, 0.22, 0.01, t + 0.23, 0.02);
      const o = osc(a, 'sine', 105, t, stop);
      o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
      o.connect(g).connect(out);
      return;
    }
  }
}

// ── lecture ──────────────────────────────────────────────────────────────

/** Lecture d'un thème (une platine par thème ; deux pendant un fondu enchaîné). */
class Deck {
  readonly out: GainNode;
  bar: number;
  next: number;
  lastBass: number;
  fadeEnd = Infinity;

  constructor(
    private a: BaseAudioContext,
    readonly id: ThemeId,
    readonly arr: Arrangement,
    dest: AudioNode,
    start: number,
    bar = 0,
  ) {
    this.out = gain(a, 0);
    this.out.connect(dest);
    this.next = start;
    this.bar = bar;
    this.lastBass = arr.tune.tonic;
  }

  get spb(): number {
    return 60 / this.arr.bpm;
  }

  fadeIn(t: number, dur: number): void {
    this.out.gain.cancelScheduledValues(t);
    this.out.gain.setValueAtTime(0.0001, t);
    this.out.gain.exponentialRampToValueAtTime(this.arr.level, t + dur);
  }

  fadeOut(t: number, dur: number): void {
    this.out.gain.cancelScheduledValues(t);
    this.out.gain.setValueAtTime(Math.max(this.out.gain.value, 0.0001), t);
    this.out.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    this.fadeEnd = t + dur + 0.1;
  }

  /** Planifie les mesures qui commencent avant `until`. */
  fill(until: number): void {
    while (this.next < until && this.next < this.fadeEnd) {
      const { evs, lastBass } = barEvents(this.arr, this.bar, this.lastBass);
      this.lastBass = lastBass;
      const spb = this.spb;
      for (const e of evs) voice(this.a, this.out, e.inst, this.next + e.t * spb, e.d * spb, e.m, e.v);
      this.next += 4 * spb;
      this.bar++;
    }
  }

  stop(): void {
    this.out.disconnect();
  }
}

const KEY = 'qj.music';
const LOOKAHEAD = 0.3;

interface Graph {
  a: AudioContext;
  bus: GainNode;
  duck: GainNode;
  tone: BiquadFilterNode;
  master: GainNode;
}

let graph: Graph | null = null;
let decks: Deck[] = [];
let wanted: ThemeId | null = null;
let ducked = false;
const listeners = new Set<(on: boolean) => void>();

function readEnabled(): boolean {
  const q = new URLSearchParams(window.location.search).get('music');
  if (q === '0') return false;
  if (q === '1') return true;
  try {
    return localStorage.getItem(KEY) !== '0';
  } catch {
    return true;
  }
}

let enabled = readEnabled();

/** Réverbération courte : réponse impulsionnelle générée (bruit à décroissance exponentielle). */
function impulse(a: BaseAudioContext, seconds: number): AudioBuffer {
  const len = Math.floor(a.sampleRate * seconds);
  const buf = a.createBuffer(2, len, a.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      lp += ((Math.random() * 2 - 1) - lp) * 0.35; // un peu sombre
      d[i] = lp * Math.pow(1 - i / len, 2.6);
    }
  }
  return buf;
}

/** Chaîne de mixage : platines → bus → (sec + réverbe) → ducking → passe-bas → compresseur → volume. */
function buildGraph(a: BaseAudioContext, dest: AudioNode): Omit<Graph, 'a'> {
  if (!noiseBuf || noiseBuf.sampleRate !== a.sampleRate) {
    noiseBuf = a.createBuffer(1, a.sampleRate * 2, a.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const bus = gain(a, 1);
  const duck = gain(a, 1);
  const tone = filter(a, 'lowpass', 6000, 0.5);
  const comp = a.createDynamicsCompressor();
  comp.threshold.value = -20;
  comp.knee.value = 12;
  comp.ratio.value = 4;
  comp.attack.value = 0.01;
  comp.release.value = 0.25;
  const master = gain(a, 0);
  const verb = a.createConvolver();
  verb.buffer = impulse(a, 2.2);
  bus.connect(duck);
  bus.connect(verb).connect(gain(a, 0.22)).connect(duck);
  duck.connect(tone).connect(comp).connect(master).connect(dest);
  return { bus, duck, tone, master };
}

const MASTER = 0.32;

function applyTone(g: Graph, at: number): void {
  const arr = decks.length ? decks[decks.length - 1].arr : null;
  const base = arr?.tone ?? 6000;
  g.tone.frequency.setTargetAtTime(ducked ? Math.min(base, 2400) : base, at, 0.25);
  g.duck.gain.setTargetAtTime(ducked ? 0.55 : 1, at, 0.2);
}

function tick(): void {
  const g = graph;
  if (!g) return;
  const now = g.a.currentTime;
  for (const d of decks) {
    if (d.next < now - 0.2) d.next = now + 0.05; // rattrapage après une pause longue
    d.fill(now + LOOKAHEAD);
  }
  const live = decks.filter((d) => now < d.fadeEnd);
  for (const d of decks) if (!live.includes(d)) d.stop();
  decks = live;
}

function startTheme(id: ThemeId): void {
  const g = graph;
  if (!g) return;
  const now = g.a.currentTime;
  const cur = decks.find((d) => d.fadeEnd === Infinity);
  if (cur?.id === id) return;
  const arr: Arrangement = THEMES[id];
  // même grille (variation de pièce) : on reprend à la mesure en cours
  const bar = cur && cur.arr.tune === arr.tune ? cur.bar : 0;
  cur?.fadeOut(now, 1.4);
  const deck = new Deck(g.a, id, arr, g.bus, now + (cur ? 0.25 : 0.05), bar);
  deck.fadeIn(now + 0.05, cur ? 1.8 : 2.5);
  decks.push(deck);
  applyTone(g, now);
  deck.fill(now + LOOKAHEAD);
}

function unlock(): void {
  if (graph) {
    if (graph.a.state === 'suspended' && !document.hidden) void graph.a.resume();
    return;
  }
  const a = audioContext();
  if (!a) return;
  graph = { a, ...buildGraph(a, a.destination) };
  graph.master.gain.value = enabled ? MASTER : 0;
  window.setInterval(tick, 50);
  if (wanted) startTheme(wanted);
}

let installed = false;

/**
 * À appeler une fois au démarrage : déblocage audio au premier geste,
 * touche M, pause quand l'onglet est caché.
 */
export function installMusic(): void {
  if (installed) return;
  installed = true;
  for (const ev of ['pointerdown', 'keydown', 'touchend']) window.addEventListener(ev, unlock, { capture: true });
  window.addEventListener('keydown', (e) => {
    if ((e.key === 'm' || e.key === 'M') && !e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey) toggleMusic();
  });
  document.addEventListener('visibilitychange', () => {
    const a = graph?.a;
    if (!a) return;
    if (document.hidden) void a.suspend();
    else void a.resume();
  });
}

/** Thème à jouer (fondu enchaîné si un autre joue déjà ; sans effet si c'est le même). */
export function playMusic(id: ThemeId): void {
  wanted = id;
  startTheme(id);
}

/** Atténue et assourdit la musique pendant un dialogue. */
export function duckMusic(on: boolean): void {
  if (ducked === on) return;
  ducked = on;
  if (graph) applyTone(graph, graph.a.currentTime);
}

export function musicEnabled(): boolean {
  return enabled;
}

/** Coupe / remet la musique (persistant). Les effets sonores ne sont pas touchés. */
export function toggleMusic(): void {
  enabled = !enabled;
  try {
    localStorage.setItem(KEY, enabled ? '1' : '0');
  } catch {
    /* stockage indisponible : réglage pour la session seulement */
  }
  if (graph) graph.master.gain.setTargetAtTime(enabled ? MASTER : 0, graph.a.currentTime, 0.15);
  listeners.forEach((f) => f(enabled));
}

export function onMusicChange(fn: (on: boolean) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * Rendu hors ligne de `seconds` secondes d'un thème (vérifications, export).
 * Ex. dans la console de dev : `(await import('/src/ui/music.ts')).renderMusic('couloir', 20)`.
 */
export async function renderMusic(id: ThemeId, seconds: number, startBar = 0): Promise<AudioBuffer> {
  const a = new OfflineAudioContext(2, Math.ceil(44100 * seconds), 44100);
  const g = buildGraph(a, a.destination);
  g.master.gain.value = MASTER;
  g.tone.frequency.value = THEMES[id].tone;
  const deck = new Deck(a, id, THEMES[id], g.bus, 0.05, startBar);
  deck.out.gain.value = THEMES[id].level;
  deck.fill(seconds);
  return a.startRendering();
}
