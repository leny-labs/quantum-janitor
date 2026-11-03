// Overlay « Plan de la Station » (ch.1, docs/CHAPTER1.md §4.1) : plan administratif tamponné,
// une bande par étage / aile, une case par zone. Case découverte = warp ; verrouillée = grisée
// + « ACCÈS REFUSÉ — motif » ; inconnue = hachurée « ??? ». Fermer : bouton, Échap, clic dehors.
import Phaser from 'phaser';
import type { GameState } from '../engine/GameState';
import { mapText, zoneState, type StationMap, type ZoneState } from '../engine/stationMap';
import { lang, t } from '../i18n';
import { makeButton } from './Button';
import { cssToGame, isTouch } from './input';
import { pickupCue, stampClonk } from './sfx';
import { COLORS, DISPLAY, FONT, H, MONO, W, hex } from './theme';

const PAPER = 0xf3ecd8;
const GRID = 0x9fb4d8;
const INK = '#2a2830';
const RED = '#c0392b';
const TEAL = 0x1f7f73;

export class StationMapOverlay {
  private root: Phaser.GameObjects.Container;
  private onKey: (e: KeyboardEvent) => void;
  private closed = false;

  constructor(
    private scene: Phaser.Scene,
    map: StationMap,
    state: GameState,
    sceneExists: (id: string) => boolean,
    private onWarp: (sceneId: string) => void,
    private onClose: () => void,
  ) {
    const touch = isTouch();
    const L = lang();
    this.root = scene.add.container(0, 0).setDepth(2500);
    const dim = scene.add.rectangle(0, 0, W, H, COLORS.ink, 0.72).setOrigin(0).setInteractive();
    dim.on('pointerdown', () => this.close());
    this.root.add(dim);

    // feuille : papier crème quadrillé, bord découpé, légère rotation (posée sur le bureau)
    const px = touch ? 20 : 70;
    const py = touch ? 12 : 28;
    const pw = W - px * 2;
    const ph = H - py * 2;
    const sheet = scene.add.container(px, py);
    sheet.setAngle(touch ? 0 : -0.6);
    const paper = scene.add.graphics();
    paper.fillStyle(0x000000, 0.35);
    paper.fillRect(8, 10, pw, ph);
    paper.fillStyle(PAPER, 1);
    paper.fillRect(0, 0, pw, ph);
    paper.lineStyle(1, GRID, 0.35);
    for (let x = 0; x <= pw; x += 24) paper.lineBetween(x, 0, x, ph);
    for (let y = 0; y <= ph; y += 24) paper.lineBetween(0, y, pw, y);
    paper.lineStyle(3, hex(INK), 0.8);
    paper.strokeRect(10, 10, pw - 20, ph - 20);
    // la feuille absorbe les clics (seul le fond sombre ferme)
    const block = scene.add.zone(0, 0, pw, ph).setOrigin(0).setInteractive();
    sheet.add([paper, block]);

    sheet.add(
      scene.add.text(30, 22, t('map.title'), { fontFamily: DISPLAY, fontSize: '28px', color: INK }).setLetterSpacing(2),
    );
    sheet.add(scene.add.text(32, 60, t('map.sub'), { fontFamily: FONT, fontSize: '13px', fontStyle: '700', color: '#5a5870' }).setLetterSpacing(2));
    // tampon « VU » de l'édition 1987
    const vu = scene.add.text(pw - 290, 30, t('map.stamp'), { fontFamily: DISPLAY, fontSize: '26px', color: RED }).setAngle(-9).setAlpha(0.7);
    sheet.add(vu);

    // bandes
    const top = 92;
    const foot = 64;
    const rowH = (ph - top - foot) / Math.max(1, map.bands.length);
    const labelW = touch ? 250 : 320;
    const boxH = Math.min(rowH - 10, Math.max(touch ? cssToGame(scene, 44) : 54, 54));
    map.bands.forEach((band, i) => {
      const y = top + i * rowH;
      const g = scene.add.graphics();
      g.fillStyle(i % 2 ? 0xe9e0c6 : 0xefe7d0, 0.9);
      g.fillRect(14, y, pw - 28, rowH - 4);
      g.lineStyle(1, hex(INK), 0.25);
      g.lineBetween(14, y + rowH - 4, pw - 14, y + rowH - 4);
      sheet.add(g);
      sheet.add(
        scene.add
          .text(26, y + rowH / 2 - 2, mapText(band.label, L), { fontFamily: FONT, fontSize: touch ? '13px' : '14px', fontStyle: '700', color: INK, wordWrap: { width: labelW - 44 } })
          .setOrigin(0, 0.5)
          .setLetterSpacing(1),
      );
      const n = band.zones.length;
      const avail = pw - labelW - 40;
      const gap = 10;
      const bw = Math.min(260, (avail - gap * (n - 1)) / n);
      band.zones.forEach((z, k) => {
        const x = labelW + k * (bw + gap);
        const st = zoneState(state, z, sceneExists);
        sheet.add(this.zoneBox(x, y + (rowH - 4 - boxH) / 2, bw, boxH, mapText(z.label, L), mapText(z.refused, L), st, () => this.warp(z.scene)));
      });
    });

    // légende + fermer
    const legend = scene.add.text(26, ph - foot + 18, t('map.legend'), { fontFamily: FONT, fontSize: '13px', fontStyle: '600', color: '#5a5870' });
    sheet.add(legend);
    this.root.add(sheet);
    const close = makeButton(scene, px + pw - 24, py + ph - foot / 2 - 4, t('map.close'), () => this.close(), { align: 'right', size: 18, kicker: t('map.closeKicker') });
    this.root.add(close);

    this.root.setAlpha(0).setScale(0.96);
    this.root.setPosition(W * 0.02, H * 0.02);
    scene.tweens.add({ targets: this.root, alpha: 1, scale: 1, x: 0, y: 0, duration: 220, ease: 'Quad.easeOut' });
    pickupCue();

    this.onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') this.close();
    };
    window.addEventListener('keydown', this.onKey);
  }

  private zoneBox(x: number, y: number, w: number, h: number, label: string, refused: string, st: ZoneState, warp: () => void): Phaser.GameObjects.Container {
    const s = this.scene;
    const c = s.add.container(x, y);
    const g = s.add.graphics();
    const paint = (hover: boolean) => {
      g.clear();
      if (st === 'unknown') {
        g.fillStyle(0xd8d0b8, 1);
        g.fillRect(0, 0, w, h);
        // hachures diagonales (bas-gauche → haut-droite), découpées au cadre
        g.lineStyle(1, hex(INK), 0.25);
        for (let k = -h; k < w; k += 10) {
          let [x0, y0, x1, y1] = [k, h, k + h, 0];
          if (x0 < 0) [y0, x0] = [h + x0, 0];
          if (x1 > w) [y1, x1] = [x1 - w, w];
          g.lineBetween(x0, y0, x1, y1);
        }
        g.lineStyle(2, hex(INK), 0.35);
        g.strokeRect(0, 0, w, h);
        return;
      }
      const fill = st === 'here' ? 0xffd166 : st === 'open' ? (hover ? 0xd9fff4 : 0xffffff) : st === 'seen' ? 0xece6d4 : 0xc9c4b4;
      g.fillStyle(fill, 1);
      g.fillRect(0, 0, w, h);
      g.lineStyle(st === 'open' ? 3 : 2, st === 'open' ? TEAL : hex(INK), st === 'locked' ? 0.4 : 0.9);
      g.strokeRect(0, 0, w, h);
    };
    paint(false);
    c.add(g);
    const small = h < 60;
    if (st === 'unknown') {
      c.add(s.add.text(w / 2, h / 2, t('map.unknown'), { fontFamily: DISPLAY, fontSize: '22px', color: '#8a8470' }).setOrigin(0.5));
    } else {
      const ty = st === 'open' ? h / 2 : h * 0.32;
      c.add(
        s.add
          .text(w / 2, ty, label, { fontFamily: FONT, fontSize: small ? '14px' : '15px', fontStyle: '700', color: st === 'locked' ? '#6a6658' : INK, align: 'center', wordWrap: { width: w - 12 } })
          .setOrigin(0.5),
      );
    }
    if (st === 'seen') {
      c.add(s.add.text(w / 2, h * 0.74, t('map.seen'), { fontFamily: FONT, fontSize: '11px', fontStyle: '700', color: '#5a5870' }).setOrigin(0.5).setLetterSpacing(1));
    }
    if (st === 'here') {
      c.add(s.add.text(w / 2, h * 0.74, t('map.here'), { fontFamily: FONT, fontSize: '12px', fontStyle: '700', color: RED }).setOrigin(0.5).setLetterSpacing(2));
    }
    if (st === 'locked') {
      const stamp = s.add
        .text(w / 2, h * 0.72, t('map.refused', { reason: refused || t('map.refusedDefault') }), { fontFamily: MONO, fontSize: '11px', fontStyle: 'bold', color: RED, align: 'center', wordWrap: { width: w - 8 } })
        .setOrigin(0.5)
        .setAngle(-3);
      c.add(stamp);
    }
    if (st === 'open') {
      const hit = s.add.zone(0, 0, w, h).setOrigin(0).setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => paint(true));
      hit.on('pointerout', () => paint(false));
      hit.on('pointerup', () => warp());
      c.add(hit);
    } else if (st === 'locked') {
      // un tampon rouge qui refuse, pour le plaisir
      const hit = s.add.zone(0, 0, w, h).setOrigin(0).setInteractive();
      hit.on('pointerup', () => {
        stampClonk();
        s.tweens.add({ targets: c, x: c.x + 4, duration: 50, yoyo: true, repeat: 2 });
      });
      c.add(hit);
    }
    return c;
  }

  private warp(sceneId: string): void {
    if (this.closed) return;
    this.dispose();
    this.onWarp(sceneId);
  }

  close(): void {
    if (this.closed) return;
    this.dispose();
    this.onClose();
  }

  private dispose(): void {
    this.closed = true;
    window.removeEventListener('keydown', this.onKey);
    this.root.destroy();
  }

  get isOpen(): boolean {
    return !this.closed;
  }
}
