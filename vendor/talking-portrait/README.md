# talking-portrait

Portraits parlants pour **Phaser 3** (mobile-first) : bouche animée (rythme du texte ou audio) + clignement d'yeux + respiration idle. Zéro dépendance runtime (seul `phaser` en peer), aucun réseau, aucune clé API.

*Talking portraits for Phaser 3: mouth flaps driven by typewriter text or audio, idle blinking and breathing. No runtime deps besides the `phaser` peer.*

```
DialogueRunner (votre jeu) → TypewriterMouth | AudioMouth → TalkingPortrait → Phaser
```

## Installation

```bash
npm i talking-portrait            # ou "talking-portrait": "file:../talking-portrait"
# optionnel, pour l'audio par visèmes :
npm i @beer-digital/lipsync-engine
```

Le package est livré compilé dans `dist/` (`npm run build`, lancé automatiquement par `prepare`).

## Usage

```ts
import { TalkingPortrait, TypewriterMouth, typewrite } from 'talking-portrait';

const face = new TalkingPortrait(scene, {
  x: 120, y: 200, width: 176, height: 200,   // x, y = centre
  textureKey: 'portrait:gary',
  mouth: { x: 0.42, y: 0.73, width: 0.19 },  // fractions de la texture
  blink: { eyes: [{ x: 0.32, y: 0.45, width: 0.1 }, { x: 0.5, y: 0.45, width: 0.1 }], lidColor: '#f4c18d' },
}).attach();                                  // ou .attach(monContainer)

// Sans VO : la bouche suit le rythme du texte
const mouth = new TypewriterMouth(face, { cps: 30 });
const typing = typewrite(textObject, line, { cps: 30 }); // helper typewriter fourni
void mouth.speak(line);
await typing.done;      // typing.skip() au clic → texte complet
mouth.idle();           // bouche fermée
```

Mode manuel : `typewrite(text, line, { onChar: (ch) => mouth.pulse(ch) })`.

### Spritesheet (boucles idle / talk, façon Sam & Max)

Pour des portraits dessinés ou bakés frame par frame : plus d'overlay de bouche, le portrait joue une boucle `idle` (respiration, clignement inclus) et une boucle `talk` pendant la parole.

```ts
import { SpriteTalk } from 'talking-portrait';

face.setSpriteSheet({
  key: 'portrait:gary',              // spritesheet Phaser, ou image simple découpée :
  frameWidth: 256, frameHeight: 256, // grille → frames 0..n-1
  idle: { frames: [{ frame: 0, duration: 1800 }, 1, 0, 2, 3], frameRate: 3 }, // `duration` (ms) prime sur frameRate
  talk: { frames: [4, 5, 6, 7], frameRate: 8 },
});
const talk = new SpriteTalk(face, { cps: 30 });
void talk.speak(line);   // talk pendant toute la réplique, idle à la fin
                         // (pauseGap: 600 → idle aussi sur les longs silences)
talk.idle();             // retour immédiat à idle (skip)
```

`face.setTalking(true|false)` pilote les boucles à la main. En mode sheet, `TypewriterMouth` / `AudioMouth` marchent aussi : toute forme ouverte → `talk`, fermeture → `idle` après `closeHold` ms. `setTexture()` quitte le mode sheet (retour à l'overlay).

### Audio (VO)

```ts
import { AudioMouth } from 'talking-portrait';

const vo = await AudioMouth.fromUrl(face, '/vo/gary-01.mp3', {
  lipsync: await import('@beer-digital/lipsync-engine'), // optionnel
});
await vo.speak();
```

Repli progressif : `lipsync-engine` (si fourni ou importable) → analyseur WebAudio intégré (volume + sifflantes) → battement simple pendant la lecture. Avec un bundler, passez le module explicitement (l'import automatique `lipsync: 'auto'` ne marche qu'avec une import map). `AudioMouth.fromBuffer(face, audioBuffer)` accepte aussi un son déjà décodé.

## API

| | |
|---|---|
| `new TalkingPortrait(scene, opts)` | `x, y, width, height, textureKey?, fit: 'cover'\|'contain', mouth?, blink?, layers?: { eyesClosed }, breathe?, depth?` |
| `.attach(parent?)` / `.detach()` / `.destroy()` | ajout au display list ou à un `Container` |
| `.setTexture(key, frame?, { mouth?, blink?, eyesClosed? })` | changer de personnage (ancrages compris) |
| `.setMouth('closed'\|'small'\|'open'\|'wide')`, `.idle()`, `.blink()` | contrôle direct |
| `mouth.sheet` | spritesheet fournie : `{ key, frames: { closed, small, open, wide } }` au lieu des formes procédurales |
| `mouth.style` | `lipColor, innerColor, teethColor, tongueColor, outlineColor` (`null` = absent) |
| `mouth.showClosed: false` | rien d'affiché au repos (portrait qui a déjà une bouche) |
| `.setSpriteSheet({ key, frameWidth?, frameHeight?, idle, talk, closeHold? })`, `.setTalking(on)` | mode spritesheet (boucles Phaser locales au sprite) |
| `SpriteTalk` | `speak(text)`, `talk()`, `idle()`, `cps`, `pauseGap` — driver des sheets |
| `TypewriterMouth` | `speak(text)`, `pulse(ch)`, `idle()`, `cps` |
| `AudioMouth` | `fromUrl`, `fromElement`, `fromBuffer`, `speak()`, `idle()` |
| `typewrite(text, str, opts)` | `{ done, finished, skip(), stop() }` — retour à la ligne pré-calculé (pas de mots qui sautent) |

Ancrages : fractions (0..1) de la **texture de base**, indépendantes du recadrage. Le recadrage `cover` utilise `setCrop` (pas de masque) : fonctionne dans n'importe quel conteneur. Le package n'importe jamais Phaser à l'exécution (types seulement) : pas de doublon de Phaser via `file:`/monorepo.

## Demo

```bash
npm install && npm run demo   # http://localhost:5173  (?auto = parle au chargement, ?lids = paupières fermées)
```

## EN — short

`TalkingPortrait` renders a portrait plus a procedural (or spritesheet) mouth overlay and eyelid blinks. Drive it with `TypewriterMouth` (text rhythm, no audio) or `AudioMouth` (WebAudio analysis, or `@beer-digital/lipsync-engine` if you pass it in). Anchors are normalized to the base texture. MIT.
