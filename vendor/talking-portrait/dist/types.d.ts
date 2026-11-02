/** Formes de bouche minimales (Preston Blair « lite »). */
export type MouthShape = 'closed' | 'small' | 'open' | 'wide';
export declare const MOUTH_SHAPES: readonly MouthShape[];
/** Point normalisé dans le cadre du portrait : 0,0 = haut-gauche, 1,1 = bas-droite. */
export interface NormPoint {
    x: number;
    y: number;
}
/** Style des bouches procédurales (lèvres simples, stylisées). */
export interface MouthStyle {
    /** Couleur des lèvres. Défaut `#b8505a`. */
    lipColor?: string;
    /** Intérieur de la bouche. Défaut `#2a0f18`. */
    innerColor?: string;
    /** Dents (bande claire en haut de l'ouverture). `null` = pas de dents. Défaut `#f4efe6`. */
    teethColor?: string | null;
    /** Langue. `null` = pas de langue. Défaut `#d96a7a`. */
    tongueColor?: string | null;
    /** Contour sombre (style cartoon). `null` = pas de contour. Défaut `#1a0a10`. */
    outlineColor?: string | null;
}
export interface MouthOptions extends Partial<NormPoint> {
    /** Largeur de la bouche, en fraction de la largeur du portrait. Défaut 0.22. */
    width?: number;
    /** Rotation en radians (tête penchée). Défaut 0. */
    rotation?: number;
    /** Affiche la forme `closed` au repos. Défaut `true` ; mettre `false` si le portrait a déjà une bouche dessinée. */
    showClosed?: boolean;
    /** Spritesheet fournie au lieu des formes procédurales : clé de texture + frame par forme. */
    sheet?: {
        key: string;
        frames: Record<MouthShape, string | number>;
    };
    /** Style des formes procédurales. */
    style?: MouthStyle;
}
export interface EyeOptions extends NormPoint {
    /** Largeur de l'œil, en fraction de la largeur du portrait. Défaut 0.1. */
    width?: number;
    /** Hauteur de l'œil, en fraction de la largeur du portrait. Défaut `width * 0.6`. */
    height?: number;
}
export interface BlinkOptions {
    /** Active le clignement aléatoire. Défaut `true` (si yeux ou texture `eyesClosed` fournis). */
    enabled?: boolean;
    /** Intervalle min/max entre deux clignements (ms). Défaut 2200 / 5200. */
    minInterval?: number;
    maxInterval?: number;
    /** Durée d'un clignement (ms). Défaut 130. */
    duration?: number;
    /** Probabilité d'un double clignement. Défaut 0.15. */
    doubleChance?: number;
    /** Yeux procéduraux : paupières dessinées par-dessus le portrait. */
    eyes?: EyeOptions[];
    /** Couleur des paupières (peau). Défaut `#c98d6b`. */
    lidColor?: string;
    /** Couleur du trait de cils. Défaut `#1a0a10`. */
    lashColor?: string;
}
export interface PortraitLayers {
    /** Calque « yeux fermés » plein cadre, affiché pendant le clignement (remplace les paupières procédurales). */
    eyesClosed?: string;
}
export interface TalkingPortraitOptions {
    /** Centre du portrait (comme une Image Phaser). */
    x: number;
    y: number;
    width: number;
    height: number;
    /** Texture de base (portrait existant). Optionnelle : on peut la fixer plus tard via `setTexture`. */
    textureKey?: string;
    frame?: string | number;
    /** `cover` (défaut) rogne pour remplir le cadre ; `contain` laisse des marges. */
    fit?: 'cover' | 'contain';
    /** Calques optionnels. */
    layers?: PortraitLayers;
    mouth?: MouthOptions;
    blink?: BlinkOptions;
    /** Respiration idle discrète (échelle verticale). `false` pour couper, nombre = amplitude. Défaut 0.008. */
    breathe?: number | false;
    /** Profondeur d'affichage lors de l'attach à la scène. */
    depth?: number;
}
/** Frame d'une boucle sprite : index/nom de frame, ou frame + durée propre (ms). */
export type SpriteFrame = string | number | {
    frame: string | number;
    duration?: number;
};
export interface SpriteLoop {
    frames: SpriteFrame[];
    /**
     * Images/s pour les frames sans `duration` propre. Une frame avec `duration`
     * dure exactement ce temps (ms), quel que soit le frameRate : inutile de le
     * préciser si toutes les frames ont une durée. Défaut 8.
     */
    frameRate?: number;
}
/**
 * Portrait en spritesheet : une boucle `idle` (respiration, clignement) et une
 * boucle `talk` (bouche à différents degrés d'ouverture), style Sam & Max.
 */
export interface SpriteSheetOptions {
    /** Texture contenant toutes les frames (spritesheet Phaser, ou simple image découpée via frameWidth/Height). */
    key: string;
    /** Taille d'une frame : découpe la texture en grille si elle n'a pas déjà ces frames numérotées. */
    frameWidth?: number;
    frameHeight?: number;
    idle: SpriteLoop;
    talk: SpriteLoop;
    /** `setMouth('closed')` ne repasse en idle qu'après ce délai (ms) : pas de saccade sur m/b/p. Défaut 160. */
    closeHold?: number;
}
/** Contrat commun aux drivers de bouche (texte, audio, …). */
export interface MouthDriver {
    readonly speaking: boolean;
    /** Ferme la bouche et arrête le driver. */
    idle(): void;
    destroy(): void;
}
