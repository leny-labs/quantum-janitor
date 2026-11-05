import * as THREE from 'three';
import { glow } from './kit';
import type { Stage } from './Stage';

/**
 * Props physiques en clic direct (docs/CHAPTERS.md, « Props interactifs physiques ») :
 * bouton, levier, interrupteur… Le décor enregistre le mesh d'un hotspot ; au clic
 * « use », RoomScene appelle `press(id)` : geste 3D lisible (enfoncer franchement / basculer),
 * flash + halo bref et petites étincelles, joué par-dessus les animations du décor, sans
 * bloquer l'action du YAML (RoomScene retarde juste la bulle de PRESS_LEAD ms).
 */
export type PressKind = 'button' | 'lever';

/** Délai conseillé avant d'ouvrir la bulle : laisse voir l'enfoncement / la bascule. */
export const PRESS_LEAD = 220;

/**
 * Porte qui s'ouvre au clic « use » (casier STOCK B-7/12 du Couloir B) : `open(id)` lance
 * l'ouverture et renvoie le temps (ms) à laisser avant la bulle, 0 si rien ne s'ouvre.
 */
export interface OpenRig {
  open(id: string): number;
}
export const CASIER_OPEN_ID = 'casier-open';
/** La porte du casier pivote (~1 s) avant que Gary ne « l'ouvre » dans la bulle. */
export const CASIER_OPEN_MS = 1000;

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
  /** Matériaux éclairables du prop (flash émissif) et leur émissif d'origine. */
  lit: { m: THREE.MeshToonMaterial | THREE.MeshStandardMaterial; base: THREE.Color }[];
  flashing: boolean;
  halo: THREE.Sprite;
  core: THREE.Sprite;
  sparks: { s: THREE.Sprite; dir: THREE.Vector2 }[];
  size: number;
}

const DUR = { button: 0.5, lever: 0.7 } as const;
/** Flash : tenu à plein un tiers du temps, puis s'éteint (lisible même à 30 i/s). */
const FLASH = 0.65;

/** Courbe du geste : entrée sèche, tenue, retour avec léger rebond (0 → 1 → 0). */
function curve(k: number): number {
  if (k < 0 || k >= 1) return 0;
  if (k < 0.18) return 1 - (1 - k / 0.18) ** 3;
  if (k < 0.55) return 1;
  const r = (k - 0.55) / 0.45;
  return (1 - r) ** 2 * Math.cos(r * Math.PI * 1.5);
}

/** Couleur dominante d'un prop (premier matériau coloré non blanc), pour teinter le flash. */
function tint(obj: THREE.Object3D): string {
  let c = '#ffffff';
  let found = false;
  obj.traverse((o) => {
    if (found || !(o instanceof THREE.Mesh)) return;
    const m = o.material as THREE.MeshToonMaterial;
    if (m?.color && !m.map && m.color.getHSL({ h: 0, s: 0, l: 0 }).s > 0.25) {
      c = '#' + m.color.getHexString();
      found = true;
    }
  });
  return c;
}

class PressRegistry implements PressRig {
  private items = new Map<string, Pressable>();
  private now = 0;

  constructor(s: Stage) {
    // appliqué en delta : compatible avec un décor qui repositionne déjà l'objet à chaque image
    s.animate((t) => {
      this.now = t;
      for (const p of this.items.values()) this.tick(p, t);
    });
  }

  private tick(p: Pressable, t: number): void {
    const e = t - p.start;
    const off = curve(e / DUR[p.kind]) * p.amount;
    if (off !== p.applied) {
      if (p.kind === 'button') p.obj.position.z += off - p.applied;
      else p.obj.rotation.x += off - p.applied;
      p.applied = off;
    }
    // flash : halo coloré qui s'ouvre, cœur blanc, étincelles, prop qui s'illumine
    const f = e >= 0 && e < FLASH ? e / FLASH : -1;
    const on = f >= 0;
    p.halo.visible = p.core.visible = on;
    for (const k of p.sparks) k.s.visible = on;
    if (on) {
      const fade = f < 0.35 ? 1 : ((1 - f) / 0.65) ** 1.5;
      p.halo.material.opacity = fade;
      p.halo.scale.setScalar(p.size * (0.9 + f * 0.9));
      p.core.material.opacity = 0.9 * fade;
      p.core.scale.setScalar(p.size * 0.55);
      for (const k of p.sparks) {
        const d = p.size * (0.2 + f * 0.75);
        k.s.position.set(k.dir.x * d, k.dir.y * d, 0.05);
        k.s.material.opacity = fade;
      }
      for (const { m, base } of p.lit) m.emissive.copy(m.color).multiplyScalar(1.1 * fade).add(base);
      p.flashing = true;
    } else if (p.flashing) {
      for (const { m, base } of p.lit) m.emissive.copy(base);
      p.flashing = false;
    }
  }

  add(id: string, obj: THREE.Object3D, kind: PressKind, amount: number): void {
    const lit: Pressable['lit'] = [];
    obj.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      const m = o.material;
      if ((m instanceof THREE.MeshToonMaterial || m instanceof THREE.MeshStandardMaterial) && !m.map) lit.push({ m, base: m.emissive.clone() });
    });
    const box = new THREE.Box3().setFromObject(obj);
    const dim = box.getSize(new THREE.Vector3());
    const size = THREE.MathUtils.clamp(Math.max(dim.x, dim.y) * 1.5, 0.25, 1.1);
    const color = tint(obj);
    // le flash vit dans le repère du prop (suit l'enfoncement / la bascule), devant sa face
    const fx = new THREE.Group();
    const center = obj.worldToLocal(box.getCenter(new THREE.Vector3()));
    fx.position.copy(center).setZ(center.z + dim.z * 0.5 + 0.06);
    // levier : le flash suit le pommeau (pièce la plus éloignée du pivot, même si le décor la fait bouger)
    let host: THREE.Object3D = obj;
    if (kind === 'lever') {
      let best = -1;
      const o0 = obj.getWorldPosition(new THREE.Vector3());
      obj.traverse((o) => {
        const d = o instanceof THREE.Mesh ? o.getWorldPosition(new THREE.Vector3()).distanceTo(o0) : -1;
        if (d > best) [best, host] = [d, o];
      });
      if (host !== obj) fx.position.set(0, 0, 0);
    }
    const halo = glow(color, size, 0);
    const core = glow('#ffffff', size * 0.6, 0);
    const n = kind === 'lever' ? 4 : 7;
    const sparks = Array.from({ length: n }, (_, i) => {
      const ang = (i / n) * Math.PI * 2 + 0.3;
      return { s: glow(i % 2 ? '#ffffff' : '#ffd166', size * 0.14, 0), dir: new THREE.Vector2(Math.cos(ang), Math.sin(ang)) };
    });
    for (const sp of [halo, core, ...sparks.map((k) => k.s)]) {
      sp.visible = false;
      sp.renderOrder = 10;
      sp.material.depthTest = false;
      fx.add(sp);
    }
    host.add(fx);
    this.items.set(id, { obj, kind, amount, start: -1e9, applied: 0, lit, flashing: false, halo, core, sparks, size });
  }

  press(id: string): PressKind | null {
    const p = this.items.get(id);
    if (!p) return null;
    if (!p.flashing) for (const l of p.lit) l.base.copy(l.m.emissive);
    p.start = this.now;
    return p.kind;
  }
}

/** Rend `obj` « pressable » au clic direct sur le hotspot `id`. */
export function pressable(s: Stage, id: string, obj: THREE.Object3D, kind: PressKind = 'button', amount = kind === 'button' ? -0.09 : 0.6): void {
  let reg = s.rig<PressRegistry>('press');
  if (!reg) s.expose('press', (reg = new PressRegistry(s)));
  reg.add(id, obj, kind, amount);
}
