// Musique d'ambiance : jazz modal « cosmique » (spiritual jazz), 100 %
// synthétisé en Web Audio (aucun fichier, aucun sample). Composition
// originale : chaque pièce a sa forme modale (plages de modes sur une pédale
// de bourdon), son ostinato de contrebasse et son orchestration ; nappes,
// glissandos de harpe, percussions et solos de flûte / sax / synthé sont
// improvisés à la volée (graine fixe par mesure → mêmes variations à chaque
// partie, mais aucun motif ne revient à l'identique avant plusieurs minutes).
//
// Un petit séquenceur planifie une mesure d'avance sur AudioContext.currentTime.
// Chaque thème est joué par une « platine » (gain, bourdon, phaser/chorus et
// écho propres) : changer de thème fait un fondu enchaîné. Démarre au premier
// geste (politique autoplay), coupure persistante (localStorage), touche M,
// `?music=0`.
import { audioContext } from './sfx';

// ── écriture ─────────────────────────────────────────────────────────────

/** Modes (demi-tons depuis la tonique). */
const MODES = {
  dorian: [0, 2, 3, 5, 7, 9, 10],
  aeolian: [0, 2, 3, 5, 7, 8, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  /** Phrygien dominant : la couleur « orientale » des ostinatos spirituels. */
  phrygdom: [0, 1, 4, 5, 7, 8, 10],
};
type Mode = keyof typeof MODES;

/** Plage modale : tonique, mode, durée en mesures. */
type Section = [root: string, mode: Mode, bars: number];

/** Note d'ostinato : [temps, degré du mode (0 = tonique, 7 = octave, négatif = dessous), durée en temps]. */
type Ost = [beat: number, degree: number, len: number];

type Inst = 'bass' | 'drone' | 'rhodes' | 'organ' | 'harp' | 'flute' | 'sax' | 'moog' | 'sweep' | 'bell' | 'gong' | 'shaker' | 'ride' | 'hat' | 'swell' | 'tom';

interface Arrangement {
  /** Plages modales jouées en boucle au-dessus du bourdon (tonique de la première). */
  form: Section[];
  bpm: number;
  /** Temps par mesure (4, 5 ou 6). */
  beats: number;
  /** Place de la croche « swinguée » dans le temps (0.5 = droit, 0.66 = ternaire). */
  swing: number;
  ostinato: Ost[];
  pad: 'rhodes' | 'organ';
  lead: 'flute' | 'sax' | 'moog';
  /** Bavardage du soliste (0-1) : plus haut = silences plus courts. */
  talk: number;
  /** Probabilité d'un glissando / arpège de harpe par mesure. */
  harp: number;
  drums: 'ride' | 'hands' | 'rubato';
  /** Probabilité d'une nappe de synthé balayée par plage modale. */
  space: number;
  /** Coupure du passe-bas général (Hz) : plus bas = plus feutré. */
  tone: number;
  level: number;
}

/**
 * Thèmes : un par pièce, plus titre et fin. Un gros plan garde le thème de
 * sa pièce.
 */
const THEMES = {
  /** Écran titre / intro : 6/4 en ré dorien, orgue, harpe et flûte, ride léger. */
  title: {
    form: [['D', 'dorian', 8], ['Bb', 'lydian', 4], ['D', 'dorian', 4], ['G', 'mixolydian', 2], ['A', 'phrygdom', 2]],
    bpm: 74, beats: 6, swing: 0.62,
    ostinato: [[0, 0, 2], [2, 4, 1], [3, 6, 0.5], [3.5, 7, 1], [4.5, 4, 0.5], [5, 3, 1]],
    pad: 'organ', lead: 'flute', talk: 0.6, harp: 0.45, drums: 'ride', space: 0.5, tone: 6000, level: 1,
  },
  /** Couloir : vamp dorien en 4/4 lent, Rhodes en chorus, sax ténor rêveur, ride en swing. */
  couloir: {
    form: [['D', 'dorian', 8], ['Eb', 'lydian', 4], ['D', 'dorian', 4], ['C', 'mixolydian', 4]],
    bpm: 72, beats: 4, swing: 0.64,
    ostinato: [[0, 0, 1.5], [1.5, 4, 0.5], [2, 6, 1], [3, 4, 0.5], [3.5, 3, 0.5]],
    pad: 'rhodes', lead: 'sax', talk: 0.55, harp: 0.22, drums: 'ride', space: 0.35, tone: 5200, level: 0.9,
  },
  /** Placard : fa lydien en apesanteur, orgue, harpe très présente, percussions rubato. */
  placard: {
    form: [['F', 'lydian', 8], ['D', 'aeolian', 4], ['Bb', 'lydian', 4]],
    bpm: 60, beats: 4, swing: 0.6,
    ostinato: [[0, 0, 2], [2, 4, 1], [3, 7, 1]],
    pad: 'organ', lead: 'flute', talk: 0.45, harp: 0.55, drums: 'rubato', space: 0.4, tone: 3400, level: 0.85,
  },
  /** Labo : 5/4 phrygien, synthé analogique en solo, nappes balayées, tambours à main. */
  labo: {
    form: [['E', 'phrygian', 8], ['F', 'lydian', 4], ['E', 'phrygdom', 4], ['C#', 'phrygian', 2], ['E', 'phrygian', 2]],
    bpm: 82, beats: 5, swing: 0.58,
    ostinato: [[0, 0, 1], [1, 0, 0.5], [1.5, 1, 1], [2.5, 4, 1], [3.5, 3, 0.5], [4, -1, 1]],
    pad: 'organ', lead: 'moog', talk: 0.5, harp: 0.15, drums: 'hands', space: 0.8, tone: 4400, level: 0.85,
  },
  /** Cliffhanger : 6/4 très lent, orgue, flûte et harpe, sans pulsation. */
  fin: {
    form: [['D', 'dorian', 8], ['Bb', 'lydian', 4], ['A', 'phrygdom', 2], ['D', 'dorian', 2]],
    bpm: 58, beats: 6, swing: 0.6,
    ostinato: [[0, 0, 3], [3, 4, 1.5], [4.5, 7, 1.5]],
    pad: 'organ', lead: 'flute', talk: 0.4, harp: 0.5, drums: 'rubato', space: 0.45, tone: 3800, level: 0.8,
  },
} satisfies Record<string, Arrangement>;

export type ThemeId = keyof typeof THEMES;

/** Thème d'une scène YAML (les gros plans suivent leur pièce hôte). */
const SCENE_THEME: Record<string, ThemeId> = { placard: 'placard', couloir: 'couloir', labo: 'labo', panneau: 'labo' };
export function themeForScene(id: string): ThemeId {
  return SCENE_THEME[id] ?? 'couloir';
}

// ── solfège ──────────────────────────────────────────────────────────────

const PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function pitchClass(name: string): number {
  const m = /^([A-G])([b#]?)$/.exec(name);
  if (!m) throw new Error(`[music] tonique illisible « ${name} »`);
  return (PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12) % 12;
}

const hz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

/** Demi-tons du degré `d` d'un mode (degrés hors octave : octave au-dessus / dessous). */
function degree(scale: number[], d: number): number {
  const o = Math.floor(d / scale.length);
  return scale[d - o * scale.length] + 12 * o;
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

interface Place {
  root: number;
  scale: number[];
  /** Première / dernière mesure de la plage modale. */
  first: boolean;
  last: boolean;
  /** Mesure dans la forme complète. */
  pos: number;
  length: number;
}

function placeOf(form: Section[], bar: number): Place {
  const length = form.reduce((n, s) => n + s[2], 0);
  const pos = ((bar % length) + length) % length;
  let at = 0;
  for (const [root, mode, bars] of form) {
    if (pos < at + bars) return { root: pitchClass(root), scale: MODES[mode], first: pos === at, last: pos === at + bars - 1, pos, length };
    at += bars;
  }
  throw new Error('[music] forme vide');
}

// ── génération d'une mesure ──────────────────────────────────────────────

interface Ev {
  /** Départ en temps depuis le début de la mesure. */
  t: number;
  /** Durée en temps. */
  d: number;
  inst: Inst;
  m: number;
  v: number;
}

/** État du soliste d'une platine (ses phrases enjambent les mesures). */
interface Soloist {
  /** Mesures restantes de la phrase en cours / de silence. */
  phrase: number;
  rest: number;
  /** Position dans le mode (degré), conservée d'une plage à l'autre. */
  deg: number;
}

const REST_DEGREES = [-3, 0, 2, 4, 7, 9, 11];
const LEAD_CENTER: Record<Arrangement['lead'], number> = { flute: 74, sax: 62, moog: 67 };

/**
 * Compose une mesure. Pas de grille à boucler : une forme modale, un ostinato
 * légèrement varié, et des couches (harpe, solo, synthé, cloches) dont la
 * densité suit un arc lent de 23 mesures, incommensurable avec la forme.
 */
function barEvents(arr: Arrangement, bar: number, solo: Soloist): Ev[] {
  const B = arr.beats;
  const r = rng(bar * 7919 + 13);
  const p = placeOf(arr.form, bar);
  const arc = 0.5 - 0.5 * Math.cos((2 * Math.PI * bar) / 23);
  const sw = (b: number) => (Math.abs(b % 1 - 0.5) < 1e-6 ? Math.floor(b) + arr.swing : b);
  const at = (deg: number, center: number) => nearest(p.root, center, center - 6, center + 5) + degree(p.scale, deg);
  const evs: Ev[] = [];
  const push = (t: number, d: number, inst: Inst, m: number, v: number) => evs.push({ t, d, inst, m, v });

  // ── contrebasse : ostinato modal, une note qui bouge de temps en temps ──
  for (const [b, d, len] of arr.ostinato) {
    const deg = b > 0 && r() < 0.12 ? d + (r() < 0.5 ? 1 : -1) : d;
    push(sw(b), len * 0.94, 'bass', at(deg, 38), b === 0 ? 0.95 : 0.72);
  }
  if (p.last && r() < 0.5) push(sw(B - 0.5), 0.45, 'bass', at(-1, 38), 0.5);

  // ── nappes : voicings en quartes tirés du mode ──
  const shift = bar % 4 === 3 ? (r() < 0.5 ? 1 : -1) : bar % 8 === 5 && r() < 0.5 ? 2 : 0;
  const voicing = [0, 3, 6, 9].map((k) => at(shift + k, 54));
  if (arr.pad === 'organ') {
    voicing.forEach((m, i) => push(i * 0.02, B, 'organ', m, i === 3 ? 0.7 : 0.9));
  } else {
    voicing.forEach((m, i) => push(i * 0.03, B * 0.6, 'rhodes', m, 0.7));
    if (r() < 0.55) {
      const t = sw(r() < 0.5 ? B - 1.5 : 1.5);
      voicing.forEach((m, i) => push(t + i * 0.025, B - t, 'rhodes', m, 0.45));
    }
  }

  // ── harpe : glissandos dans le mode, ou arpège lent ──
  if (bar > 0 && r() < arr.harp * (0.5 + arc)) {
    const n = 7 + Math.floor(r() * 9);
    const start = Math.floor(r() * Math.max(1, B - 2));
    const d0 = r() < 0.5 ? 0 : 2;
    const back = r() < 0.4;
    for (let i = 0; i < n; i++) {
      const k = back && i > n / 2 ? n - i : i;
      push(start + i * 0.085, 1.6, 'harp', at(d0 + k, 60), 0.4 + 0.5 * Math.sin((Math.PI * (i + 1)) / (n + 1)));
    }
  } else if (r() < arr.harp * 0.6) {
    const shape = [0, 4, 7, 9, 11, 9, 7, 4];
    for (let e = 0; e < B * 2; e++) push(sw(e / 2), 1.2, 'harp', at(shape[e % shape.length] + shift, 55), e % 2 ? 0.35 : 0.5);
  }

  // ── soliste : phrases improvisées dans le mode, silences entre deux ──
  if (bar >= 4) {
    if (solo.rest > 0) solo.rest--;
    else {
      if (solo.phrase === 0) solo.phrase = 1 + Math.floor(r() * 3);
      const last = solo.phrase === 1;
      const slots: number[] = [];
      for (let e = Math.floor(r() * 3); e < B * 2 - (last ? 3 : 0); ) {
        slots.push(e);
        e += r() < 0.45 ? 1 : r() < 0.7 ? 2 : 3;
      }
      const center = LEAD_CENTER[arr.lead];
      slots.forEach((e, i) => {
        let step = Math.round((r() - 0.5) * 3.2 + (3 - solo.deg) * 0.15);
        if (step === 0) step = r() < 0.5 ? 1 : -1;
        if (r() < 0.1) step *= 3;
        solo.deg = Math.max(-3, Math.min(11, solo.deg + step));
        const final = last && i === slots.length - 1;
        // fin de phrase posée sur une note de l'accord modal (1, 3, 5)
        if (final) solo.deg = REST_DEGREES.reduce((b, x) => (Math.abs(x - solo.deg) < Math.abs(b - solo.deg) ? x : b));
        const t = sw(e / 2);
        const next = final ? B + 1 : sw((slots[i + 1] ?? B * 2) / 2);
        const m = at(solo.deg, center);
        if (arr.lead !== 'moog' && r() < 0.12 && t > 0.1) push(t - 0.08, 0.08, arr.lead, m + 2, 0.5);
        push(t, Math.max(0.3, (next - t) * 0.94), arr.lead, m, (i === 0 ? 0.7 : 0.85) * (0.8 + r() * 0.2));
      });
      solo.phrase--;
      if (solo.phrase === 0) solo.rest = 1 + Math.floor((r() * 3) / Math.max(0.2, arr.talk));
    }
  }

  // ── synthé spatial : nappe balayée en début de plage ──
  if (p.first && bar > 0 && r() < arr.space) {
    push(0, B * 2, 'sweep', at(4, 62), 0.8);
    push(0.3, B * 2, 'sweep', at(0, 50), 0.6);
  } else if (arr.lead === 'moog' && r() < arr.space * 0.15) {
    push(sw(B - 1.5), 1.5, 'sweep', at(7, 74), 0.5);
  }

  // ── percussions ──
  if (bar % p.length === 0 || (p.first && r() < 0.35)) push(0, 4, 'gong', at(0, 40), bar === 0 ? 0.6 : 0.8);
  if (p.last) push(B - 2, 2, 'swell', 0, 0.7);
  const bell = () => push(r() * (B - 0.5), 2, 'bell', at([0, 4, 7, 9][Math.floor(r() * 4)], 84), 0.4 + r() * 0.4);
  if (arr.drums === 'ride') {
    for (let b = 0; b < B; b++) {
      push(b, 0.2, 'ride', 0, b % 2 ? 0.75 : 0.5);
      if (b % 2 === 0 && r() < 0.75) push(b + arr.swing, 0.2, 'ride', 0, 0.35);
      if (b % 2) push(b, 0.1, 'hat', 0, 0.55);
    }
    if (arc > 0.35) for (let e = 0; e < B * 2; e++) push(sw(e / 2), 0.1, 'shaker', 0, e % 2 ? 0.35 : 0.2);
    if (r() < 0.2) bell();
  } else if (arr.drums === 'hands') {
    push(0, 0.5, 'tom', 0, 0.8);
    push(sw(1.5), 0.5, 'tom', 0, 0.45);
    push(3, 0.5, 'tom', 0, 0.6);
    if (r() < 0.5) push(sw(B - 0.5), 0.5, 'tom', 0, 0.35);
    for (let e = 0; e < B * 2; e++) push(sw(e / 2), 0.1, 'shaker', 0, e % 2 ? 0.4 : 0.22);
    if (bar % 2 === 0) push(0, 0.2, 'ride', 0, 0.45);
    if (r() < 0.25) bell();
  } else {
    // rubato : pas de pulsation, des événements dispersés
    if (r() < 0.55) bell();
    if (r() < 0.3) bell();
    if (!p.last && r() < 0.3) push(r() * (B - 2), 2, 'swell', 0, 0.45);
    if (r() < 0.3) {
      const t = r() * (B - 1);
      for (let i = 0; i < 4; i++) push(t + i * (0.22 - i * 0.03), 0.1, 'shaker', 0, 0.3 + i * 0.1);
    }
    if (r() < 0.4) push(0, 0.2, 'ride', 0, 0.35);
  }
  return evs;
}

// ── instruments ──────────────────────────────────────────────────────────

/** Volume relatif de chaque instrument dans le mélange. */
const MIX: Record<Inst, number> = {
  bass: 0.55,
  drone: 0.05,
  rhodes: 0.1,
  organ: 0.035,
  harp: 0.11,
  flute: 0.1,
  sax: 0.075,
  moog: 0.05,
  sweep: 0.035,
  bell: 0.03,
  gong: 0.06,
  shaker: 0.03,
  ride: 0.03,
  hat: 0.035,
  swell: 0.04,
  tom: 0.3,
};

/** Envoi vers l'écho de la platine (en plus de la grande réverbe commune). */
const ECHO: Partial<Record<Inst, number>> = { harp: 0.35, flute: 0.4, sax: 0.3, moog: 0.55, bell: 0.45, sweep: 0.5, rhodes: 0.2 };

/** Sorties d'une platine : sec, nappes (phaser + chorus), écho. */
interface Outs {
  dry: AudioNode;
  pad: AudioNode;
  echo: AudioNode;
}

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

function noiseHit(a: BaseAudioContext, out: AudioNode, t: number, v: number, type: BiquadFilterType, f: number, q: number, attack: number, decay: number): number {
  if (!noiseBuf) return t;
  const src = a.createBufferSource();
  src.buffer = noiseBuf;
  const g = gain(a, 0);
  src.connect(filter(a, type, f, q)).connect(g).connect(out);
  const stop = env(g.gain, t, v, attack, decay, 0.01, t + attack + decay, 0.02);
  src.start(t, Math.random() * 1.5);
  src.stop(stop);
  return stop;
}

/** Joue une note d'un instrument synthétisé. `t`, `d` en secondes. */
function voice(a: BaseAudioContext, outs: Outs, inst: Inst, t: number, d: number, m: number, vel: number): void {
  const v = vel * MIX[inst];
  const f = hz(m);
  const g = gain(a, 0);
  g.connect(inst === 'rhodes' || inst === 'organ' || inst === 'sweep' ? outs.pad : outs.dry);
  const send = ECHO[inst];
  if (send) g.connect(gain(a, send)).connect(outs.echo);
  switch (inst) {
    case 'bass': {
      // contrebasse pincée : attaque sourde, filtre qui se referme
      const stop = env(g.gain, t, v, 0.008, 0.4, 0.4, t + d * 0.9, 0.2);
      const lp = filter(a, 'lowpass', Math.min(1600, f * 9), 0.9);
      lp.frequency.setValueAtTime(Math.min(1600, f * 9), t);
      lp.frequency.exponentialRampToValueAtTime(f * 3 + 80, t + 0.35);
      osc(a, 'triangle', f, t, stop).connect(lp);
      osc(a, 'sine', f, t, stop).connect(gain(a, 0.6)).connect(lp);
      lp.connect(g);
      return;
    }
    case 'rhodes': {
      const stop = env(g.gain, t, v, 0.005, 0.9, 0.4, t + d, 0.7);
      const car = osc(a, 'sine', f, t, stop);
      const mod = osc(a, 'sine', f, t, stop);
      const idx = a.createGain();
      idx.gain.setValueAtTime(f * 1.2, t);
      idx.gain.exponentialRampToValueAtTime(f * 0.12, t + 0.5);
      mod.connect(idx).connect(car.frequency);
      car.connect(g);
      return;
    }
    case 'organ': {
      // orgue à tirettes doux : 8' + 4' + 2⅔', gonflé lentement
      const stop = env(g.gain, t, v, 0.35, 0.3, 0.85, t + d, 0.9);
      osc(a, 'sine', f, t, stop).connect(g);
      osc(a, 'sine', f * 2, t, stop).connect(gain(a, 0.45)).connect(g);
      osc(a, 'sine', f * 3, t, stop).connect(gain(a, 0.18)).connect(g);
      return;
    }
    case 'harp': {
      const stop = env(g.gain, t, v, 0.002, 1.6, 0.01, t + 0.2, 0.3);
      osc(a, 'sine', f, t, stop).connect(g);
      const pluck = gain(a, 0);
      env(pluck.gain, t, 0.3, 0.001, 0.12, 0.01, t + 0.13, 0.02);
      osc(a, 'triangle', f * 2, t, stop).connect(pluck).connect(g);
      return;
    }
    case 'flute': {
      // sinus + souffle filtré, vibrato tardif, petit glissé d'attaque
      const stop = env(g.gain, t, v, 0.07, 0.15, 0.8, t + d * 0.95, 0.15);
      const o = osc(a, 'sine', f, t, stop);
      o.detune.setValueAtTime(-25, t);
      o.detune.linearRampToValueAtTime(0, t + 0.06);
      vibrato(a, o.detune, t, stop, 5.1, 14, 0.25);
      o.connect(g);
      osc(a, 'triangle', f, t, stop).connect(gain(a, 0.12)).connect(g);
      noiseHit(a, g, t, 0.35, 'bandpass', f * 2, 3, 0.04, Math.max(0.1, d * 0.6));
      return;
    }
    case 'sax': {
      // ténor feutré : dent de scie, formant, filtre qui s'ouvre avec le souffle
      const stop = env(g.gain, t, v, 0.05, 0.2, 0.75, t + d * 0.95, 0.14);
      const o = osc(a, 'sawtooth', f, t, stop);
      o.detune.setValueAtTime(-30, t);
      o.detune.linearRampToValueAtTime(0, t + 0.08);
      vibrato(a, o.detune, t, stop, 4.6, 12, 0.3);
      const lp = filter(a, 'lowpass', 700, 1);
      lp.frequency.setValueAtTime(700, t);
      lp.frequency.exponentialRampToValueAtTime(1900, t + 0.12);
      lp.frequency.exponentialRampToValueAtTime(1200, t + 0.6);
      o.connect(filter(a, 'peaking', 1100, 1)).connect(lp).connect(g);
      noiseHit(a, g, t, 0.15, 'bandpass', 2500, 1.5, 0.03, 0.1);
      return;
    }
    case 'moog': {
      // synthé analogique : deux dents de scie désaccordées, filtre résonant, portamento
      const stop = env(g.gain, t, v, 0.02, 0.3, 0.7, t + d * 0.95, 0.25);
      const lp = filter(a, 'lowpass', f * 1.5, 7);
      lp.frequency.setValueAtTime(f * 1.5, t);
      lp.frequency.exponentialRampToValueAtTime(Math.min(7000, f * 9), t + 0.09);
      lp.frequency.exponentialRampToValueAtTime(f * 2.5, t + 0.6);
      for (const c of [-7, 7]) {
        const o = osc(a, 'sawtooth', f * 0.94, t, stop);
        o.frequency.exponentialRampToValueAtTime(f, t + 0.07);
        o.detune.value = c;
        o.connect(lp);
      }
      vibrato(a, lp.frequency, t, stop, 0.8, f * 0.5, 0.4);
      lp.connect(g);
      return;
    }
    case 'sweep': {
      // nappe « spatiale » : filtre résonant qui monte puis redescend lentement
      const stop = env(g.gain, t, v, d * 0.35, d * 0.3, 0.6, t + d * 0.8, 1.6);
      const lp = filter(a, 'lowpass', 250, 9);
      lp.frequency.setValueAtTime(250, t);
      lp.frequency.exponentialRampToValueAtTime(3200, t + d * 0.5);
      lp.frequency.exponentialRampToValueAtTime(300, stop);
      for (const c of [-12, 12]) {
        const o = osc(a, 'sawtooth', f, t, stop);
        o.detune.value = c;
        o.connect(lp);
      }
      lp.connect(g);
      return;
    }
    case 'bell': {
      // cymbalettes / crotale : partiels inharmoniques, longue résonance
      const stop = env(g.gain, t, v, 0.001, 3, 0.001, t + 0.01, 0.1);
      [1, 2.76, 5.4, 8.93].forEach((k, i) => {
        if (f * k < 16000) osc(a, 'sine', f * k, t, stop).connect(gain(a, [1, 0.5, 0.25, 0.12][i])).connect(g);
      });
      return;
    }
    case 'gong': {
      // gong doux frappé à la mailloche : partiels graves qui gonflent puis s'éteignent
      const stop = env(g.gain, t, v, 0.25, 6, 0.001, t + 0.3, 0.2);
      [1, 1.47, 2.09, 2.56, 3.13].forEach((k, i) => {
        const o = osc(a, 'sine', f * k, t, stop);
        o.detune.setValueAtTime(-15, t);
        o.detune.linearRampToValueAtTime(0, t + 1.5);
        o.connect(gain(a, 1 / (i + 1))).connect(g);
      });
      noiseHit(a, g, t, 0.25, 'lowpass', 500, 0.7, 0.4, 1.5);
      return;
    }
    case 'shaker':
      noiseHit(a, g, t, 1, 'bandpass', 6500, 1.2, 0.008, 0.055);
      g.gain.value = v;
      return;
    case 'hat':
      noiseHit(a, g, t, 1, 'highpass', 7500, 0.7, 0.002, 0.05);
      g.gain.value = v;
      return;
    case 'ride': {
      // cymbale ride à la baguette légère : souffle aigu + petit tintement
      noiseHit(a, g, t, 1, 'highpass', 5500, 0.5, 0.002, 0.7);
      const ping = gain(a, 0);
      const stop = env(ping.gain, t, 0.12, 0.001, 0.4, 0.01, t + 0.41, 0.05);
      osc(a, 'triangle', 3150, t, stop).connect(ping).connect(g);
      g.gain.value = v;
      return;
    }
    case 'swell': {
      // roulement de cymbale aux mailloches : crescendo puis longue extinction
      noiseHit(a, g, t, 1, 'bandpass', 4200, 0.4, Math.max(0.2, d), 2.2);
      g.gain.value = v;
      return;
    }
    case 'tom': {
      // tambour à main grave
      const stop = env(g.gain, t, v, 0.004, 0.35, 0.01, t + 0.36, 0.03);
      const o = osc(a, 'sine', 110, t, stop);
      o.frequency.exponentialRampToValueAtTime(68, t + 0.2);
      o.connect(g);
      noiseHit(a, g, t, 0.15, 'bandpass', 350, 1, 0.002, 0.05);
      return;
    }
    case 'drone':
      return;
  }
}

// ── lecture ──────────────────────────────────────────────────────────────

/**
 * Lecture d'un thème (une platine par thème ; deux pendant un fondu enchaîné).
 * Chaque platine porte son bourdon (tonique + quinte, tenus en continu), son
 * phaser + chorus stéréo pour les nappes, et son écho filtré à réinjection.
 */
class Deck {
  readonly out: GainNode;
  private outs: Outs;
  private lfos: OscillatorNode[] = [];
  private solo: Soloist = { phrase: 0, rest: 0, deg: 4 };
  bar: number;
  next: number;
  fadeEnd = Infinity;

  constructor(
    private a: BaseAudioContext,
    readonly id: ThemeId,
    readonly arr: Arrangement,
    dest: AudioNode,
    start: number,
    bar = 0,
  ) {
    this.next = start;
    this.bar = bar;
    this.out = gain(a, 0);
    this.out.connect(dest);
    const lfo = (rate: number, depth: number, target: AudioParam) => {
      const o = osc(a, 'sine', rate, start, start + 1e6);
      o.connect(gain(a, depth)).connect(target);
      this.lfos.push(o);
    };

    const dry = gain(a, 1);
    dry.connect(this.out);

    // phaser (4 passe-tout balayés) puis chorus stéréo (deux lignes modulées)
    const pad = gain(a, 1);
    pad.connect(gain(a, 0.6)).connect(this.out);
    let ph: AudioNode = pad;
    for (let i = 0; i < 4; i++) {
      const ap = filter(a, 'allpass', 700 + i * 250, 0.6);
      lfo(0.11, 450 + i * 150, ap.frequency);
      ph = ph.connect(ap);
    }
    ph.connect(gain(a, 0.5)).connect(this.out);
    [-0.7, 0.7].forEach((pan, i) => {
      const dl = a.createDelay(0.1);
      dl.delayTime.value = 0.016 + i * 0.006;
      lfo(0.43 + i * 0.17, 0.004, dl.delayTime);
      const sp = a.createStereoPanner();
      sp.pan.value = pan;
      ph.connect(dl).connect(gain(a, 0.45)).connect(sp).connect(this.out);
    });

    // écho : croche pointée × 2, réinjection filtrée (sombre, qui s'éloigne)
    const echo = gain(a, 1);
    const dl = a.createDelay(3);
    dl.delayTime.value = (60 / arr.bpm) * 1.5;
    const fb = gain(a, 0.42);
    const tone = filter(a, 'lowpass', 2200, 0.5);
    echo.connect(dl).connect(tone).connect(fb).connect(dl);
    const sp = a.createStereoPanner();
    sp.pan.value = 0.35;
    tone.connect(gain(a, 0.6)).connect(sp).connect(this.out);

    // bourdon : pédale sur la tonique de la forme, filtre qui respire lentement
    const root = nearest(pitchClass(arr.form[0][0]), 38, 33, 44);
    const dg = gain(a, 0);
    dg.gain.setValueAtTime(0.0001, start);
    dg.gain.exponentialRampToValueAtTime(MIX.drone, start + 4);
    const dlp = filter(a, 'lowpass', 500, 2);
    lfo(0.07, 250, dlp.frequency);
    for (const [m, type, v] of [[root, 'sine', 1], [root + 7, 'triangle', 0.35], [root + 12, 'sawtooth', 0.12], [root + 19, 'triangle', 0.08]] as const) {
      const o = osc(a, type, hz(m), start, start + 1e6);
      o.detune.value = (m - root) * 0.3;
      o.connect(gain(a, v)).connect(dlp);
      this.lfos.push(o);
    }
    dlp.connect(dg).connect(this.out);

    this.outs = { dry, pad, echo };
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
      const spb = this.spb;
      for (const e of barEvents(this.arr, this.bar, this.solo)) voice(this.a, this.outs, e.inst, this.next + e.t * spb, e.d * spb, e.m, e.v);
      this.next += this.arr.beats * spb;
      this.bar++;
    }
  }

  stop(): void {
    for (const o of this.lfos) {
      try {
        o.stop();
      } catch {
        /* déjà arrêté */
      }
    }
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

/**
 * Grande réverbe « cathédrale cosmique » : réponse impulsionnelle générée,
 * bruit stéréo décorrélé qui s'assombrit en s'éteignant, attaque adoucie.
 */
function impulse(a: BaseAudioContext, seconds: number): AudioBuffer {
  const len = Math.floor(a.sampleRate * seconds);
  const buf = a.createBuffer(2, len, a.sampleRate);
  const fade = Math.floor(a.sampleRate * 0.08);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      const x = i / len;
      lp += ((Math.random() * 2 - 1) - lp) * (0.5 - 0.42 * x); // de plus en plus sombre
      d[i] = lp * Math.pow(1 - x, 3) * Math.min(1, i / fade);
    }
  }
  return buf;
}

/** Chaîne de mixage : platines → bus → (sec + grande réverbe) → ducking → passe-bas → compresseur → volume. */
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
  verb.buffer = impulse(a, 4.5);
  const predelay = a.createDelay(0.2);
  predelay.delayTime.value = 0.045;
  bus.connect(duck);
  bus.connect(predelay).connect(verb).connect(gain(a, 0.5)).connect(duck);
  duck.connect(tone).connect(comp).connect(master).connect(dest);
  return { bus, duck, tone, master };
}

const MASTER = 0.26;

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
  // même forme : on reprend à la mesure en cours
  const bar = cur && cur.arr.form === arr.form ? cur.bar : 0;
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
