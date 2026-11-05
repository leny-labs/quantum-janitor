// Tracé de la bouche-onde procédurale (sans Phaser) : partagé par la boîte de
// dialogue (ui/WaveMouth.ts) et l'écran 3D de PERCO (three/percoFace.ts).
import type { Mood } from '../engine/mood';
import type { PortraitWave } from '../three/Studio';

/** Fréquence (crêtes sur la largeur), vitesse, dents de scie (0 = sinus doux). */
export const FLAVOR: Record<Mood, { freq: number; speed: number; jag: number }> = {
  calm: { freq: 11, speed: 1, jag: 0.6 },
  suspicious: { freq: 8, speed: 0.6, jag: 0.4 },
  angry: { freq: 15, speed: 1.7, jag: 1 },
  love: { freq: 6, speed: 0.8, jag: 0 },
  surprised: { freq: 9, speed: 1.3, jag: 0.3 },
  sad: { freq: 5, speed: 0.5, jag: 0.1 },
};

const POINTS = 72;
export const WAVE_GLOW = 0x7fffd4;
export const WAVE_CORE = 0xe8fffa;

const smooth = (x: number, a: number, b: number) => {
  const u = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return u * u * (3 - 2 * u);
};

/**
 * Points de l'onde, en px de cellule (`def.cell`), au temps `time` (s) pour un
 * niveau de parole lissé `level` (0 repos · 1 parle). Les réglages optionnels
 * de `def` (speed, punch, jag, step) valent 1 / 0 / humeur / rien par défaut :
 * SYLVIE et B.O.B. gardent exactement leur tracé.
 */
export function wavePoints(def: PortraitWave, mood: Mood, time: number, level: number): { x: number; y: number }[] {
  const { x0, x1, y, amp } = def;
  // inclinaison autour du centre de l'onde (grille-bouche penchée)
  const rad = ((def.angle ?? 0) * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const cx = (x0 + x1) / 2;
  const f = FLAVOR[mood];
  const t = time * f.speed * (def.speed ?? 1);
  const jag = def.jag ?? f.jag;
  // enveloppe de parole : syllabes (deux sinus décalés) + un peu de bruit ;
  // `punch` > 0 rend les syllabes plus sèches (attaque franche, creux plus profonds)
  const syl = Math.abs(Math.sin(t * 7.3) * Math.sin(t * 3.1 + 1.3));
  const sh = def.punch ? Math.pow(syl, 1 / (1 + def.punch)) * (Math.sin(t * 13.7) > -0.2 ? 1 : 0.35) : syl;
  const speech = level * (0.35 + 0.65 * sh) * (0.85 + Math.random() * 0.15);
  const r0 = def.rest ?? 0.09;
  const rest = r0 * (1 + (4 / 9) * Math.sin(t * 1.7));
  const a = Math.max(rest, speech) * amp;
  const step = def.step;
  const n = step ? Math.max(4, Math.round((x1 - x0) / step)) : POINTS;
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    // bouts plats (comme la planche de ref), crêtes au milieu
    const win = smooth(u, 0.04, 0.2) * (1 - smooth(u, 0.8, 0.96));
    const ph = u * Math.PI * 2 * f.freq - t * 9;
    const sine = Math.sin(ph);
    // dents de scie : on pousse le sinus vers un triangle pointu
    const saw = (2 / Math.PI) * Math.asin(sine);
    const wave = sine * (1 - jag) + saw * jag;
    // relief qui voyage (une crête plus haute, comme le pic de la ref)
    const bump = 0.55 + 0.45 * Math.sin(u * Math.PI * 2 * 1.3 - t * 2.2);
    const dx = x0 + (x1 - x0) * u - cx;
    let dy = -wave * bump * win * a;
    // écran pixel : hauteurs posées sur la grille (marches d'escalier)
    if (step) dy = Math.round(dy / (step / 2)) * (step / 2);
    const px = cx + dx * cos - dy * sin;
    const py = y + dx * sin + dy * cos;
    if (step && i > 0) pts.push({ x: px, y: pts[pts.length - 1].y });
    pts.push({ x: px, y: py });
  }
  return pts;
}
