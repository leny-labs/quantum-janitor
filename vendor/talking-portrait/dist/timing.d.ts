/** Pause supplémentaire (en caractères) après `ch`, partagée par le typewriter et la bouche. */
export declare function pauseAfter(ch: string): number;
/**
 * Instants (ms) d'apparition de chaque caractère pour un débit donné.
 * `times[i]` = moment où le caractère i devient visible ; `total` = fin de la ligne.
 */
export declare function revealTimeline(text: string, cps: number, pauses?: boolean): {
    times: number[];
    total: number;
};
/** Nombre de caractères visibles à l'instant `elapsed`. */
export declare function visibleCount(times: number[], elapsed: number): number;
