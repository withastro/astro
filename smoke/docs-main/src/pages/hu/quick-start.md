---
layout: ~/layouts/MainLayout.astro
title: Gyors beállítás
description: A legegyszerűbb módja hogy minél hamarabb elkezdhess dolgozni az Astro-val.
---

```shell
# követelmények: ellenőrizd hogy a Node.js legalább 14.15.0+, vagy 16+ veziójú
node --version

# Csinálj egy új mappát és lépj is bele
mkdir my-astro-project && cd $_

# felszállásra készülj...
npm init astro

# függőségek telepítése
npm install

# kezdődhet a fejlesztés!
npm run dev
```

Az elkészült weboldalakhoz,

```shell
# amikor elkészültél: építsd meg a statikus oldalad a `dist/` mappába
npm run build
```

Ha többet szeretnél megtudni az Astro telepítéséről és első használatáról, kérünk [olvasd el a telepítési útmutatónkat.](/hu/installation)

Ha jobban szeretsz példák alapján tanulni, nézd meg a [komplett példa gyűjteményünket](https://github.com/withastro/astro/tree/main/examples) GitHub-on. Bármelyik minta projektet kipróbálhatod a saját számítógépeden az `npm init astro -- --template "MINTA_NÉV"` parancs használatával.

## Indítsd el a projektedet

A projekted mappájában, írd be az alábbi parancsot a terminálba:

```bash
npm run dev
```

Mostantól az Astro alkalmazásod elérhető a [http://localhost:3000](http://localhost:3000) címen. Ha megnyitod ezt a címet a böngésződben, látnod kell az Astro saját "Hello, World"-jét.

A szerver autómatikusan figyeli az `src/` mappában történő változásokat, így nem kell újraindítanod az alkalmazást ha bármit módosítasz.

## A projekted megépítése

A projekted megépítéséhez a projekt mappában futtasd le az alábbi parancsot:

```bash
npm run build
```

Ez a parancs utasítja az Astro-t hogy építse meg az oldaladat, és mentse el a háttértárolóra. Az alkalmazásod mostantól készen áll a `dist/` mappában.

## A projekted kiépítése

Az Astro oldalak statikusak, így bármelyik kedvenc szolgáltatódnál elhelyezheted őket:

- [AWS S3 bucket](https://aws.amazon.com/s3/)
- [Google Firebase](https://firebase.google.com/)
- [Netlify](https://www.netlify.com/)
- [Vercel](https://vercel.com/)
- [Tudj meg többet az Astro kiépítéséről a Kiépítési útmutatóval.](/en/guides/deploy)

## Következő lépések

Siker! Mostmár elkezdheted a fejlesztést!

Javasoljuk hogy fordítsd egy kis időt az Astro megismerésére. Ehhez nézd át a dokumentációnkat. Javasoljuk az alábbi linkeket

📚 Tudj meg többet az Astro projekt struktúrájáról a [Projekt Struktúra útmutatóval.](/en/core-concepts/project-structure)

📚 Tudj meg többet a komponens szintaxisról az [Astro Komponensek útmutatóval.](/en/core-concepts/astro-components)

📚 Tudj meg többet az Astro fájl-alapú átirányításáról az [Átirányítási útmutatóval.](/en/core-concepts/astro-pages)
