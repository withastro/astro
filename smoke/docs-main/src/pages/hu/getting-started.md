---
layout: ~/layouts/MainLayout.astro
title: Első lépések
description: Bevezetés az Astro-ba.
---

Astro egy modern statikus oldal generátor. Tudj meg többet a [honlapunkon](https://astro.build/) vagy [kiadásról szóló posztunkból](https://astro.build/blog/introducing-astro). Ez az oldal egy áttekintő az Astro dokumentációhoz és minden hozzá kapcsolódó forráshoz.

## Az Astro kipróbálása

Az Astro kipróbálásának legegyszerűbb módja az `npm init astro` parancs futtatása egy új mappában a saját számítógépeden. A parancssoros varázsló végigvezet egy új Astro projekt beállításán.

Ha hamarabb munkához látnál, látogasd meg a [Gyors beállítás - útmutató](/hu/quick-start) oldalunkat.

Ellenkező esetben, olvasd el a [Telepítési útmutató](/hu/installation) oldalunkat, ahol részletesen megtudhatod hogyan telepítsd és állítsd be az Astro-t.

### Minta projektek

Ha jobban szeretsz példák alapján tanulni, nézd meg a [komplett példa gyűjteményünket](https://github.com/withastro/astro/tree/main/examples) GitHub-on.

Bármelyik minta projektet kipróbálhatod a saját számítógépeden az `npm init astro` parancs lefuttatásával és a `--template` paraméterrel. A `--template` paraméter támogatja a harmadik féltől és a közösségtől származó mintákat is.

```bash
# Inicializáló parancs futtatása a kiválasztott hivatalos mintával
npm init astro -- --template [HIVATALOS_MINTA_NEVE]
# Inicializáló parancs futtatása egy közösségi mintával
npm init astro -- --template [GITHUB_FELHASZNÁLÓ]/[REPO_NEVE]
npm init astro -- --template [GITHUB_FELHASZNÁLÓ]/[REPO_NEVE]/minta/elérési/útvonala
```

### Online Játszótér

Ha előbb szeretnéd az Astro-t a böngésződben kipróbálni, pillanatok alatt létrehozhatsz egy új Astro projektet az [astro.new](https://astro.new/) oldalunkon.

Ezen felül az Astro elérhető olyan online kód szerkesztőkben is mint a Stackblitz, CodeSandbox, Gitpod, és GitHub Codespaces. Kattints az "Open in Stackblitz" gombra bármelyik mintánknál a [minta gyűjteményeink](https://github.com/withastro/astro/tree/main/examples) között. Vagy, [kattints ide](https://stackblitz.com/fork/astro) és automatikusan elindul egy új Astro projekt [Stackblitz-en](https://stackblitz.com/fork/astro).

## Tanuld meg az Astro-t

Különböző emberek különféle nyelvekből és háttérből érkeznek az Astro-hoz. Akár az elméleti, akár a gyakorlati tanulást preferálod, reméljük ez a szekció a segítségedre lesz.

- Ha szeretsz **gyakorlással tanulni**, látogass el a [minta gyűjteményeink közé](https://github.com/withastro/astro/tree/main/examples).
- Ha szereted **az alapokat lépésről lépésre elsajátítani**, kezdd az [alap koncepciókkal és útmutatókkal](/en/core-concepts/project-structure).

Mint minden új technológiának, az Astronak is van egy tanulási görbéje. Azonban gyakorlással és egy kis türelemmel, tudjuk, hogy _meg fogod tanulni_ pillanatokon belül.

### A `.astro` szintaxisa

Amint nekilátsz az Astro tanulásának, hamar észreveheted hogy nagyon sok fájl a `.astro` kiterjesztést használja. Ez az **Astro komponens szintaxisa**: egy különleges HTML-szerű fájlformátum amit az Astro a sablonozáshoz használ. Úgy terveztük hogy ismerős legyen mindenki számára akinek van HTML vagy JSX tapasztalata.

Az [Astro komponensek](/en/core-concepts/astro-components) útmutatónk bevezet az Astro szintaktika világába, a lehető leghatékonyabb módon.

### API Referencia

Ez a szekció hasznos lehet, ha valamelyik konkrét Astro API-ről szeretnél tanulni. Például a [Beállítások Referencia](/en/reference/configuration-reference) kilistázza az összes elérhető opciót a beállításokhoz. 
A [Beépített Komponensek Referencia](/en/reference/builtin-components) kilistázza az összes beépített komponenst, mint  
például a `<Markdown />` és a `<Code />`.

### Verzió kezelt Dokumentáció

Ez a dokumentáció mindig a legfrissebb stabil Astro verziót tükrözi. Amint elérjük a v1.0 mérföldkövet, beépítésre kerül a verziókövetett dokumentáció is.

## Maradj naprakész

Az [@astrodotbuild](https://twitter.com/astrodotbuild) Twitter felhasználó a hivatalos csatornánk ahol új információkat szerezhetsz az Astro csapattól.

Ezen felül az egyes verziók megjelenését bejelentjük a [Discord szerverünkön](https://astro.build/chat) is az #announcements csatornán.

Nem minden verizó kiadás érdemel meg egy külön posztot, de minden verzióhoz találsz részletes naplót, - ahol láthatod mi változott - a [`CHANGELOG.md` fájlban GitHubon](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md).

## Valami hiányzik?

Ha valami hiányzik a dokumentációból, vagy valami féélreérthető, kérjük [készíts egy bejelentést hozzá](https://github.com/withastro/astro/issues/new/choose) a javaslataiddal, vagy tweetelj az [@astrodotbuild](https://twitter.com/astrodotbuild) Twitter fiókunknak. Örömmel hallanánk mit gondolsz!

## Elismerés

Ez az 'Első Lépések' útmutató a [React](https://reactjs.org/) útmutatója alapján készült.
