// Registre des pièces 3D : id de scène YAML → caméra fixe + construction du décor.
// Une scène YAML sans entrée ici retombe sur le rendu 2D (`art` du YAML).
import type { SceneDef } from '../../engine/types';
import type { CameraSpec, ShotSpec, Stage } from '../Stage';
import { cockpit } from './cockpit';
import { couloir } from './couloir';
import { eclat } from './eclat';
import { galerie } from './galerie';
import { labo } from './labo';
import { nid } from './nid';
import { placard } from './placard';
import { stAttente, stSas } from './station';
import { temple } from './temple';

export interface RoomBuild {
  camera: CameraSpec;
  /** `scene` donne accès aux autres scènes YAML (gros plans filmés dans ce décor). */
  build(stage: Stage, scene: (id: string) => SceneDef | undefined): void;
  /**
   * Travels d'examen : id de hotspot de la pièce → cadrage. Sur « Regarder »,
   * la caméra glisse vers l'objet le temps de la réplique puis revient.
   */
  shots?: Record<string, ShotSpec>;
  /**
   * Plan d'arrivée : id d'un travel de `shots` filmé pendant les répliques
   * `onFirstEnter` de la pièce (push-in, réplique, retour ; sautable).
   */
  intro?: string;
}

export const ROOMS: Record<string, RoomBuild> = {
  placard,
  couloir,
  labo,
  // ch.1 « Blattaria Prime »
  'nid-royal': nid,
  'galerie-des-offrandes': galerie,
  'temple-couloir': temple,
  'coeur-eclat': eclat,
  // interlude ch.0 → ch.1 « la Capsule de Service CS-07 »
  'interlude-vaisseau': cockpit,
  // ch.1 « La Station Bureaucratique » (scènes st-*)
  'st-sas': stSas,
  'st-attente': stAttente,
};

/**
 * Gros plans filmés dans le décor d'une autre pièce (même rendu 3D) :
 * id de scène YAML → pièce hôte. On y entre / sort par un travel caméra.
 */
export const CLOSEUPS: Record<string, string> = { panneau: 'labo' };
