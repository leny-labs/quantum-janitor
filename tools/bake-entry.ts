// Page servie par Vite pour `npm run bake:portraits` : rend les planches de
// portraits avec le vrai Studio (Three.js, mêmes props / matériaux toon) et
// les expose en data URL au script Node.
import '@fontsource/chakra-petch/700.css';
import { renderPortraitSheets, SHEET } from '../src/three/Studio';
import { loadFonts } from '../src/ui/theme';

async function bake(): Promise<Record<string, { sheet: string; ref: string }>> {
  await loadFonts();
  const out: Record<string, { sheet: string; ref: string }> = {};
  for (const [id, sheet] of Object.entries(renderPortraitSheets())) {
    // référence GenAI : la frame idle0 seule
    const ref = document.createElement('canvas');
    ref.width = ref.height = SHEET.frame;
    ref.getContext('2d')!.drawImage(sheet, 0, 0, SHEET.frame, SHEET.frame, 0, 0, SHEET.frame, SHEET.frame);
    out[id] = { sheet: sheet.toDataURL('image/png'), ref: ref.toDataURL('image/png') };
    sheet.style.cssText = 'display:block;margin:8px';
    document.body.append(sheet);
  }
  return out;
}

(window as unknown as { __bake: typeof bake }).__bake = bake;
