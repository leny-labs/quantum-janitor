// SYLVIE en personne, Direction Générale de l'Existence (st-direction) : mur de
// CRT de bureau 1985 (GenAI détouré, props/st/direction-ecrans.png) et, sur le
// grand écran central laissé vierge, le visage de SYLVIE redessiné en direct sur
// une CanvasTexture — même ADN que le portrait (yeux ronds cerclés, bouche-onde
// cyan, tracé partagé ui/waveShape) mais paupières mi-closes : fatiguée d'avoir
// raison. Clignement, onde qui s'agite quand c'est elle qui parle (engine/speaking).
// Le `sylvie()` partagé (props.ts : ch. 0, Studio) n'est pas touché.
import * as THREE from 'three';
import { isMood, type Mood } from '../engine/mood';
import { speaking } from '../engine/speaking';
import { wavePoints } from '../ui/waveShape';

export const DIRECTION_ECRANS_URL = `${import.meta.env.BASE_URL}props/st/direction-ecrans.png`;
export const DIRECTION_ECRANS_ASPECT = 1528 / 1024;
export const DIRECTION_TRONE_URL = `${import.meta.env.BASE_URL}props/st/direction-trone.png`;
export const DIRECTION_TRONE_ASPECT = 989 / 1024;

/** Écran central vierge dans direction-ecrans.png (px, image 1528 × 1024), mesuré sur le détourage. */
const SCREEN = { x0: 584, y0: 302, x1: 946, y1: 624 };
const IMG_W = 1528;
const IMG_H = 1024;

/** Paupière (0 ouvert · 1 fermé) selon l'humeur : au repos, mi-close, lasse. */
const LID: Record<Mood, number> = { calm: 0.4, suspicious: 0.55, angry: 0.5, love: 0.22, surprised: 0, sad: 0.58 };

const CYAN = '#7fffd4';
const CORE = '#e8fffa';

/**
 * Mur d'écrans debout au sol (pieds en y = 0), hauteur `h` monde, centré en x.
 * `update(t)` à chaque frame : visage de SYLVIE + scintillement des petits écrans.
 */
export function sylvieWall(h: number): { group: THREE.Group; update: (t: number) => void } {
  const w = h * DIRECTION_ECRANS_ASPECT;
  const group = new THREE.Group();

  const map = new THREE.TextureLoader().load(DIRECTION_ECRANS_URL);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  // éclairé par la pièce (le beige prend le teal), + émission propre : les écrans « sortent »
  const wallMat = new THREE.MeshStandardMaterial({ map, emissiveMap: map, emissive: '#ffffff', emissiveIntensity: 0.32, alphaTest: 0.4, roughness: 0.85 });
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wallMat);
  wall.position.y = h / 2;
  // pas d'ombre portée reçue : la carte d'ombre du key coupait le mur d'une bande horizontale
  wall.receiveShadow = false;
  group.add(wall);

  const sx = ((SCREEN.x0 + SCREEN.x1) / 2 / IMG_W - 0.5) * w;
  const sy = (1 - (SCREEN.y0 + SCREEN.y1) / 2 / IMG_H) * h;

  // ── visage : CanvasTexture sur l'écran central ──
  const fw = ((SCREEN.x1 - SCREEN.x0) / IMG_W) * w;
  const fh = ((SCREEN.y1 - SCREEN.y0) / IMG_H) * h;
  const CW = 512;
  const CH = Math.round((CW * fh) / fw);
  const canvas = document.createElement('canvas');
  canvas.width = CW;
  canvas.height = CH;
  const g = canvas.getContext('2d')!;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(fw, fh), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, fog: false }));
  face.position.set(sx, sy, 0.01);
  face.renderOrder = 2;
  group.add(face);

  const wave = { cell: CW, x0: CW * 0.22, x1: CW * 0.78, y: CH * 0.72, amp: CH * 0.11 };
  let level = 0;
  let lid = LID.calm;
  let last = 0;
  let frame = -1;

  const draw = (t: number, mood: Mood, blink: number) => {
    // fond CRT : dégradé teal bombé, coins arrondis
    g.clearRect(0, 0, CW, CH);
    g.save();
    const r = CH * 0.12;
    g.beginPath();
    g.roundRect(0, 0, CW, CH, r);
    g.clip();
    const bg = g.createRadialGradient(CW / 2, CH * 0.45, CH * 0.1, CW / 2, CH / 2, CW * 0.62);
    bg.addColorStop(0, '#2a9a8a');
    bg.addColorStop(0.6, '#17675f');
    bg.addColorStop(1, '#082a2a');
    g.fillStyle = bg;
    g.fillRect(0, 0, CW, CH);

    // yeux : anneau + pupille, paupière lasse (bande couleur d'écran + trait)
    const ey = CH * 0.4;
    const er = CH * 0.13;
    for (const ex of [CW * 0.32, CW * 0.68]) {
      g.save();
      g.shadowColor = CYAN;
      g.shadowBlur = 18;
      g.strokeStyle = '#c8fff0';
      g.lineWidth = CH * 0.022;
      g.beginPath();
      g.arc(ex, ey, er, 0, Math.PI * 2);
      g.stroke();
      g.fillStyle = CYAN;
      g.beginPath();
      g.arc(ex, ey + er * 0.08, er * 0.48, 0, Math.PI * 2);
      g.fill();
      g.restore();
      const close = Math.max(lid, blink);
      if (close > 0.01) {
        const yl = ey - er * 1.25 + close * er * 2.4;
        g.save();
        g.beginPath();
        g.arc(ex, ey, er * 1.25, 0, Math.PI * 2);
        g.clip();
        g.fillStyle = bg; // paupière = fond d'écran (pas de disque sombre)
        g.fillRect(ex - er * 1.3, ey - er * 1.3, er * 2.6, yl - (ey - er * 1.3));
        g.restore();
        g.save();
        g.shadowColor = CYAN;
        g.shadowBlur = 12;
        g.strokeStyle = '#c8fff0';
        g.lineWidth = CH * 0.02;
        g.lineCap = 'round';
        const half = Math.sqrt(Math.max(0, er * er - (yl - ey) ** 2)) + er * 0.15;
        g.beginPath();
        g.moveTo(ex - half, yl);
        g.lineTo(ex + half, yl);
        g.stroke();
        g.restore();
      }
    }

    // bouche-onde (même tracé que le portrait de dialogue)
    const pts = wavePoints(wave, mood, t, level);
    const path = () => {
      g.beginPath();
      pts.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)));
    };
    g.save();
    g.lineJoin = 'round';
    g.lineCap = 'round';
    g.shadowColor = CYAN;
    g.shadowBlur = 20;
    g.strokeStyle = CYAN;
    g.lineWidth = CH * 0.03;
    path();
    g.stroke();
    g.shadowBlur = 0;
    g.strokeStyle = CORE;
    g.lineWidth = CH * 0.011;
    path();
    g.stroke();
    g.restore();

    // balayage CRT : lignes + bande claire qui descend, vignette
    g.fillStyle = 'rgba(0, 20, 18, 0.18)';
    for (let y = 0; y < CH; y += 4) g.fillRect(0, y, CW, 1.5);
    const band = ((t * 0.25) % 1.3) * CH - CH * 0.15;
    const bl = g.createLinearGradient(0, band - CH * 0.08, 0, band + CH * 0.08);
    bl.addColorStop(0, 'rgba(200,255,240,0)');
    bl.addColorStop(0.5, 'rgba(200,255,240,0.07)');
    bl.addColorStop(1, 'rgba(200,255,240,0)');
    g.fillStyle = bl;
    g.fillRect(0, band - CH * 0.08, CW, CH * 0.16);
    const vg = g.createRadialGradient(CW / 2, CH / 2, CH * 0.35, CW / 2, CH / 2, CW * 0.6);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,10,12,0.45)');
    g.fillStyle = vg;
    g.fillRect(0, 0, CW, CH);
    g.restore();
    tex.needsUpdate = true;
  };

  const update = (t: number) => {
    const me = speaking.id === 'sylvie';
    const talking = me && speaking.talking;
    const mood: Mood = me && isMood(speaking.mood) ? speaking.mood : 'calm';
    const dt = Math.min(0.1, Math.max(0, t - last));
    last = t;
    level += ((talking ? 1 : 0) - level) * Math.min(1, (dt * 1000) / (talking ? 60 : 160));
    // en parlant elle s'anime un peu (paupière moins lourde) ; au repos, lasse
    const target = LID[mood] - (talking ? 0.12 : 0);
    lid += (Math.max(0, target) - lid) * Math.min(1, dt * 4);
    // clignement : lent, toutes les ~5 s
    const cyc = t % 5.3;
    const blink = cyc < 0.16 ? Math.sin((cyc / 0.16) * Math.PI) : 0;
    // ~30 redessins / s au plus
    const f = Math.round(t * 30);
    if (f !== frame) {
      frame = f;
      draw(t, mood, blink);
    }
    // petits écrans : léger scintillement, plus vif quand elle parle
    wallMat.emissiveIntensity = 0.3 + Math.sin(t * 7.1) * Math.sin(t * 2.3) * 0.03 + level * 0.08;
  };
  return { group, update };
}
