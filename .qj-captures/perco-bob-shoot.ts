// Captures PERCO (portrait à humeurs + onde ambre), B.O.B. en st-pause / st-tampons.
// npx tsx .qj-captures/perco-bob-shoot.ts [after|before] [only=pause,moods,tampons,travail]
import { mkdirSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright-core';
const mode = process.argv[2] ?? 'after';
const only = (process.argv.find((a) => a.startsWith('only=')) ?? 'only=pause,moods,tampons,travail').slice(5).split(',');
const OUT = join(homedir(), 'qj-perco-bob', mode);
mkdirSync(OUT, { recursive: true });
const pw = join(homedir(), '.cache/ms-playwright');
const d = readdirSync(pw).filter((d) => /^chromium-\d+$/.test(d)).sort().reverse()[0];
const BASE = 'http://localhost:5173/?chapter=1&items=badge,fragment,plan_station&flags=st,ch0_termine,combi_portee,bob_suit,st_laisse,st_arrive,st_greve_connue';
const browser = await chromium.launch({ executablePath: join(pw, d, 'chrome-linux64/chrome'), args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const open = async (scene: string, extra = '') => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', (e) => console.error('pageerror', e.message));
  page.on('console', (m) => { if (m.type() === 'error' || /\[3D\]/.test(m.text())) console.error('console', m.text()); });
  await page.goto(`${BASE}${extra}&scene=${scene}`);
  await page.waitForTimeout(9000);
  return page;
};
const save = async (page: any, name: string, clip?: any) => {
  await page.screenshot({ path: join(OUT, name), clip });
  console.log('✓', name);
};
// réplique PERCO forcée dans la boîte de dialogue de la salle
const say = (page: any, text: string, mood: string) =>
  page.evaluate(([text, mood]: string[]) => {
    const g = (window as any).__game;
    const room = g.scene.getScene('Room');
    const ch = room.session.content.characters.get('perco');
    room.dialogueBox.showLine(ch, text, mood);
  }, [text, mood]);
const PORTRAIT = { x: 20, y: 440, width: 560, height: 280 };

if (only.includes('pause')) {
  const page = await open('st-pause');
  // bulle d'intro PERCO (onFirstEnter, angry) en cours de frappe
  await page.waitForTimeout(200);
  await save(page, 'pause-intro.png');
  for (let i = 0; i < 6; i++) await page.mouse.click(640, 600), await page.waitForTimeout(500);
  await page.waitForTimeout(1500);
  await save(page, 'pause-bob-left.png');
  await page.close();
}
if (only.includes('moods')) {
  const page = await open('st-pause');
  for (let i = 0; i < 6; i++) await page.mouse.click(640, 600), await page.waitForTimeout(500);
  await page.waitForTimeout(800);
  await say(page, 'CAMARADE.', 'calm');
  await page.waitForTimeout(1500);
  await save(page, 'perco-idle.png');
  await save(page, 'perco-idle-portrait.png', PORTRAIT);
  await say(page, "CAFÉ TIÈDE ! COLÈRE CHAUDE ! CAFÉ TIÈDE ! COLÈRE CHAUDE ! QUARANTE ET UN ANS SANS PAUSE ! L'HORLOGE EST BLOQUÉE À 10 H 11 !", 'angry');
  await page.waitForTimeout(700);
  await save(page, 'perco-talk.png');
  await save(page, 'perco-talk-portrait.png', PORTRAIT);
  await save(page, 'perco-talk-world.png', { x: 420, y: 0, width: 440, height: 440 });
  for (const m of ['calm', 'suspicious', 'angry', 'love', 'surprised']) {
    await say(page, `HUMEUR : ${m.toUpperCase()}, CAMARADE. LE CAFÉ EST UN DROIT, PAS UN PRIVILÈGE DE LA DIRECTION !`, m);
    await page.waitForTimeout(450);
    await save(page, `perco-mood-${m}.png`, PORTRAIT);
  }
  await page.close();
}
if (only.includes('travail')) {
  const page = await open('st-pause', ',st_greve_finie,st_accord_pris,st_accord_signe');
  for (let i = 0; i < 6; i++) await page.mouse.click(640, 600), await page.waitForTimeout(500);
  await page.waitForTimeout(800);
  await say(page, 'TOUT EST TIÈDE, CAMARADE. LE CAFÉ, LA GRÈVE, LA COLÈRE. C\'EST NOTRE ÉQUILIBRE.', 'calm');
  await page.waitForTimeout(600);
  await save(page, 'perco-mood-travail-calm.png', PORTRAIT);
  await save(page, 'perco-travail-world.png', { x: 420, y: 0, width: 440, height: 440 });
  await say(page, 'UN À LA FOIS. SANS LIMITE. LE CAFÉ EST UN DROIT.', 'love');
  await page.waitForTimeout(600);
  await save(page, 'perco-mood-travail-love.png', PORTRAIT);
  await page.close();
}
if (only.includes('tampons')) {
  const page = await open('st-tampons');
  for (let i = 0; i < 6; i++) await page.mouse.click(640, 600), await page.waitForTimeout(500);
  await page.waitForTimeout(1500);
  await save(page, 'tampons-bob-zok.png');
  await save(page, 'tampons-bob-zoom.png', { x: 520, y: 260, width: 420, height: 260 });
  await page.close();
}
await browser.close();
