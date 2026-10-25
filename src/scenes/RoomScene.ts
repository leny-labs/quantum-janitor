import Phaser from 'phaser';
import { ActionRunner, type ActionHost } from '../engine/ActionRunner';
import { toActions } from '../engine/content';
import { EXIT_CURSORS, HotspotLayer } from '../engine/HotspotLayer';
import { Inventory, resolveCombine } from '../engine/Inventory';
import { SceneManager } from '../engine/SceneManager';
import type { Action, Exit, Hotspot, Interaction } from '../engine/types';
import { getSession, type Session } from '../session';
import { makeButton } from '../ui/Button';
import { DialogueBox } from '../ui/DialogueBox';
import { HoverLabel } from '../ui/HoverLabel';
import { VerbMenu, type Verb } from '../ui/VerbMenu';
import { COLORS, FONT, MONO, ROOM_H, W, hex, setCursor } from '../ui/theme';

const WRONG_ITEM = [
  'Utiliser {item} sur {target} ? Même moi, je trouve ça bête.',
  'Non. {item} et {target}, ça ne va pas ensemble. Comme moi et la promotion.',
  "Rien ne se passe. L'univers reste stable. Pour l'instant.",
  "J'ai essayé. Intérieurement. Ça n'a pas marché.",
];
const WRONG_COMBINE = ["Je ne vais pas combiner {item} avec {target}. J'ai des principes. Peu, mais j'en ai."];

/** La scène Phaser principale : une vue fixe + inventaire + dialogues. */
export class RoomScene extends Phaser.Scene implements ActionHost {
  private session!: Session;
  private layer!: HotspotLayer;
  private scenes!: SceneManager;
  private inventory!: Inventory;
  private dialogueBox!: DialogueBox;
  private hover!: HoverLabel;
  private verbs!: VerbMenu;
  private runner!: ActionRunner;
  private titleText!: Phaser.GameObjects.Text;
  private debugText: Phaser.GameObjects.Text | null = null;
  private heldItem!: Phaser.GameObjects.Text;
  private busy = false;

  constructor() {
    super('Room');
  }

  create(): void {
    this.session = getSession();
    this.session.activeScene = this;
    const { state, content } = this.session;
    this.busy = false;
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
    this.scenes = new SceneManager(this, content, state, this.layer, { width: W, height: ROOM_H });
    this.inventory = new Inventory(this, content, state, {
      click: (id, p) => this.onClickItem(id, p),
      hover: (id) => this.onHoverItem(id),
    });
    this.runner = new ActionRunner(state, this);
    this.dialogueBox = new DialogueBox(this);
    this.hover = new HoverLabel(this);
    this.verbs = new VerbMenu(this);

    // HUD
    this.titleText = this.add
      .text(14, 10, '', { fontFamily: FONT, fontSize: '18px', color: COLORS.dim, backgroundColor: '#00000088', padding: { x: 8, y: 4 } })
      .setDepth(700);
    makeButton(this, W - 14, 10, 'Menu', () => !this.busy && this.scene.start('Title'), { size: 18, origin: 0 })
      .setOrigin(1, 0)
      .setDepth(700);
    if (this.session.debug.overlay) {
      this.debugText = this.add
        .text(14, 44, '', { fontFamily: MONO, fontSize: '13px', color: '#ff99ff', backgroundColor: '#000000aa', wordWrap: { width: 700 } })
        .setDepth(700);
    }
    this.heldItem = this.add
      .text(0, 0, '', { fontFamily: FONT, fontSize: '18px', color: '#ffffff', fontStyle: 'bold', padding: { x: 6, y: 4 } })
      .setDepth(790)
      .setVisible(false);
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.heldItem.setPosition(p.x + 14, p.y + 14));
    // clic droit dans le vide = reposer l'objet tenu
    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (p.rightButtonDown() && over.length === 0) state.select(null);
    });

    const off = state.onChange(() => this.refresh());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      off();
      setCursor(this, 'default');
      if (this.session.activeScene === this) this.session.activeScene = null;
    });

    this.cameras.main.fadeIn(400, 0, 0, 0);
    const first = this.scenes.show();
    void this.act(this.enterActions(first));
  }

  // ── rendu ────────────────────────────────────────────────────────────

  private refresh(): void {
    this.scenes.refresh();
    this.inventory.render();
    const { state, content } = this.session;
    this.titleText.setText(this.scenes.current().title);
    const held = state.selectedItem ? content.items.get(state.selectedItem) : null;
    this.heldItem.setVisible(!!held);
    if (held) this.heldItem.setText(held.icon.glyph).setBackgroundColor(held.icon.color);
    this.hover.set(null);
    if (!this.busy) setCursor(this, held ? 'crosshair' : 'default');
    this.debugText?.setText(
      `[debug] scène=${state.scene}\nflags=${[...state.flags].join(',') || '∅'}\nobjets=${state.items.join(',') || '∅'}`,
    );
  }

  private enterActions(first: boolean): Action[] {
    const def = this.scenes.current();
    const list: Action[] = [];
    if (first && def.onFirstEnter) list.push(...toActions(def.onFirstEnter));
    if (def.onEnter) list.push(...toActions(def.onEnter));
    return list;
  }

  /** Exécute une interaction en bloquant les entrées. */
  private async act(i: Interaction | undefined): Promise<void> {
    if (this.busy || !i || (Array.isArray(i) && i.length === 0)) return;
    this.busy = true;
    this.verbs.close();
    this.hover.set(null);
    setCursor(this, 'default');
    try {
      await this.runner.run(i);
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

  private fill(text: string, item: string, target: string): string {
    return text.replace('{item}', item).replace('{target}', target);
  }

  private pick(list: string[]): string {
    return list[Math.floor(Math.random() * list.length)];
  }

  private get blocked(): boolean {
    return this.busy || this.dialogueBox.isOpen || this.verbs.isOpen;
  }

  // ── entrées ──────────────────────────────────────────────────────────

  private onHoverHotspot(h: Hotspot | null): void {
    if (this.blocked) return;
    const { state, content } = this.session;
    if (!h) {
      this.hover.set(null);
      setCursor(this, state.selectedItem ? 'crosshair' : 'default');
      return;
    }
    const held = state.selectedItem ? content.items.get(state.selectedItem) : null;
    this.hover.set(held ? `Utiliser ${held.name} sur ${h.label}` : h.label);
    setCursor(this, 'pointer');
  }

  private onHoverExit(e: Exit | null): void {
    if (this.blocked) return;
    if (!e) {
      this.hover.set(null);
      setCursor(this, this.session.state.selectedItem ? 'crosshair' : 'default');
      return;
    }
    this.hover.set(`→ ${e.label}`);
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
    this.hover.set(held ? `Combiner ${held.name} avec ${def.name}` : def.name);
  }

  private onClickHotspot(h: Hotspot, p: Phaser.Input.Pointer): void {
    if (this.blocked) return;
    const { state, content } = this.session;
    if (p.rightButtonDown()) {
      if (state.selectedItem) state.select(null);
      else void this.act(h.look ?? 'Rien de particulier.');
      return;
    }
    if (state.selectedItem) {
      const item = content.items.get(state.selectedItem)!;
      const reaction =
        h.useItem?.[item.id] ?? h.useItemDefault ?? this.fill(this.pick(WRONG_ITEM), item.name, h.label);
      state.select(null);
      void this.act(reaction);
      return;
    }
    const verbs: Verb[] = [{ label: 'Regarder', run: () => void this.act(h.look ?? 'Rien de particulier.') }];
    if (h.use) verbs.push({ label: h.useLabel ?? 'Utiliser', run: () => void this.act(h.use) });
    if (h.talk) verbs.push({ label: 'Parler', run: () => void this.act(h.talk) });
    if (verbs.length === 1) verbs[0].run();
    else this.verbs.show(p.x, p.y, h.label, verbs);
  }

  private onClickExit(e: Exit, p: Phaser.Input.Pointer): void {
    if (this.blocked || !p.leftButtonDown()) return;
    const { state } = this.session;
    state.selectedItem = null;
    if (!state.check(e.requires)) {
      void this.act(e.lockedText ?? "C'est fermé.");
      return;
    }
    void this.act([{ goto: e.to }]);
  }

  private onClickItem(id: string, p: Phaser.Input.Pointer): void {
    if (this.blocked) return;
    const { state, content } = this.session;
    const def = content.items.get(id)!;
    if (p.rightButtonDown()) {
      state.select(null);
      void this.act(def.look);
      return;
    }
    const held = state.selectedItem;
    if (!held) return state.select(id);
    if (held === id) return state.select(null);
    state.select(null);
    const reaction =
      resolveCombine(content, held, id) ??
      this.fill(this.pick(WRONG_COMBINE), content.items.get(held)!.name, def.name);
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
    await this.runner.run(this.enterActions(first));
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
