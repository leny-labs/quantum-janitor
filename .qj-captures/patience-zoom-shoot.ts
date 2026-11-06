// M. Patience (st-attente) : clic ticket → plan perso entier → prise dans le plan (B.O.B. aspire)
// → retour. Sorties dans ~/qj-patience-zoom/.
import { mkdirSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright-core';
const OUT = join(homedir(), 'qj-patience-zoom');
mkdirSync(OUT, { recursive: true });
const pw = join(homedir(), '.cache/ms-playwright');
const d = readdirSync(pw).filter((d) => /^chromium-\d+$/.test(d)).sort().reverse()[0];
// tout vu sauf la main serrée : le clic dans le zoom fait tirer Gary, puis B.O.B. enchaîne
const flags = 'st,ch0_termine,combi_portee,bob_suit,st_laisse,st_arrive,st_voit_afficheur';
const URL = `http://localhost:5173/?scene=st-attente&chapter=1&flags=${flags}&items=badge`;
const browser = await chromium.launch({ executablePath: join(pw, d, 'chrome-linux64/chrome'), args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', (e) => console.error('pageerror', e.message));
await page.goto(URL);
await page.waitForTimeout(9000);
const st = () =>
  page.evaluate(() => {
    const s = (window as any).__game.scene.getScene('Room');
    const g = s.session.state;
    return { open: s.dialogueBox?.isOpen, busy: s.busy, ex: s.room.examining, picks: s.room.hasPicks(), flags: ['st_main_serree', 'st_ticket_9848', 'st_voit_patience'].filter((f) => g.flags?.has?.(f) ?? g.hasFlag?.(f)), items: g.inventory?.items ?? g.items };
  });
const shot = async (n: string) => (await page.screenshot({ path: join(OUT, n) }), console.log('✓', n, JSON.stringify(await st())));
const box = (await page.locator('canvas').boundingBox())!;
const g = await page.evaluate(() => ({ w: (window as any).__game.scale.width, h: (window as any).__game.scale.height }));
const click = (x: number, y: number) => page.mouse.click(box.x + (x / g.w) * box.width, box.y + (y / g.h) * box.height);
const drain = async (max = 20, choice?: string) => {
  for (let i = 0; i < max; i++) {
    const s = await page.evaluate(() => {
      const r = (window as any).__game.scene.getScene('Room');
      return { open: r.dialogueBox?.isOpen, choices: r.dialogueBox?.choiceZones?.length ?? 0 };
    });
    if (!s.open) return;
    if (s.choices && choice) await page.keyboard.press(choice);
    else await page.keyboard.press('Space');
    await page.waitForTimeout(700);
  }
};
await drain(4);
await shot('before.png');
// 1. clic sur le ticket (vue pièce) : Regarder → plan M. Patience entier
await click(340, 352);
await page.waitForTimeout(1600);
await shot('examine-bubble.png');
await drain(6);
await page.waitForTimeout(600);
await shot('after-examine.png');
// 2. le ticket dans le plan : pixel sous lequel spotAt renvoie ticket_patience
const hit = await page.evaluate(() => {
  const r = (window as any).__game.scene.getScene('Room').room;
  const pts: [number, number][] = [];
  for (let y = 0; y < 580; y += 6) for (let x = 0; x < 1280; x += 6) if (r.spotAt(x, y) === 'ticket_patience') pts.push([x, y]);
  if (!pts.length) return null;
  const sx = pts.reduce((a, p) => a + p[0], 0) / pts.length, sy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  return { x: Math.round(sx), y: Math.round(sy), n: pts.length };
});
console.log('ticket dans le plan', hit);
if (!hit) throw new Error('ticket non cliquable dans le plan');
await page.mouse.move(box.x + (hit.x / g.w) * box.width, box.y + (hit.y / g.h) * box.height);
await page.waitForTimeout(400);
await shot('hover-in-zoom.png');
await click(hit.x, hit.y);
await page.waitForTimeout(900);
await shot('pull-in-zoom.png');
// tirer (2 répliques) puis B.O.B. : choix 1 « Il n'en a plus besoin… »
let aspir = false;
for (let i = 0; i < 30; i++) {
  const s = await page.evaluate(() => {
    const r = (window as any).__game.scene.getScene('Room');
    return { open: r.dialogueBox?.isOpen, choices: r.dialogueBox?.choiceZones?.length ?? 0, text: r.dialogueBox?.bodyText?.text ?? '' };
  });
  if (!s.open) break;
  if (s.choices) {
    await page.keyboard.press('1');
    await page.waitForTimeout(700);
    continue;
  }
  if (!aspir && /SHLUUUP/.test(s.text)) {
    aspir = true;
    await page.waitForTimeout(700);
    await shot('after-take-in-zoom.png');
    await page.waitForTimeout(1200);
    await shot('after-take-in-zoom-2.png');
    await page.waitForTimeout(1500);
  }
  await page.keyboard.press('Space');
  await page.waitForTimeout(900);
}
await page.waitForTimeout(1800);
await shot('after-taken.png');
// 3. après : le ticket a disparu ; re-clic à l'emplacement = M. Patience (pas de boucle sur le ticket)
await page.waitForTimeout(800);
await shot('after-room.png');
await browser.close();
