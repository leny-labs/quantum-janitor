// Humeurs de portrait (yeux de SYLVIE, sourcils de B.O.B.). Pas d'import Phaser :
// partagé avec tools/validate-content.ts et la 3D.

/** Humeurs reconnues : tag Ink `# mood: angry`, clé d'action YAML `mood: angry`. */
export const MOODS = ['calm', 'suspicious', 'angry', 'love', 'surprised', 'sad'] as const;
export type Mood = (typeof MOODS)[number];

export const isMood = (s: string | undefined): s is Mood => !!s && (MOODS as readonly string[]).includes(s);

// texte sans accents, en minuscules : les règles valent pour le FR et l'EN
const ANGRY = /!!|infraction|sanction|interdit|negatif|mensonge|colere|retenue|amende|violation|immediatement|forbidden|negative|\blie\b|penalty|fined?\b|angry|right now/;
const LOVE = /merci|bravo|excellent|felicitation|adore|\bj'aime|♥|<3|thank|well done|congrat|\blove|good citizen/;
const SUSPICIOUS = /suspect|verifi|hmm+|non conforme|confirmer|surveill|filme|analyse|enregistre|verif|suspicious|confirm|monitor|watching|recorded|analy[sz]|non-?compliant/;
const SURPRISED = /\?!|!\?|\boh+ non\b|\bquoi \?|pour moi \?|\bwow\b|\bwhoa\b|\boh+ no\b|\bwhat\?|for me\?/;
const SAD = /soupir|triste|desespoir|\bseul\b|pleur|deprim|epuis|personne ne|\bsigh|\bsad\b|despair|lonely|\bcry|depress|exhaust|nobody/;

/**
 * Humeur devinée d'une réplique sans tag : « !!! », infraction, sanction →
 * angry ; suspect, vérification, hmm → suspicious ; merci, bravo, excellent
 * citoyen, ♥ → love ; « ?! », oh non → surprised ; soupir, triste, seul →
 * sad ; sinon calm. (surprised / sad passent après les autres : une réplique
 * déjà reconnue garde son humeur.)
 */
export function guessMood(text: string): Mood {
  const s = text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); // i18n-ignore
  if (ANGRY.test(s)) return 'angry';
  if (LOVE.test(s)) return 'love';
  if (SUSPICIOUS.test(s)) return 'suspicious';
  if (SURPRISED.test(s)) return 'surprised';
  if (SAD.test(s)) return 'sad';
  return 'calm';
}

/** Humeur d'une réplique : le tag s'il est valide, sinon devinée sur le texte. */
export const lineMood = (text: string, tag?: string): Mood => (isMood(tag) ? tag : guessMood(text));
