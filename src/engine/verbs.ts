// Verbes d'un hotspot et action « smart » (clic gauche / tap court).
// Aucun import Phaser : partagé avec tools/.
import { t } from '../i18n';
import type { Hotspot, Interaction, UseIcon } from './types';

export type VerbKind = 'look' | 'use' | 'talk';
/** Valeurs admises pour `smart:` dans le YAML. `menu` = ouvrir le verb coin. */
export const SMART_VALUES = ['look', 'use', 'talk', 'menu'] as const;
export type SmartChoice = (typeof SMART_VALUES)[number];

export interface HotspotVerb {
  kind: VerbKind;
  label: string;
  action: Interaction;
}

/** Verbes disponibles, dans l'ordre du verb coin (touches 1, 2, 3). */
export function hotspotVerbs(h: Hotspot): HotspotVerb[] {
  const list: HotspotVerb[] = [{ kind: 'look', label: t('verbs.look'), action: h.look ?? t('verbs.nothing') }];
  if (h.use) list.push({ kind: 'use', label: h.useLabel ?? t('verbs.use'), action: h.use });
  if (h.talk) list.push({ kind: 'talk', label: t('verbs.talk'), action: h.talk });
  return list;
}

/**
 * Devine le picto du verbe « utiliser » d'après son libellé source (français) :
 * « Prendre le fusible » → main qui saisit. Appelé au chargement, avant traduction.
 */
export function guessUseIcon(label: string | undefined): UseIcon {
  const l = (label ?? '').toLowerCase();
  if (/^(prend|ramass|saisi)/.test(l)) return 'take';
  if (/^(appuy|press|activ)/.test(l)) return 'press';
  return 'use';
}

/**
 * Verbe joué au clic gauche / tap court, ou `null` s'il faut ouvrir le verb
 * coin. Priorité par défaut : Parler (personnage) > Utiliser > Regarder ;
 * `smart:` dans le YAML la remplace (ex. `smart: look` quand « utiliser »
 * n'est qu'un refus, `smart: menu` quand aucun verbe ne s'impose).
 */
export function smartVerb(h: Hotspot): HotspotVerb | null {
  const verbs = hotspotVerbs(h);
  if (h.smart === 'menu') return verbs.length > 1 ? null : verbs[0];
  const pick = (k: VerbKind) => verbs.find((v) => v.kind === k);
  if (h.smart) return pick(h.smart) ?? verbs[0];
  return pick('talk') ?? pick('use') ?? verbs[0];
}
