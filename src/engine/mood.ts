// Humeurs de portrait (yeux de SYLVIE). Pas d'import Phaser : partagé avec
// tools/validate-content.ts.

/** Humeurs reconnues : tag Ink `# mood: angry`, clé d'action YAML `mood: angry`. */
export const MOODS = ['calm', 'suspicious', 'angry', 'love'] as const;
export type Mood = (typeof MOODS)[number];

export const isMood = (s: string | undefined): s is Mood => !!s && (MOODS as readonly string[]).includes(s);

// texte sans accents, en minuscules : les règles valent pour le FR et l'EN
const ANGRY = /!!|infraction|sanction|interdit|negatif|mensonge|colere|retenue|amende|violation|immediatement|forbidden|negative|\blie\b|penalty|fined?\b|angry|right now/;
const LOVE = /merci|bravo|excellent|felicitation|adore|\bj'aime|♥|<3|thank|well done|congrat|\blove|good citizen/;
const SUSPICIOUS = /suspect|verifi|hmm+|non conforme|confirmer|surveill|filme|analyse|enregistre|verif|suspicious|confirm|monitor|watching|recorded|analy[sz]|non-?compliant/;

/**
 * Humeur devinée d'une réplique sans tag : « !!! », infraction, sanction →
 * angry ; suspect, vérification, hmm → suspicious ; merci, bravo, excellent
 * citoyen, ♥ → love ; sinon calm.
 */
export function guessMood(text: string): Mood {
  const s = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); // i18n-ignore
  if (ANGRY.test(s)) return 'angry';
  if (LOVE.test(s)) return 'love';
  if (SUSPICIOUS.test(s)) return 'suspicious';
  return 'calm';
}
