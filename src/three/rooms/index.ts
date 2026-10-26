// Registre des pièces 3D : id de scène YAML → caméra fixe + construction du décor.
// Une scène YAML sans entrée ici retombe sur le rendu 2D (`art` du YAML).
import type { SceneDef } from '../../engine/types';
import type { CameraSpec, ShotSpec, Stage } from '../Stage';
import { couloir } from './couloir';
import { labo } from './labo';
import { placard } from './placard';

export interface RoomBuild {
  camera: CameraSpec;
  /** `scene` donne accès aux autres scènes YAML (gros plans filmés dans ce décor). */
  build(stage: Stage, scene: (id: string) => SceneDef | undefined): void;
  /**
   * Travels d'examen : id de hotspot de la pièce → cadrage. Sur « Regarder »,
   * la caméra glisse vers l'objet le temps de la réplique puis revient.
   */
  shots?: Record<string, ShotSpec>;
}

export const ROOMS: Record<string, RoomBuild> = { placard, couloir, labo };

/**
 * Gros plans filmés dans le décor d'une autre pièce (même rendu 3D) :
 * id de scène YAML → pièce hôte. On y entre / sort par un travel caméra.
 */
export const CLOSEUPS: Record<string, string> = { panneau: 'labo' };
