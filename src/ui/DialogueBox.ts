import Phaser from 'phaser';
import type { DialogueView } from '../engine/DialogueRunner';
import type { CharacterDef } from '../engine/types';
import { portraitKey } from '../three/Studio';
import { drawHazard, drawPanel } from './chrome';
import { COLORS, FONT, H, W, hex, setCursor } from './theme';

const PANEL_Y = 462;
const PANEL_X = 20;
const PANEL_W = W - 40;
const PANEL_H = H - PANEL_Y - 16;
const PORTRAIT = 176;
const TEXT_X = PANEL_X + PORTRAIT + 48;

/** Boîte de dialogue : portrait 3D, cartouche de nom, texte, choix. */
export class DialogueBox implements DialogueView {
  private root: Phaser.GameObjects.Container;
  private blocker: Phaser.GameObjects.Rectangle;
  private portraitFrame: Phaser.GameObjects.Graphics;
  private portraitImg: Phaser.GameObjects.Image;
  private portraitBg: Phaser.GameObjects.Rectangle;
  private portraitText: Phaser.GameObjects.Text;
  private nameTab: Phaser.GameObjects.Graphics;
  private nameText: Phaser.GameObjects.Text;
  private channel: Phaser.GameObjects.Text;
  private bodyText: Phaser.GameObjects.Text;
  private hint: Phaser.GameObjects.Text;
  private choiceTexts: Phaser.GameObjects.Text[] = [];
  private choiceDecor: Phaser.GameObjects.GameObject[] = [];
  private advance: (() => void) | null = null;
  private shownAt = 0;
  private keyHandler: (e: KeyboardEvent) => void;

  constructor(private scene: Phaser.Scene) {
    this.blocker = scene.add
      .rectangle(0, 0, W, H, COLORS.ink, 0.35)
      .setOrigin(0)
      .setDepth(900)
      .setInteractive()
      .setVisible(false);
    this.blocker.on('pointerdown', () => this.tryAdvance());

    this.root = scene.add.container(0, 0).setDepth(901).setVisible(false);
    const panel = scene.add.graphics();
    drawPanel(panel, PANEL_X, PANEL_Y, PANEL_W, PANEL_H, { fill: COLORS.panel, fillAlpha: 0.96, cut: 22, brackets: true });
    // trame de scanlines discrète
    panel.fillStyle(0xffffff, 0.025);
    for (let y = PANEL_Y + 6; y < PANEL_Y + PANEL_H - 6; y += 4) panel.fillRect(PANEL_X + 6, y, PANEL_W - 12, 1);
    drawHazard(panel, PANEL_X + PANEL_W - 190, PANEL_Y + PANEL_H - 10, 150, 4, 0.8);

    const px = PANEL_X + 22;
    const py = PANEL_Y + 22;
    const ps = PANEL_H - 44;
    this.portraitFrame = scene.add.graphics();
    drawPanel(this.portraitFrame, px - 4, py - 4, PORTRAIT + 8, ps + 8, { fill: COLORS.ink, edge: 0xffffff, edgeAlpha: 0.5, cut: 14, glow: false });
    this.portraitBg = scene.add.rectangle(px, py, PORTRAIT, ps, 0x444444).setOrigin(0);
    this.portraitImg = scene.add.image(px + PORTRAIT / 2, py + ps / 2, '__WHITE').setVisible(false);
    this.portraitText = scene.add
      .text(px + PORTRAIT / 2, py + ps / 2, '', { fontFamily: FONT, fontSize: '28px', color: '#ffffff', align: 'center', fontStyle: '700' })
      .setOrigin(0.5);
    const mask = scene.make.graphics({}, false).fillRect(px, py, PORTRAIT, ps).createGeometryMask();
    this.portraitImg.setMask(mask);

    this.nameTab = scene.add.graphics();
    this.nameText = scene.add.text(TEXT_X + 14, PANEL_Y - 2, '', { fontFamily: FONT, fontSize: '17px', fontStyle: '700', color: '#07050f' }).setOrigin(0, 0.5).setLetterSpacing(2);
    this.channel = scene.add
      .text(PANEL_X + PANEL_W - 28, PANEL_Y + 18, 'CANAL 7 · CONVERSATION ENREGISTRÉE POUR VOTRE SÉCURITÉ', { fontFamily: FONT, fontSize: '10px', fontStyle: '600', color: COLORS.dim })
      .setOrigin(1, 0.5)
      .setLetterSpacing(1.5);
    this.bodyText = scene.add.text(TEXT_X, PANEL_Y + 40, '', {
      fontFamily: FONT,
      fontSize: '23px',
      fontStyle: '500',
      color: COLORS.text,
      wordWrap: { width: PANEL_X + PANEL_W - TEXT_X - 40 },
      lineSpacing: 7,
    });
    this.hint = scene.add
      .text(PANEL_X + PANEL_W - 30, PANEL_Y + PANEL_H - 26, 'CONTINUER  ▼', { fontFamily: FONT, fontSize: '12px', fontStyle: '700', color: COLORS.accent })
      .setOrigin(1, 0.5)
      .setLetterSpacing(2);
    scene.tweens.add({ targets: this.hint, alpha: 0.35, duration: 650, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.root.add([panel, this.portraitFrame, this.portraitBg, this.portraitImg, this.portraitText, this.nameTab, this.nameText, this.channel, this.bodyText, this.hint]);

    this.keyHandler = (e: KeyboardEvent) => {
      if (!this.root.visible) return;
      if (e.key === ' ' || e.key === 'Enter') this.tryAdvance();
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= this.choiceTexts.length) this.choiceTexts[n - 1].emit('pointerdown');
    };
    window.addEventListener('keydown', this.keyHandler);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => window.removeEventListener('keydown', this.keyHandler));
  }

  get isOpen(): boolean {
    return this.root.visible;
  }

  private open(): void {
    this.blocker.setVisible(true);
    this.root.setVisible(true);
    this.shownAt = this.scene.time.now;
    setCursor(this.scene, 'default');
  }

  private tryAdvance(): void {
    // évite que le clic qui a ouvert la boîte ne la referme aussitôt
    if (!this.advance || this.scene.time.now - this.shownAt < 180) return;
    const a = this.advance;
    this.advance = null;
    a();
  }

  private setSpeaker(speaker: CharacterDef | null): void {
    const hasPortrait = !!speaker?.portrait;
    const key = speaker ? portraitKey(speaker.id) : '';
    const has3d = hasPortrait && this.scene.textures.exists(key);
    this.portraitFrame.setVisible(hasPortrait);
    this.portraitBg.setVisible(hasPortrait && !has3d);
    this.portraitText.setVisible(hasPortrait && !has3d);
    this.portraitImg.setVisible(has3d);
    if (has3d) {
      this.portraitImg.setTexture(key);
      const ps = PANEL_H - 44;
      this.portraitImg.setScale(Math.max(PORTRAIT, ps) / this.portraitImg.width);
    }
    const named = !!speaker && speaker.id !== 'narrateur' && !!speaker.name;
    this.setName(named ? speaker!.name : '', speaker?.color);
    if (speaker && !has3d) {
      this.portraitBg.setFillStyle(hex(speaker.color));
      this.portraitText.setText(speaker.portrait ?? '');
    }
    const x = hasPortrait ? TEXT_X : PANEL_X + 40;
    this.bodyText.setX(x);
    this.bodyText.setWordWrapWidth(PANEL_X + PANEL_W - x - 40);
    const narr = speaker?.id === 'narrateur';
    this.bodyText.setFontStyle(narr ? 'italic 500' : '500');
    this.bodyText.setColor(narr ? '#cfc6ee' : COLORS.text);
  }

  private setName(name: string, color?: string): void {
    const g = this.nameTab;
    g.clear();
    this.nameText.setText(name.toUpperCase());
    if (!name) return;
    const x = this.bodyText.x - 2;
    this.nameText.setX(x + 16);
    const w = this.nameText.width + 34;
    const c = hex(color, hex(COLORS.accent));
    // couleurs sombres (narrateur, Reine) : liseré clair et texte clair
    const dark = Phaser.Display.Color.IntegerToColor(c).v < 0.55;
    g.fillStyle(c, 1);
    g.fillPoints([new Phaser.Geom.Point(x, PANEL_Y - 16), new Phaser.Geom.Point(x + w, PANEL_Y - 16), new Phaser.Geom.Point(x + w + 14, PANEL_Y + 12), new Phaser.Geom.Point(x, PANEL_Y + 12)], true);
    g.lineStyle(1.5, dark ? 0xffffff : COLORS.ink, dark ? 0.6 : 0.8);
    g.strokePoints([new Phaser.Geom.Point(x, PANEL_Y - 16), new Phaser.Geom.Point(x + w, PANEL_Y - 16), new Phaser.Geom.Point(x + w + 14, PANEL_Y + 12), new Phaser.Geom.Point(x, PANEL_Y + 12)], true);
    this.nameText.setColor(dark ? '#ffffff' : '#07050f');
  }

  private clearChoices(): void {
    this.choiceTexts.forEach((t) => t.destroy());
    this.choiceDecor.forEach((t) => t.destroy());
    this.choiceTexts = [];
    this.choiceDecor = [];
  }

  showLine(speaker: CharacterDef | null, text: string): Promise<void> {
    this.clearChoices();
    this.setSpeaker(speaker);
    this.bodyText.setText(text);
    this.hint.setVisible(true);
    this.open();
    return new Promise((resolve) => (this.advance = resolve));
  }

  showChoices(choices: string[]): Promise<number> {
    this.clearChoices();
    this.setSpeaker(null);
    this.bodyText.setText('');
    this.setName('Réponse — formulaire R-12', COLORS.hover);
    this.hint.setVisible(false);
    this.open();
    return new Promise((resolve) => {
      const top = PANEL_Y + 34;
      const lineH = Math.min(48, (PANEL_H - 50) / choices.length);
      choices.forEach((c, i) => {
        const y = top + i * lineH;
        const bar = this.scene.add.graphics();
        const t = this.scene.add
          .text(PANEL_X + 84, y + lineH / 2, c, { fontFamily: FONT, fontSize: '22px', fontStyle: '500', color: COLORS.text, wordWrap: { width: PANEL_W - 140 } })
          .setOrigin(0, 0.5)
          .setInteractive({ useHandCursor: true });
        const paint = (on: boolean) => {
          bar.clear();
          if (on) {
            bar.fillStyle(hex(COLORS.hover), 0.12);
            bar.fillRect(PANEL_X + 30, y + 3, PANEL_W - 60, lineH - 6);
          }
          drawPanel(bar, PANEL_X + 40, y + lineH / 2 - 14, 30, 28, { fill: on ? hex(COLORS.hover) : COLORS.panelHi, edge: hex(on ? COLORS.hover : COLORS.accent), cut: 7, glow: false });
          t.setColor(on ? COLORS.hover : COLORS.text);
        };
        const n = this.scene.add
          .text(PANEL_X + 55, y + lineH / 2, String(i + 1), { fontFamily: FONT, fontSize: '15px', fontStyle: '700', color: COLORS.text })
          .setOrigin(0.5);
        paint(false);
        t.on('pointerover', () => {
          paint(true);
          n.setColor('#07050f');
        });
        t.on('pointerout', () => {
          paint(false);
          n.setColor(COLORS.text);
        });
        t.on('pointerdown', () => {
          if (this.scene.time.now - this.shownAt < 180) return;
          this.clearChoices();
          resolve(i);
        });
        this.root.add([bar, n, t]);
        this.choiceDecor.push(bar, n);
        this.choiceTexts.push(t);
      });
    });
  }

  close(): void {
    this.clearChoices();
    this.advance = null;
    this.blocker.setVisible(false);
    this.root.setVisible(false);
  }
}
