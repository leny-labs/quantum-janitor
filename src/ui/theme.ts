export const W = 1280;
export const H = 720;
/** Hauteur de la vue illustrée ; en dessous : barre d'inventaire. */
export const ROOM_H = 580;

/** Texte d'interface (Chakra Petch, embarquée via @fontsource). */
export const FONT = '"Chakra Petch", "Trebuchet MS", "DejaVu Sans", sans-serif';
/** Titres, enseignes (Bungee). */
export const DISPLAY = 'Bungee, "Chakra Petch", Impact, sans-serif';
export const MONO = '"Courier New", "DejaVu Sans Mono", monospace';

export const COLORS = {
  panel: 0x14102a,
  panelHi: 0x241c48,
  panelBorder: 0x7fffd4,
  ink: 0x07050f,
  text: '#f6efe2',
  dim: '#a39cc4',
  accent: '#7fffd4',
  hover: '#ffd166',
  warm: '#ff8c42',
  danger: '#ff5c7a',
};

export function hex(c: string | undefined, fallback = 0x888888): number {
  if (!c) return fallback;
  const s = c.replace('#', '');
  const n = parseInt(s.length === 3 ? s.split('').map((x) => x + x).join('') : s, 16);
  return Number.isNaN(n) ? fallback : n;
}

export function setCursor(scene: Phaser.Scene, cursor: string): void {
  scene.game.canvas.style.cursor = cursor;
}

/** Polices embarquées : à charger avant le premier texte Phaser / canvas. */
export async function loadFonts(): Promise<void> {
  const specs = ['400 20px Bungee', '500 20px "Chakra Petch"', '600 20px "Chakra Petch"', '700 20px "Chakra Petch"', 'italic 500 20px "Chakra Petch"'];
  await Promise.all(specs.map((s) => document.fonts.load(s, 'AÀÉé«»…').catch(() => [])));
}
