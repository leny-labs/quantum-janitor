import type Phaser from 'phaser';
import type { BlinkOptions, MouthDriver, MouthOptions, MouthShape, SpriteSheetOptions, TalkingPortraitOptions } from './types';
/**
 * Portrait parlant : image de base + bouche en overlay + clignement d'yeux,
 * ou spritesheet animée (boucles `idle` / `talk`, voir `setSpriteSheet`).
 *
 * Tous les ancrages (bouche, yeux) sont exprimés en fractions de la texture de
 * base (0..1), indépendamment du recadrage : changer la taille du cadre ne
 * déplace pas la bouche sur le visage.
 *
 * Aucun import Phaser à l'exécution : tout passe par la scène fournie, ce qui
 * évite les doublons de Phaser quand le package est lié (`file:`, monorepo).
 */
export declare class TalkingPortrait {
    readonly scene: Phaser.Scene;
    /** Conteneur racine, centré sur (x, y). */
    readonly container: Phaser.GameObjects.Container;
    private content;
    private base;
    private eyesClosedImg;
    private lids;
    private mouthImg;
    private width;
    private height;
    private fit;
    private mouthOpts;
    private mouthKeys;
    private blinkOpts;
    private eyesClosedKey;
    private shape;
    /** Mode spritesheet : clés des animations locales du sprite de base. */
    private sheet;
    private talkingNow;
    private closeTimer;
    /** Échelle et taille (px) de la texture de base affichée. */
    private baseScale;
    private baseW;
    private baseH;
    private blinkTimer;
    private breatheTween;
    private driver;
    private destroyed;
    constructor(scene: Phaser.Scene, opts: TalkingPortraitOptions);
    /** Ajoute le portrait à un conteneur parent, ou à la scène par défaut. */
    attach(parent?: Phaser.GameObjects.Container): this;
    /** Retire le portrait de son parent sans le détruire. */
    detach(): this;
    setPosition(x: number, y: number): this;
    setVisible(v: boolean): this;
    get visible(): boolean;
    setSize(width: number, height: number): this;
    /** Change le portrait de base (et éventuellement ses ancrages). */
    setTexture(key: string, frame?: string | number, opts?: {
        mouth?: MouthOptions;
        blink?: BlinkOptions;
        eyesClosed?: string;
    }): this;
    /**
     * Passe en mode spritesheet : le portrait joue `idle` en boucle et `talk`
     * pendant la parole. La bouche overlay et les paupières procédurales sont
     * coupées (le clignement fait partie de la boucle idle).
     *
     * ```ts
     * face.setSpriteSheet({
     *   key: 'portrait:gary', frameWidth: 256, frameHeight: 256,
     *   idle: { frames: [{ frame: 0, duration: 1800 }, { frame: 1, duration: 90 }] },
     *   talk: { frames: [2, 3, 4, 5], frameRate: 8 },
     * });
     * ```
     */
    setSpriteSheet(opts: SpriteSheetOptions): this;
    /** `true` si le portrait est en mode spritesheet. */
    get hasSpriteSheet(): boolean;
    /** `true` pendant la boucle `talk` (mode spritesheet). */
    get talking(): boolean;
    /** Mode spritesheet : bascule entre les boucles `talk` et `idle`. */
    setTalking(on: boolean): this;
    /** Met à jour ancrages / style de bouche et options de clignement. */
    configure(opts: {
        mouth?: MouthOptions;
        blink?: BlinkOptions;
    }): this;
    /** Forme de bouche courante. */
    get mouth(): MouthShape;
    setMouth(shape: MouthShape): this;
    /**
     * Déclare le driver actif (texte, audio…). Le précédent est mis au repos :
     * un seul driver anime la bouche à la fois.
     */
    claim(driver: MouthDriver): void;
    release(driver: MouthDriver): void;
    /** Ferme la bouche et arrête le driver actif. */
    idle(): this;
    /** Force un clignement immédiat. */
    blink(): void;
    setBreathing(amplitude: number | false): this;
    destroy(): void;
    private onShutdown;
    private cleanup;
    private leaveSheet;
    /** Convertit un point normalisé de la texture de base en coordonnées de `content`. */
    private toLocal;
    private layout;
    private applyFit;
    private scaleMouth;
    private canBlink;
    private scheduleBlink;
    private showLids;
    private drawLids;
    private drawLid;
}
