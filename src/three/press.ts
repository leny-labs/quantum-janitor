import type * as THREE from 'three';
import type { Stage } from './Stage';

/**
 * Props physiques en clic direct (docs/CHAPTERS.md, « Props interactifs physiques ») :
 * bouton, levier, interrupteur… Le décor enregistre le mesh d'un hotspot ; au clic
 * « use », RoomScene appelle `press(id)` : petit geste 3D (enfoncer / basculer) joué
 * par-dessus les animations du décor, sans bloquer l'action du YAML.
 */
export type PressKind = 'button' | 'lever';

export interface PressRig {
  /** Joue le geste du hotspot `id` ; renvoie son type, ou null si aucun mesh n'est enregistré. */
  press(id: string): PressKind | null;
}

interface Pressable {
  obj: THREE.Object3D;
  kind: PressKind;
  /** Enfoncement (unités locales, axe z) ou bascule (radians, axe x). */
  amount: number;
  start: number;
  /** Décalage appliqué à l'image précédente (retiré avant d'appliquer le suivant). */
  applied: number;
}

const DUR = { button: 0.28, lever: 0.45 } as const;

class PressRegistry implements PressRig {
  private items = new Map<string, Pressable>();
  private now = 0;

  constructor(s: Stage) {
    // appliqué en delta : compatible avec un décor qui repositionne déjà l'objet à chaque image
    s.animate((t) => {
      this.now = t;
      for (const p of this.items.values()) {
        const k = (t - p.start) / DUR[p.kind];
        const off = k >= 0 && k < 1 ? Math.sin(Math.PI * k) * p.amount : 0;
        if (off === p.applied) continue;
        if (p.kind === 'button') p.obj.position.z += off - p.applied;
        else p.obj.rotation.x += off - p.applied;
        p.applied = off;
      }
    });
  }

  add(id: string, obj: THREE.Object3D, kind: PressKind, amount: number): void {
    this.items.set(id, { obj, kind, amount, start: -1e9, applied: 0 });
  }

  press(id: string): PressKind | null {
    const p = this.items.get(id);
    if (!p) return null;
    p.start = this.now;
    return p.kind;
  }
}

/** Rend `obj` « pressable » au clic direct sur le hotspot `id`. */
export function pressable(s: Stage, id: string, obj: THREE.Object3D, kind: PressKind = 'button', amount = kind === 'button' ? -0.06 : 0.5): void {
  let reg = s.rig<PressRegistry>('press');
  if (!reg) s.expose('press', (reg = new PressRegistry(s)));
  reg.add(id, obj, kind, amount);
}
