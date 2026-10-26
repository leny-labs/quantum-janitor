// Écrit public/portraits/{id}-sheet.png (planche idle + talk) et {id}-ref.png
// (frame idle0, image de référence pour GenAI) à partir du Studio Three.js.
// Les planches GenAI (GENAI_SHEETS dans Studio.ts, ex. gary) ne sont pas touchées.
// Usage : npm run bake:portraits   (CHROME=/chemin/vers/chrome pour forcer le navigateur)
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';

const ROOT = resolve(import.meta.dirname, '..');
const OUT = join(ROOT, 'public/portraits');

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

const server = await createServer({ root: ROOT, base: '/', server: { port: 0 }, logLevel: 'warn' });
await server.listen();
const url = server.resolvedUrls?.local[0];
const browser = await chromium.launch({ executablePath: findChrome(), args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
try {
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.error('[page]', e.message));
  await page.goto(`${url}tools/bake.html`);
  await page.waitForFunction(() => '__bake' in window);
  const sheets = await page.evaluate(() => (window as unknown as { __bake: () => Promise<Record<string, { sheet: string; ref: string }>> }).__bake());
  mkdirSync(OUT, { recursive: true });
  for (const [id, { sheet, ref }] of Object.entries(sheets)) {
    for (const [name, data] of [[`${id}-sheet.png`, sheet], [`${id}-ref.png`, ref]]) {
      writeFileSync(join(OUT, name), Buffer.from(data.split(',')[1], 'base64'));
      console.log('✓', join('public/portraits', name));
    }
  }
} finally {
  await browser.close();
  await server.close();
}
