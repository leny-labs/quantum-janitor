// Captures d'écran des pièces 3D (revue visuelle). Usage :
//   npm run shots [-- out=/tmp/qj url=http://localhost:5174/]
// Nécessite un serveur Vite lancé (npm run dev).
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright-core';

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.split('=') as [string, string]));
const URL = args.url ?? 'http://localhost:5174/';
const OUT = args.out ?? 'docs/screenshots';

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

const SHOTS: [name: string, query: string][] = [
  ['title', ''],
  ['placard', '?scene=placard'],
  ['couloir', '?scene=couloir&flags=bob_suit'],
  ['couloir-off', '?scene=couloir&flags=bob_suit,fusible_retire,labo_ouvert,lecteur_propre'],
  ['labo', '?scene=labo&flags=bob_suit,labo_ouvert'],
  ['labo-full', '?scene=labo&flags=bob_suit,labo_ouvert,panneau_allume,refroidissement_verse'],
  ['panneau', '?scene=panneau&flags=panneau_allume,fusible_pose'],
  ['fin', '?scene=fin'],
];

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: findChrome(), args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
try {
  for (const [name, q] of SHOTS.filter(([n]) => !args.only || args.only.split(',').includes(n))) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.on('pageerror', (e) => console.error(`[${name}]`, e.message));
    await page.goto(URL + q);
    await page.waitForTimeout(Number(args.wait ?? 3500));
    // ferme une éventuelle bulle d'intro
    await page.screenshot({ path: join(OUT, `${name}.png`) });
    console.log('✓', join(OUT, `${name}.png`));
    await page.close();
  }
} finally {
  await browser.close();
}
