import Phaser from 'phaser';
import type { GameState } from './GameState';
import type { GameContent } from './types';
import { iconKey } from '../three/Studio';
import { drawHazard, drawLed, drawPanel } from '../ui/chrome';
import { cssToGame, isTouch, uiPx } from '../ui/input';
import { COLORS, FONT, H, ROOM_H, W, hex } from '../ui/theme';

export interface InventoryCallbacks {
  click(itemId: string, p: Phaser.Input.Pointer): void;
  hover(itemId: string | null): void;
}

/** Géométrie de la barre : colonne de titre, cases, défilement. */
interface Layout {
  slot: number;
  gap: number;
  /** Bord gauche de la première case. */
  x0: number;
  y: number;
  /** Nombre de cases dessinées (vides comprises). */
  count: number;
}

const BAR = H - ROOM_H;

function layout(touch: boolean, items: number): Layout {
  // au doigt : cases plus grandes (≥ 60 px CSS en paysage téléphone), colonne de titre plus étroite
  const slot = touch ? 116 : 96;
  const gap = touch ? 12 : 14;
  const x0 = touch ? 206 : 236;
  const fit = Math.floor((W - x0 - 10 + gap) / (slot + gap));
  return { slot, gap, x0, y: touch ? 16 : 20, count: Math.max(touch ? fit : 8, items) };
}

/** Barre d'inventaire en bas de l'écran (« objets autorisés »), défilable au doigt si elle déborde. */
export class Inventory {
  private container: Phaser.GameObjects.Container;
  private strip!: Phaser.GameObjects.Container;
  private zones: Phaser.GameObjects.Zone[] = [];
  private lay: Layout = layout(false, 0);
  /** Décalage horizontal des cases (≤ 0). */
  private scroll = 0;
  private drag: { x: number; scroll: number; moved: boolean } | null = null;
  private maskShape: Phaser.GameObjects.Graphics;
  private mask: Phaser.Display.Masks.GeometryMask;

  constructor(
    private scene: Phaser.Scene,
    private content: GameContent,
    private state: GameState,
    private cb: InventoryCallbacks,
  ) {
    this.container = scene.add.container(0, ROOM_H).setDepth(500);
    const mask = (this.maskShape = scene.make.graphics({}, false));
    this.mask = mask.createGeometryMask();
    this.render();
    // glisser horizontalement sur la barre fait défiler les cases
    const slop = () => cssToGame(scene, 10);
    const down = (p: Phaser.Input.Pointer) => {
      if (p.y >= ROOM_H && p.x >= this.lay.x0 - 10 && this.maxScroll() < 0) this.drag = { x: p.x, scroll: this.scroll, moved: false };
    };
    const move = (p: Phaser.Input.Pointer) => {
      if (!this.drag || !p.isDown) return;
      const dx = p.x - this.drag.x;
      if (!this.drag.moved && Math.abs(dx) < slop()) return;
      this.drag.moved = true;
      this.setScroll(this.drag.scroll + dx);
    };
    const up = () => (this.drag = null);
    scene.input.on('pointerdown', down);
    scene.input.on('pointermove', move);
    scene.input.on('pointerup', up);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.input.off('pointerdown', down);
      scene.input.off('pointermove', move);
      scene.input.off('pointerup', up);
      mask.destroy();
    });
  }

  /** Défilement minimal (négatif si les cases débordent de l'écran). */
  private maxScroll(): number {
    const { x0, slot, gap, count } = this.lay;
    return Math.min(0, W - 10 - (x0 + count * (slot + gap) - gap));
  }

  private setScroll(v: number): void {
    this.scroll = Phaser.Math.Clamp(v, this.maxScroll(), 0);
    this.strip.x = this.scroll;
    // les zones masquées restent cliquables pour Phaser : on coupe celles hors champ
    const { x0, slot, gap } = this.lay;
    this.zones.forEach((z, i) => {
      const cx = x0 + i * (slot + gap) + slot / 2 + this.scroll;
      if (z.input) z.input.enabled = cx > x0 - 4 && cx < W;
    });
  }

  /** Centre (coordonnées écran) et taille de la case `i`, défilement compris. */
  slotRect(i: number): { x: number; y: number; size: number } {
    const { x0, slot, gap, y } = this.lay;
    return { x: x0 + i * (slot + gap) + slot / 2 + this.scroll, y: ROOM_H + y + slot / 2, size: slot };
  }

  /** Centre (coordonnées écran) de la case `i`. */
  slotCenter(i: number): { x: number; y: number } {
    const r = this.slotRect(i);
    return { x: r.x, y: r.y };
  }

  /** Fait défiler la barre pour que la case `i` soit visible. */
  reveal(i: number): void {
    const r = this.slotRect(i);
    const half = r.size / 2;
    if (r.x - half < this.lay.x0) this.setScroll(this.scroll + this.lay.x0 - (r.x - half));
    else if (r.x + half > W - 10) this.setScroll(this.scroll - (r.x + half - (W - 10)));
  }

  render(): void {
    const s = this.scene;
    const c = this.container;
    const touch = isTouch();
    const lay = (this.lay = layout(touch, this.state.items.length));
    const X0 = lay.x0;
    const SLOT = lay.slot;
    c.removeAll(true);
    this.zones = [];
    const bg = s.add.graphics();
    bg.fillGradientStyle(COLORS.panelHi, COLORS.panelHi, COLORS.ink, COLORS.ink, 1, 1, 1, 1);
    bg.fillRect(0, 0, W, BAR);
    drawHazard(bg, 0, 0, W, 4);
    bg.fillStyle(hex(COLORS.accent), 0.9);
    bg.fillRect(0, 4, W, 1.5);
    // colonne de titre
    bg.fillStyle(COLORS.ink, 0.5);
    bg.fillRect(0, 6, X0 - 18, BAR - 6);
    drawLed(bg, 22, 30, hex(COLORS.accent), 3.5);
    c.add(bg);
    if (touch) {
      // au doigt : titre et aide lisibles (≥ 11-12 px CSS), sans la note d'ambiance
      c.add(s.add.text(34, 30, 'OBJETS', { fontFamily: FONT, fontSize: `${uiPx(s, 15, 13)}px`, fontStyle: '700', color: COLORS.accent }).setOrigin(0, 0.5).setLetterSpacing(2));
      const help = s.add
        .text(16, 58, 'TAP  prendre\nAPPUI LONG  examiner', { fontFamily: FONT, fontSize: `${uiPx(s, 11, 11)}px`, fontStyle: '600', color: COLORS.text, lineSpacing: 6 })
        .setAlpha(0.85);
      if (help.width > X0 - 30) help.setScale((X0 - 30) / help.width);
      c.add(help);
    } else {
      c.add(s.add.text(34, 30, 'OBJETS AUTORISÉS', { fontFamily: FONT, fontSize: '15px', fontStyle: '700', color: COLORS.accent }).setOrigin(0, 0.5).setLetterSpacing(2));
      c.add(
        s.add.text(18, 48, 'Réf. QJ-INV/0 · Toute possession\nnon listée est une trahison.', {
          fontFamily: FONT,
          fontSize: '11px',
          fontStyle: 'italic 500',
          color: COLORS.dim,
          lineSpacing: 2,
        }),
      );
      c.add(s.add.text(18, 92, 'CLIC  prendre en main\nCLIC DROIT  examiner', { fontFamily: FONT, fontSize: '11px', fontStyle: '600', color: COLORS.text, lineSpacing: 4 }).setAlpha(0.75));
    }

    // cases dans une bande masquée (défilement horizontal si elles débordent)
    const strip = (this.strip = s.add.container(this.scroll, 0));
    c.add(strip);
    this.maskShape.clear().fillStyle(0xffffff).fillRect(X0 - 6, ROOM_H, W - X0 + 6, BAR);
    strip.setMask(this.mask);
    const y = lay.y;
    for (let i = 0; i < lay.count; i++) {
      const x = X0 + i * (SLOT + lay.gap);
      const id = this.state.items[i];
      const def = id ? this.content.items.get(id) : undefined;
      const g = s.add.graphics();
      strip.add(g);
      if (!def) {
        drawPanel(g, x, y, SLOT, SLOT, { fill: COLORS.ink, fillAlpha: 0.55, edge: 0x4a4070, edgeAlpha: 0.6, cut: 12, glow: false });
        g.lineStyle(1, 0x4a4070, 0.6);
        g.lineBetween(x + SLOT / 2 - 6, y + SLOT / 2, x + SLOT / 2 + 6, y + SLOT / 2);
        continue;
      }
      const selected = this.state.selectedItem === id;
      const draw = (hover: boolean) => {
        g.clear();
        const edge = hex(selected ? COLORS.hover : hover ? COLORS.accent : '#6a5fa8');
        drawPanel(g, x, y, SLOT, SLOT, { fill: selected ? 0x3a2a40 : hover ? COLORS.panelHi : COLORS.panel, edge, cut: 12, glow: selected || hover, brackets: selected });
        // pastille de couleur de l'objet
        g.fillStyle(hex(def.icon.color), 0.9);
        g.fillRect(x + SLOT - 22, y + 8, 12, 3);
      };
      draw(false);
      const key = iconKey(id);
      if (s.textures.exists(key)) {
        strip.add(s.add.image(x + SLOT / 2, y + SLOT / 2 - 8, key).setDisplaySize(SLOT * 0.875, SLOT * 0.875));
      } else {
        strip.add(s.add.rectangle(x + SLOT / 2, y + 38, 56, 44, hex(def.icon.color)).setStrokeStyle(2, 0xffffff, 0.5));
        strip.add(
          s.add
            .text(x + SLOT / 2, y + 38, def.icon.glyph, { fontFamily: FONT, fontSize: def.icon.glyph.length > 2 ? '17px' : '24px', color: '#ffffff', fontStyle: '700' })
            .setOrigin(0.5),
        );
      }
      const name = s.add
        .text(x + SLOT / 2, y + SLOT - 11, def.name.toUpperCase(), { fontFamily: FONT, fontSize: `${touch ? 15 : 10}px`, fontStyle: '700', color: selected ? COLORS.hover : COLORS.text })
        .setOrigin(0.5)
        .setLetterSpacing(1);
      if (name.width > SLOT - 10) name.setScale((SLOT - 10) / name.width);
      strip.add(name);
      const zone = s.add.zone(x, y, SLOT, SLOT).setOrigin(0).setInteractive({ useHandCursor: true });
      zone.on('pointerover', () => {
        draw(true);
        this.cb.hover(id);
      });
      zone.on('pointerout', () => {
        draw(false);
        this.cb.hover(null);
      });
      zone.on('pointerdown', (p: Phaser.Input.Pointer) => this.cb.click(id, p));
      strip.add(zone);
      this.zones[i] = zone;
    }
    this.setScroll(this.scroll);
  }
}
