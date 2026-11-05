// Carnet de déduction (ch.1, docs/CHAPTER1.md « Carnet de déduction ») : indices
// (content/clues.yaml) et déductions (content/deductions.yaml). Pur TypeScript (sans Phaser),
// partagé avec tools/validate-content.ts, tools/playthrough.ts et le walkthrough.
//
// Rien n'est stocké à part : un indice est « noté » quand sa condition `when` est vraie sur
// l'état (flags / objets déjà posés par les looks et dialogues), une déduction est « conclue »
// quand son flag `set` est posé. Sauvegardes, /creator et ?flags= / ?items= marchent donc tels quels.
import { parse } from 'yaml';
import type { GameState } from './GameState';
import { mapText, type MapText } from './stationMap';
import type { Condition } from './types';

/** Pictogrammes dessinés (Graphics) ; `item:<id>` = icône d'inventaire existante. */
export const CLUE_PICTOS = ['clock', 'schedule', 'display', 'ticket', 'skeleton', 'stamp', 'speech', 'shard', 'map', 'form', 'shutter'] as const;
export type CluePicto = (typeof CLUE_PICTOS)[number];

export interface ClueDef {
  id: string;
  title: MapText;
  text: MapText;
  /** Pictogramme (`clock`…) ou `item:<id>` (icône GenAI d'inventaire). */
  icon?: string;
  /** Condition (flags / objets) : vraie = indice noté au carnet. */
  when: Condition;
}

export interface DeductionDef {
  id: string;
  /** Une paire d'ids (indices ou conclusions), ordre libre — ou plusieurs paires alternatives. */
  needs: [string, string] | [string, string][];
  title: MapText;
  text: MapText;
  /** Flag posé quand la déduction est validée (= persistance). */
  set: string;
  /** Réplique affichée sous la conclusion (« bob: … », « narrateur: … » ou texte de Gary). */
  line?: MapText;
  icon?: string;
}

export interface Carnet {
  clues: ClueDef[];
  deductions: DeductionDef[];
}

export function parseClues(text: string): ClueDef[] {
  return ((parse(text) as { clues?: ClueDef[] })?.clues ?? []).map((c) => ({ ...c, when: c.when ?? {} }));
}

export function parseDeductions(text: string): DeductionDef[] {
  return (parse(text) as { deductions?: DeductionDef[] })?.deductions ?? [];
}

/** Paires acceptées par une déduction (forme courte `[a, b]` ou liste de paires). */
export function deductionPairs(d: DeductionDef): [string, string][] {
  const n = d.needs as unknown[];
  return Array.isArray(n[0]) ? (n as [string, string][]) : [n as [string, string]];
}

export const clueText = mapText;

/** Indices notés (ordre du YAML). */
export function knownClues(state: GameState, c: Carnet): ClueDef[] {
  if (!state.hasFlag('st')) return [];
  return c.clues.filter((k) => state.check(k.when));
}

/** Déductions validées (ordre du YAML). */
export function concluded(state: GameState, c: Carnet): DeductionDef[] {
  return c.deductions.filter((d) => state.hasFlag(d.set));
}

/** Ids combinables : indices notés + conclusions validées. */
export function usableIds(state: GameState, c: Carnet): Set<string> {
  return new Set([...knownClues(state, c).map((k) => k.id), ...concluded(state, c).map((d) => d.id)]);
}

/** Le bouton CARNET apparaît dès le premier indice noté. */
export function hasCarnet(state: GameState, c: Carnet): boolean {
  return knownClues(state, c).length > 0;
}

export type DeduceResult = { kind: 'ok'; deduction: DeductionDef } | { kind: 'already'; deduction: DeductionDef } | { kind: 'rejected' };

/**
 * Rapproche deux pièces (ordre libre). Ne modifie pas l'état : l'appelant pose `deduction.set`
 * si `ok`. Une pièce inconnue (pas encore notée) est toujours rejetée.
 */
export function deduce(state: GameState, c: Carnet, a: string, b: string): DeduceResult {
  const usable = usableIds(state, c);
  if (a === b || !usable.has(a) || !usable.has(b)) return { kind: 'rejected' };
  const d = c.deductions.find((x) => deductionPairs(x).some(([p, q]) => (p === a && q === b) || (p === b && q === a)));
  if (!d) return { kind: 'rejected' };
  return state.hasFlag(d.set) ? { kind: 'already', deduction: d } : { kind: 'ok', deduction: d };
}
