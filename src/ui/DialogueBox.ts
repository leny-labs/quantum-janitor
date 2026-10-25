import Phaser from 'phaser';
import type { DialogueView } from '../engine/DialogueRunner';
import type { CharacterDef } from '../engine/types';
import { COLORS, FONT, H, W, hex, setCursor } from './theme';

const PANEL_Y = 450;
const PANEL_H = H - PANEL_Y - 12;
const PORTRAIT = 170;

/** Boîte de dialogue : portrait placeholder, nom, texte, choix. */
export class DialogueBox implements DialogueView {
  private root: Phaser.GameObjects.Container;
  private blocker: Phaser.GameObjects.Rectangle;
  private portraitBg: Phaser.GameObjects.Rectangle;
  private portraitText: Phaser.GameObjects.Text;
  private nameText: Phaser.GameObjects.Text;
  private bodyText: Phaser.GameObjects.Text;
  private hint: Phaser.GameObjects.Text;
  private choiceTexts: Phaser.GameObjects.Text[] = [];
  private advance: (() => void) | null = null;
  private shownAt = 0;
  private keyHandler: (e: KeyboardEvent) => void;

  constructor(private scene: Phaser.Scene) {
    this.blocker = scene.add
      .rectangle(0, 0, W, H, 0x000000, 0.25)
      .setOrigin(0)
      .setDepth(900)
      .setInteractive()
      .setVisible(false);
    this.blocker.on('pointerdown', () => this.tryAdvance());

    this.root = scene.add.container(0, 0).setDepth(901).setVisible(false);
    const panel = scene.add
      .rectangle(12, PANEL_Y, W - 24, PANEL_H, COLORS.panel, 0.96)
      .setOrigin(0)
      .setStrokeStyle(3, COLORS.panelBorder);
    this.portraitBg = scene.add.rectangle(32, PANEL_Y + 40, PORTRAIT, PORTRAIT - 20, 0x444444).setOrigin(0).setStrokeStyle(2, 0xffffff);
    this.portraitText = scene.add
      .text(32 + PORTRAIT / 2, PANEL_Y + 40 + (PORTRAIT - 20) / 2, '', {
        fontFamily: FONT,
        fontSize: '30px',
        color: '#ffffff',
        align: 'center',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.nameText = scene.add.text(32, PANEL_Y + 10, '', { fontFamily: FONT, fontSize: '22px', color: COLORS.accent, fontStyle: 'bold' });
    this.bodyText = scene.add.text(230, PANEL_Y + 44, '', {
      fontFamily: FONT,
      fontSize: '24px',
      color: COLORS.text,
      wordWrap: { width: W - 230 - 50 },
      lineSpacing: 6,
    });
    this.hint = scene.add
      .text(W - 34, PANEL_Y + PANEL_H - 14, '▼ clic / espace', { fontFamily: FONT, fontSize: '16px', color: COLORS.dim })
      .setOrigin(1, 1);
    this.root.add([panel, this.portraitBg, this.portraitText, this.nameText, this.bodyText, this.hint]);

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
    this.portraitBg.setVisible(hasPortrait);
    this.portraitText.setVisible(hasPortrait);
    this.nameText.setText(speaker && speaker.id !== 'narrateur' ? speaker.name : '');
    if (speaker) {
      this.portraitBg.setFillStyle(hex(speaker.color));
      this.portraitText.setText(speaker.portrait ?? '');
    }
    this.bodyText.setX(hasPortrait ? 230 : 40);
    this.bodyText.setWordWrapWidth(W - (hasPortrait ? 230 : 40) - 50);
    this.bodyText.setFontStyle(speaker?.id === 'narrateur' ? 'italic' : 'normal');
  }

  private clearChoices(): void {
    this.choiceTexts.forEach((t) => t.destroy());
    this.choiceTexts = [];
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
    this.nameText.setText('Que répondre ?');
    this.bodyText.setText('');
    this.hint.setVisible(false);
    this.open();
    return new Promise((resolve) => {
      const lineH = Math.min(44, (PANEL_H - 50) / choices.length);
      choices.forEach((c, i) => {
        const t = this.scene.add
          .text(56, PANEL_Y + 46 + i * lineH, `${i + 1}. ${c}`, {
            fontFamily: FONT,
            fontSize: '23px',
            color: COLORS.text,
            wordWrap: { width: W - 120 },
          })
          .setInteractive({ useHandCursor: true });
        t.on('pointerover', () => t.setColor(COLORS.hover));
        t.on('pointerout', () => t.setColor(COLORS.text));
        t.on('pointerdown', () => {
          if (this.scene.time.now - this.shownAt < 180) return;
          this.clearChoices();
          resolve(i);
        });
        this.root.add(t);
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
