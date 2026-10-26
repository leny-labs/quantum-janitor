// Sourcils procéduraux d'un portrait-planche (B.O.B.) : deux plaques gris acier
// dessinées par-dessus la planche (PORTRAIT_BROWS dans Studio.ts), orientées
// selon l'humeur (BROW_POSES, engine/brows.ts). Ressorts un peu sous-amortis :
// les changements d'humeur « claquent » façon cartoon. Petits sursauts sur les
// accents de parole, retour à la pose de l'humeur dès qu'il se tait.
import Phaser from 'phaser';
import { ACCENT_LIFT, BROW_POSES, accentOf, type BrowPose } from '../engine/brows';
import type { Mood } from '../engine/mood';
import { PORTRAIT_BROWS, type BrowSpot, type PortraitBrows } from '../three/Studio';

const KEYS = ['y', 'rot', 'bend', 'len'] as const;
/** Ressort de pose (raideur, amortissement, en 1/s) et ressort d'accent. */
const POSE_K = 170;
const POSE_D = 17;
const KICK_K = 320;
const KICK_D = 15;
/** Points par bord de plaque (la cambrure en a besoin). */
const SEG = 10;

export const browsFor = (id: string): PortraitBrows | null => PORTRAIT_BROWS[id] ?? null;

class Spring {
  x: BrowPose;
  private v: BrowPose = { y: 0, rot: 0, bend: 0, len: 0 };
  constructor(p: BrowPose) {
    this.x = { ...p };
  }
  step(to: BrowPose, dt: number): void {
    for (const k of KEYS) {
      this.v[k] += ((to[k] - this.x[k]) * POSE_K - this.v[k] * POSE_D) * dt;
      this.x[k] += this.v[k] * dt;
    }
  }
  snap(to: BrowPose): void {
    this.x = { ...to };
    this.v = { y: 0, rot: 0, bend: 0, len: 0 };
  }
}

export class Brows {
  readonly g: Phaser.GameObjects.Graphics;
  private left = 0;
  private top = 0;
  private k = 1;
  private mood: Mood = 'calm';
  private l = new Spring(BROW_POSES.calm.l);
  private r = new Spring(BROW_POSES.calm.r);
  /** Sursaut d'accent (rayons d'œil) et sa vitesse ; `tilt` = part du gauche en plus (« ? »). */
  private kick = 0;
  private kickV = 0;
  private tilt = 0;
  private prev = ' ';
  /** Prochain micro-sursaut spontané pendant la parole (s). */
  private nextTic = 0.8;

  constructor(
    scene: Phaser.Scene,
    private def: PortraitBrows,
  ) {
    this.g = scene.add.graphics();
  }

  /** Pose les sourcils sur une cellule de planche de `cellPx` px, coin haut-gauche en (`left`, `top`). */
  place(left: number, top: number, cellPx: number): this {
    this.left = left;
    this.top = top;
    this.k = cellPx / this.def.cell;
    this.draw();
    return this;
  }

  /** Nouvelle humeur ; `snap` = sans transition (première réplique). */
  setMood(mood: Mood, snap = false): void {
    this.mood = mood;
    if (snap) {
      this.l.snap(BROW_POSES[mood].l);
      this.r.snap(BROW_POSES[mood].r);
      this.kick = this.kickV = 0;
      this.draw();
    }
  }

  /** Sursaut des deux sourcils (force 0..1) ; `tilt` > 0 : le gauche monte plus. */
  accent(strength: number, tilt = 0): void {
    this.kickV -= strength * ACCENT_LIFT * 14;
    this.tilt = tilt;
  }

  /** Caractère frappé par le typewriter : sursaut sur « ! », « ? », mot en capitales. */
  char(ch: string): void {
    const a = accentOf(ch, this.prev);
    this.prev = ch;
    if (a) this.accent(a, ch === '?' ? 0.6 : 0);
  }

  update(dt: number, talking: boolean): void {
    const s = Math.min(dt, 50) / 1000;
    const pose = BROW_POSES[this.mood];
    this.l.step(pose.l, s);
    this.r.step(pose.r, s);
    // en parole, un micro-sursaut de temps en temps ; au repos, plus rien
    if (talking) {
      this.nextTic -= s;
      if (this.nextTic <= 0) {
        this.accent(0.22 + Math.random() * 0.2);
        this.nextTic = 0.6 + Math.random() * 0.9;
      }
    } else this.nextTic = 0.4;
    this.kickV += (-this.kick * KICK_K - this.kickV * KICK_D) * s;
    this.kick += this.kickV * s;
    this.draw();
  }

  private draw(): void {
    const g = this.g;
    g.clear();
    this.plate(this.def.l, this.l.x, -1, this.kick * (1 + this.tilt));
    this.plate(this.def.r, this.r.x, 1, this.kick * (1 - this.tilt));
  }

  /** Une plaque ; `side` -1 = gauche (bout intérieur à droite), 1 = droite. */
  private plate(spot: BrowSpot, p: BrowPose, side: -1 | 1, kick: number): void {
    const { fill, top, edge } = this.def;
    const g = this.g;
    const k = this.k;
    const half = (spot.len * p.len) / 2;
    // bout intérieur relevé : rotation de sens opposé de chaque côté
    const a = Phaser.Math.DegToRad(side < 0 ? -p.rot : p.rot);
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    const cx = spot.x;
    const cy = spot.y + (p.y + kick) * spot.eye;
    const upper: Phaser.Math.Vector2[] = [];
    const lower: Phaser.Math.Vector2[] = [];
    const lip: Phaser.Math.Vector2[] = [];
    const pt = (x: number, y: number) => new Phaser.Math.Vector2(this.left + (cx + x * cos - y * sin) * k, this.top + (cy + x * sin + y * cos) * k);
    for (let i = 0; i <= SEG; i++) {
      const u = (i / SEG) * 2 - 1; // -1 gauche → 1 droite
      const inner = side < 0 ? (u + 1) / 2 : (1 - u) / 2;
      // plaque en coin, plus épaisse côté nez ; bouts arrondis ; cambrure en arc
      const th = spot.thick * (0.82 + 0.3 * inner) * (0.55 + 0.45 * Math.sqrt(1 - Math.pow(Math.abs(u), 6)));
      const arc = -p.bend * spot.thick * 0.9 * (1 - u * u);
      const x = u * half;
      upper.push(pt(x, arc - th / 2));
      lower.push(pt(x, arc + th / 2));
      lip.push(pt(x, arc - th / 2 + Math.min(2.2, th * 0.22)));
    }
    const poly = [...upper, ...lower.reverse()];
    // ombre portée sur le corps
    g.fillStyle(0x000000, 0.28);
    g.fillPoints(
      poly.map((v) => new Phaser.Math.Vector2(v.x + 1 * k, v.y + 2.6 * k)),
      true,
    );
    g.fillStyle(fill, 1);
    g.fillPoints(poly, true);
    // biseau éclairé du haut
    g.lineStyle(1.8 * k, top, 0.85);
    g.strokePoints(lip.slice(1, -1));
    g.lineStyle(1.3 * k, edge, 0.95);
    g.strokePoints(poly, true);
  }
}
