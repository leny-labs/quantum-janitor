// Placement commun de B.O.B. dans les salles 3D (docs/CHAPTERS.md, « yeux de B.O.B. toujours visibles »).
// Le rect `bob` du YAML fixe où il est posé (pied au bas du rect, sur le sol) et sa taille :
// le hotspot et le mesh restent donc alignés. L'orientation, elle, n'est plus une valeur magique
// par salle : B.O.B. regarde la caméra de la salle (ses yeux sont sur sa face +Z), avec un
// léger ¾ vers le centre de l'écran. En dev, un garde-fou signale un placement où ses yeux
// tomberaient sous la barre d'inventaire (ROOM_H) ou trop près d'elle.
import * as THREE from 'three';
import { ROOM_H } from '../../ui/theme';
import { at } from '../kit';
import { bob } from '../props';
import type { Stage, Standing } from '../Stage';
import { BobIdle } from './bobidle';
import { BobVoice } from './bobvoix';

/** Marge (px écran) entre les yeux de B.O.B. et le haut de la barre d'inventaire. */
export const BOB_HUD_MARGIN = 24;

export interface BobSpotOpts {
  /** Diamètre du robot en part de la largeur du rect (défaut 0.75). */
  scale?: number;
  /** ¾ : rotation ajoutée vers le centre de l'écran, en radians (défaut 0.25 ; 0 = plein face). */
  turn?: number;
  /** Cabré vers la caméra (rotation X, négatif = face levée), pour les caméras très plongeantes. */
  tilt?: number;
  /** Hauteur du sol sous B.O.B. (défaut 0). */
  floorY?: number;
}

export interface BobSpot {
  robot: THREE.Group;
  /** Diamètre effectif du robot (monde). */
  w: number;
  stand: Standing;
}

/** Pose B.O.B. sur le rect `bob` de la salle, tourné vers la caméra, avec sa voix et son idle. */
export function bobSpot(s: Stage, opts: BobSpotOpts = {}): BobSpot {
  const stand = s.stand(s.rect('bob'), opts.floorY ?? 0);
  const w = stand.w * (opts.scale ?? 0.75);
  const cam = s.camera.position;
  const face = Math.atan2(cam.x - stand.x, cam.z - stand.z);
  // ¾ vers le centre : un B.O.B. à gauche de la caméra pivote vers la droite, et inversement
  const side = stand.x < cam.x ? 1 : -1;
  const robot = at(bob(w), stand.x, opts.floorY ?? 0, stand.z, face + side * (opts.turn ?? 0.25));
  robot.rotation.x = opts.tilt ?? 0;
  s.spot('bob', robot);
  const voice = new BobVoice(s, robot);
  s.expose('bobVoix', voice);
  // idle léger permanent (clignements, respiration, antenne, soupirs) ; s'efface devant voix et rigs
  s.expose('bobIdle', new BobIdle(s, robot, voice));
  if (import.meta.env.DEV) checkEyes(s, robot, w);
  return { robot, w, stand };
}

/** Garde-fou dev : les yeux (face avant) doivent rester au-dessus de la barre d'inventaire. */
function checkEyes(s: Stage, robot: THREE.Group, w: number): void {
  robot.updateMatrixWorld(true);
  const r = w / 2;
  // yeux : face avant (+Z local), à ~0.16 w du sol ; bas de la face : pare-choc avant
  const eyes = s.project(robot.localToWorld(new THREE.Vector3(0, w * 0.26 * 0.62, r * 0.9)));
  const toward = new THREE.Vector3().subVectors(s.camera.position, robot.position).setY(0).normalize();
  const front = new THREE.Vector3(Math.sin(robot.rotation.y), 0, Math.cos(robot.rotation.y));
  const limit = ROOM_H - BOB_HUD_MARGIN;
  if (eyes[1] > limit) console.warn(`[3D] B.O.B. : yeux à y=${Math.round(eyes[1])} sous la marge HUD (${limit}) → remonter/reculer le rect « bob »`);
  if (front.dot(toward) < 0.5) console.warn('[3D] B.O.B. : face trop détournée de la caméra (yeux peu visibles)');
}
