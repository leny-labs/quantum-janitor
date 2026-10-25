import Phaser from 'phaser';
import { EndScene } from './scenes/EndScene';
import { RoomScene } from './scenes/RoomScene';
import { TitleScene } from './scenes/TitleScene';
import { H, W } from './ui/theme';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: W,
  height: H,
  backgroundColor: '#0b0b12',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [TitleScene, RoomScene, EndScene],
});

// Accès console / tests automatisés en développement uniquement.
if (import.meta.env.DEV) (window as unknown as { __game: Phaser.Game }).__game = game;
