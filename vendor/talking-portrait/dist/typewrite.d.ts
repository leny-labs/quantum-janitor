import type Phaser from 'phaser';
export interface TypewriteOptions {
    /** Caractères par seconde. Défaut 30. */
    cps?: number;
    /** Pauses après la ponctuation. Défaut `true`. */
    pauses?: boolean;
    /** Appelé à chaque nouveau caractère visible (pour piloter `TypewriterMouth.pulse`, un son…). */
    onChar?: (ch: string, index: number) => void;
}
export interface TypewriteHandle {
    /** Résout quand tout le texte est affiché (fin normale ou `skip()`), `false` si `stop()`. */
    readonly done: Promise<boolean>;
    readonly finished: boolean;
    /** Affiche tout le texte immédiatement. */
    skip(): void;
    /** Interrompt sans compléter le texte. */
    stop(): void;
}
/**
 * Révèle progressivement `text` dans un `Phaser.GameObjects.Text`.
 * Le retour à la ligne est calculé sur le texte complet d'abord : les mots
 * ne sautent pas d'une ligne à l'autre pendant la frappe.
 */
export declare function typewrite(target: Phaser.GameObjects.Text, text: string, opts?: TypewriteOptions): TypewriteHandle;
