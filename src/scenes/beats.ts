// Bruitages des petites animations des moments clés (rigs 3D des pièces).
// Les travels caméra restent silencieux : seuls les gestes font du bruit.
import type Phaser from 'phaser';
import type { BobCue } from '../three/rooms/bobrepas';
import type { FuseCue } from '../three/rooms/fusible';
import type { LecteurCue } from '../three/rooms/lecteur';
import { beep, buzz, chime, crunch, glitch, plouf, powerDown, slurp, splat, squeak, thud, whoosh } from '../ui/sfx';

export function lecteurCue(scene: Phaser.Scene, c: LecteurCue): void {
  switch (c) {
    case 'squeak':
      return squeak();
    case 'plop':
      return splat();
    case 'clean':
      return chime([1046, 1318, 1568]);
    case 'bip':
      return beep();
    case 'granted':
      beep(1570);
      return void setTimeout(() => beep(2090), 110);
    case 'door':
      return whoosh();
    case 'clunk':
      thud();
      scene.cameras.main.shake(160, 0.003);
      return;
  }
}

export function bobCue(scene: Phaser.Scene, c: BobCue): void {
  switch (c) {
    case 'open':
      return squeak();
    case 'slurp':
      return slurp();
    case 'gulp':
    case 'shut':
      return thud();
    case 'chew':
      return crunch();
    case 'retch':
      return glitch();
    case 'burst':
      splat();
      thud();
      scene.cameras.main.shake(220, 0.008);
      return;
    case 'land':
      return splat();
    case 'grab':
      return chime([784, 1046]);
  }
}

export function fuseCue(scene: Phaser.Scene, c: FuseCue): void {
  switch (c) {
    case 'zap':
      buzz();
      scene.cameras.main.shake(140, 0.004);
      return;
    case 'flicker':
      return glitch();
    case 'die':
      return powerDown();
  }
}

/** Jus de seau : vert-olive / vert vase, reflet acide. */
const SPLASH = [0x7a9a3a, 0x5c7a2a, 0x8aa844, 0x6b8a30];
const SLUDGE = 0x3e5218;
const SHEEN = 0xc8ff9a;

/**
 * Serpillière trempée dans le seau (inventaire, 2D) : plouf, anneau de vase
 * et gerbe de gouttes verdâtres épaisses (grumeaux, bulles) au-dessus de la case du seau.
 */
export function splash(scene: Phaser.Scene, x: number, y: number, size: number): Promise<void> {
  plouf();
  const g = scene.add.graphics().setDepth(760);
  const drops = Array.from({ length: 16 }, (_, i) => {
    const a = -Math.PI / 2 + (i / 15 - 0.5) * 2.2;
    // grumeaux : plus gros, plus sombres, partent moins haut
    const lump = i % 5 === 2;
    const v = size * (lump ? 2.4 + Math.random() : 3 + Math.random() * 1.8);
    const r = size * (lump ? 0.08 + Math.random() * 0.03 : 0.05 + Math.random() * 0.04);
    return { vx: Math.cos(a) * v, vy: Math.sin(a) * v, r, c: lump ? SLUDGE : SPLASH[i % SPLASH.length], lump };
  });
  // bulles qui crèvent à la surface
  const bubbles = Array.from({ length: 5 }, () => ({
    dx: (Math.random() - 0.5) * size * 0.6,
    r: size * (0.03 + Math.random() * 0.035),
    t0: Math.random() * 0.45,
  }));
  const top = y - size * 0.2;
  return new Promise((resolve) => {
    scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 1000,
      onUpdate: (tw) => {
        const k = tw.getValue() ?? 0;
        const t = k * 0.9;
        g.clear();
        // nappe de vase puis anneau à la surface du seau
        g.fillStyle(0x5c7a2a, 0.55 * (1 - k));
        g.fillEllipse(x, top, size * (0.35 + k * 0.5), size * (0.1 + k * 0.14));
        g.lineStyle(Math.max(2, size * 0.045), 0x7a9a3a, 0.9 * (1 - k));
        g.strokeEllipse(x, top, size * (0.4 + k * 0.9), size * (0.12 + k * 0.25));
        for (const b of bubbles) {
          const u = (k - b.t0) / 0.3;
          if (u < 0 || u > 1) continue;
          g.lineStyle(Math.max(1.5, size * 0.015), 0x8aa844, 1 - u);
          g.strokeCircle(x + b.dx, top - b.r * u, b.r * (0.6 + u * 0.6));
        }
        for (const d of drops) {
          const dx = x + d.vx * t;
          const dy = top + d.vy * t + 0.5 * size * (d.lump ? 11 : 9) * t * t;
          const al = 0.95 * (1 - k * k);
          // étirées dans le sens de la chute (les grumeaux restent ronds)
          const h = d.lump ? d.r * 2.2 : d.r * (2 + Math.abs(d.vy + size * 9 * t) / size);
          g.fillStyle(d.c, al);
          g.fillEllipse(dx, dy, d.r * 2, h);
          // reflet gluant
          g.fillStyle(SHEEN, al * (d.lump ? 0.35 : 0.7));
          g.fillCircle(dx - d.r * 0.35, dy - h * 0.2, d.r * 0.32);
        }
      },
      onComplete: () => {
        g.destroy();
        resolve();
      },
    });
  });
}
