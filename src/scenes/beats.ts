// Bruitages des petites animations des moments clés (rigs 3D des pièces).
// Les travels caméra restent silencieux : seuls les gestes font du bruit.
import type Phaser from 'phaser';
import type { LecteurCue } from '../three/rooms/lecteur';
import { beep, chime, splat, squeak, thud, whoosh } from '../ui/sfx';

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
