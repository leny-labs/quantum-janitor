import Phaser from 'phaser';
import { END_SCENE_ID, getSession } from '../session';
import { makeButton } from '../ui/Button';
import { COLORS, FONT, H, W } from '../ui/theme';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create(): void {
    const session = getSession();
    const d = session.debug;
    // Mode debug : on saute l'écran titre (une seule fois).
    if (d.active && !this.registry.get('debugStarted')) {
      this.registry.set('debugStarted', true);
      session.startDebug();
      if (d.scene === END_SCENE_ID) this.scene.start('End', { knot: 'cafards' });
      else this.scene.start('Room');
      return;
    }

    this.add.rectangle(0, 0, W, H, 0x0b0b12).setOrigin(0);
    // étoiles placeholder
    const rnd = new Phaser.Math.RandomDataGenerator(['klepsydra']);
    for (let i = 0; i < 140; i++) {
      this.add.circle(rnd.between(0, W), rnd.between(0, H), rnd.realInRange(0.5, 2), 0xffffff, rnd.realInRange(0.2, 0.9));
    }
    // seau placeholder
    this.add.rectangle(W / 2, 470, 90, 80, 0x3d7dd8).setStrokeStyle(3, 0xffffff);
    this.add.ellipse(W / 2, 430, 96, 22, 0x6fa8ff).setStrokeStyle(3, 0xffffff);
    this.add.text(W / 2, 470, 'SEAU', { fontFamily: FONT, fontSize: '18px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);

    this.add
      .text(W / 2, 150, 'QUANTUM JANITOR', { fontFamily: FONT, fontSize: '86px', color: COLORS.accent, fontStyle: 'bold' })
      .setOrigin(0.5)
      .setShadow(4, 4, '#ff5c7a', 0, true, true);
    this.add.text(W / 2, 240, 'Chapitre 0 : « Le Seau »', { fontFamily: FONT, fontSize: '34px', color: COLORS.text }).setOrigin(0.5);
    this.add
      .text(W / 2, 300, "Station Klepsydra-9 · secteur Entretien · Gary Plunk, agent d'entretien intérimaire", {
        fontFamily: FONT,
        fontSize: '18px',
        color: COLORS.dim,
      })
      .setOrigin(0.5);

    const hasSave = session.save.has() && !d.active;
    let y = 570;
    if (hasSave) {
      makeButton(this, W / 2, y, 'Continuer', () => {
        if (!session.loadGame()) return;
        if (session.state.ended) this.scene.start('End', { final: true });
        else this.scene.start('Room');
      });
      y += 64;
    }
    makeButton(this, W / 2, y, hasSave ? 'Nouvelle partie (efface la sauvegarde)' : 'Nouvelle partie', () => {
      session.newGame();
      this.scene.start('Room');
    });

    this.add
      .text(W - 12, H - 10, 'Sauvegarde automatique · v0.1', { fontFamily: FONT, fontSize: '14px', color: COLORS.dim })
      .setOrigin(1, 1);
  }
}
