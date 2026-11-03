// Cartes de transition (docs/CHAPTERS.md §2) : carte d'acte (« ACTE II — Blattaria Prime »),
// carte titre de chapitre (« CHAPITRE 1 — La Station Bureaucratique », tamponnée).
// Fond sombre, fondu entrant ≥ 600 ms, tenue, fondu sortant ; clic / tap / Échap après 1 s
// pour passer ; tenue doublée et pas de secousse si `prefers-reduced-motion`.
import Phaser from 'phaser';
import { drawHazard } from './chrome';
import { distantPlouf, stampClonk } from './sfx';
import { COLORS, DISPLAY, FONT, H, W, hex } from './theme';

export interface CardOpts {
  /** Petites capitales espacées (« ACTE II », « CHAPITRE 1 »). */
  kicker: string;
  /** Nom de l'acte / du chapitre (italique). */
  title: string;
  tagline?: string;
  /** Mention administrative en pied de carte. */
  foot?: string;
  /** Tampon géant (carte titre ch.1) : texte du tampon ; sinon carte d'acte (plouf lointain). */
  stamp?: string;
  /** Tenue en ms (défaut 2500). */
  hold?: number;
}

/** Texture de halo radial (blanc → transparent), créée une fois. */
export function glowTexture(scene: Phaser.Scene): string {
  const key = 'card-glow';
  if (scene.textures.exists(key)) return key;
  const tex = scene.textures.createCanvas(key, 512, 512);
  const c = tex!.getContext();
  const grad = c.createRadialGradient(256, 256, 0, 256, 256, 256);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.45)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = grad;
  c.fillRect(0, 0, 512, 512);
  tex!.refresh();
  return key;
}

/** Tampon administratif encré (cadre double + texte), invisible et agrandi : prêt à `slamStamp`. */
export function stampObject(scene: Phaser.Scene, x: number, y: number, text: string, color = '#ff4f9a', size = 40): Phaser.GameObjects.Container {
  const label = scene.add.text(0, 0, text, { fontFamily: DISPLAY, fontSize: `${size}px`, color }).setOrigin(0.5).setLetterSpacing(4);
  const frame = scene.add.graphics();
  const w = label.width + size * 1.2;
  const h = label.height + size * 0.65;
  frame.lineStyle(size * 0.15, hex(color), 1);
  frame.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
  frame.lineStyle(size * 0.05, hex(color), 0.8);
  frame.strokeRoundedRect(-w / 2 + 8, -h / 2 + 8, w - 16, h - 16, 6);
  return scene.add.container(x, y, [frame, label]).setAngle(-12).setAlpha(0).setScale(2.4);
}

/** Abat le tampon : chute rapide, CLONK, petite secousse (sauf `prefers-reduced-motion`). */
export function slamStamp(scene: Phaser.Scene, stamp: Phaser.GameObjects.Container): Promise<void> {
  return new Promise((resolve) =>
    scene.tweens.add({
      targets: stamp,
      alpha: 0.92,
      scale: 1,
      duration: 170,
      ease: 'Quad.easeIn',
      onComplete: () => {
        stampClonk();
        if (!reducedMotion()) scene.cameras.main.shake(120, 0.008);
        resolve();
      },
    }),
  );
}

const reducedMotion = (): boolean => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches; // i18n-ignore

/**
 * Affiche la carte au-dessus de tout (depth 3000) ; résout une fois le texte effacé, l'écran
 * restant noir. La valeur résolue `reveal()` fait apparaître (fondu 800 ms) ce qui a été
 * installé dessous entre-temps (pièce d'arrivée) ; inutile si la scène Phaser change.
 */
export function showChapterCard(scene: Phaser.Scene, opts: CardOpts): Promise<() => Promise<void>> {
  const calm = reducedMotion();
  const hold = (opts.hold ?? 2500) * (calm ? 2 : 1);
  const depth = 3000;
  const layer: Phaser.GameObjects.GameObject[] = [];
  const add = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
    (o as unknown as Phaser.GameObjects.Components.Depth).setDepth?.(depth);
    layer.push(o);
    return o;
  };

  const bg = add(scene.add.rectangle(0, 0, W, H, COLORS.ink, 0).setOrigin(0).setInteractive());
  const content: Phaser.GameObjects.GameObject[] = [];
  const keep = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
    add(o);
    content.push(o);
    (o as unknown as Phaser.GameObjects.Components.Alpha).setAlpha?.(0);
    return o;
  };

  // halo doux (dégradé radial) qui respire, et bandes de chantier
  const glowTex = glowTexture(scene);
  const halo = keep(scene.add.image(W / 2, H / 2 - 20, glowTex).setDisplaySize(1100, 760).setTint(opts.stamp ? 0xffb347 : 0xb56cff));
  const breathe = scene.tweens.add({ targets: halo, scaleX: halo.scaleX * 1.05, scaleY: halo.scaleY * 1.05, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  const g = keep(scene.add.graphics());
  drawHazard(g, 0, 150, W, 6);
  drawHazard(g, 0, H - 156, W, 6);

  const kicker = keep(
    scene.add.text(W / 2, 232, opts.kicker, { fontFamily: FONT, fontSize: '22px', fontStyle: '700', color: COLORS.hover }).setOrigin(0.5).setLetterSpacing(14),
  );
  const title = keep(
    scene.add
      .text(W / 2, 330, opts.title, { fontFamily: FONT, fontSize: '76px', fontStyle: 'italic 500', color: '#fff6e0', align: 'center', padding: { x: 12, y: 6 } })
      .setOrigin(0.5)
      .setStroke('#07050f', 8)
      .setShadow(0, 6, opts.stamp ? 'rgba(255,209,102,0.45)' : 'rgba(181,108,255,0.55)', 24, true, true),
  );
  const tag = opts.tagline
    ? keep(scene.add.text(W / 2, 418, opts.tagline, { fontFamily: FONT, fontSize: '22px', fontStyle: 'italic 500', color: COLORS.text, align: 'center' }).setOrigin(0.5))
    : null;
  const foot = opts.foot
    ? keep(scene.add.text(W / 2, H - 120, opts.foot, { fontFamily: FONT, fontSize: '12px', fontStyle: '600', color: COLORS.dim }).setOrigin(0.5).setLetterSpacing(2))
    : null;

  // tampon (carte titre) : arrive de haut, gros, s'écrase avec un CLONK
  const stamp = opts.stamp ? add(stampObject(scene, W * 0.74, 470, opts.stamp)) : null;

  const reveal = () =>
    new Promise<void>((done) => {
      if (!bg.active) return done();
      scene.tweens.add({ targets: bg, fillAlpha: 0, duration: 800, onComplete: () => (bg.destroy(), done()) });
    });
  return new Promise((resolve) => {
    let done = false;
    let canSkip = false;
    const finish = () => {
      if (done) return;
      done = true;
      scene.input.keyboard?.off('keydown', onKey);
      scene.tweens.add({
        targets: content.concat(stamp ? [stamp] : []),
        alpha: 0,
        duration: 800,
        onComplete: () => {
          breathe.stop();
          content.forEach((o) => o.destroy());
          stamp?.destroy();
          resolve(reveal);
        },
      });
    };
    const skip = () => canSkip && finish();
    const onKey = (e: KeyboardEvent) => (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') && skip();
    bg.on('pointerdown', skip);
    scene.input.keyboard?.on('keydown', onKey);
    scene.time.delayedCall(1000, () => (canSkip = true));

    // fondu au noir, puis la carte
    scene.tweens.add({ targets: bg, fillAlpha: 1, duration: 700 });
    scene.tweens.add({ targets: halo, alpha: 0.32, duration: 1200, delay: 300 });
    scene.tweens.add({ targets: [g, kicker], alpha: 1, duration: 800, delay: 500 });
    scene.tweens.add({ targets: title, alpha: 1, duration: 800, delay: 800 });
    if (!calm) scene.tweens.add({ targets: title, y: { from: 346, to: 330 }, duration: 900, delay: 800, ease: 'Cubic.easeOut' });
    const rest = [tag, foot].filter(Boolean) as Phaser.GameObjects.GameObject[];
    if (rest.length) scene.tweens.add({ targets: rest, alpha: 1, duration: 800, delay: 1200 });
    if (!opts.stamp) scene.time.delayedCall(900, () => distantPlouf());
    if (stamp) {
      const s = stamp;
      scene.time.delayedCall(1500, () => void slamStamp(scene, s));
    }
    scene.time.delayedCall(1300 + hold, finish);
  });
}
