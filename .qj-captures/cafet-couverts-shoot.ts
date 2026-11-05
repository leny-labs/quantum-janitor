import { mkdirSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright-core';
const OUT = join(homedir(), 'qj-cafet-couverts');
mkdirSync(OUT, { recursive: true });
const pw = join(homedir(), '.cache/ms-playwright');
const d = readdirSync(pw).filter((d) => /^chromium-\d+$/.test(d)).sort().reverse()[0];
const BASE = 'http://localhost:5173/?scene=st-cafeteria&chapter=1&flags=st,ch0_termine,combi_portee,bob_suit,st_laisse,st_arrive,st_voit_borne&items=badge,fragment,plan_station';
const browser = await chromium.launch({ executablePath: join(pw, d, 'chrome-linux64/chrome'), args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
for (const [name, q, clip] of [
  ['cafet-room.png', '', undefined],
  ['cafet-tables-zoom.png', '&shot=tables', undefined],
  ['cafet-tables-zoom-detail.png', '&shot=tables', { x: 340, y: 160, width: 600, height: 400 }],
] as const) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('pageerror', e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.error('console', m.text()); });
  await page.goto(BASE + q);
  await page.waitForTimeout(9000);
  await page.screenshot({ path: join(OUT, name), clip: clip as any });
  console.log('✓', join(OUT, name));
  await page.close();
}
await browser.close();
