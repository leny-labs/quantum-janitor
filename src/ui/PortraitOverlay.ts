// Calque animé collé par-dessus un portrait-planche (drone dorsal de Gary) :
// une Image Phaser sur la texture `overlayKey(id)`, qui joue sa propre
// timeline (PORTRAIT_OVERLAYS dans Studio.ts), sans se caler sur idle / talk.
import Phaser from 'phaser';
import { PORTRAIT_OVERLAYS, overlayKey, type OverlayStep, type PortraitOverlay } from '../three/Studio';

/** Calque d'un personnage, si sa texture est chargée. */
export function overlayFor(scene: Phaser.Scene, id: string): PortraitOverlay | null {
  const o = PORTRAIT_OVERLAYS[id];
  return o && scene.textures.exists(overlayKey(id)) ? o : null;
}

export class OverlayPlayer {
  readonly image: Phaser.GameObjects.Image;
  private def: PortraitOverlay;
  private seq: readonly OverlayStep[];
  private i: number;
  private left: number;
  private talking = false;
  private shown = -1;

  constructor(scene: Phaser.Scene, id: string) {
    const def = (this.def = PORTRAIT_OVERLAYS[id]);
    const key = overlayKey(id);
    const tex = scene.textures.get(key);
    if (!tex.has('r0')) {
      // la bande peut être servie à une autre échelle que frameW × frameH
      const fw = tex.source[0].width / def.frames;
      const fh = tex.source[0].height;
      for (let i = 0; i < def.frames; i++) tex.add(`r${i}`, 0, i * fw, 0, fw, fh);
    }
    this.image = scene.add.image(0, 0, key, 'r0').setOrigin(0);
    // départ à un point aléatoire de la boucle : deux portraits ne bougent pas pareil
    this.seq = def.idle;
    this.i = Math.floor(Math.random() * this.seq.length);
    this.left = this.seq[this.i].duration * (0.3 + Math.random() * 0.7);
    this.update(0);
  }

  /**
   * Pose le calque sur un portrait dont une cellule de planche mesure `cellPx`
   * px à l'écran et a son coin haut-gauche en (`left`, `top`) (repère du parent).
   */
  place(left: number, top: number, cellPx: number): this {
    const k = cellPx / this.def.cell;
    this.image.setPosition(left + this.def.x * k, top + this.def.y * k).setDisplaySize(this.def.frameW * k, this.def.frameH * k);
    return this;
  }

  /** Bascule la variante « le personnage parle » sans remettre la boucle à zéro. */
  setTalking(on: boolean): void {
    if (on === this.talking) return;
    this.talking = on;
    this.seq = on ? this.def.talk : this.def.idle;
    // la pose en cours finit son temps ; la suite reprend au même rang dans l'autre boucle
    this.i %= this.seq.length;
  }

  update(dt: number): void {
    this.left -= dt;
    while (this.left <= 0) {
      this.i = (this.i + 1) % this.seq.length;
      this.left += this.seq[this.i].duration;
    }
    const f = this.seq[this.i].frame;
    if (f !== this.shown) this.image.setFrame(`r${(this.shown = f)}`);
  }
}
