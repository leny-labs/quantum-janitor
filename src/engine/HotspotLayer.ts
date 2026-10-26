import Phaser from 'phaser';
import type { GameState } from './GameState';
import type { ArtShape, Exit, ExitDirection, Hotspot, SceneDef } from './types';
import { drawNavButton } from '../ui/chrome';
import { TOUCH_TARGET_CSS, uiPx } from '../ui/input';
import { COLORS, FONT, hex } from '../ui/theme';

export interface HotspotCallbacks {
  hoverHotspot(h: Hotspot | null): void;
  hoverExit(e: Exit | null): void;
  clickHotspot(h: Hotspot, p: Phaser.Input.Pointer): void;
  clickExit(e: Exit, p: Phaser.Input.Pointer): void;
}

/** Rayon du bouton de sortie ; zone tactile d'au moins 2 × NAV_HIT px. */
const NAV_R = 28;
const NAV_HIT = 32;
export const EXIT_CURSORS: Record<ExitDirection, string> = {
  left: 'w-resize',
  right: 'e-resize',
  up: 'n-resize',
  down: 's-resize',
};

/**
 * Zones cliquables d'une vue fixe + flèches de sortie. Si la pièce est rendue
 * en 3D (`art3d`), le fond et l'`art` du YAML ne sont pas dessinés : seul
 * l'overlay interactif reste au-dessus de l'image Three.js.
 */
export class HotspotLayer {
  readonly container: Phaser.GameObjects.Container;

  constructor(
    private scene: Phaser.Scene,
    private state: GameState,
    private cb: HotspotCallbacks,
    private debug = false,
  ) {
    this.container = scene.add.container(0, 0).setDepth(10);
  }

  render(def: SceneDef, width: number, height: number, art3d = false): void {
    const s = this.scene;
    this.container.removeAll(true);
    if (!art3d) {
      this.container.add(s.add.rectangle(0, 0, width, height, hex(def.background)).setOrigin(0));
      this.drawArt(def.art ?? []);
    }

    for (const e of def.exits ?? []) {
      if (!this.state.check(e.if)) continue;
      const [x, y, w, h] = e.rect;
      const locked = !this.state.check(e.requires);
      const dir = e.dir ?? 'right';
      const cx = x + w / 2;
      const cy = y + h / 2;
      if (!art3d) this.container.add(s.add.rectangle(x, y, w, h, 0x000000, 0.18).setOrigin(0).setStrokeStyle(2, hex(COLORS.accent), 0.45));
      // au doigt : bouton ≥ 40 px CSS de diamètre, zone ≥ 48 px CSS
      const r = uiPx(s, NAV_R, 20);
      const hit = Math.max(NAV_HIT * 2, uiPx(s, 0, TOUCH_TARGET_CSS));
      const g = s.add.graphics({ x: cx, y: cy }).setAlpha(locked ? 0.55 : 0.92);
      drawNavButton(g, r, dir, locked ? 'locked' : 'idle');
      // zone tactile : le rect du YAML, élargi à 64 × 64 px de jeu minimum
      const zw = Math.max(w, hit);
      const zh = Math.max(h, hit);
      const zone = s.add.zone(cx - zw / 2, cy - zh / 2, zw, zh).setOrigin(0).setInteractive();
      const hover = (on: boolean) => {
        drawNavButton(g, r, dir, locked ? 'locked' : on ? 'hover' : 'idle');
        s.tweens.killTweensOf(g);
        s.tweens.add({ targets: g, scale: on ? 1.12 : 1, alpha: on ? 1 : locked ? 0.55 : 0.92, duration: 120, ease: 'Quad.easeOut' });
      };
      zone.on('pointerover', () => {
        hover(true);
        this.cb.hoverExit(e);
      });
      zone.on('pointerout', () => {
        hover(false);
        this.cb.hoverExit(null);
      });
      zone.on('pointerdown', (p: Phaser.Input.Pointer) => this.cb.clickExit(e, p));
      this.container.add([g, zone]);
    }

    for (const h of def.hotspots ?? []) {
      if (!this.state.check(h.if)) continue;
      if (h.art && !art3d) this.drawArt(h.art);
      const [x, y, w, hh] = h.rect;
      if (this.debug) {
        this.container.add(s.add.rectangle(x, y, w, hh).setOrigin(0).setStrokeStyle(1, 0xff00ff, 0.9));
        this.container.add(s.add.text(x + 2, y + 2, h.id, { fontFamily: FONT, fontSize: '12px', color: '#ff66ff' }));
      }
      const zone = s.add.zone(x, y, w, hh).setOrigin(0).setInteractive();
      zone.on('pointerover', () => this.cb.hoverHotspot(h));
      zone.on('pointerout', () => this.cb.hoverHotspot(null));
      zone.on('pointerdown', (p: Phaser.Input.Pointer) => this.cb.clickHotspot(h, p));
      this.container.add(zone);
    }
  }

  private drawArt(shapes: ArtShape[]): void {
    const s = this.scene;
    for (const a of shapes) {
      if (!this.state.check(a.if)) continue;
      const alpha = a.alpha ?? 1;
      if (a.rect) {
        const [x, y, w, h] = a.rect;
        const r = s.add.rectangle(x, y, w, h, hex(a.color), a.color ? alpha : 0).setOrigin(0);
        if (a.stroke) r.setStrokeStyle(2, hex(a.stroke), alpha);
        this.container.add(r);
      }
      if (a.circle) {
        const [x, y, rad] = a.circle;
        const c = s.add.circle(x, y, rad, hex(a.color), a.color ? alpha : 0);
        if (a.stroke) c.setStrokeStyle(2, hex(a.stroke), alpha);
        this.container.add(c);
      }
      if (a.text) {
        const pos = a.at ?? (a.rect ? [a.rect[0] + a.rect[2] / 2, a.rect[1] + a.rect[3] / 2] : a.circle ? [a.circle[0], a.circle[1]] : [0, 0]);
        const color = a.rect || a.circle ? (a.stroke ?? '#ffffff') : (a.color ?? '#ffffff');
        const t = s.add
          .text(pos[0], pos[1], a.text, {
            fontFamily: FONT,
            fontSize: `${a.size ?? 18}px`,
            color,
            align: 'center',
          })
          .setOrigin(0.5)
          .setAlpha(alpha);
        this.container.add(t);
      }
    }
  }
}
