import type { TalkingPortrait } from './TalkingPortrait';
import type { MouthDriver, MouthShape } from './types';
/** Sous-ensemble utilisé de `@beer-digital/lipsync-engine` (pas de dépendance de types). */
export interface LipSyncModule {
    LipSyncEngine: new (opts?: Record<string, unknown>) => LipSyncEngineLike;
}
interface LipSyncEngineLike {
    init(): Promise<void>;
    attachElement(el: HTMLMediaElement): void;
    startAnalysis(): void;
    stopAnalysis?(): void;
    destroy?(): void;
    on(ev: 'viseme', cb: (frame: VisemeFrame) => void): void;
}
interface VisemeFrame {
    viseme?: string;
    intensity?: number;
    shape?: {
        open?: number;
        width?: number;
        round?: number;
    };
}
export interface AudioMouthOptions {
    /**
     * Moteur de visèmes :
     * - module importé (`await import('@beer-digital/lipsync-engine')`) : recommandé avec un bundler ;
     * - `'auto'` (défaut) : tente un import dynamique, sinon analyseur intégré ;
     * - `null` : analyseur intégré (AnalyserNode, zéro dépendance).
     */
    lipsync?: LipSyncModule | 'auto' | null;
    /** Options passées à `new LipSyncEngine(...)`. */
    lipsyncOptions?: Record<string, unknown>;
    /** AudioContext partagé (sinon créé à la demande). */
    context?: AudioContext;
    /** Gain de détection de l'analyseur intégré. Défaut 1. */
    sensitivity?: number;
    /** Durée minimale d'une forme (ms). Défaut 70. */
    minHold?: number;
    volume?: number;
}
/** Forme de bouche depuis une frame `lipsync-engine` (open/width/round 0..1). */
export declare function shapeFromViseme(frame: VisemeFrame): MouthShape;
/**
 * Driver audio (VO). Analyse le son joué et anime la bouche. Dégrade
 * proprement : lipsync-engine → analyseur WebAudio intégré → battement
 * simple pendant la lecture si WebAudio est indisponible.
 */
export declare class AudioMouth implements MouthDriver {
    private face;
    private element;
    private buffer;
    private opts;
    private ctx;
    private analyser;
    private engine;
    private bufferSource;
    private timeData;
    private freqData;
    private level;
    private lastChange;
    private playing;
    private resolve;
    private listening;
    private destroyed;
    private readonly sensitivity;
    private readonly minHold;
    private constructor();
    /** Charge une VO depuis une URL (lecture en streaming via `<audio>`). */
    static fromUrl(face: TalkingPortrait, url: string, opts?: AudioMouthOptions): Promise<AudioMouth>;
    /** Utilise un élément `<audio>`/`<video>` existant. */
    static fromElement(face: TalkingPortrait, el: HTMLMediaElement, opts?: AudioMouthOptions): Promise<AudioMouth>;
    /** Utilise un AudioBuffer déjà décodé (VO synthétisée, pack audio…). */
    static fromBuffer(face: TalkingPortrait, buffer: AudioBuffer, opts?: AudioMouthOptions): AudioMouth;
    get speaking(): boolean;
    /** Lance la lecture et anime la bouche ; résout à la fin du son (ou sur `idle()`). */
    speak(): Promise<void>;
    idle(): void;
    destroy(): void;
    private setupAnalyser;
    private stopPlayback;
    private listen;
    /** Applique une forme en respectant `minHold`. */
    private push;
    private tick;
}
export {};
