import type Phaser from 'phaser';
import type { MouthShape, MouthStyle } from './types';
/** Taille (px) des textures de bouche générées ; affichées ensuite à l'échelle voulue. */
export declare const MOUTH_TEX_W = 128;
export declare const MOUTH_TEX_H = 80;
export declare function resolveMouthStyle(style?: MouthStyle): Required<MouthStyle>;
/** Clé de texture d'une forme pour un style donné. */
export declare function mouthTextureKey(shape: MouthShape, style?: MouthStyle): string;
/**
 * Génère (une seule fois par style) les 4 textures de bouche procédurales et
 * renvoie leurs clés. Toutes partagent le même cadre, centré : on peut
 * permuter la texture d'une Image sans la repositionner.
 */
export declare function ensureMouthTextures(scene: Phaser.Scene, style?: MouthStyle): Record<MouthShape, string>;
/** Dessine une forme de bouche stylisée sur un contexte 2D (MOUTH_TEX_W × MOUTH_TEX_H). */
export declare function drawMouth(ctx: CanvasRenderingContext2D, shape: MouthShape, style?: MouthStyle): void;
