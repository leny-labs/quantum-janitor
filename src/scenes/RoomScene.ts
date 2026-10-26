import Phaser from 'phaser';
import { ActionRunner, type ActionHost } from '../engine/ActionRunner';
import { toActions } from '../engine/content';
import { EXIT_CURSORS, HotspotLayer } from '../engine/HotspotLayer';
import { resolveCombine } from '../engine/combine';
import { Inventory } from '../engine/Inventory';
import { SceneManager } from '../engine/SceneManager';
import type { Action, Exit, Hotspot, Interaction } from '../engine/types';
import { hotspotVerbs, smartVerb, type HotspotVerb } from '../engine/verbs';
import { getSession, type Session } from '../session';
import { RoomRenderer, RoomView } from '../three/RoomRenderer';
import { CLOSEUPS, ROOMS } from '../three/rooms';
import { VendingRig } from '../three/rooms/vending';
import { makeButton } from '../ui/Button';
import { DialogueBox } from '../ui/DialogueBox';
import { HoverLabel } from '../ui/HoverLabel';
import { ProgressCue } from '../ui/ProgressCue';
import { drawNavButton, verbCursor, type VerbIcon } from '../ui/chrome';
import { t, tl } from '../i18n';
import { isTouch, uiPx } from '../ui/input';
import { playMusic, themeForScene } from '../ui/music';
import { makeMusicToggle } from '../ui/MusicToggle';
import { PressRing } from '../ui/PressRing';
import { RoomPlaque } from '../ui/RoomPlaque';
import { VerbCoin } from '../ui/VerbCoin';
import { playVending } from './VendingGame';
import { FONT, MONO, ROOM_H, W, hex, setCursor } from '../ui/theme';

/** Durée (s) du push-in lent du plan d'arrivée. */
const INTRO_PUSH = 2.1;

/** La scène Phaser principale : une vue fixe + inventaire + dialogues. */
export class RoomScene extends Phaser.Scene implements ActionHost {
  private session!: Session;
  private layer!: HotspotLayer;
  private room!: RoomView;
  private scenes!: SceneManager;
  private inventory!: Inventory;
  private dialogueBox!: DialogueBox;
  private hover!: HoverLabel;
  private cue!: ProgressCue;
  private coin!: VerbCoin;
  private press: PressRing | null = null;
  private dropButton: Phaser.GameObjects.Container | null = null;
  private runner!: ActionRunner;
  private plaque!: RoomPlaque;
  /** Boutons du HUD (lus aussi par tools/tap-check.ts). */
  menuButton!: Phaser.GameObjects.Container;
  musicButton!: Phaser.GameObjects.Container;
  private debugText: Phaser.GameObjects.Text | null = null;
  private heldItem!: Phaser.GameObjects.Text;
  /** Flèche « retour » quand la caméra reste sur un travel d'examen (?shot=…). */
  private shotExit: Phaser.GameObjects.Container | null = null;
  private busy = false;
  /** Plan d'arrivée en cours de travel : coupe sèche vers la vue de la pièce. */
  private skipCine: (() => void) | null = null;

  constructor() {
    super('Room');
  }

  create(): void {
    this.session = getSession();
    this.session.activeScene = this;
    const { state, content } = this.session;
    this.busy = false;
    this.skipCine = null;
    state.selectedItem = null;
    this.input.mouse?.disableContextMenu();

    this.layer = new HotspotLayer(
      this,
      state,
      {
        hoverHotspot: (h) => this.onHoverHotspot(h),
        hoverExit: (e) => this.onHoverExit(e),
        clickHotspot: (h, p) => this.onClickHotspot(h, p),
        clickExit: (e, p) => this.onClickExit(e, p),
      },
      this.session.debug.overlay,
    );
    this.room = new RoomView(this, RoomRenderer.get(W, ROOM_H), (id) => content.scenes.get(id));
    this.scenes = new SceneManager(
      this,
      content,
      state,
      this.layer,
      { width: W, height: ROOM_H },
      (def) => this.room.show(def, (c) => state.check(c)),
      (from, to) => this.room.travel(from, to),
    );
    this.inventory = new Inventory(this, content, state, {
      click: (id, p) => this.onClickItem(id, p),
      hover: (id) => this.onHoverItem(id),
    });
    this.runner = new ActionRunner(state, this);
    this.dialogueBox = new DialogueBox(this);
    this.hover = new HoverLabel(this);
    this.coin = new VerbCoin(this);
    this.cue = new ProgressCue(
      this,
      state,
      () => this.dialogueBox.isOpen,
      (i) => {
        this.inventory.reveal(i);
        return this.inventory.slotRect(i);
      },
    );

    // HUD
    this.plaque = new RoomPlaque(this);
    const menu = (this.menuButton = makeButton(this, W - 14, 10, t('hud.menu'), () => !this.busy && this.scene.start('Title'), {
      size: uiPx(this, 18, 14),
      align: 'right',
      valign: 'top',
    }).setDepth(700));
    this.musicButton = makeMusicToggle(this, menu.x - menu.width / 2 - 8 - menu.height / 2, menu.y, menu.height).setDepth(700);
    if (this.session.debug.overlay) {
      this.debugText = this.add
        .text(14, 96, '', { fontFamily: MONO, fontSize: '13px', color: '#ff99ff', backgroundColor: '#000000aa', wordWrap: { width: 700 } })
        .setDepth(700);
    }
    this.heldItem = this.add
      .text(0, 0, '', { fontFamily: FONT, fontSize: '18px', color: '#ffffff', fontStyle: 'bold', padding: { x: 6, y: 4 } })
      .setDepth(790)
      .setVisible(false);
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.heldItem.setPosition(p.x + 14, p.y + 14));
    // clic dans le vide : reposer l'objet tenu ; en gros plan, sinon, reculer vers la pièce
    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      // plan d'arrivée : un clic / tap saute au plan de la pièce (la réplique, elle, se lit normalement)
      if (this.skipCine && !this.dialogueBox.isOpen) return this.skipCine();
      // caméra rapprochée hors dialogue : n'importe quel clic dans la vue la ramène
      if (this.room.examining && !this.busy && p.y < ROOM_H) return this.leaveShot();
      if (over.length > 0 || p.y >= ROOM_H) return;
      if (state.selectedItem) {
        if (p.rightButtonDown()) state.select(null);
        return;
      }
      if (p.rightButtonDown() || !this.room.onSubject(p.x, p.y)) this.leaveCloseup();
    });
    const onKey = (e: KeyboardEvent) => {
      if (this.skipCine && !this.dialogueBox.isOpen && !e.repeat) return this.skipCine();
      if (e.key === 'Escape' || e.key === 'ArrowDown') this.leaveCloseup();
    };
    window.addEventListener('keydown', onKey);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => window.removeEventListener('keydown', onKey));
    this.dropButton = null;
    this.press = null;
    this.shotExit = null;

    const off = state.onChange(() => {
      this.refresh();
      this.cue.check();
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.press?.cancel();
      off();
      setCursor(this, 'default');
      if (this.session.activeScene === this) this.session.activeScene = null;
    });

    this.cameras.main.fadeIn(400, 0, 0, 0);
    let first = this.scenes.show();
    // debug ?cine=1 : rejoue l'arrivée (une fois par chargement)
    if (this.session.debug.cine && !this.registry.get('debugCine')) {
      this.registry.set('debugCine', true);
      first = true;
    }
    this.parkDebugShot();
    void this.locked(() => this.enter(first));
  }

  // ── rendu ────────────────────────────────────────────────────────────

  update(): void {
    this.room.update();
  }

  private refresh(): void {
    this.scenes.refresh();
    this.inventory.render();
    const { state, content } = this.session;
    this.plaque.show(this.scenes.current());
    playMusic(themeForScene(state.scene));
    const held = state.selectedItem ? content.items.get(state.selectedItem) : null;
    this.heldItem.setVisible(!!held);
    if (held) this.heldItem.setText(held.icon.glyph).setBackgroundColor(held.icon.color);
    this.renderDropButton(held?.name ?? null);
    this.hover.set(null);
    this.room.highlight(null);
    if (!this.busy) setCursor(this, held ? 'crosshair' : 'default');
    this.debugText?.setText(
      t('hud.debug', { scene: state.scene, flags: [...state.flags].join(',') || '∅', items: state.items.join(',') || '∅' }),
    );
  }

  private enterActions(first: boolean): Action[] {
    const def = this.scenes.current();
    const list: Action[] = [];
    if (first && def.onFirstEnter) list.push(...toActions(def.onFirstEnter));
    if (def.onEnter) list.push(...toActions(def.onEnter));
    return list;
  }

  /** Actions d'arrivée dans la pièce ; en 3D, `onFirstEnter` peut être filmé (plan d'arrivée). */
  private async enter(first: boolean): Promise<void> {
    const def = this.scenes.current();
    const intro = first && def.onFirstEnter ? ROOMS[def.id]?.intro : undefined;
    if (intro) {
      await this.filmed(intro, def.onFirstEnter);
      if (def.onEnter) await this.runner.run(def.onEnter);
      return;
    }
    await this.runner.run(this.enterActions(first));
  }

  /**
   * Plan d'arrivée : push-in lent vers `shot`, répliques, retour à la pièce.
   * Clic / tap / touche pendant un travel = coupe sèche sur la vue de la
   * pièce ; les répliques sont jouées quoi qu'il arrive (l'état ne dépend
   * jamais du saut).
   */
  private async filmed(shot: string, i: Interaction | undefined): Promise<void> {
    const move = this.room.examine(shot, false, INTRO_PUSH);
    if (!move) return this.runner.run(i);
    this.scenes.spots(false);
    let skipped = false;
    const skip = new Promise<void>((resolve) => {
      this.skipCine = () => {
        skipped = true;
        this.skipCine = null;
        this.room.release(true);
        resolve();
      };
    });
    try {
      await Promise.race([move, skip]);
      await this.runner.run(i);
      this.dialogueBox.close();
      if (!skipped && this.sys.isActive()) {
        const back = this.room.release();
        if (back) await Promise.race([back, skip]);
      }
    } finally {
      this.skipCine = null;
      if (this.sys.isActive()) this.scenes.spots(true);
    }
  }

  /** Bloque les entrées le temps de `fn` (interaction, plan, mini-jeu). */
  private async locked(fn: () => Promise<void>): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    this.press?.cancel();
    this.coin.close();
    this.hover.set(null);
    setCursor(this, 'default');
    try {
      await fn();
    } catch (e) {
      console.error(e);
    } finally {
      this.busy = false;
      if (this.sys.isActive()) {
        this.dialogueBox.close();
        this.refresh();
      }
    }
  }

  /**
   * Exécute une interaction en bloquant les entrées. Avec `shot` (verbe
   * Regarder d'un hotspot qui a un travel d'examen), la caméra glisse vers
   * l'objet pendant la réplique puis revient.
   */
  private async act(i: Interaction | undefined, shot?: string): Promise<void> {
    if (this.busy || !i || (Array.isArray(i) && i.length === 0)) return;
    await this.locked(async () => {
      const scene = this.session.state.scene;
      const move = shot ? this.room.examine(shot) : null;
      if (move) this.scenes.spots(false);
      try {
        await this.runner.run(i);
        if (move && this.room.examining === shot && this.session.state.scene === scene && this.sys.isActive()) {
          this.dialogueBox.close();
          const back = this.room.release();
          if (back) await back;
        }
      } finally {
        if (move && this.sys.isActive()) this.scenes.spots(true);
      }
    });
  }

  /**
   * Serpillière sur le distributeur (en 3D) : travel sur la vitrine,
   * mini-jeu du manche, puis la suite du YAML (objet, flag, réplique) — la
   * ligne du narrateur, que le mini-jeu montre, est sautée. Abandon : rien
   * ne change, on peut retenter.
   */
  private async vending(rig: VendingRig, reaction: Interaction): Promise<void> {
    const move = this.room.examine(VendingRig.GAME_SHOT);
    if (!move) return this.runner.run(reaction);
    this.scenes.spots(false);
    try {
      await move;
      if (await playVending(this, rig)) {
        await this.runner.run(toActions(reaction).map((a) => (a.say?.startsWith('narrateur:') ? { ...a, say: undefined } : a)));
      }
      this.dialogueBox.close();
      if (!this.sys.isActive()) return;
      const back = this.room.release();
      if (back) await back;
    } finally {
      if (this.sys.isActive()) this.scenes.spots(true);
    }
  }

  private pick(list: string[]): string {
    return list[Math.floor(Math.random() * list.length)];
  }

  private get blocked(): boolean {
    return this.busy || this.dialogueBox.isOpen || this.coin.isOpen || !!this.room.examining;
  }

  /** Tactile : objet en main → bouton « Reposer » (pas de clic droit au doigt). */
  private renderDropButton(heldName: string | null): void {
    this.dropButton?.destroy();
    this.dropButton = null;
    if (!heldName || !isTouch()) return;
    this.heldItem.setVisible(false);
    this.dropButton = makeButton(this, 14, ROOM_H - 14, t('hud.drop'), () => this.session.state.select(null), {
      size: uiPx(this, 20, 15),
      align: 'left',
      kicker: t('hud.held', { item: heldName.toUpperCase() }),
    }).setDepth(700);
    this.dropButton.setY(this.dropButton.y - this.dropButton.height / 2);
  }

  private verbIcon(v: HotspotVerb, h: Hotspot): VerbIcon {
    return v.kind === 'talk' ? 'talk' : v.kind === 'look' ? 'look' : (h.useIcon ?? 'use');
  }

  /** Ouvre le verb coin d'un hotspot au point (x, y). */
  private openCoin(h: Hotspot, x: number, y: number, touch: boolean): void {
    const verbs = hotspotVerbs(h).map((v) => ({ label: v.label, icon: this.verbIcon(v, h), run: () => void this.act(v.action, v.kind === 'look' ? h.id : undefined) }));
    this.hover.set(null);
    setCursor(this, 'default');
    this.coin.open(x, y, h.label, verbs, { touch });
  }

  /** Action du clic gauche / tap court. */
  private smartAction(h: Hotspot, p: Phaser.Input.Pointer, touch: boolean): void {
    const v = smartVerb(h);
    if (v) void this.act(v.action, v.kind === 'look' ? h.id : undefined);
    else this.openCoin(h, p.x, p.y, touch);
  }

  private useHeldOn(h: Hotspot): void {
    const { state, content } = this.session;
    if (!state.selectedItem) return;
    const item = content.items.get(state.selectedItem)!;
    const reaction = h.useItem?.[item.id] ?? h.useItemDefault ?? this.pick(tl('room.wrongItem', { item: item.name, target: h.label }));
    state.select(null);
    // mini-jeu 3D du manche ; sans rendu 3D, la réplique du YAML suffit
    const rig = h.id === 'distributeur' && item.id === 'serpilliere' && !state.hasFlag('sandwich_tombe') ? this.room.rig<VendingRig>('vending') : null;
    if (rig) return void this.locked(() => this.vending(rig, reaction));
    void this.act(reaction);
  }

  /** Tactile : tap / appui long au point de contact. */
  private startPress(p: Phaser.Input.Pointer, onTap: () => void, onLong: () => void): void {
    this.press?.cancel();
    this.press = new PressRing(
      this,
      p.x,
      p.y,
      () => !this.blocked && onTap(),
      () => !this.blocked && onLong(),
    );
  }

  // ── entrées ──────────────────────────────────────────────────────────

  private onHoverHotspot(h: Hotspot | null): void {
    this.room.highlight(h && !this.blocked ? h.id : null);
    if (this.blocked) return;
    const { state, content } = this.session;
    if (!h) {
      this.hover.set(null);
      setCursor(this, state.selectedItem ? 'crosshair' : 'default');
      return;
    }
    const held = state.selectedItem ? content.items.get(state.selectedItem) : null;
    if (held) {
      this.hover.set(t('hud.useOn', { item: held.name, target: h.label }));
      setCursor(this, 'crosshair');
      return;
    }
    const v = smartVerb(h);
    this.hover.set(v ? t('hud.smart', { verb: v.label, target: h.label }) : t('hud.more', { target: h.label }));
    setCursor(this, v ? verbCursor(this.verbIcon(v, h)) : 'context-menu');
  }

  private onHoverExit(e: Exit | null): void {
    if (this.blocked) return;
    if (!e) {
      this.hover.set(null);
      setCursor(this, this.session.state.selectedItem ? 'crosshair' : 'default');
      return;
    }
    this.hover.set(t('hud.exit', { exit: e.label }));
    setCursor(this, EXIT_CURSORS[e.dir ?? 'right']);
  }

  private onHoverItem(id: string | null): void {
    if (this.blocked) return;
    const { state, content } = this.session;
    if (!id) {
      this.hover.set(null);
      return;
    }
    const def = content.items.get(id)!;
    const held = state.selectedItem && state.selectedItem !== id ? content.items.get(state.selectedItem) : null;
    this.hover.set(held ? t('hud.combine', { item: held.name, target: def.name }) : def.name);
  }

  private onClickHotspot(h: Hotspot, p: Phaser.Input.Pointer): void {
    if (this.blocked) return;
    const { state } = this.session;
    if (isTouch(p)) {
      // pas de survol au doigt : on montre tout de suite ce qu'on touche
      this.onHoverHotspot(h);
      if (state.selectedItem) return this.startPress(p, () => this.useHeldOn(h), () => this.useHeldOn(h));
      return this.startPress(
        p,
        () => this.smartAction(h, p, true),
        () => this.openCoin(h, p.x, p.y, true),
      );
    }
    if (p.rightButtonDown()) {
      // objet en main : clic droit = le reposer ; sinon verb coin
      if (state.selectedItem) state.select(null);
      else this.openCoin(h, p.x, p.y, false);
      return;
    }
    if (state.selectedItem) return this.useHeldOn(h);
    this.smartAction(h, p, false);
  }

  private onClickExit(e: Exit, p: Phaser.Input.Pointer): void {
    if (this.blocked || !p.leftButtonDown()) return;
    const { state } = this.session;
    state.selectedItem = null;
    if (!state.check(e.requires)) {
      void this.act(e.lockedText ?? t('room.locked'));
      return;
    }
    void this.act([{ goto: e.to }]);
  }

  /**
   * Debug `?shot=<hotspot>` : la caméra démarre sur le travel d'examen de ce
   * hotspot et y reste ; Échap, flèche bas, clic droit ou clic ramènent à la pièce.
   */
  private parkDebugShot(): void {
    const shot = this.session.debug.shot;
    if (!shot || this.registry.get('debugShotParked')) return;
    this.registry.set('debugShotParked', true);
    if (!this.room.examine(shot, true)) {
      console.warn(`[debug] pas de travel d'examen « ${shot} » dans ${this.session.state.scene}`);
      return;
    }
    this.scenes.spots(false, true);
    const g = this.add.graphics();
    drawNavButton(g, 28, 'down', 'idle');
    this.shotExit = this.add.container(W / 2, ROOM_H - 44, [g]).setDepth(20).setSize(64, 64);
    this.shotExit.setInteractive({ useHandCursor: true });
    this.shotExit.on('pointerover', () => drawNavButton(g, 28, 'down', 'hover'));
    this.shotExit.on('pointerout', () => drawNavButton(g, 28, 'down', 'idle'));
  }

  /** Caméra restée sur un travel d'examen : retour à la vue de la pièce. */
  private leaveShot(): void {
    if (!this.room.examining || this.busy) return;
    const back = this.room.release();
    this.shotExit?.destroy();
    this.shotExit = null;
    if (!back) return;
    this.busy = true;
    void back.then(() => {
      this.busy = false;
      if (!this.sys.isActive()) return;
      this.scenes.spots(true);
      this.refresh();
    });
  }

  /** En gros plan (console…) ou caméra rapprochée : retour à la pièce. */
  private leaveCloseup(): void {
    if (this.room.examining) return this.leaveShot();
    const host = CLOSEUPS[this.session.state.scene];
    if (!host || this.blocked) return;
    this.session.state.selectedItem = null;
    void this.act([{ goto: host }]);
  }

  private onClickItem(id: string, p: Phaser.Input.Pointer): void {
    if (this.blocked) return;
    const { state, content } = this.session;
    const def = content.items.get(id)!;
    const look = () => {
      state.select(null);
      void this.act(def.look);
    };
    if (isTouch(p)) return this.startPress(p, () => this.itemPrimary(id), look);
    if (p.rightButtonDown()) return look();
    this.itemPrimary(id);
  }

  /** Clic / tap sur un objet : le prendre, le reposer ou le combiner. */
  private itemPrimary(id: string): void {
    const { state, content } = this.session;
    const def = content.items.get(id)!;
    const held = state.selectedItem;
    if (!held) return state.select(id);
    if (held === id) return state.select(null);
    state.select(null);
    const reaction =
      resolveCombine(content, held, id) ??
      this.pick(tl('room.wrongCombine', { item: content.items.get(held)!.name, target: def.name }));
    void this.act(reaction);
  }

  // ── ActionHost ───────────────────────────────────────────────────────

  async say(text: string): Promise<void> {
    const line = this.session.dialogue.parseLine(text, 'gary');
    await this.dialogueBox.showLine(line.speaker, line.text);
  }

  dialogue(knot: string): Promise<Action[]> {
    return this.session.dialogue.run(knot, this.dialogueBox);
  }

  async goto(scene: string): Promise<void> {
    this.dialogueBox.close();
    const first = await this.scenes.goto(scene);
    await this.enter(first);
  }

  async end(knot: string): Promise<void> {
    this.dialogueBox.close();
    const cam = this.cameras.main;
    cam.shake(1800, 0.03);
    cam.flash(600, 255, 255, 255);
    // fissure placeholder
    const crack = this.add.graphics().setDepth(950);
    crack.lineStyle(6, hex('#ffffff'), 1);
    crack.beginPath();
    crack.moveTo(W / 2 - 20, 0);
    [[W / 2 + 40, 120], [W / 2 - 30, 240], [W / 2 + 60, 380], [W / 2 - 10, ROOM_H]].forEach(([x, y]) => crack.lineTo(x, y));
    crack.strokePath();
    await new Promise((r) => this.time.delayedCall(1700, r));
    await new Promise<void>((resolve) => {
      cam.fadeOut(900, 255, 255, 255);
      cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => resolve());
    });
    this.scene.start('End', { knot });
  }

  shake(): void {
    this.cameras.main.shake(450, 0.012);
  }
}
