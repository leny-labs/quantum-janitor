// Carte de la Station (ch.1, docs/CHAPTER1.md §4.1) : déclaration (content/station-map.yaml) et
// état des zones. Pur TypeScript (sans Phaser), partagé avec tools/validate-content.ts.
import { parse } from 'yaml';
import type { GameState } from './GameState';
import type { Condition } from './types';

/** Texte localisé de la carte (le français est la source, l'anglais facultatif). */
export interface MapText {
  fr: string;
  en?: string;
}

export interface MapZone {
  scene: string;
  label: MapText;
  /** Pas encore de scène dans le jeu : affichée (inconnue / verrouillée), jamais warpable. */
  planned?: boolean;
  /** Repérée sans avoir été visitée (sinon « ??? »). */
  visible?: Condition;
  /** Accès (reprend la condition de la sortie qui y mène). */
  unlock?: Condition;
  /** Motif du refus (« ACCÈS REFUSÉ — … »). */
  refused?: MapText;
}

export interface MapBand {
  id: string;
  label: MapText;
  zones: MapZone[];
}

export interface StationMap {
  bands: MapBand[];
}

export type ZoneState = 'here' | 'open' | 'seen' | 'locked' | 'unknown';

export function parseStationMap(text: string): StationMap {
  const m = parse(text) as StationMap;
  return { bands: m?.bands ?? [] };
}

export function mapText(t: MapText | undefined, lang: string): string {
  if (!t) return '';
  return (lang === 'en' && t.en) || t.fr;
}

/**
 * `here` = pièce courante ; `open` = visitée, déverrouillée, existante → warp ; `seen` = repérée,
 * accessible, mais jamais visitée (on y va à pied d'abord) ; `locked` = repérée mais pas (encore)
 * accessible ; `unknown` = « ??? ».
 */
export function zoneState(state: GameState, z: MapZone, sceneExists: (id: string) => boolean): ZoneState {
  if (state.scene === z.scene) return 'here';
  const visited = state.visited.has(z.scene);
  const known = visited || (!!z.visible && state.check(z.visible));
  if (!known) return 'unknown';
  const reachable = !z.planned && sceneExists(z.scene) && state.check(z.unlock);
  if (!reachable) return 'locked';
  return visited ? 'open' : 'seen';
}

/** La carte s'ouvre avec le plan en poche, dans la Station (flag d'état `st`). */
export function hasStationMap(state: GameState): boolean {
  return state.hasItem('plan_station') && state.hasFlag('st');
}
