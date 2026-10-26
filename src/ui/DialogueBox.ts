import Phaser from 'phaser';
import { SpriteTalk, TalkingPortrait, TypewriterMouth, typewrite } from 'talking-portrait';
import type { BlinkOptions, MouthOptions, TypewriteHandle } from 'talking-portrait';
import type { DialogueView } from '../engine/DialogueRunner';
import { t } from '../i18n';
import type { CharacterDef } from '../engine/types';
import { SHEET, portraitKey, sheetKey } from '../three/Studio';
import { drawHazard, drawPanel } from './chrome';
import { cssToGame, isTouch, uiPx } from './input';
import { duckMusic } from './music';
import { OverlayPlayer, overlayFor } from './PortraitOverlay';
import { Blipper } from './voice';
import { COLORS, FONT, H, W, hex, setCursor } from './theme';

const PANEL_Y = 462;
const PANEL_X = 20;
const PANEL_W = W - 40;
const PANEL_H = H - PANEL_Y - 16;
const PORTRAIT = 176;
const TEXT_X = PANEL_X + PORTRAIT + 48;
/** Vitesse du typewriter (caractères/s), partagée avec la bouche. */
const CPS = 32;
/** Hauteur minimale d'une ligne de choix au doigt (px CSS, recommandation ≥ 44). */
const CHOICE_TOUCH_CSS = 48;
/** Marges haut + bas autour de la liste de choix dans le panneau. */
const CHOICE_PAD = 50;
/** Taille du texte des répliques (px de jeu) ; au doigt, au moins BODY_CSS px CSS. */
const BODY_PX = 23;
const BODY_CSS = 16;
/** Marges haut (nom) + bas (« continuer ») autour du texte d'une réplique. */
const BODY_PAD_TOP = 40;
const BODY_PAD_BOTTOM = 44;

/**
 * Repli quand un personnage n'a pas de planche de sprites : ancrages bouche /
 * yeux sur le portrait 3D fixe (fractions de la texture 300×300 générée par
 * Studio). Les non-humains ont une bouche « LED » sans lèvres.
 */
const FACES: Record<string, { mouth: MouthOptions; blink?: BlinkOptions }> = {
  gary: {
    mouth: { x: 0.42, y: 0.73, width: 0.19, rotation: -0.08, style: { lipColor: '#c4605a' } },
    blink: {
      eyes: [
        { x: 0.32, y: 0.445, width: 0.1, height: 0.075 },
        { x: 0.495, y: 0.445, width: 0.1, height: 0.075 },
      ],
      lidColor: '#f4c18d',
    },
  },
  bob: {
    mouth: { x: 0.45, y: 0.68, width: 0.26, style: { lipColor: '#2a3340', innerColor: '#7fffd4', teethColor: null, tongueColor: null, outlineColor: '#0b1018' } },
  },
  sylvie: {
    mouth: { x: 0.5, y: 0.6, width: 0.26, style: { lipColor: '#7fffd4', innerColor: '#0b3a35', teethColor: null, tongueColor: null, outlineColor: null } },
  },
  reine: {
    mouth: { x: 0.58, y: 0.79, width: 0.2, style: { lipColor: '#3a1a08', innerColor: '#120600', teethColor: '#e8d890', tongueColor: null } },
    blink: {
      eyes: [
        { x: 0.405, y: 0.51, width: 0.17, height: 0.18 },
        { x: 0.76, y: 0.51, width: 0.17, height: 0.18 },
      ],
      lidColor: '#5a2e0c',
      lashColor: '#1a0a02',
    },
  },
};

/** Boîte de dialogue : portrait 3D, cartouche de nom, texte, choix. */
export class DialogueBox implements DialogueView {
  private root: Phaser.GameObjects.Container;
  private panel: Phaser.GameObjects.Graphics;
  /** Bord haut du panneau : remonte quand les choix tactiles ne tiennent pas dedans. */
  private panelY = PANEL_Y;
  private blocker: Phaser.GameObjects.Rectangle;
  private portraitFrame: Phaser.GameObjects.Graphics;
  private face: TalkingPortrait;
  private mouth: TypewriterMouth;
  private sprite: SpriteTalk;
  /** Driver actif pour le speaker courant (planche → SpriteTalk, sinon overlay). */
  private voice: TypewriterMouth | SpriteTalk;
  /** Planche actuellement montée sur `face` (évite de la remonter à chaque réplique). */
  private sheetOn: string | null = null;
  /** Calques par-dessus la planche (drone de Gary), créés à la demande, par id. */
  private overlays = new Map<string, OverlayPlayer>();
  private overlayOn: OverlayPlayer | null = null;
  private typing: TypewriteHandle | null = null;
  private portraitBg: Phaser.GameObjects.Rectangle;
  private portraitText: Phaser.GameObjects.Text;
  private nameTab: Phaser.GameObjects.Graphics;
  private nameText: Phaser.GameObjects.Text;
  private channel: Phaser.GameObjects.Text;
  private bodyText: Phaser.GameObjects.Text;
  private hint: Phaser.GameObjects.Text;
  /** Une zone par ligne de choix (toute la largeur), dans l'ordre. */
  private choiceZones: Phaser.GameObjects.Zone[] = [];
  private choiceDecor: Phaser.GameObjects.GameObject[] = [];
  private pickChoice: ((i: number) => void) | null = null;
  private nameColor: string | undefined;
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
    const panel = (this.panel = scene.add.graphics());

    const px = PANEL_X + 22;
    const py = PANEL_Y + 22;
    const ps = PANEL_H - 44;
    this.portraitFrame = scene.add.graphics();
    drawPanel(this.portraitFrame, px - 4, py - 4, PORTRAIT + 8, ps + 8, { fill: COLORS.ink, edge: 0xffffff, edgeAlpha: 0.5, cut: 14, glow: false });
    this.portraitBg = scene.add.rectangle(px, py, PORTRAIT, ps, 0x444444).setOrigin(0);
    this.face = new TalkingPortrait(scene, { x: px + PORTRAIT / 2, y: py + ps / 2, width: PORTRAIT, height: ps, breathe: 0.006 });
    this.face.setVisible(false);
    this.mouth = new TypewriterMouth(this.face, { cps: CPS });
    this.sprite = new SpriteTalk(this.face, { cps: CPS });
    this.voice = this.mouth;
    this.portraitText = scene.add
      .text(px + PORTRAIT / 2, py + ps / 2, '', { fontFamily: FONT, fontSize: '28px', color: '#ffffff', align: 'center', fontStyle: '700' })
      .setOrigin(0.5);

    this.nameTab = scene.add.graphics();
    this.nameText = scene.add.text(TEXT_X + 14, PANEL_Y - 2, '', { fontFamily: FONT, fontSize: `${uiPx(scene, 17, 13)}px`, fontStyle: '700', color: '#07050f' }).setOrigin(0, 0.5).setLetterSpacing(2);
    this.channel = scene.add
      .text(PANEL_X + PANEL_W - 28, PANEL_Y + 18, t('dialogue.channel'), { fontFamily: FONT, fontSize: '10px', fontStyle: '600', color: COLORS.dim })
      .setOrigin(1, 0.5)
      .setLetterSpacing(1.5)
      // mention décorative, illisible au doigt : masquée
      .setVisible(!isTouch());
    this.bodyText = scene.add.text(TEXT_X, PANEL_Y + 40, '', {
      fontFamily: FONT,
      fontSize: '23px',
      fontStyle: '500',
      color: COLORS.text,
      wordWrap: { width: PANEL_X + PANEL_W - TEXT_X - 40 },
      lineSpacing: 7,
    });
    this.hint = scene.add
      .text(PANEL_X + PANEL_W - 30, PANEL_Y + PANEL_H - 26, t('dialogue.continue'), { fontFamily: FONT, fontSize: `${uiPx(scene, 12, 12)}px`, fontStyle: '700', color: COLORS.accent })
      .setOrigin(1, 0.5)
      .setLetterSpacing(2);
    scene.tweens.add({ targets: this.hint, alpha: 0.35, duration: 650, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.root.add([panel, this.portraitFrame, this.portraitBg, this.face.container, this.portraitText, this.nameTab, this.nameText, this.channel, this.bodyText, this.hint]);
    this.layoutPanel(PANEL_Y);

    this.keyHandler = (e: KeyboardEvent) => {
      if (!this.root.visible) return;
      if (e.key === ' ' || e.key === 'Enter') this.tryAdvance();
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= this.choiceZones.length) this.pickChoice?.(n - 1);
    };
    window.addEventListener('keydown', this.keyHandler);
    // le calque vit sur sa propre horloge, indépendante des boucles idle / talk
    const tick = (_t: number, dt: number) => {
      if (this.root.visible && this.overlayOn) {
        this.overlayOn.setTalking(this.face.talking);
        this.overlayOn.update(dt);
      }
    };
    scene.events.on(Phaser.Scenes.Events.UPDATE, tick);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('keydown', this.keyHandler);
      scene.events.off(Phaser.Scenes.Events.UPDATE, tick);
    });
  }

  /** Redessine le panneau avec son bord haut en `y` (le bas reste collé à l'écran). */
  private layoutPanel(y: number): void {
    this.panelY = y;
    const h = H - 16 - y;
    const g = this.panel;
    g.clear();
    drawPanel(g, PANEL_X, y, PANEL_W, h, { fill: COLORS.panel, fillAlpha: 0.96, cut: 22, brackets: true });
    // trame de scanlines discrète
    g.fillStyle(0xffffff, 0.025);
    for (let sy = y + 6; sy < y + h - 6; sy += 4) g.fillRect(PANEL_X + 6, sy, PANEL_W - 12, 1);
    drawHazard(g, PANEL_X + PANEL_W - 190, y + h - 10, 150, 4, 0.8);
    this.channel.setY(y + 18);
    this.nameText.setY(y - 2);
  }

  get isOpen(): boolean {
    return this.root.visible;
  }

  private open(): void {
    this.blocker.setVisible(true);
    this.root.setVisible(true);
    this.shownAt = this.scene.time.now;
    duckMusic(true);
    setCursor(this.scene, 'default');
  }

  private tryAdvance(): void {
    // évite que le clic qui a ouvert la boîte ne la referme aussitôt
    if (this.scene.time.now - this.shownAt < 180) return;
    // premier clic pendant la frappe : texte complet, retour immédiat à idle
    if (this.typing && !this.typing.finished) {
      this.typing.skip();
      this.voice.idle();
      return;
    }
    if (!this.advance) return;
    this.voice.idle();
    const a = this.advance;
    this.advance = null;
    a();
  }

  private setSpeaker(speaker: CharacterDef | null): void {
    const hasPortrait = !!speaker?.portrait;
    const key = speaker ? portraitKey(speaker.id) : '';
    const sheet = speaker ? sheetKey(speaker.id) : '';
    const hasSheet = hasPortrait && this.scene.textures.exists(sheet);
    const has3d = hasPortrait && (hasSheet || this.scene.textures.exists(key));
    this.portraitFrame.setVisible(hasPortrait);
    this.portraitBg.setVisible(hasPortrait && !has3d);
    this.portraitText.setVisible(hasPortrait && !has3d);
    this.face.setVisible(has3d);
    this.voice = hasSheet ? this.sprite : this.mouth;
    if (hasSheet) {
      // même planche que la réplique précédente : on ne relance pas la boucle idle
      if (this.sheetOn !== sheet) {
        // boucles sprite idle / talk (chaque frame porte sa durée) ; la grille se
        // déduit de la taille de l'image (une planche GenAI en 2048×1024 marche aussi)
        const src = this.scene.textures.get(sheet).source[0];
        this.face.setSpriteSheet({
          key: sheet,
          frameWidth: Math.floor(src.width / SHEET.cols),
          frameHeight: Math.floor(src.height / SHEET.rows),
          idle: { frames: [...SHEET.idle] },
          talk: { frames: [...SHEET.talk] },
        });
        this.sheetOn = sheet;
      }
    } else if (has3d) {
      this.sheetOn = null;
      const f = FACES[speaker!.id];
      // portrait inconnu : bouche discrète, invisible au repos ; pas de clignement
      this.face.setTexture(key, undefined, {
        mouth: f?.mouth ?? { y: 0.68, width: 0.14, showClosed: false },
        blink: f?.blink ?? { enabled: false },
      });
    }
    this.showOverlay(hasSheet ? speaker!.id : null);
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

  /**
   * Calque animé du speaker (s'il en a un et que sa planche est affichée).
   * Il est enfant du contenu de `face` : même transform, même respiration,
   * même visibilité. Ancrage = fractions de la cellule de planche, ramenées à
   * la taille affichée (fit « cover » de TalkingPortrait, cellule centrée sur
   * le cadre).
   */
  private showOverlay(id: string | null): void {
    const def = id ? overlayFor(this.scene, id) : null;
    let o = def ? (this.overlays.get(id!) ?? null) : null;
    if (def && !o) {
      o = new OverlayPlayer(this.scene, id!);
      this.overlays.set(id!, o);
      // contenu interne de TalkingPortrait (celui qui respire), au-dessus de la planche
      (this.face.container.list[0] as Phaser.GameObjects.Container).add(o.image);
      const src = this.scene.textures.get(sheetKey(id!)).source[0];
      const fw = src.width / SHEET.cols;
      const fh = src.height / SHEET.rows;
      const ps = PANEL_H - 44;
      const k = Math.max(PORTRAIT / fw, ps / fh);
      // repère du contenu : bas du cadre en y = 0, planche centrée en (0, -ps / 2)
      o.place((-fw * k) / 2, -ps / 2 - (fh * k) / 2, fw * k);
    }
    for (const p of this.overlays.values()) p.image.setVisible(p === o);
    this.overlayOn = o;
  }

  private setName(name: string, color?: string): void {
    this.nameColor = color;
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
    const y = this.panelY;
    const top = y - 2 - Math.max(14, this.nameText.height / 2 + 2);
    const bot = y - 2 + Math.max(14, this.nameText.height / 2 + 2);
    const tab = [new Phaser.Geom.Point(x, top), new Phaser.Geom.Point(x + w, top), new Phaser.Geom.Point(x + w + 14, bot), new Phaser.Geom.Point(x, bot)];
    g.fillPoints(tab, true);
    g.lineStyle(1.5, dark ? 0xffffff : COLORS.ink, dark ? 0.6 : 0.8);
    g.strokePoints(tab, true);
    this.nameText.setColor(dark ? '#ffffff' : '#07050f');
  }

  private clearChoices(): void {
    this.choiceZones.forEach((t) => t.destroy());
    this.choiceDecor.forEach((t) => t.destroy());
    this.choiceZones = [];
    this.choiceDecor = [];
    this.pickChoice = null;
    if (this.panelY !== PANEL_Y) this.layoutPanel(PANEL_Y);
  }

  /** Arrête la frappe en cours et ferme la bouche. */
  private stopTalking(): void {
    this.typing?.stop();
    this.typing = null;
    this.voice.idle();
  }

  showLine(speaker: CharacterDef | null, text: string): Promise<void> {
    this.clearChoices();
    this.stopTalking();
    this.setSpeaker(speaker);
    this.hint.setVisible(false);
    this.fitBody(text);
    this.open();
    // blip « Nintendo » par lettre révélée, au timbre du personnage (tap = tout afficher, sans son)
    const voice = new Blipper(speaker?.id ?? 'narrateur');
    const typing = typewrite(this.bodyText, text, { cps: CPS, onChar: (ch) => voice.char(ch) });
    this.typing = typing;
    if (this.face.visible) void this.voice.speak(text);
    void typing.done.then(() => {
      if (this.typing !== typing) return;
      this.voice.idle();
      this.hint.setVisible(true);
    });
    return new Promise((resolve) => (this.advance = resolve));
  }

  /**
   * Taille du texte et hauteur du panneau pour une réplique : à la souris,
   * 23 px dans le panneau standard ; au doigt, ≥ 16 px CSS, le panneau
   * remontant si besoin (le texte rétrécit seulement s'il ne tient plus à l'écran).
   */
  private fitBody(text: string): void {
    const touch = isTouch();
    const body = this.bodyText;
    let size = touch ? uiPx(this.scene, BODY_PX, BODY_CSS) : BODY_PX;
    const maxH = H - 16 - 24 - BODY_PAD_TOP - BODY_PAD_BOTTOM;
    for (;;) {
      body.setFontSize(size).setLineSpacing(Math.round(size * 0.3)).setText(text);
      if (body.height <= maxH || size <= BODY_PX) break;
      size -= 2;
    }
    const need = BODY_PAD_TOP + body.height + BODY_PAD_BOTTOM;
    const y = Math.min(PANEL_Y, Math.round(H - 16 - need));
    if (y !== this.panelY) this.layoutPanel(y);
    // le nom suit le bord du panneau : on redessine son cartouche
    this.setName(this.nameText.text, this.nameColor);
    body.setY(y + BODY_PAD_TOP).setText('');
  }

  showChoices(choices: string[]): Promise<number> {
    this.clearChoices();
    this.stopTalking();
    this.setSpeaker(null);
    this.bodyText.setText('');
    this.hint.setVisible(false);
    // Au doigt, chaque ligne fait ≥ 48 px CSS ; si la liste ne tient pas, le
    // panneau remonte (sans dépasser le haut de l'écran).
    const touch = isTouch();
    const want = touch ? Math.max(56, cssToGame(this.scene, CHOICE_TOUCH_CSS)) : 48;
    const lineH = Math.min(want, (H - 40 - CHOICE_PAD) / choices.length);
    const panelY = Math.min(PANEL_Y, H - 16 - CHOICE_PAD - lineH * choices.length);
    if (panelY !== this.panelY) this.layoutPanel(panelY);
    this.setName(t('dialogue.choices'), COLORS.hover);
    this.open();
    const fontSize = touch ? Math.round(Math.min(28, lineH * 0.5)) : 22;
    return new Promise((resolve) => {
      // la sélection se fait au relâché sur la ligne où le doigt / clic s'est posé :
      // l'appui qui a fait apparaître les choix ne peut pas en valider un
      let armed = -1;
      this.pickChoice = (i) => {
        this.clearChoices();
        resolve(i);
      };
      const top = panelY + 34;
      choices.forEach((c, i) => {
        const y = top + i * lineH;
        const bar = this.scene.add.graphics();
        const t = this.scene.add
          .text(PANEL_X + 84, y + lineH / 2, c, { fontFamily: FONT, fontSize: `${fontSize}px`, fontStyle: '500', color: COLORS.text, wordWrap: { width: PANEL_W - 140 } })
          .setOrigin(0, 0.5);
        const n = this.scene.add
          .text(PANEL_X + 55, y + lineH / 2, String(i + 1), { fontFamily: FONT, fontSize: '15px', fontStyle: '700', color: COLORS.text })
          .setOrigin(0.5);
        const paint = (on: boolean) => {
          bar.clear();
          if (on) {
            bar.fillStyle(hex(COLORS.hover), 0.12);
            bar.fillRect(PANEL_X + 30, y + 3, PANEL_W - 60, lineH - 6);
          } else if (touch) {
            // au doigt, chaque ligne est une touche visible
            bar.fillStyle(0xffffff, 0.04);
            bar.fillRect(PANEL_X + 30, y + 3, PANEL_W - 60, lineH - 6);
          }
          drawPanel(bar, PANEL_X + 40, y + lineH / 2 - 14, 30, 28, { fill: on ? hex(COLORS.hover) : COLORS.panelHi, edge: hex(on ? COLORS.hover : COLORS.accent), cut: 7, glow: false });
          t.setColor(on ? COLORS.hover : COLORS.text);
          n.setColor(on ? '#07050f' : COLORS.text);
        };
        paint(false);
        // zone de touche : toute la ligne (badge + texte + marges), pas seulement le texte
        const zone = this.scene.add
          .zone(PANEL_X + 30, y, PANEL_W - 60, lineH)
          .setOrigin(0)
          .setInteractive({ useHandCursor: true });
        zone.on('pointerover', () => paint(true));
        zone.on('pointerout', () => {
          paint(false);
          if (armed === i) armed = -1;
        });
        zone.on('pointerdown', (p: Phaser.Input.Pointer) => {
          if (p.rightButtonDown()) return;
          armed = i;
          paint(true);
        });
        zone.on('pointerup', () => {
          if (armed !== i) return;
          this.pickChoice?.(i);
        });
        this.root.add([bar, n, t, zone]);
        this.choiceDecor.push(bar, n, t);
        this.choiceZones.push(zone);
      });
    });
  }

  close(): void {
    this.clearChoices();
    this.stopTalking();
    this.advance = null;
    this.blocker.setVisible(false);
    this.root.setVisible(false);
    duckMusic(false);
  }
}
