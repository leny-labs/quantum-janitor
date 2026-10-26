import Phaser from 'phaser';
import type { GameState } from './GameState';
import type { GameContent } from './types';
import { iconKey } from '../three/Studio';
import { drawHazard, drawLed, drawPanel } from '../ui/chrome';
import { isTouch } from '../ui/input';
import { COLORS, FONT, H, ROOM_H, W, hex } from '../ui/theme';

export interface InventoryCallbacks {
  click(itemId: string, p: Phaser.Input.Pointer): void;
  hover(itemId: string | null): void;
}

const SLOT = 96;
const GAP = 14;
const SLOTS = 8;
const X0 = 236;

/** Centre (coordonnées écran) et taille de la case d'inventaire `i`. */
export function slotRect(i: number): { x: number; y: number; size: number } {
  return { x: X0 + i * (SLOT + GAP) + SLOT / 2, y: ROOM_H + 20 + SLOT / 2, size: SLOT };
}

/** Barre d'inventaire en bas de l'écran (« objets autorisés »). */
export class Inventory {
  private container: Phaser.GameObjects.Container;

  constructor(
    private scene: Phaser.Scene,
    private content: GameContent,
    private state: GameState,
    private cb: InventoryCallbacks,
  ) {
    this.container = scene.add.container(0, ROOM_H).setDepth(500);
    this.render();
  }

  /** Centre (coordonnées écran) de la case `i`. */
  slotCenter(i: number): { x: number; y: number } {
    const r = slotRect(i);
    return { x: r.x, y: r.y };
  }

  render(): void {
    const s = this.scene;
    const c = this.container;
    const BAR = H - ROOM_H;
    c.removeAll(true);
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
    c.add(
      s.add.text(18, 92, isTouch() ? 'TAP  prendre en main\nAPPUI LONG  examiner' : 'CLIC  prendre en main\nCLIC DROIT  examiner', { fontFamily: FONT, fontSize: '11px', fontStyle: '600', color: COLORS.text, lineSpacing: 4 }).setAlpha(0.75),
    );

    const y = 20;
    for (let i = 0; i < Math.max(SLOTS, this.state.items.length); i++) {
      const x = X0 + i * (SLOT + GAP);
      const id = this.state.items[i];
      const def = id ? this.content.items.get(id) : undefined;
      const g = s.add.graphics();
      c.add(g);
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
        c.add(s.add.image(x + SLOT / 2, y + SLOT / 2 - 8, key).setDisplaySize(84, 84));
      } else {
        c.add(s.add.rectangle(x + SLOT / 2, y + 38, 56, 44, hex(def.icon.color)).setStrokeStyle(2, 0xffffff, 0.5));
        c.add(
          s.add
            .text(x + SLOT / 2, y + 38, def.icon.glyph, { fontFamily: FONT, fontSize: def.icon.glyph.length > 2 ? '17px' : '24px', color: '#ffffff', fontStyle: '700' })
            .setOrigin(0.5),
        );
      }
      const name = s.add
        .text(x + SLOT / 2, y + SLOT - 11, def.name.toUpperCase(), { fontFamily: FONT, fontSize: '10px', fontStyle: '700', color: selected ? COLORS.hover : COLORS.text })
        .setOrigin(0.5)
        .setLetterSpacing(1);
      if (name.width > SLOT - 10) name.setScale((SLOT - 10) / name.width);
      c.add(name);
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
      c.add(zone);
    }
  }
}
