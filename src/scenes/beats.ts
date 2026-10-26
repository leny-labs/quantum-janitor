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

const SPLASH = [0x9fe8d0, 0x6fa8ff, 0xc8fff0, 0x7fffd4];

/**
 * Serpillière trempée dans le seau (inventaire, 2D) : plouf, anneau et
 * gerbe de gouttes phosphorescentes au-dessus de la case du seau.
 */
export function splash(scene: Phaser.Scene, x: number, y: number, size: number): Promise<void> {
  plouf();
  const g = scene.add.graphics().setDepth(760);
  const drops = Array.from({ length: 14 }, (_, i) => {
    const a = -Math.PI / 2 + (i / 13 - 0.5) * 2.2;
    const v = size * (3.2 + Math.random() * 1.8);
    return { vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: size * (0.05 + Math.random() * 0.04), c: SPLASH[i % SPLASH.length] };
  });
  const top = y - size * 0.2;
  return new Promise((resolve) => {
    scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 900,
      onUpdate: (tw) => {
        const k = tw.getValue() ?? 0;
        const t = k * 0.9;
        g.clear();
        // anneau à la surface du seau
        g.lineStyle(Math.max(2, size * 0.04), 0x9fe8d0, 1 - k);
        g.strokeEllipse(x, top, size * (0.4 + k * 0.9), size * (0.12 + k * 0.25));
        for (const d of drops) {
          const dx = x + d.vx * t;
          const dy = top + d.vy * t + 0.5 * size * 9 * t * t;
          g.fillStyle(d.c, 1 - k * k);
          // étirées dans le sens de la chute
          g.fillEllipse(dx, dy, d.r * 2, d.r * (2 + Math.abs(d.vy + size * 9 * t) / size));
        }
      },
      onComplete: () => {
        g.destroy();
        resolve();
      },
    });
  });
}
