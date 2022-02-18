---
layout: ~/layouts/MainLayout.astro
title: Telepítés
description: Hogyan telepítsd fel az Astro-t NPM, PNPM vagy Yarn használatával.
---

Több opcióból is választhatsz hogy miként szeretnéd az Astro-t egy új projektben telepíteni.

## Előzetes követelmények

- **Node.js** - `14.15.0`, `v16.0.0`, vagy magasabb verzió.
- **Szöveg szerkesztő** - Mi a [VS Code-ot](https://code.visualstudio.com/) ajánljuk a saját [Hivatalos Astro bővítményünkkel](https://marketplace.visualstudio.com/items?itemName=astro-build.astro-vscode).
- **Terminál** - Az Astro elsődlegesen terminál alól érhető el.

A bemutató kedvéért [`npm`](https://www.npmjs.com/) csomagkezelőt fogunk használni az alábbi példákban, de ugyanúgy használhatod [`yarn`-al](https://yarnpkg.com/) vagy [`pnpm`-el](https://pnpm.io/) ha azokat jobban szereted.

## Az Astro létrehozása

`npm init astro` a legegyszerűbb módja hogy telepítsd az Astro-t egy új projekthez. Futtasd le ezt a parancsot a terminálban, ez elindítja a `create-astro` varázslót ami végigvezet a projekt beállításán.

```shell
# NPM-el
npm init astro

# Yarn-al
yarn create astro

# Pnpm-el
pnpm create astro
```

[`create-astro`](https://github.com/withastro/astro/tree/main/packages/create-astro) varázsló felajánlja hogy válassz a [kezdő minták közül](https://github.com/withastro/astro/tree/main/examples) vagy, importálhatod a saját Astro projektedet GitHub-ról.

```bash
# Megjegyzés: Cseréld ki a "my-astro-project"-et a saját projekted nevére.

# npm 6.x
npm init astro my-astro-project --template starter
# npm 7+ (extra dupla-kötőjel szükséges)
npm init astro my-astro-project -- --template starter
# yarn
yarn create astro my-astro-project --template starter
# pnpm
pnpm create astro my-astro-project -- --template starter
# Harmadik féltől származó minta használata
npm init astro my-astro-project -- --template [GITHUB_FELHASZNÁLÓ]/[REPO_NEVE]
# Harmadik féltől származó, repo-ban elhelyezett minta használata
npm init astro my-astro-project -- --template [GITHUB_FELHASZNÁLÓ]/[REPO_NEVE]/minta/elérési/útvonala
```

Miután a `create-astro` végez a projekteddel, ne felejtsd el feltelepíteni a függőségeket npm-el vagy az általad választott csomagkezelővel. Ebben a példában npm-et használunk:

```bash
npm install
```

Most már [Elindíthatod](#start-astro) az Astro projektedet. Amint összeállítottad a projektet [Megépítheted azt.](#build-astro) Az Astro ezután csomagolja az alkalmazásodat, így a statikus fájlaid készen állnak a [Kitelepítésre](/en/guides/deploy) a kedvenc szolgáltatódhoz.

## Kézi Telepítés

Az Astro-t telepítheted a `create-astro` varázsló segítsége nélkül is. Alább láthatod a pár extra lépésrt amire szükséged lesz hozzá.

### Állítsd be a projektedet

```bash
# Csinálj egy új mappát és lépj bele
mkdir my-astro-project
cd my-astro-project
```

Csinálj egy üres mappát a projekted nevével, majd lépj bele:

### Hozd létre a `package.json` fájlt

```bash
# Ez a parancs létrehoz neked egy alap package.json fájlt
npm init --yes
```

Az Astro-t úgy terveztük hogy működjön a teljes npm csomagrendszerrel. Ezt egy projekt nyilvántartás vezérli, a projekted gyökérkönyvtárában amit `package.json`-ként ismerhetsz. Ha nem ismerős a `package.json` fájl, javasoljuk hogy olvasd át annak működését az [npm dokumentációjában](https://docs.npmjs.com/creating-a-package-json-file).

### Az Astro telepítése

Ha követted a fenti utasításokat, egy mappád kell legyen, benne egy darab `package.json` fájllal. Mostmár telepítheted az Astro-t a projektedhez.

```bash
npm install astro
```

Következő lépésben lecserélheted az ideiglenes "scripts" szekciót a `package.json` fájlban amint az `npm init` hozott létre neked, az alábbira:

```diff
  "scripts": {
-    "test": "echo \"Error: no test specified\" && exit 1"
+    "dev": "astro dev",
+    "build": "astro build",
+    "preview": "astro preview"
  },
}
```

A [`dev`](#start-astro) parancs elindítja az Astro Fejlesztői Szerverét a `http://localhost:3000` címen. Amikor a projekted elkészül a [`build`](#build-astro) parancs megépíti a projektedet a `dist/` mappába. [Az Astro kiépítéséről többet olvashatsz a Kiépítési útmutatónkban.](/en/guides/deploy)

### Hozd létre az első oldalad

Nyisd meg a kedvenc szöveg szerkesztődet és hozz létre egy új fájlt a projektedben:

1. Hozz létre egy új fájlt: `src/pages/index.astro`
2. Másold bele az alábbi kódrészletet (beleértve a `---` is).

```astro
---
// JS/TS kódot írhatsz a (---) blokkba,
// ez csak és kizárólag a szerveren fut!
console.log('A parancssorban láthatsz engem!')
---

<html>
  <body>
    <h1>Hello, World!</h1>
  </body>
</html>

<style lang='css||scss'>
  body{
    h1{
      color:orange;
    }
  }
</style>

<script>
 // JS kód amit ide írsz csak és kizárólag a böngészőben fut!
 console.log('A böngésző konzolban láthatsz engem!')
</script>
```

A fenti az Astro Komponens Szintaxis példája, ami egyszerre áll HTML-ből és JSX-ből.

Létrehozhatsz több oldalt az `src/pages` mappában. Az Astro a fájlok nevét fogja felhasználni hogy új oldalakat hozzon létre a weboldaladon. Például, ha létrehozol egy új fájlt az `src/pages/about.astro` címen (az előző kódrészletet felhasználva), az Astro generál neked egy új oldalt amit a `http://localhost/about` címen érsz el.

## [Astro Indítása](#start-astro)

```bash
npm run dev
```

Az Astro mostantól a `http://localhost:3000` címen futtatja az alkalmazásodat. Ha megnyitod ezt a linket a böngésződben, látnod kell az Astro "Hello, World" mintaprogramját.

Ha meg kell osztanod a helyi hálózaton, hogy hogyan halad a fejlesztés, vagy megnéznéd a mobilodról, csak add hozzá a következő opciót az `astro.config.mjs` fájlhoz:

```js
devOptions: {
  hostname: '0.0.0.0',
}
```

## [Astro Megépítése](#build-astro)

```bash
npm run build
```

Ez utasítja az Astro-t hogy építse meg az oldaladat és mentse közvetlenül a lemezre. Az alkalamzásod mostantól készen áll a `dist/` mappában.

## Következő lépések

Siker! Mostmár elkezdheted a fejlesztést!

Javasoljuk hogy fordítsd egy kis időt az Astro megismerésére. Ehhez nézd át a dokumentációnkat. Javasoljuk az alábbi linkeket

📚 Tudj meg többet az Astro projekt struktúrájáról a [Projekt Struktúra útmutatóval.](/en/core-concepts/project-structure)

📚 Tudj meg többet a komponens szintaxisról az [Astro Komponensek útmutatóval.](/en/core-concepts/astro-components)

📚 Tudj meg többet az Astro fájl-alapú átirányításáról az [Átirányítási útmutatóval.](/en/core-concepts/astro-pages)
