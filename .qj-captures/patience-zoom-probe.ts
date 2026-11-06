// Sonde de cadrage : ?shot=<id> sur st-attente → /tmp/qjpz/<name>.png
import { readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright-core';
const [shotId = '', name = 'probe', extraFlags = ''] = process.argv.slice(2);
const pw = join(homedir(), '.cache/ms-playwright');
const d = readdirSync(pw).filter((d) => /^chromium-\d+$/.test(d)).sort().reverse()[0];
const flags = 'st,ch0_termine,combi_portee,bob_suit,st_laisse,st_arrive' + (extraFlags ? ',' + extraFlags : '');
const URL = `http://localhost:5173/?scene=st-attente&chapter=1&flags=${flags}&items=badge${shotId ? '&shot=' + shotId : ''}`;
const browser = await chromium.launch({ executablePath: join(pw, d, 'chrome-linux64/chrome'), args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', (e) => console.error('pageerror', e.message));
await page.goto(URL);
await page.waitForTimeout(9000);
await page.screenshot({ path: join('/tmp/qjpz', name + '.png') });
await browser.close();
