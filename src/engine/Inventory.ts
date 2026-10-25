import Phaser from 'phaser';
import type { GameState } from './GameState';
import type { GameContent, Interaction } from './types';
import { COLORS, FONT, H, ROOM_H, W, hex } from '../ui/theme';

export interface InventoryCallbacks {
  click(itemId: string, p: Phaser.Input.Pointer): void;
  hover(itemId: string | null): void;
}

/** Résout la combinaison objet sélectionné + objet cliqué (dans les deux sens). */
export function resolveCombine(content: GameContent, a: string, b: string): Interaction | undefined {
  return content.items.get(a)?.combine?.[b] ?? content.items.get(b)?.combine?.[a];
}

const SLOT = 104;
const GAP = 14;

/** Barre d'inventaire en bas de l'écran. */
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

  render(): void {
    const s = this.scene;
    const c = this.container;
    c.removeAll(true);
    c.add(s.add.rectangle(0, 0, W, H - ROOM_H, 0x0d0d16).setOrigin(0));
    c.add(s.add.rectangle(0, 0, W, 3, hex(COLORS.accent)).setOrigin(0));
    c.add(s.add.text(18, 8, 'INVENTAIRE', { fontFamily: FONT, fontSize: '14px', color: COLORS.dim }));
    c.add(
      s.add
        .text(W - 18, 8, 'clic : prendre en main · clic droit : examiner', { fontFamily: FONT, fontSize: '14px', color: COLORS.dim })
        .setOrigin(1, 0),
    );

    this.state.items.forEach((id, i) => {
      const def = this.content.items.get(id);
      if (!def) return;
      const x = 18 + i * (SLOT + GAP);
      const y = 28;
      const selected = this.state.selectedItem === id;
      const frame = s.add
        .rectangle(x, y, SLOT, SLOT, selected ? 0x3a3420 : 0x1d1d2c)
        .setOrigin(0)
        .setStrokeStyle(selected ? 4 : 2, selected ? hex(COLORS.hover) : 0x44445a);
      const icon = s.add.rectangle(x + SLOT / 2, y + 40, 64, 52, hex(def.icon.color)).setStrokeStyle(2, 0xffffff, 0.5);
      const glyph = s.add
        .text(x + SLOT / 2, y + 40, def.icon.glyph, { fontFamily: FONT, fontSize: def.icon.glyph.length > 2 ? '19px' : '26px', color: '#ffffff', fontStyle: 'bold' })
        .setOrigin(0.5);
      const name = s.add
        .text(x + SLOT / 2, y + SLOT - 12, def.name, { fontFamily: FONT, fontSize: '13px', color: COLORS.text })
        .setOrigin(0.5);
      const zone = s.add.zone(x, y, SLOT, SLOT).setOrigin(0).setInteractive({ useHandCursor: true });
      zone.on('pointerover', () => this.cb.hover(id));
      zone.on('pointerout', () => this.cb.hover(null));
      zone.on('pointerdown', (p: Phaser.Input.Pointer) => this.cb.click(id, p));
      c.add([frame, icon, glyph, name, zone]);
    });
  }
}
