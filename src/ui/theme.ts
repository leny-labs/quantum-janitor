export const W = 1280;
export const H = 720;
/** Hauteur de la vue illustrée ; en dessous : barre d'inventaire. */
export const ROOM_H = 580;

export const FONT = '"Trebuchet MS", "DejaVu Sans", Verdana, sans-serif';
export const MONO = '"Courier New", "DejaVu Sans Mono", monospace';

export const COLORS = {
  panel: 0x14141f,
  panelBorder: 0x7fffd4,
  text: '#f2efe6',
  dim: '#9a98a8',
  accent: '#7fffd4',
  hover: '#ffd166',
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
