import type { TalkingPortrait } from './TalkingPortrait';
import type { MouthDriver } from './types';
export interface SpriteTalkOptions {
    /** Caractères par seconde (doit correspondre au typewriter du jeu). Défaut 28. */
    cps?: number;
    /** Respecte les pauses de ponctuation (comme `typewrite`). Défaut `true`. */
    pauses?: boolean;
    /**
     * Écart entre deux caractères (ms) au-delà duquel on repasse en idle le temps
     * de la pause. Défaut `Infinity` : la boucle `talk` tient toute la réplique
     * (repasser en idle à chaque point fait sauter la planche). À régler vers
     * 600+ pour ne marquer que les longs silences.
     */
    pauseGap?: number;
}
/**
 * Driver pour portraits en spritesheet (`TalkingPortrait.setSpriteSheet`) :
 * boucle `talk` pendant toute la révélation du texte, `idle` à la fin (et,
 * si `pauseGap` est fini, pendant les longues pauses). Pas de forme de bouche par caractère : c'est la
 * boucle dessinée qui fait le « Sam & Max ».
 */
export declare class SpriteTalk implements MouthDriver {
    private face;
    private opts;
    private times;
    private total;
    private start;
    private active;
    private resolve;
    private destroyed;
    constructor(face: TalkingPortrait, opts?: SpriteTalkOptions);
    get speaking(): boolean;
    get cps(): number;
    set cps(v: number);
    /** Boucle `talk` le temps de « dire » `text`. Résout à la fin (ou sur `idle()`). */
    speak(text: string, opts?: {
        cps?: number;
    }): Promise<void>;
    /** Parle sans texte (VO, durée inconnue) jusqu'à `idle()`. */
    talk(): void;
    idle(): void;
    destroy(): void;
    private finish;
    private tick;
}
