// Registre des pièces 3D : id de scène YAML → caméra fixe + construction du décor.
// Une scène YAML sans entrée ici retombe sur le rendu 2D (`art` du YAML).
import type { CameraSpec, Stage } from '../Stage';
import { couloir } from './couloir';
import { labo } from './labo';
import { panneau } from './panneau';
import { placard } from './placard';

export interface RoomBuild {
  camera: CameraSpec;
  build(stage: Stage): void;
}

export const ROOMS: Record<string, RoomBuild> = { placard, couloir, labo, panneau };
