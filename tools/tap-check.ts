/**
 * Vérif navigateur des choix de dialogue : lance son propre serveur Vite,
 * ouvre le placard (tactile émulé puis souris), démarre le dialogue de B.O.B.
 * et choisit une réponse en tapant / cliquant sur le badge numéroté et en bout
 * de ligne — pas seulement sur le texte. Échoue si le choix n'est pas pris ou
 * si une ligne fait moins de 44 px CSS au doigt. Vérifie ensuite au doigt
 * (paysage 844×390) les autres commandes : réplique suivante, fermeture,
 * inventaire, appui long → verb coin, flèche de sortie, ♪ et MENU.
 *   npm run check:tap
 */
import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { chromium, type Page } from 'playwright-core';
import { createServer } from 'vite';

function findChrome(): string | undefined {
  if (process.env.CHROME) return process.env.CHROME;
  const pw = join(homedir(), '.cache/ms-playwright');
  if (existsSync(pw)) {
    for (const d of readdirSync(pw).filter((d) => /^chromium-\d+$/.test(d)).sort().reverse()) {
      const exe = join(pw, d, 'chrome-linux64/chrome');
      if (existsSync(exe)) return exe;
    }
  }
  return ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(existsSync);
}

interface Row {
  left: number;
  right: number;
  y: number;
  h: number;
}

/** Lignes de choix affichées, en px CSS de la page. */
function rows(page: Page): Promise<Row[]> {
  return page.evaluate(() => {
    const g = (window as any).__game;
    const box = g.scene.getScene('Room').dialogueBox;
    const r = g.canvas.getBoundingClientRect();
    const k = r.width / 1280;
    return box.choiceZones.map((z: any) => ({ left: r.left + z.x * k, right: r.left + (z.x + z.width) * k, y: r.top + (z.y + z.height / 2) * k, h: z.height * k }));
  });
}

/** Point de jeu (1280×720) → px CSS de la page. */
function toCss(page: Page, x: number, y: number): Promise<{ x: number; y: number }> {
  return page.evaluate(
    ([x, y]) => {
      const r = (window as any).__game.canvas.getBoundingClientRect();
      const k = r.width / 1280;
      return { x: r.left + x * k, y: r.top + y * k };
    },
    [x, y],
  );
}

/** Attend qu'une expression évaluée dans la page devienne vraie (false si délai dépassé). */
async function until(page: Page, fn: string, ms = 4000): Promise<boolean> {
  return page
    .waitForFunction(fn, null, { timeout: ms })
    .then(() => true)
    .catch(() => false);
}

const ROOM = "window.__game.scene.getScene('Room')";

const failures: string[] = [];
const server = await createServer({ logLevel: 'error', server: { port: 0 } });
await server.listen();
const url = server.resolvedUrls!.local[0];
const browser = await chromium.launch({ executablePath: findChrome(), args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

const CASES = [
  { name: 'tactile paysage 844×390 — tap sur le badge', touch: true, vw: 844, vh: 390, at: 'badge' },
  { name: 'tactile paysage 844×390 — tap en bout de ligne', touch: true, vw: 844, vh: 390, at: 'end' },
  { name: 'tactile portrait 390×844 — tap au centre', touch: true, vw: 390, vh: 844, at: 'center' },
  { name: 'souris 1280×720 — clic sur le badge', touch: false, vw: 1280, vh: 720, at: 'badge' },
] as const;

try {
  for (const c of CASES) {
    const ctx = await browser.newContext({ viewport: { width: c.vw, height: c.vh }, hasTouch: c.touch, isMobile: c.touch, deviceScaleFactor: c.touch ? 2 : 1 });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => failures.push(`[${c.name}] erreur JS : ${e.message}`));
    await page.goto(`${url}?scene=placard&music=0${c.touch ? '&touch=1' : ''}`);
    await page.waitForFunction(() => (window as any).__game?.scene.getScene('Room')?.dialogueBox, null, { timeout: 30000 });
    const tap = (x: number, y: number) => (c.touch ? page.touchscreen.tap(x, y) : page.mouse.click(x, y));
    const canvas = (await page.locator('canvas').boundingBox())!;
    await page.evaluate(() => void (window as any).__game.scene.getScene('Room').act([{ dialogue: 'bob' }]));
    let list: Row[] = [];
    // avance les répliques (tap dans la boîte de dialogue) jusqu'aux choix
    for (let i = 0; i < 20 && !list.length; i++) {
      await page.waitForTimeout(400);
      list = await rows(page);
      if (!list.length) await tap(canvas.x + canvas.width / 2, canvas.y + canvas.height * 0.85);
    }
    if (!list.length) {
      failures.push(`[${c.name}] aucun choix affiché`);
      await ctx.close();
      continue;
    }
    await page.waitForTimeout(300);
    const minH = Math.min(...list.map((r) => r.h));
    if (c.touch && c.vw > c.vh && minH < 44) failures.push(`[${c.name}] ligne de choix trop basse : ${minH.toFixed(1)} px CSS`);
    const row = list[1];
    const x = c.at === 'badge' ? row.left + (row.right - row.left) * 0.03 : c.at === 'end' ? row.right - 6 : (row.left + row.right) / 2;
    await tap(x, row.y);
    await page.waitForTimeout(500);
    const after = await rows(page);
    const ok = after.length === 0;
    console.log(`${ok ? '✓' : '✗'} ${c.name} (ligne ${minH.toFixed(0)} px CSS)`);
    if (!ok) failures.push(`[${c.name}] le tap n'a pas sélectionné le choix`);
    await ctx.close();
  }

  // ── autres commandes au doigt ──
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => failures.push(`[commandes] erreur JS : ${e.message}`));
  const cdp = await ctx.newCDPSession(page);
  const tapAt = async (x: number, y: number) => {
    const p = await toCss(page, x, y);
    await page.touchscreen.tap(p.x, p.y);
  };
  const longPress = async (x: number, y: number) => {
    const p = await toCss(page, x, y);
    const pt = [{ x: p.x, y: p.y, id: 1 }];
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt });
    await page.waitForTimeout(650);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };
  const check = (name: string, ok: boolean) => {
    console.log(`${ok ? '✓' : '✗'} doigt : ${name}`);
    if (!ok) failures.push(`[commandes] ${name}`);
  };
  await page.goto(`${url}?scene=placard&items=seau&music=0&touch=1`);
  await page.waitForFunction(() => (window as any).__game?.scene.getScene('Room')?.dialogueBox, null, { timeout: 30000 });
  await page.waitForTimeout(800);
  // réplique : un tap affiche tout, un autre ferme
  await page.evaluate(() => void (window as any).__game.scene.getScene('Room').act('Une réplique de test assez longue pour que la frappe dure un moment.'));
  await page.waitForTimeout(300);
  await tapAt(640, 600);
  check('tap pendant la frappe → texte complet', await until(page, `${ROOM}.dialogueBox.typing?.finished`, 1500));
  await page.waitForTimeout(250);
  await tapAt(640, 600);
  check('tap suivant → dialogue fermé', await until(page, `!${ROOM}.dialogueBox.isOpen`));
  await page.waitForTimeout(300);
  // inventaire : tap sur la case → objet en main
  const slot = await page.evaluate(() => {
    const r = (window as any).__game.scene.getScene('Room');
    return r.inventory.slotCenter?.(0) ?? null;
  });
  await tapAt(slot?.x ?? 284, slot?.y ?? 648);
  check('tap sur un objet → en main', await until(page, `${ROOM}.session.state.selectedItem === 'seau'`));
  await page.evaluate(() => (window as any).__game.scene.getScene('Room').session.state.select(null));
  await page.waitForTimeout(300);
  // appui long sur un hotspot → verb coin
  await longPress(1035, 300);
  check('appui long sur le casier → verb coin', await until(page, `${ROOM}.coin.isOpen`, 1500));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  // ♪ : bascule la musique (persistée)
  const music = await page.evaluate(() => {
    const r = (window as any).__game.scene.getScene('Room');
    return { x: r.musicButton.x, y: r.musicButton.y };
  });
  await tapAt(music.x, music.y);
  check('tap sur ♪ → musique basculée', await until(page, `localStorage.getItem('qj.music') === '1'`, 1500));
  // flèche de sortie → couloir
  await tapAt(1210, 305);
  check('tap sur la flèche → couloir', await until(page, `${ROOM}.session.state.scene === 'couloir'`, 6000));
  await page.waitForTimeout(600);
  // MENU → écran titre
  const menu = await page.evaluate(() => {
    const r = (window as any).__game.scene.getScene('Room');
    return { x: r.menuButton.x, y: r.menuButton.y };
  });
  await tapAt(menu.x, menu.y);
  check('tap sur MENU → écran titre', await until(page, `window.__game.scene.isActive('Title')`, 4000));
  await ctx.close();
} finally {
  await browser.close();
  await server.close();
}
if (failures.length) {
  console.error('\n' + failures.join('\n'));
  process.exit(1);
}
console.log('\n✓ Choix de dialogue sélectionnables au doigt et à la souris.');
