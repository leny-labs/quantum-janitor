import Phaser from 'phaser';
import type { VendingRig } from '../three/rooms/vending';
import { drawNavButton } from '../ui/chrome';
import { uiPx } from '../ui/input';
import { chime, creak, glitch, splat, squeak, thud, whoosh } from '../ui/sfx';
import { ROOM_H, W } from '../ui/theme';

/** Ratés depuis le dernier cran gagné avant que le coup suivant passe d'office (jamais bloquant). */
const MERCY = 3;
/** Ratés d'affilée qui font revisser la spirale d'un cran. */
const SLIP = 2;

/**
 * Mini-jeu du manche (caméra déjà sur la vitrine) : clic / tap / Espace au
 * bout du balancement, un coup réussi par cran de spirale (fenêtre plus
 * serrée et rythme plus vif à chaque cran ; deux ratés d'affilée font perdre
 * un cran). Échap, flèche bas ou le bouton retour abandonnent proprement.
 * Résout true si le sandwich est tombé.
 */
export function playVending(scene: Phaser.Scene, rig: VendingRig): Promise<boolean> {
  return new Promise((resolve) => {
    /** Ratés au total (facture du bandeau), depuis le dernier cran, d'affilée. */
    let misses = 0;
    let since = 0;
    let streak = 0;
    let swinging = false;
    let over = false;
    /** Coup gagnant parti : on laisse le sandwich arriver dans le bac. */
    let landing = false;

    rig.onCue = (c) => {
      if (c === 'jab') whoosh();
      else if (c === 'miss') {
        thud();
        glitch();
        scene.cameras.main.shake(180, 0.004);
      } else if (c === 'back') creak(true);
      else if (c === 'creak') creak();
      else if (c === 'release') chime([660, 880, 1175]);
      else if (c === 'tip') squeak();
      else if (c === 'land') {
        thud();
        splat();
        scene.cameras.main.shake(140, 0.003);
      } else thud();
    };
    rig.start();

    // retour : même flèche que la caméra rapprochée de debug, cible tactile ≥ 48 px CSS
    const r = uiPx(scene, 28, 28);
    const g = scene.add.graphics();
    drawNavButton(g, r, 'down', 'idle');
    const back = scene.add
      .container(W / 2, ROOM_H - r - 16, [g])
      .setDepth(20)
      .setSize(r * 2 + 12, r * 2 + 12)
      .setInteractive({ useHandCursor: true });
    back.on('pointerover', () => drawNavButton(g, r, 'down', 'hover'));
    back.on('pointerout', () => drawNavButton(g, r, 'down', 'idle'));
    back.on('pointerdown', () => finish(false));

    const strike = async () => {
      if (swinging || over) return;
      swinging = true;
      if (rig.inWindow || since >= MERCY) {
        since = streak = 0;
        landing = rig.progress + 1 >= rig.steps;
        await rig.strike('hit', 0);
        if (landing) return finish(true);
      } else {
        misses++;
        since++;
        streak++;
        const slip = streak >= SLIP && rig.progress > 0;
        if (slip) streak = 0;
        await rig.strike(slip ? 'back' : 'miss', misses);
      }
      swinging = false;
    };
    const onDown = (p: Phaser.Input.Pointer, objs: Phaser.GameObjects.GameObject[]) => {
      if (objs.includes(back) || p.rightButtonDown()) return;
      void strike();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        void strike();
      } else if (e.key === 'Escape' || e.key === 'ArrowDown') finish(false);
    };
    const onShutdown = () => finish(false, true);
    scene.input.on('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, onShutdown);

    function finish(won: boolean, force = false): void {
      if (over || (landing && !won && !force)) return;
      over = true;
      if (!won) rig.stop();
      rig.onCue = null;
      scene.input.off('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
      scene.events.off(Phaser.Scenes.Events.SHUTDOWN, onShutdown);
      back.destroy();
      resolve(won);
    }
  });
}
