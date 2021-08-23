---
layout: ~/layouts/MainLayout.astro
title: Pika-aloitus
lang: fi
---

```shell
# vaatimukset: varmista että Node.js on vähintään versiota 12.20.0+, 14.13.1+ tai 16+
node --version

# luo uuden projektin hakemisto ja siirry siihen
mkdir astrokokeilu && cd "$_"

# valmistaudu laukaisuun...
npm init astro

# asenna riippuvuudet
npm install

# aloita kehittäminen!
npm run dev

# kun olet valmis: luo oma staattinen sivustosi hakemistoon `dist/`
npm run build
```

Astro-sivuston käyttöönotto tuotannossa vaatii `/dist`-hakemiston (joka luodaan suorittamalla `npm run build`) sisällön siirtämisen haluamallesi palveluntarjoajalle.

[Luo lisää tästä Astron julkaisuoppaassa.](/guides/deploy)

## Projektin käynnistäminen

Siirry takaisin komentoriville ja suorita tämä komento projektin hakemistossa:

```bash
npm run dev
```

Tämän jälkeen ohjelma on käynnissä osoitteessa [http://localhost:3000](http://localhost:3000). Avaa tämä URL selaimessa nähdäksesi viestin "Moi maailma!", jonka kopioimme edellisessä vaiheessa.

Astro seuraa muutoksia `src/`-hakemiston sisällä, joten ohjelmaa ei tarvitse käynnistää uudelleen tehdessäsi muutoksia siihen koodatessasi.

## Sivuston luominen

Palaa takaisin komentoriville ja suorita tämä komento projektin hakemistossa:

```bash
npm run build
```

Tämä muodostaa projektista valmiit sivuston tiedostot ja kirjoittaa ne `dist/`-hakemistoon. Astro-sivustot ovat staattisia, joten ne voi julkaista mille tahansa palveluntarjoajalle (Vercel, Netlify, S3 bucket, jne.).
