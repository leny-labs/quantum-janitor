import type { TalkingPortrait } from './TalkingPortrait';
import type { MouthDriver, MouthShape } from './types';
export interface TypewriterMouthOptions {
    /** Caractères par seconde (doit correspondre au typewriter du jeu). Défaut 28. */
    cps?: number;
    /** Durée minimale d'une forme (ms) : évite un battement illisible. Défaut 75. */
    minHold?: number;
    /** Respecte les pauses de ponctuation (comme `typewrite`). Défaut `true`. */
    pauses?: boolean;
    /** Mode manuel (`pulse`) : bouche refermée après ce délai sans caractère (ms). Défaut 140. */
    closeAfter?: number;
}
/** Forme de bouche suggérée pour un caractère (FR/EN, accents ignorés). */
export declare function shapeForChar(ch: string): MouthShape;
/**
 * Driver « rythme du texte » : anime la bouche au débit du typewriter, sans
 * audio. `speak(text)` tourne en autonomie ; `pulse(ch)` permet de piloter
 * caractère par caractère depuis le typewriter du jeu.
 */
export declare class TypewriterMouth implements MouthDriver {
    private face;
    private opts;
    private times;
    private text;
    private total;
    private start;
    private lastChange;
    private lastPulse;
    private mode;
    private resolve;
    private listening;
    private destroyed;
    constructor(face: TalkingPortrait, opts?: TypewriterMouthOptions);
    get speaking(): boolean;
    /** Débit courant (chars/s). */
    get cps(): number;
    set cps(v: number);
    /** Anime la bouche le temps de « dire » `text`. Résout à la fin (ou sur `idle()`). */
    speak(text: string, opts?: {
        cps?: number;
    }): Promise<void>;
    /** Mode manuel : signale qu'un caractère vient d'apparaître. */
    pulse(ch: string): void;
    idle(): void;
    destroy(): void;
    private now;
    private finish;
    private listen;
    private apply;
    private tick;
}
