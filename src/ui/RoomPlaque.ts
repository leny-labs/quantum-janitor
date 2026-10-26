// Plaque signalétique de la pièce (en haut à gauche) : étiquette de station
// Klepsydra-9 biseautée, pictogramme sur languette jaune, nom en gros, secteur
// en sous-titre, liseré néon. À l'entrée dans une pièce : glisse depuis la
// gauche en clignotant comme un néon qui s'allume, puis se fait discrète.
import Phaser from 'phaser';
import type { RoomIcon, SceneDef } from '../engine/types';
import { uiPx } from './input';
import { COLORS, DISPLAY, FONT, hex } from './theme';

const X = 14;
const Y = 10;
const TAB = 46;
const PAD = 14;
/** Délai avant de passer en mode discret (ms). */
const CALM_AFTER = 3200;

function chamfer(x: number, y: number, w: number, h: number, c: number): Phaser.Geom.Point[] {
  return [
    new Phaser.Geom.Point(x, y),
    new Phaser.Geom.Point(x + w - c, y),
    new Phaser.Geom.Point(x + w, y + c),
    new Phaser.Geom.Point(x + w, y + h),
    new Phaser.Geom.Point(x + c, y + h),
    new Phaser.Geom.Point(x, y + h - c),
  ];
}

/** Pictogramme au trait (encre sombre sur la languette jaune), centré sur (cx, cy), ~26 px. */
function drawIcon(g: Phaser.GameObjects.Graphics, icon: RoomIcon | undefined, cx: number, cy: number): void {
  const ink = COLORS.ink;
  g.lineStyle(2.6, ink, 1);
  g.fillStyle(ink, 1);
  switch (icon) {
    case 'bucket': {
      // seau + anse
      g.strokePoints([new Phaser.Geom.Point(cx - 10, cy - 4), new Phaser.Geom.Point(cx - 7, cy + 11), new Phaser.Geom.Point(cx + 7, cy + 11), new Phaser.Geom.Point(cx + 10, cy - 4)], true);
      g.beginPath();
      g.arc(cx, cy - 4, 9, Math.PI, 0);
      g.strokePath();
      g.fillRect(cx - 7, cy + 1, 14, 2.5);
      break;
    }
    case 'corridor': {
      // couloir en perspective + flèche
      g.strokePoints([new Phaser.Geom.Point(cx - 12, cy - 11), new Phaser.Geom.Point(cx - 4, cy - 4), new Phaser.Geom.Point(cx - 4, cy + 4), new Phaser.Geom.Point(cx - 12, cy + 11)], false);
      g.strokePoints([new Phaser.Geom.Point(cx + 12, cy - 11), new Phaser.Geom.Point(cx + 4, cy - 4), new Phaser.Geom.Point(cx + 4, cy + 4), new Phaser.Geom.Point(cx + 12, cy + 11)], false);
      g.fillTriangle(cx - 2, cy - 3, cx - 2, cy + 3, cx + 2, cy);
      break;
    }
    case 'reactor': {
      // trèfle de radioactivité
      g.fillCircle(cx, cy, 2.8);
      for (let i = 0; i < 3; i++) {
        const a = -Math.PI / 2 + (i * Math.PI * 2) / 3;
        g.slice(cx, cy, 12, a - 0.5, a + 0.5, false);
        g.fillPath();
      }
      g.fillStyle(hex(COLORS.hover), 1);
      g.fillCircle(cx, cy, 5);
      g.fillStyle(ink, 1);
      g.fillCircle(cx, cy, 2.8);
      break;
    }
    case 'console': {
      // cadran + aiguille + boutons
      g.strokeRoundedRect(cx - 12, cy - 10, 24, 20, 3);
      g.beginPath();
      g.arc(cx, cy + 3, 7, Math.PI, 0);
      g.strokePath();
      g.lineBetween(cx, cy + 3, cx + 5, cy - 3);
      g.fillCircle(cx - 7, cy + 7, 1.6);
      g.fillCircle(cx + 7, cy + 7, 1.6);
      break;
    }
    default: {
      // anneau de station
      g.strokeCircle(cx, cy, 10);
      g.strokeCircle(cx, cy, 3.5);
      g.lineBetween(cx - 10, cy, cx - 3.5, cy);
      g.lineBetween(cx + 3.5, cy, cx + 10, cy);
    }
  }
}

export class RoomPlaque {
  private root: Phaser.GameObjects.Container;
  private glow: Phaser.GameObjects.Graphics;
  private plate: Phaser.GameObjects.Graphics;
  private name: Phaser.GameObjects.Text;
  private sector: Phaser.GameObjects.Text;
  private shown: string | null = null;
  private calm: Phaser.Time.TimerEvent | null = null;

  constructor(private scene: Phaser.Scene) {
    this.glow = scene.add.graphics();
    this.plate = scene.add.graphics();
    this.name = scene.add.text(0, 0, '', { fontFamily: DISPLAY, fontSize: '21px', color: '#f6efe2' }).setOrigin(0, 0.5).setShadow(2, 2, '#07050f', 0, false, true);
    this.sector = scene.add.text(0, 0, '', { fontFamily: FONT, fontSize: '12px', fontStyle: '700', color: COLORS.accent }).setOrigin(0, 0.5).setLetterSpacing(2.5);
    this.root = scene.add.container(X, Y, [this.glow, this.plate, this.name, this.sector]).setDepth(700);
    // au doigt : la plaque grandit pour que le nom fasse ≥ 14 px CSS
    this.root.setScale(uiPx(scene, 21, 14) / 21);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.calm?.remove());
  }

  /** Affiche la plaque de la pièce ; l'animation d'entrée ne joue qu'au changement de pièce. */
  show(def: SceneDef): void {
    if (this.shown === def.id) return;
    const first = this.shown === null;
    this.shown = def.id;
    this.draw(def);
    this.enter(first);
  }

  private draw(def: SceneDef): void {
    const sector = (def.sector ?? '').toUpperCase();
    this.name.setText(def.title);
    this.sector.setText(sector).setVisible(!!sector);
    const tx = TAB + PAD;
    const h = sector ? 58 : 44;
    const w = Math.ceil(tx + Math.max(this.name.width, this.sector.width) + PAD + 10);
    this.name.setPosition(tx, sector ? 22 : h / 2);
    this.sector.setPosition(tx, 44);
    const cut = 12;
    const accent = hex(COLORS.accent);
    const amber = hex(COLORS.hover);

    // halo néon (calque séparé : il clignote à l'allumage puis s'atténue)
    const gl = this.glow;
    gl.clear();
    for (const [lw, a] of [[12, 0.07], [7, 0.12], [3.5, 0.2]] as const) {
      gl.lineStyle(lw, accent, a);
      gl.strokePoints(chamfer(0, 0, w, h, cut), true);
    }

    const g = this.plate;
    g.clear();
    // ombre portée « cartoon » décalée
    g.fillStyle(COLORS.ink, 0.55);
    g.fillPoints(chamfer(4, 5, w, h, cut), true);
    // plaque
    g.fillStyle(0x0f0b24, 0.92);
    g.fillPoints(chamfer(0, 0, w, h, cut), true);
    // reflet haut
    g.fillStyle(0xffffff, 0.06);
    g.fillRect(TAB, 3, w - TAB - cut, h * 0.36);
    // languette jaune du pictogramme, biseautée comme la plaque
    g.fillStyle(amber, 1);
    g.fillPoints([new Phaser.Geom.Point(0, 0), new Phaser.Geom.Point(TAB, 0), new Phaser.Geom.Point(TAB, h), new Phaser.Geom.Point(cut, h), new Phaser.Geom.Point(0, h - cut)], true);
    // bande de danger au pied de la languette
    g.fillStyle(COLORS.ink, 0.85);
    for (let x = -6; x < TAB; x += 9) g.fillPoints([new Phaser.Geom.Point(Math.max(0, x), h - 7), new Phaser.Geom.Point(x + 5, h - 7), new Phaser.Geom.Point(x + 3, h - 2), new Phaser.Geom.Point(Math.max(0, x - 2), h - 2)], true);
    drawIcon(g, def.icon, TAB / 2, (h - 7) / 2 + 1);
    // liseré néon + filet intérieur
    g.lineStyle(1.6, accent, 0.95);
    g.strokePoints(chamfer(0, 0, w, h, cut), true);
    g.lineStyle(1, accent, 0.25);
    g.strokePoints(chamfer(3, 3, w - 6, h - 6, cut - 2), true);
    // séparateur néon nom / secteur + rivets
    if (sector) {
      g.fillStyle(accent, 0.5);
      g.fillRect(tx, 33, w - tx - PAD - 4, 1.5);
    }
    g.fillStyle(0xffffff, 0.35);
    g.fillCircle(w - 7, h - 7, 1.8);
    g.fillCircle(TAB + 6, 6, 1.8);
  }

  private enter(first: boolean): void {
    const s = this.scene;
    const r = this.root;
    this.calm?.remove();
    s.tweens.killTweensOf([r, this.glow, this.name]);
    r.setAlpha(1);
    this.glow.setAlpha(1);
    this.name.setAlpha(1);
    // glisse depuis la gauche
    const k = r.scaleX;
    r.x = X - 40 * k;
    s.tweens.add({ targets: r, x: X, duration: first ? 420 : 300, delay: first ? 250 : 0, ease: 'Back.easeOut' });
    // néon qui s'allume : quelques ratés puis plein feu
    s.tweens.chain({
      targets: [this.glow, this.name],
      tweens: [
        { alpha: 0.15, duration: 60, delay: first ? 250 : 0 },
        { alpha: 1, duration: 50 },
        { alpha: 0.3, duration: 70 },
        { alpha: 1, duration: 40 },
        { alpha: 0.55, duration: 50, delay: 90 },
        { alpha: 1, duration: 120 },
      ],
    });
    // puis discret : halo éteint, plaque légèrement translucide
    this.calm = s.time.delayedCall(CALM_AFTER, () => {
      s.tweens.add({ targets: this.glow, alpha: 0.25, duration: 900, ease: 'Sine.easeInOut' });
      s.tweens.add({ targets: r, alpha: 0.82, duration: 900, ease: 'Sine.easeInOut' });
    });
  }
}
