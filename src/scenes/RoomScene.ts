import Phaser from 'phaser';
import { ActionRunner, type ActionHost } from '../engine/ActionRunner';
import { toActions } from '../engine/content';
import { EXIT_CURSORS, HotspotLayer } from '../engine/HotspotLayer';
import { resolveCombine } from '../engine/combine';
import { repairState } from '../engine/repair';
import { Inventory } from '../engine/Inventory';
import { lineMood } from '../engine/mood';
import { SceneManager } from '../engine/SceneManager';
import type { Action, CharacterDef, Exit, Hotspot, Interaction } from '../engine/types';
import { hotspotVerbs, smartVerb, type HotspotVerb } from '../engine/verbs';
import { END_SCENE_ID, getSession, type Session } from '../session';
import { actBreak, endKnotOf } from '../engine/walkthrough';
import { RoomRenderer, RoomView } from '../three/RoomRenderer';
import { CLOSEUPS, ROOMS } from '../three/rooms';
import { BobAspirRig } from '../three/rooms/bobaspire';
import type { BobIdle } from '../three/rooms/bobidle';
import { BobRig } from '../three/rooms/bobrepas';
import { BobVoice } from '../three/rooms/bobvoix';
import { CouloirWalkRig, EXIT_DOOR } from '../three/rooms/couloirWalk';
import { FuseRig } from '../three/rooms/fusible';
import { LecteurRig } from '../three/rooms/lecteur';
import { VendingRig } from '../three/rooms/vending';
import { CASIER_OPEN_ID, PRESS_LEAD, type OpenRig, type PressRig } from '../three/press';
import { itemIconKey } from '../three/Studio';
import { propSound } from '../ui/sfx';
import { propSfx } from '../engine/propSfx';
import { makeButton } from '../ui/Button';
import { showChapterCard } from '../ui/ChapterCard';
import { STATION_MAP } from '../engine/contentBrowser';
import { hasStationMap } from '../engine/stationMap';
import { StationMapOverlay } from '../ui/StationMap';
import { DialogueBox } from '../ui/DialogueBox';
import { HoverLabel } from '../ui/HoverLabel';
import { ProgressCue } from '../ui/ProgressCue';
import { drawNavButton, verbCursor, type VerbIcon } from '../ui/chrome';
import { lang, t, tl } from '../i18n';
import { isTouch, uiPx } from '../ui/input';
import { playMusic, themeForScene } from '../ui/music';
import { makeMapToggle } from '../ui/MapToggle';
import { CarnetOverlay, freshClues, hasUnread, makeCarnetToggle, notifyNoted, type CarnetButton } from '../ui/Carnet';
import { clueText, freshReadyDeductions, hasCarnet, markNudged, readyDeductions, type Carnet, type ClueDef } from '../engine/clues';
import { makeMusicToggle } from '../ui/MusicToggle';
import { PressRing } from '../ui/PressRing';
import { RoomPlaque } from '../ui/RoomPlaque';
import { VerbCoin } from '../ui/VerbCoin';
import { playVending } from './VendingGame';
import { bobCue, fuseCue, lecteurCue, splash } from './beats';
import { FONT, MONO, ROOM_H, W, hex, setCursor } from '../ui/theme';

/** La suite du YAML sans les lignes du narrateur (quand une animation les montre déjà). */
function withoutNarrator(i: Interaction): Action[] {
  return toActions(i).map((a) => (a.say?.startsWith('narrateur:') ? { ...a, say: undefined } : a));
}

/** Cadence de frappe des répliques (caractères / s, comme DialogueBox) : durée de parole de B.O.B. */
const TYPE_CPS = 32;

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
  /** Plan de la Station (ch.1) : visible avec l'objet `plan_station`. */
  mapButton!: Phaser.GameObjects.Container;
  private mapOverlay: StationMapOverlay | null = null;
  /** Carnet de déduction (ch.1) : visible dès le premier indice noté (engine/clues.ts). */
  carnetButton!: CarnetButton;
  private carnetOverlay: CarnetOverlay | null = null;
  /** Indices fraîchement notés : fiche « Noté au carnet » dès que l'écran est libre. */
  private notedPending: ClueDef[] = [];
  /** État changé : revérifier si une déduction est devenue possible (relance de B.O.B.). */
  private deduceDirty = true;
  /** Pastille CARNET après une relance de B.O.B., jusqu'à l'ouverture du carnet. */
  private deduceUnread = false;
  private debugText: Phaser.GameObjects.Text | null = null;
  private heldItem!: Phaser.GameObjects.Text;
  /** Objet en main : son icône GenAI suit le curseur (repli : étiquette `heldItem`). */
  private heldIcon!: Phaser.GameObjects.Image;
  /** Flèche « retour » quand la caméra reste sur un travel d'examen (?shot=…). */
  private shotExit: Phaser.GameObjects.Container | null = null;
  private busy = false;
  /**
   * Objet ramassable (`ShotSpec.picks`) cliqué dans un plan d'examen pendant sa réplique :
   * le reste du « Regarder » est sauté et l'objet est pris dans le plan, avant le retour.
   */
  private zoomPick: string | null = null;
  /** Plan d'arrivée en cours de travel : coupe sèche vers la vue de la pièce. */
  private skipCine: (() => void) | null = null;
  /** `# couloir_out` reçu pendant le dialogue : sortie de boucle à jouer à la fin de l'interaction. */
  private couloirOut = false;
  /** Carte de transition affichée (écran noir) : la pièce suivante apparaît au prochain `goto`. */
  private reveal: (() => Promise<void>) | null = null;

  constructor() {
    super('Room');
  }

  create(): void {
    this.session = getSession();
    this.session.activeScene = this;
    const { state, content } = this.session;
    this.busy = false;
    this.skipCine = null;
    this.reveal = null;
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
    this.mapOverlay = null;
    this.mapButton = makeMapToggle(this, this.musicButton.x - menu.height - 8, menu.y, menu.height, t('hud.map'), () => this.openMap())
      .setDepth(700)
      .setVisible(hasStationMap(state));
    this.carnetOverlay = null;
    this.notedPending = [];
    this.deduceDirty = true;
    this.deduceUnread = false;
    this.carnetButton = makeCarnetToggle(this, this.mapButton.x, menu.y, menu.height, t('hud.carnet'), () => this.openCarnet()).setDepth(700) as CarnetButton;
    freshClues(state, this.carnet); // référence : ce qui est déjà noté au chargement n'est pas « nouveau »
    this.layoutCarnetButton();
    if (this.session.debug.overlay) {
      this.debugText = this.add
        .text(14, 96, '', { fontFamily: MONO, fontSize: '13px', color: '#ff99ff', backgroundColor: '#000000aa', wordWrap: { width: 700 } })
        .setDepth(700);
    }
    this.heldItem = this.add
      .text(0, 0, '', { fontFamily: FONT, fontSize: '18px', color: '#ffffff', fontStyle: 'bold', padding: { x: 6, y: 4 } })
      .setLetterSpacing(1.5) // « 1/4096 » : le 1 ne touche plus le /
      .setDepth(790)
      .setVisible(false);
    this.heldIcon = this.add.image(0, 0, '__DEFAULT').setOrigin(0).setDepth(790).setVisible(false);
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      this.heldItem.setPosition(p.x + 14, p.y + 14);
      this.heldIcon.setPosition(p.x + 12, p.y + 12);
      this.hoverInShot(p);
    });
    // clic dans le vide : reposer l'objet tenu ; en gros plan, sinon, reculer vers la pièce
    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      // plan d'arrivée : un clic / tap saute au plan de la pièce (la réplique, elle, se lit normalement)
      if (this.skipCine && !this.dialogueBox.isOpen) return this.skipCine();
      // plan d'examen : clic sur un objet ramassable posé dans le cadre (cuillère sur le plateau…)
      if (this.room.examining && p.y < ROOM_H && !p.rightButtonDown() && !state.selectedItem && !this.coin.isOpen) {
        const pick = this.room.spotAt(p.x, p.y);
        if (pick && this.busy) {
          // pendant la réplique du « Regarder » : on saute la suite, la prise suit dans le plan
          if (this.dialogueBox.isOpen && !this.skipCine) {
            this.zoomPick = pick;
            this.dialogueBox.dismiss();
          }
          return;
        }
        if (pick) return this.pickInShot(pick);
      }
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
      if ((e.key === 'p' || e.key === 'P') && !e.repeat && !this.mapOverlay) return this.openMap();
      if ('cCnN'.includes(e.key) && e.key.length === 1 && !e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey && !this.carnetOverlay) return this.openCarnet();
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
      // nouvel indice : petite fiche « Noté au carnet » + pastille sur le bouton
      // (jouée à la fin de l'interaction : jamais sous une bulle de dialogue)
      this.notedPending.push(...freshClues(state, this.carnet));
      this.deduceDirty = true;
      this.layoutCarnetButton();
    });
    // `# aspir` du dialogue (st_patience) : B.O.B. aspire le ticket de M. Patience
    const onAspir = () => void this.bobAspir();
    this.events.on('ink-aspir', onAspir);
    // `# couloir_out` (st_couloir_suivre, dénouement) : on reprend la porte une fois le dialogue fini
    this.couloirOut = false;
    const onCouloirOut = () => (this.couloirOut = true);
    this.events.on('ink-couloir-out', onCouloirOut);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off('ink-aspir', onAspir);
      this.events.off('ink-couloir-out', onCouloirOut);
      this.mapOverlay?.close();
      this.carnetOverlay?.close();
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
    if (this.notedPending.length && !this.blocked && this.carnetButton.visible) {
      const size = this.menuButton.height;
      notifyNoted(this, this.carnetButton.x + size / 2, this.carnetButton.y + size / 2, this.notedPending);
      this.notedPending = [];
    } else if (this.deduceDirty && !this.blocked && this.carnetButton.visible) {
      this.nudgeDeduction();
    }
  }

  /**
   * B.O.B. signale (une fois par déduction et par session) qu'une paire du carnet est réunie
   * mais pas encore déduite ; une seule réplique par passage, les suivantes au prochain écran libre.
   */
  private nudgeDeduction(): void {
    const { state } = this.session;
    const [d] = freshReadyDeductions(state, this.carnet);
    if (!d) {
      this.deduceDirty = false;
      return;
    }
    markNudged(state, [d.id]);
    this.deduceUnread = true;
    this.carnetButton.setUnread(true);
    const line = d.nudge ? clueText(d.nudge, lang()) : t('carnet.nudge');
    // t283 : l'antenne frétille et clignote un temps avant la réplique (puis continue dessous)
    const idle = this.room.rig<BobIdle>('bobIdle');
    idle?.alert();
    void this.locked(async () => {
      if (idle) await new Promise((r) => this.time.delayedCall(550, r));
      await this.say(line);
    });
  }

  private refresh(): void {
    this.scenes.refresh();
    this.inventory.render();
    const { state, content } = this.session;
    this.plaque.show(this.scenes.current());
    this.mapButton.setVisible(hasStationMap(state));
    this.layoutCarnetButton();
    playMusic(themeForScene(state.scene));
    const held = state.selectedItem ? content.items.get(state.selectedItem) : null;
    const heldKey = held ? itemIconKey(held.id, (f) => state.hasFlag(f)) : null;
    const iconHeld = !!heldKey && this.textures.exists(heldKey);
    this.heldIcon.setVisible(iconHeld);
    if (iconHeld) this.heldIcon.setTexture(heldKey).setDisplaySize(56, 56);
    this.heldItem.setVisible(!!held && !iconHeld);
    if (held && !iconHeld) this.heldItem.setText(held.icon.glyph).setBackgroundColor(held.icon.color);
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
      if (this.couloirOut) await this.corridorExit();
    } catch (e) {
      console.error(e);
    } finally {
      this.busy = false;
      if (this.sys.isActive()) {
        this.dialogueBox.close();
        this.refresh();
        // carte restée noire sans pièce derrière (séquence interrompue) : jamais d'écran mort
        const reveal = this.reveal;
        this.reveal = null;
        void reveal?.();
      }
    }
  }

  /**
   * Exécute une interaction en bloquant les entrées. Avec `shot` (verbe
   * Regarder d'un hotspot qui a un travel d'examen), la caméra glisse vers
   * l'objet pendant la réplique puis revient.
   */
  /** `lead` (ms) : petit temps mort avant la bulle (geste 3D d'un prop physique à laisser voir). */
  private async act(i: Interaction | undefined, shot?: string, lead = 0): Promise<void> {
    if (this.busy || !i || (Array.isArray(i) && i.length === 0)) return;
    await this.locked(async () => {
      if (lead > 0) await new Promise((r) => setTimeout(r, lead));
      const scene = this.session.state.scene;
      const move = shot ? this.room.examine(shot) : null;
      if (move) this.scenes.spots(false);
      this.zoomPick = null;
      let parked = false;
      try {
        await this.runner.run(i);
        if (move && this.room.examining === shot && this.session.state.scene === scene && this.sys.isActive()) {
          this.dialogueBox.close();
          const pick = this.zoomPick;
          this.zoomPick = null;
          if (pick) {
            await move; // le travel finit d'arriver : on voit la main prendre l'objet dans le plan
            await this.runPick(pick);
          }
          if (!pick && this.room.hasPicks()) {
            // il reste un objet à ramasser dans le cadre : la caméra reste, clic dessus = le prendre
            parked = true;
            await move;
            this.showShotExit();
          } else {
            const back = this.room.release();
            if (back) await back;
          }
        }
      } finally {
        this.zoomPick = null;
        if (move && this.sys.isActive() && !parked) this.scenes.spots(true);
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
        await this.runner.run(withoutNarrator(reaction));
      }
      this.dialogueBox.close();
      if (!this.sys.isActive()) return;
      const back = this.room.release();
      if (back) await back;
    } finally {
      if (this.sys.isActive()) this.scenes.spots(true);
    }
  }

  /**
   * Petite animation d'un moment clé (sans interaction) : travel silencieux
   * vers `shot`, `play` (le geste en 3D), puis la suite du YAML — sans la
   * ligne du narrateur si `skipNarrator` (l'animation la montre) — et retour.
   * Sans rendu 3D, la réplique du YAML suffit.
   */
  private async beat(shot: string, play: () => Promise<void>, reaction: Interaction, skipNarrator: boolean, after?: () => Promise<void>): Promise<void> {
    const move = this.room.examine(shot);
    if (!move) return this.runner.run(reaction);
    this.scenes.spots(false);
    try {
      await move;
      await play();
      await this.runner.run(skipNarrator ? withoutNarrator(reaction) : reaction);
      this.dialogueBox.close();
      await after?.();
      if (!this.sys.isActive()) return;
      const back = this.room.release();
      if (back) await back;
    } finally {
      if (this.sys.isActive()) this.scenes.spots(true);
    }
  }

  /** Serpillière mouillée / badge sur le lecteur du labo : frottage ou bip + porte. */
  private lecteur(rig: LecteurRig, scrub: boolean, reaction: Interaction): Promise<void> {
    rig.onCue = (c) => lecteurCue(this, c);
    const done = () => {
      rig.onCue = null;
      rig.idle();
    };
    const run = scrub
      ? this.beat(LecteurRig.SCRUB_SHOT, () => rig.scrub(), reaction, true)
      : this.beat(LecteurRig.SWIPE_SHOT, () => rig.swipe(), reaction, false, () => rig.settled());
    return run.finally(done);
  }

  /** Sandwich à B.O.B. : il l'aspire ; au `# shake` du dialogue, il recrache tout (dont le badge). */
  private async bobMeal(rig: BobRig, reaction: Interaction): Promise<void> {
    rig.onCue = (c) => bobCue(this, c);
    const retch = () => rig.retch();
    this.events.on('ink-shake', retch);
    // le badge ne se perd jamais : rendu avant que les débris fondent, et même si la séquence casse
    const secure = () => repairState(this.session.state);
    try {
      await this.beat(BobRig.SHOT, () => rig.eat(), reaction, false, () => {
        secure();
        return rig.clear();
      });
    } finally {
      secure();
      this.events.off('ink-shake', retch);
      rig.onCue = null;
    }
  }

  /**
   * `# aspir` : B.O.B. aspire le ticket 9 848 et le recrache aux pieds de Gary, pendant
   * la réplique SHLUUUP (sans bloquer le dialogue). Petit travel vers B.O.B. le temps du
   * geste, sauf si la caméra est déjà sur un plan d'examen.
   */
  private async bobAspir(): Promise<void> {
    const rig = this.room.rig<BobAspirRig>('bobAspir');
    if (!rig || rig.busy) return;
    rig.onCue = (c) => bobCue(this, c);
    const move = this.room.examining ? null : this.room.examine(BobAspirRig.SHOT);
    if (move) this.scenes.spots(false);
    try {
      await rig.play();
      await new Promise((r) => this.time.delayedCall(300, r));
      if (move && this.sys.isActive() && this.room.examining === BobAspirRig.SHOT) {
        const back = this.room.release();
        if (back) await back;
      }
    } finally {
      if (move && this.sys.isActive()) this.scenes.spots(true);
    }
  }

  /** Fusible 7B arraché : étincelles, la lumière du circuit hoquette et meurt. */
  private async fuse(rig: FuseRig, reaction: Interaction): Promise<void> {
    rig.onCue = (c) => fuseCue(this, c);
    try {
      await this.beat(FuseRig.SHOT, () => rig.pull(), reaction, true);
    } finally {
      rig.onCue = null;
    }
  }

  /**
   * Couloir Infini B : la caméra passe la porte et revient par le bout du couloir (même extincteur),
   * M. Ficus glisse d'une porte si la plante est posée ; puis le dialogue de la boucle.
   * Clic / touche pendant la marche = coupe sèche sur la vue de la pièce.
   */
  private async corridorWalk(rig: CouloirWalkRig, door: string, i: Interaction): Promise<void> {
    this.scenes.spots(false);
    const walking = rig.walk(door);
    // armé un peu après : le clic qui a poussé la porte ne doit pas couper la marche aussitôt
    this.time.delayedCall(220, () => {
      if (!rig.walking) return;
      this.skipCine = () => {
        this.skipCine = null;
        rig.skip();
      };
    });
    try {
      await walking;
    } finally {
      this.skipCine = null;
      if (this.sys.isActive()) this.scenes.spots(true);
    }
    await this.runner.run(i);
  }

  /**
   * Couloir Infini B dénoué (`# couloir_out`) : la bulle se ferme, Gary reprend la porte B-1
   * (plongée battant → noir, pas), l'écran se rallume sur le couloir droit (bureaux, sorties).
   * Clic / touche = coupe sèche, même armement que la marche.
   */
  private async corridorExit(): Promise<void> {
    this.couloirOut = false;
    const rig = this.room.rig<CouloirWalkRig>(CouloirWalkRig.ID);
    if (!rig || !this.sys.isActive() || this.session.state.scene !== 'st-couloir-b') return;
    this.dialogueBox.close();
    this.scenes.spots(false);
    const exiting = rig.exit(EXIT_DOOR, () => {
      if (this.sys.isActive()) this.cameras.main.fadeIn(650, 0, 0, 0);
    });
    this.time.delayedCall(220, () => {
      if (!rig.walking) return;
      this.skipCine = () => {
        this.skipCine = null;
        rig.skip();
      };
    });
    try {
      await exiting;
    } finally {
      this.skipCine = null;
      if (this.sys.isActive()) this.scenes.spots(true);
    }
  }

  /** Verbe d'un hotspot ; certains gestes clés ont leur petite animation. */
  private runVerb(h: Hotspot, v: HotspotVerb): void {
    const { state } = this.session;
    const fuse =
      h.id === 'fusibles' && v.kind === 'use' && state.hasFlag('sait_fusible') && !state.hasFlag('fusible_retire') ? this.room.rig<FuseRig>('fusible') : null;
    if (fuse) return void this.locked(() => this.fuse(fuse, v.action));
    // Couloir Infini B : une porte poussée pendant la boucle = marche 3D, puis l'Ink
    const walk = v.kind === 'use' ? this.room.rig<CouloirWalkRig>(CouloirWalkRig.ID) : null;
    if (walk?.loops(h.id)) {
      const sound = propSfx(h, state);
      if (sound) propSound(sound, h.id);
      return void this.locked(() => this.corridorWalk(walk, h.id, v.action));
    }
    // props physiques en clic direct (three/press.ts) : le bouton s'enfonce, le levier bascule,
    // et un bruitage joue à CHAQUE actionnement (réappui, hors tension, refus : engine/propSfx.ts)
    // (+ flash/halo bref ; la bulle attend PRESS_LEAD ms pour laisser voir le geste)
    let lead = 0;
    if (v.kind === 'use') {
      const gesture = this.room.rig<PressRig>('press')?.press(h.id);
      const sound = propSfx(h, state, gesture);
      if (sound) propSound(sound, h.id);
      if (gesture) lead = PRESS_LEAD;
      // porte qui s'ouvre avant la réplique (casier B-7/12) : on la laisse pivoter
      lead = Math.max(lead, this.room.rig<OpenRig>(CASIER_OPEN_ID)?.open(h.id) ?? 0);
    }
    void this.act(v.action, v.kind === 'look' ? h.id : undefined, lead);
  }

  private pick(list: string[]): string {
    return list[Math.floor(Math.random() * list.length)];
  }

  private get blocked(): boolean {
    return this.busy || this.dialogueBox.isOpen || this.coin.isOpen || !!this.room.examining || !!this.mapOverlay || !!this.carnetOverlay;
  }

  private get carnet(): Carnet {
    return this.session.content.carnet ?? { clues: [], deductions: [] };
  }

  /** Bouton CARNET : à gauche du PLAN (ou à sa place sans plan), pastille si indice non lu. */
  private layoutCarnetButton(): void {
    const { state } = this.session;
    const size = this.menuButton.height;
    this.carnetButton.setVisible(hasCarnet(state, this.carnet));
    this.carnetButton.setX(this.mapButton.visible ? this.mapButton.x - size - 8 : this.mapButton.x);
    this.carnetButton.setUnread(hasUnread(state, this.carnet) || this.deduceUnread);
  }

  /** Carnet de déduction : overlay modal ; une déduction validée pose son flag (sauvegarde comprise). */
  private openCarnet(): void {
    const { state, content } = this.session;
    if (this.blocked || !hasCarnet(state, this.carnet)) return;
    // carnet ouvert : le joueur y est déjà, B.O.B. n'a plus à relancer ces déductions-là
    markNudged(state, readyDeductions(state, this.carnet).map((d) => d.id));
    this.deduceUnread = false;
    state.select(null);
    this.hover.set(null);
    this.carnetOverlay = new CarnetOverlay(
      this,
      this.carnet,
      state,
      () => {
        this.carnetOverlay = null;
        this.layoutCarnetButton();
      },
      (id) => content.characters.get(id)?.name,
    );
    this.layoutCarnetButton();
  }

  /** Plan de la Station : une zone découverte = warp (comme une sortie, fondu compris). */
  private openMap(): void {
    const { state, content } = this.session;
    if (this.blocked || !hasStationMap(state)) return;
    state.select(null);
    this.hover.set(null);
    this.mapOverlay = new StationMapOverlay(
      this,
      STATION_MAP,
      state,
      (id) => content.scenes.has(id),
      (id) => {
        this.mapOverlay = null;
        void this.act([{ goto: id }]);
      },
      () => {
        this.mapOverlay = null;
      },
    );
  }

  /** Tactile : objet en main → bouton « Reposer » (pas de clic droit au doigt). */
  private renderDropButton(heldName: string | null): void {
    this.dropButton?.destroy();
    this.dropButton = null;
    if (!heldName || !isTouch()) return;
    this.heldItem.setVisible(false);
    this.heldIcon.setVisible(false);
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
    const verbs = hotspotVerbs(h).map((v) => ({ label: v.label, icon: this.verbIcon(v, h), run: () => this.runVerb(h, v) }));
    this.hover.set(null);
    setCursor(this, 'default');
    this.coin.open(x, y, h.label, verbs, { touch });
  }

  /** Action du clic gauche / tap court. */
  private smartAction(h: Hotspot, p: Phaser.Input.Pointer, touch: boolean): void {
    const v = smartVerb(h);
    if (v) this.runVerb(h, v);
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
    // petites animations des moments clés du lecteur de badge
    const reader = h.id === 'lecteur' ? this.room.rig<LecteurRig>('lecteur') : null;
    if (reader && item.id === 'serpilliere' && state.hasFlag('serpilliere_mouillee') && !state.hasFlag('lecteur_propre')) {
      return void this.locked(() => this.lecteur(reader, true, reaction));
    }
    if (reader && item.id === 'badge' && state.hasFlag('lecteur_propre') && !state.hasFlag('labo_ouvert')) {
      return void this.locked(() => this.lecteur(reader, false, reaction));
    }
    const bob = h.id === 'bob' && item.id === 'sandwich' ? this.room.rig<BobRig>('bob') : null;
    if (bob) return void this.locked(() => this.bobMeal(bob, reaction));
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
    // `to: fin` : franchir la faille = fin du chapitre (même chemin que `# end:` en Ink)
    void this.act([e.to === END_SCENE_ID ? { end: endKnotOf(this.session.chapter) } : { goto: e.to }]);
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
    this.showShotExit();
  }

  /** Flèche « retour » de la caméra restée sur un plan d'examen (le clic passe par `leaveShot`). */
  private showShotExit(): void {
    this.shotExit?.destroy();
    const g = this.add.graphics();
    drawNavButton(g, 28, 'down', 'idle');
    this.shotExit = this.add.container(W / 2, ROOM_H - 44, [g]).setDepth(20).setSize(64, 64);
    this.shotExit.setInteractive({ useHandCursor: true });
    this.shotExit.on('pointerover', () => drawNavButton(g, 28, 'down', 'hover'));
    this.shotExit.on('pointerout', () => drawNavButton(g, 28, 'down', 'idle'));
  }

  /** Verbe direct d'un hotspot ramassable du plan d'examen (prise de la cuillère…), joué dans le plan. */
  private async runPick(id: string): Promise<void> {
    const h = this.scenes.current().hotspots?.find((x) => x.id === id);
    const v = h ? smartVerb(h) : null;
    this.room.highlight(null);
    if (!v) return;
    await this.runner.run(v.action);
    this.dialogueBox.close();
  }

  /** Clic sur un objet ramassable dans un plan d'examen resté ouvert : on le prend, puis retour à la pièce. */
  private pickInShot(id: string): void {
    this.shotExit?.destroy();
    this.shotExit = null;
    void this.locked(async () => {
      try {
        await this.runPick(id);
        if (this.room.examining && this.sys.isActive()) {
          const back = this.room.release();
          if (back) await back;
        }
      } finally {
        if (this.sys.isActive()) this.scenes.spots(true);
      }
    });
  }

  /** Survol dans un plan d'examen : l'objet ramassable s'éclaire (+ libellé « Prendre … » hors réplique). */
  private hoverInShot(p: Phaser.Input.Pointer): void {
    if (!this.room.examining || this.coin.isOpen || this.skipCine) return;
    const id = p.y < ROOM_H && !this.session.state.selectedItem ? this.room.spotAt(p.x, p.y) : null;
    this.room.highlight(id);
    if (this.busy) return;
    const h = id ? this.scenes.current().hotspots?.find((x) => x.id === id) : undefined;
    const v = h ? smartVerb(h) : null;
    this.hover.set(h && v ? t('hud.smart', { verb: v.label, target: h.label }) : null);
    setCursor(this, h && v ? verbCursor(this.verbIcon(v, h)) : 'default');
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
    // serpillière trempée dans le seau : plouf et gerbe de gouttes sur la case du seau
    const pair = [held, id];
    if (pair.includes('serpilliere') && pair.includes('seau') && !state.hasFlag('serpilliere_mouillee')) {
      const r = this.inventory.slotRect(state.items.indexOf('seau'));
      return void this.locked(async () => {
        await splash(this, r.x, r.y, r.size);
        await this.runner.run(reaction);
      });
    }
    void this.act(reaction);
  }

  // ── ActionHost ───────────────────────────────────────────────────────

  async say(text: string, mood?: string): Promise<void> {
    // objet ramassé en plein « Regarder » d'un plan d'examen : la description s'efface devant le geste
    if (this.zoomPick) return;
    const line = this.session.dialogue.parseLine(text, 'gary');
    await this.spoken(line.speaker, line.text, mood);
  }

  dialogue(knot: string): Promise<Action[]> {
    const box = this.dialogueBox;
    return this.session.dialogue.run(knot, {
      showLine: (speaker, text, mood) => this.spoken(speaker, text, mood),
      showChoices: (choices) => box.showChoices(choices),
      close: () => box.close(),
    });
  }

  /** Affiche une réplique ; celles de B.O.B. le font parler en 3D (onde Bender, rebond). */
  private spoken(speaker: CharacterDef | null, text: string, mood?: string): Promise<void> {
    const shown = this.dialogueBox.showLine(speaker, text, mood);
    const voice = speaker?.id === 'bob' ? this.room.rig<BobVoice>('bobVoix') : null;
    if (!voice) return shown;
    voice.talk(text.length / TYPE_CPS + 0.15, lineMood(text, mood));
    return shown.finally(() => voice.hush());
  }

  async goto(scene: string): Promise<void> {
    this.dialogueBox.close();
    const first = await this.scenes.goto(scene);
    const reveal = this.reveal;
    this.reveal = null;
    if (reveal) {
      playMusic(themeForScene(scene));
      await reveal();
    }
    await this.enter(first);
  }

  /** Carte de transition (titre du chapitre 1…) ; l'autosave a déjà le chapitre courant. */
  async card(id: string): Promise<void> {
    this.dialogueBox.close();
    if (id !== 'ch1') return console.warn(`[card] carte inconnue « ${id} »`);
    this.reveal = await showChapterCard(this, {
      kicker: t('card.ch1.kicker'),
      title: t('card.ch1.title'),
      tagline: t('card.ch1.tagline'),
      foot: t('card.ch1.foot'),
      stamp: t('card.ch1.stamp'),
    });
  }

  async end(knot: string): Promise<void> {
    this.dialogueBox.close();
    // déjà au noir derrière une carte de transition : directement l'écran suivant
    if (this.reveal) {
      this.reveal = null;
      this.scene.start('End', { knot, fromCard: true });
      return;
    }
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
    // coupure d'acte (fin Klepsydra, `# end: cafards`) : cliffhanger puis acte suivant, pas de fin de chapitre
    const act = actBreak(this.session.chapter, knot);
    this.scene.start('End', act ? { knot, act: act.id } : { knot });
  }

  shake(): void {
    this.cameras.main.shake(450, 0.012);
  }
}
