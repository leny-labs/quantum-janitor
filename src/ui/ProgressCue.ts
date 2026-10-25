// Micro-avancées façon Agent A : chaque vrai progrès (objet obtenu, flag posé,
// zone ouverte) déclenche un retour bref et joyeux — étincelles dessinées,
// anneau qui s'ouvre, case d'inventaire qui pulse, petit carillon. Jamais
// bloquant (≤ 400 ms), une seule fois par flag / objet, pas de spam.
import Phaser from 'phaser';
import type { GameState } from '../engine/GameState';
import { slotRect } from '../engine/Inventory';
import { COLORS, ROOM_H, hex } from './theme';

const DURATION = 380;
/** Écart minimal entre deux cues (ms) : plusieurs changements d'un coup = un seul retour. */
const DEBOUNCE = 250;

export class ProgressCue {
  /** Flags / objets déjà connus : un cue au plus par élément, chargement compris. */
  private seenFlags: Set<string>;
  private seenItems: Set<string>;
  private last = -Infinity;
  /** Dernier clic dans la pièce : c'est là que le joueur a « fait avancer » les choses. */
  private anchor = { x: 640, y: ROOM_H / 2 };
  /** Cue à jouer dès que rien ne recouvre l'écran (l'objet « atterrit » à la fermeture du dialogue). */
  private pending: { play: () => void; item: boolean } | null = null;

  constructor(
    private scene: Phaser.Scene,
    private state: GameState,
    private blocked: () => boolean = () => false,
  ) {
    this.seenFlags = new Set(state.flags);
    this.seenItems = new Set(state.items);
    scene.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.y < ROOM_H && !this.blocked()) this.anchor = { x: p.x, y: p.y };
    });
    scene.events.on(Phaser.Scenes.Events.UPDATE, this.flush);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.events.off(Phaser.Scenes.Events.UPDATE, this.flush));
  }

  private flush = (): void => {
    if (!this.pending || this.blocked()) return;
    const { play } = this.pending;
    this.pending = null;
    const now = this.scene.time.now;
    if (now - this.last < DEBOUNCE) return;
    this.last = now;
    play();
  };

  /** À appeler à chaque changement d'état (GameState.onChange). */
  check(): void {
    const items = this.state.items.filter((i) => !this.seenItems.has(i));
    const flags = [...this.state.flags].filter((f) => !this.seenFlags.has(f));
    items.forEach((i) => this.seenItems.add(i));
    flags.forEach((f) => this.seenFlags.add(f));
    if (!items.length && !flags.length) return;
    const item = items[items.length - 1];
    const { x, y } = this.anchor;
    const play = item
      ? () => {
          // nouvel objet : la case qui le reçoit s'illumine (si l'objet n'a pas déjà été consommé)
          const i = this.state.items.indexOf(item);
          if (i < 0) return;
          const slot = slotRect(i);
          this.pulse(slot.x, slot.y, slot.size);
          this.burst(slot.x, slot.y, hex(COLORS.hover), 7);
          chime([988, 1319]);
        }
      : () => {
          this.burst(x, Math.min(y, ROOM_H - 24), hex(COLORS.accent), 6);
          chime([784, 1175]);
        };
    // joué à la frame suivante : une réplique lancée dans la foulée (give → say)
    // ouvre le dialogue d'abord, et le cue attend alors sa fermeture.
    // Un objet prime sur un simple flag ; un seul cue à la fois.
    if (!this.pending || item || !this.pending.item) this.pending = { play, item: !!item };
  }

  /** Anneau qui s'ouvre + étincelles en étoile (trait sombre, façon illustration). */
  private burst(x: number, y: number, color: number, count: number): void {
    const s = this.scene;
    const ring = s.add.graphics({ x, y }).setDepth(850);
    const r = { t: 0 };
    s.tweens.add({
      targets: r,
      t: 1,
      duration: DURATION * 0.8,
      ease: 'Cubic.easeOut',
      onUpdate: () => {
        ring.clear();
        ring.lineStyle(5, COLORS.ink, 0.5 * (1 - r.t));
        ring.strokeCircle(0, 0, 10 + r.t * 34);
        ring.lineStyle(2.5, color, 1 - r.t);
        ring.strokeCircle(0, 0, 10 + r.t * 34);
      },
      onComplete: () => ring.destroy(),
    });
    const phase = Math.random() * Math.PI * 2;
    for (let i = 0; i < count; i++) {
      const a = phase + (i / count) * Math.PI * 2;
      const dist = 46 + Math.random() * 26;
      const star = s.add.graphics({ x, y }).setDepth(851);
      drawSpark(star, i % 3 === 0 ? 0xffffff : color, 7 + Math.random() * 3);
      star.setScale(0.4).setRotation(Math.random());
      s.tweens.add({
        targets: star,
        x: x + Math.cos(a) * dist,
        y: y + Math.sin(a) * dist - 8,
        scale: { from: 1.1, to: 0.2 },
        alpha: { from: 1, to: 0 },
        rotation: star.rotation + 1.2,
        duration: DURATION * (0.8 + Math.random() * 0.2),
        ease: 'Quad.easeOut',
        onComplete: () => star.destroy(),
      });
    }
  }

  /** Cadre lumineux autour d'une case d'inventaire, qui gonfle et s'efface. */
  private pulse(x: number, y: number, size: number): void {
    const g = this.scene.add.graphics({ x, y }).setDepth(849);
    g.lineStyle(3, hex(COLORS.hover), 1);
    g.strokeRoundedRect(-size / 2, -size / 2, size, size, 10);
    g.fillStyle(hex(COLORS.hover), 0.18);
    g.fillRoundedRect(-size / 2, -size / 2, size, size, 10);
    this.scene.tweens.add({
      targets: g,
      scale: { from: 1, to: 1.14 },
      alpha: { from: 1, to: 0 },
      duration: DURATION,
      ease: 'Cubic.easeOut',
      onComplete: () => g.destroy(),
    });
  }
}

/** Étincelle à 4 branches, liseré sombre. */
function drawSpark(g: Phaser.GameObjects.Graphics, color: number, r: number): void {
  const pts: Phaser.Types.Math.Vector2Like[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const d = i % 2 ? r * 0.32 : r;
    pts.push({ x: Math.cos(a) * d, y: Math.sin(a) * d });
  }
  g.lineStyle(3, COLORS.ink, 0.7);
  g.strokePoints(pts, true);
  g.fillStyle(color, 1);
  g.fillPoints(pts, true);
}

let audio: AudioContext | null = null;

/** Carillon discret : notes sinus courtes, enveloppe percussive. */
function chime(freqs: number[]): void {
  try {
    audio ??= new AudioContext();
    if (audio.state === 'suspended') void audio.resume();
    const t0 = audio.currentTime;
    freqs.forEach((f, i) => {
      const t = t0 + i * 0.07;
      const osc = audio!.createOscillator();
      const gain = audio!.createGain();
      osc.type = 'triangle';
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.05, t + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      osc.connect(gain).connect(audio!.destination);
      osc.start(t);
      osc.stop(t + 0.24);
    });
  } catch {
    // pas d'audio (navigateur restreint) : le retour visuel suffit
  }
}
