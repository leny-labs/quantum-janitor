// Bruitages des petites animations des moments clés (rigs 3D des pièces).
// Les travels caméra restent silencieux : seuls les gestes font du bruit.
import type Phaser from 'phaser';
import type { BobCue } from '../three/rooms/bobrepas';
import type { FuseCue } from '../three/rooms/fusible';
import type { LecteurCue } from '../three/rooms/lecteur';
import { beep, buzz, chime, glitch, powerDown, slurp, splat, squeak, thud, whoosh } from '../ui/sfx';

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
    case 'slurp':
      return slurp();
    case 'gulp':
      return thud();
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
