---
layout: ~/layouts/MainLayout.astro
title: Asennus
---

Astron voi asentaa parilla eri tavalla uuteen projektiin.

## Vaatimukset

- **Node.js** - `v12.20.0`, `v14.13.1`, `v16.0.0` tai uudempi.
- **Tekstieditori** - Suosittelemme [VS Codea](https://code.visualstudio.com/) yhdessä [Astro-laajennoksen](https://marketplace.visualstudio.com/items?itemName=astro-build.astro-vscode) kanssa.
- **Terminaali** - Astroa käytetään pääasiassa komentorivin kautta.

## Suositeltu asennus

`npm init astro` on helpoin tapa lisätä Astro uuteen projektiin. Komennon suorittaminen terminaalissa aloittaa `create-astro`-asennusvelhon, joka käy lävitse uuden projektin aloituksen.

```bash
mkdir <projektin-nimi>
cd <projektin-nimi>
npm init astro
```

Seuraa CLI-ohjelman ohjeistusta asentaaksesi Astron käyttäen yhtä virallisista aloitustemplaateista.

Tämän jälkeen voit siirtyä [pika-aloitusoppaaseen](/quick-start#start-your-project) saadaksesi 30:n sekunnin yhteenvedon siitä, kuinka käynnistää uusi projekti kehittämistä varten, ja kuinka luoda siitä lopullinen sivusto!

## Asentaminen itse

### Projektin valmistelu

Luo uusi tyhjä hakemisto jolla on projektisi nimi ja siirry siihen:

```bash
mkdir <projektin-nimi>
cd <projektin-nimi>
# Huomaa: korvaa <projektin-nimi> projektisi nimellä.
```

Luo uusi `package.json`-tiedosto projektille. Astro on suunniteltu toimimaan npm-ympäristössä, jota hallinnoidaan `package.json` sisältämien sääntöjen kautta. Mikäli `package.json` ei ole ennestään tuttu, niin suosittelemme tutustumaan [npm:n dokumentaatioon](https://docs.npmjs.com/creating-a-package-json-file).

```bash
# Tämä komento luo uuden package.json-tiedoston sisältäen muutaman peruskentän
npm init --yes
```

### Asenna Astro

Sinulla tulisi olla nyt hakemisto, josta löytyy yksittäinen `package.json`-tiedosto kun aiemmin mainitut toimet on tehty. Astron lisääminen projektiin on nyt mahdollista.

Käytämme `npm`:ää esimerkeissämme, mutta vaihtoehtoisesti voit myös käyttää `yarn`:ia tai `pnpm`:ää. Sikäli jos kumpikaan `yarn` tahi `pnpm` ei ole tuttu, niin suosittelemme pitäytymistä `npm`:ssä.

```bash
npm install astro
```

Voit nyt vaihtaa oletuksena toimivan "scripts"-osion `npm init`in luomassa `package.json`:ssa seuraavasti:

```diff
  "scripts": {
-    "test": "echo \"Error: no test specified\" && exit 1"
+    "start": "astro dev",
+    "build": "astro build"
  },
}
```

### Lisää ensimmäinen sivu

Avaa tekstieditori ja luo uusi tiedosto projektiin:

```astro
---
// 1. Luo uusi tiedosto <projektin-hakemisto>/src/pages/index.astro
// 2. Kopioi ja liitä tämä koko tiedosto (sisältäen `-` väliviivat) siihen.
---
<html lang="fi">
  <body>
    <h1>Moi maailma!</h1>
  </body>
</html>
```

Voit nyt lisätä uusia sivuja `src/pages`-hakemistoon Astron käyttäessä ennettua tiedostonimeä luodakseen uusia sivuja sivustolle. Jos esimerkiksi luot uuden tiedoston nimellä `src/pages/about.astro` (käyttäen edellistä koodia), niin Astro luo uuden sivun osoitteeseen `/about`.

### Seuraavat vaiheet

Näin se hoituu! Olet nyt valmis aloittamaan kehittämisen! Siirry [pika-aloitusoppaaseen](/quick-start#start-your-project) saadaksesi 30:n sekunnin läpikäynnin Astron käynnistämisestä ja projektin luomisesta sivustoksi!

📚 Opi lisää Astron projektien rakenteesta [projektin rakenneoppaassa](/core-concepts/project-structure).  
📚 Opi lisää Astron komponenttien syntaksista [Astro-komponenttien oppaassa](/core-concepts/astro-components).  
📚 Opi lisää Astron tiedostoihin pohjautuvasta reitityksestä [reititysoppaassa](core-concepts/astro-pages).
