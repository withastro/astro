---
layout: ~/layouts/MainLayout.astro
title: Styling & CSS
description: Lerne Komponenten mit Astro zu gestalten.
---

Astro verfügt über eine besondere Möglichkeit, um das Schreiben von CSS so einfach wie möglich zu halten: Astro-Komponenten können über das Einfügen eines `<style>`-Tags an beliebiger Stelle gestaltet werden.

## Styles in Astro-Komponenten

Standardmäßig werden in Astro-Komponenten alle Styles nur auf Elemente im Rahmen der Komponente (genannt **Scope**) angewandt, der sie hinzugefügt wurden. Dies kann die Arbeit mit Styles erheblich erleichtern, da du dich zu jeder Zeit nur um die Gestaltung der Komponente kümmern musst, an der du arbeitest.

```html
<!-- src/components/MeineKomponente.astro -->
<style>
  /* Klassen-Selektor im Scope der Komponente */
  .text {
    font-family: cursive;
  }
  /* Element-Selektor im Scope der Komponente */
  h1 {
    color: red;
  }
</style>

<h1>Ich bin ein Style im Scope der Komponente, und ich bin rot!</h1>
<p class="text">
  Ich bin ein Style im Scope der Komponente, und ich bin kursiv!!
</p>
```

Beachte dass der `h1`-Selektor hier nicht über die Komponente hinaus wirksam wird! Die Styles werden nicht auf andere `h1`-Tags außerhalb dieses Dokuments angewandt - auch nicht in untergeordneten Komponenten.

_Tipp: Auch wenn es möglich ist hier Element-Selektoren zu verwenden, sollten doch bevorzugt Klassen-Namen verwendet werden. Das ist nicht nur ein klein wenig performanter, es ist auch leichter zu lesen, insbesondere in einem umfangreichen Dokument._

### Globale Styles

Natürlich besteht die tatsächliche Macht von CSS darin, Styles so häufig wie möglich wiederzuverwenden! Die bevorzugte Methode um globale Styles einzubinden, ist die Verwendung eines `<link>`-Tags im `<head>`-Block, ganz so wie du es gewohnt bist. Diese Methode kann in Astro auch im Zusammenhang mit dem `<style>`-Tag im Scope der Komponente angewandt werden:

```html
<!-- src/pages/index.astro -->
<head>
  <!-- Styles - geladen über src/styles/utils.css unter Verwendung von Astro.resolve() -->
  <link rel="stylesheet" type="text/css"
  href={Astro.resolve('../styles/utils.css')} />
</head>
<body>
  <!-- Styles die nur im Scope der aktuellen Seite gelten 
  (nicht für untergeordnete Seiten oder andere Komponenten) -->
  <style>
    .title {
      font-size: 32px;
      font-weight: bold;
    }
  </style>

  <!-- Die Klasse ".title" ist im Scope, aber wir können auch unsere 
  globalen Hilfsklasssen "align-center" und "margin top: 4" aus utils.css verwenden -->
  <h1 class="title align-center mt4">Seitentitel im Scope</h1>
</body>
```

_Beachte: `Astro.resolve()` ist ein nützliches Hilfsmittel, um Verweise auf Dateien von überall her aufzulösen ([docs][astro-resolve])_

#### Styling untergeordneter Elemente

Falls du Styles, die im Scope der Komponente gesetzt werden, auch auf untergeordnete Komponenten anwenden willst, kannst du auf die `:global()`-Funktion aus den [CSS-Modules][css-modules] zurückgreifen:

```astro
<!-- src/components/MeineKomponente.astro -->
---
import PostContent from './Post.astro';
---
<style>
  /* Nur im Scope der aktuellen Komponente gültig */
  h1 {
    color: red;
  }

  /* Im Scope aller Komponenten unterhalb des Elements mit der .blogpost-Klasse gültig */
  .blogpost :global(h1) {
    color: blue;
  }
</style>

<h1>Titel</h1>
<article class="blogpost">
  <PostContent />
</article>
```

Dies ist eine sehr gute Methode, um Dinge zu stylen wie Blogposts oder Dokumente, die mit Inhalten aus einem CMS außerhalb von Astro gefüttert werden. Aber Vorsicht, wenn untergeordnete Elemente frei von Abhängigkeiten gestaltet werden, bricht dies auch die Verkapselung der Komponente auf. Das Arbeiten mit Komponenten die unterschiedlich aussehen, abhängig davon ob sie ein bestimmtes übergeordnetes Element haben oder nicht, kann sehr schnell unübersichtlich werden.

#### Globale Styles innerhalb eines `<style>`-Tags

Falls du globale Styles verwenden willst, ohne einen normalen `<link>`-Tag im `<head>`-Block zu verwenden (die empfohlene Variante), gibt es dafür mit `<style global>` eine Notlösung:

```html
<style global>
  /* Wird auf alle h1-Tags der gesamten Site angewandt */
  h1 {
    font-size: 32px;
  }
</style>

<h1>Globaler Style</h1>
```

Dasselbe kannst du erreichen, indem du einem Selektor die `:global()`-Funktion voranstellst:

```html
<style>
  /* Wird auf alle h1-Tags deiner gesamten Site angewandt */
  :global(h1) {
    font-size: 32px;
  }

  /* h1-Style nur im Scope dieser Datei angewandt */
  h1 {
    color: blue;
  }
</style>
```

Es wird empfohlen diese Methoden nur dort einzusetzen, wo ein `<link>`-Tag nicht funktionieren würde. Es ist sehr schwer irrige globale Styles aufzuspüren, wenn sie verteilt auftreten und nicht in einer zentralen CSS-Datei stehen.

📚 Lies unseren vollständigen Artikel über die Syntax in [Astro-Komponenten][astro-component], um mehr über die Verwendung des `<style>`-Tags zu erfahren.

## Autoprefixer

[Autoprefixer][autoprefixer] kümmert sich für dich um Browser-übergreifende CSS-Kompatibilität. Installiere autoprefixer (`npm install --save-dev autoprefixer`) und füge eine Datei mit dem Namen `postcss.config.cjs` deinem Hauptverzeichnis hinzu:

```js
// postcss.config.cjs
module.exports = {
  plugins: [require('autoprefixer')],
};
```

_Beachte: Astro v0.21 und spätere Versionen erfordern diesen Schritt zur Einrichtung von autoprefixer. Vorherige Versionen haben dies automatisch ausgeführt._

## PostCSS

Du kannst jedes beliebige PostCSS-Plugin verwenden, indem du eine `postcss.config.cjs`-Datei deinem Hauptverzeichnis hinzufügst. Für das Setup und die Konfiguration des Plugins, das du installieren willst, folge der Dokumentation zu dem Plugin.

---

## Unterstützte Styling-Optionen

Styling in Astro sollte so flexibel sein, wie du es haben willst! Die folgenden Optionen werden unterstützt:

| Framework        | Globales CSS | Scoped CSS | CSS-Modules |
| :--------------- | :----------: | :--------: | :---------: |
| `.astro`         |      ✅      |     ✅     |    N/A¹     |
| `.jsx` \| `.tsx` |      ✅      |     ❌     |     ✅      |
| `.vue`           |      ✅      |     ✅     |     ✅      |
| `.svelte`        |      ✅      |     ✅     |     ❌      |

¹ _`.astro`-Dateien haben keine Laufzeit, daher nimmt Scoped-CSS hier den Platz von CSS-Modules ein (Styles sind im Scope der Komponenten, benötigen aber keine dynamischen Werte)_

Alle Styles in Astro werden automatisch minifiziert und gepackt, du kannst so einfach nur dein CSS schreiben - und wir machen den Rest ✨.

---

## Frameworks und Bibliotheken

### 📘 React/Preact

`.jsx`-Dateien unterstützen sowohl globales CSS als auch CSS-Modules. Um letztere zu verwenden, benutze die Erweitereung `.module.css` (oder `.module.scss`/`.module.sass` wenn du Sass einsetzt).

```js
import './global.css'; // Verwende globales CSS
import Styles from './styles.module.css'; // Verwende CSS-Modules (muss auf `.module.css`, `.module.scss`, or `.module.sass` enden!)
```

### 📗 Vue

Vue unterstützt in Astro die selben Methoden wie `vue-loader`:

- [vue-loader - Scoped-CSS][vue-scoped]
- [vue-loader - CSS-Modules][vue-css-modules]

### 📕 Svelte

Svelte funktioniert in Astro ebenfalls genauso wie gewohnt: [Svelte-Styling-Docs][svelte-style].

### 🎨 CSS-Präprozessoren (Sass, Stylus, etc.)

Astro unterstützt als CSS-Präprozessoren [Sass][sass], [Stylus][stylus] und [Less][less] mittels [Vite][vite-preprocessors]. Der jeweils gewünschte Präprozessor kann wie folgt aufgesetzt werden:

- **Sass**: Führe `npm install -D sass` aus und verwende `<style lang="scss">` oder `<style lang="sass">` (eingerückt) in `.astro`-Dateien
- **Stylus**: Führe `npm install -D stylus` aus und verwende `<style lang="styl">` oder `<style lang="stylus">` in `.astro`-Dateien
- **Less**: Führe `npm install -D less` aus und verwende `<style lang="less">` in `.astro`-Dateien

Alle oben genannten können auch innerhalb eines JS-Frameworks ausgeführt werden! Folge einfach den Modellen, die das jeweilige Framework hierfür empfielt:

- **React**/**Preact**: `import Styles from './styles.module.scss'`;
- **Vue**: `<style lang="scss">`
- **Svelte**: `<style lang="scss">`

Darüber hinaus unterstützt Astro auch [PostCSS](#-postcss), aber die Einrichtung erfolgt [etwas abweichend hiervon](#-postcss).

_Beachte: CSS unterhalb des `public/`-Verzeichnisses wird **nicht** verarbeitet! Platziere es stattdessen unterhalb des `src/`-Verzeichnisses._

### 🍃 Tailwind

Astro kann sehr einfach für die Verwendung von [Tailwind][tailwind] konfiguriert werden! Installiere die Abhängigkeiten:

```
npm install --save-dev tailwindcss
```

Und erzeuge zwei Dateien in deinem Hauptverzeichnis: `tailwind.config.cjs` und `postcss.config.cjs`:

```js
// tailwind.config.cjs
module.exports = {
  mode: 'jit',
  purge: ['./public/**/*.html', './src/**/*.{astro,js,jsx,svelte,ts,tsx,vue}'],
  // Weitere Optionen hier ...
};
```

```js
// postcss.config.cjs
module.exports = {
  plugins: [require('tailwindcss')],
};
```

Damit bist du ausgerüstet, um Tailwind einzusetzen! Der von uns empfohlene Ansatz ist, eine Datei `src/styles/global.css` (oder wie du dein globales Stylesheet bevorzugterweise nennst) mit den [Tailwind-Utilities][tailwind-utilities] darin zu erzeugen - ungefähr in dieser Form:

```css
/* src/styles/global.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Füge die Datei deiner Astro-Seite (oder deiner Layout-Komponente) hinzu:

```astro
<head>
  <link rel="stylesheet" href={Astro.resolve('../styles/global.css')}>
</head>
```

Alternativ zu einer Datei `src/styles/global.css` kannst du Tailwind-Utilities auch in einzelnen `pages/*.astro`-Komponenten in einem `<style>`-Block hinzufügen. Aber vermeide sorgfältig etwaige Dopplungen! Falls du mehrere von Tailwind verwaltete Stylesheets verwendest, stelle sicher, dass du nicht die selben CSS-Styles mehrfach in verschiedenen CSS-Dateien an die Benutzerinnen und Benutzer schickst.

#### Umziehen von v0.19

Mit der [Version 0.20.0](https://github.com/withastro/astro/releases/tag/astro%400.20.0) packt, kompiliert und prozessiert Astro keine Dateien mehr, die im Verezichnis `public/` liegen. Wir haben ursprünglich empfohlen sämtliche Tailwind-Dateien im `public`-Verzeichnis zu speichern. Falls du dein Projekt diesem Modell folgend begonnen hast, solltest du alle Tailwind-Dateien in das `src`-Verzeichnis verschieben und sie in deinem Template über [Astro.resolve()][astro-resolve] importieren:

```astro
  <link
    rel="stylesheet"
    href={Astro.resolve("../styles/global.css")}
  >
```

### 🎭 PostCSS

PostCSS zu verwenden ist so einfach wie eine [`postcss.config.cjs`](https://github.com/postcss/postcss#usage)-Datei in deinem Hauptverzeichnis zu erzeugen.

Beachte, dass dieses Plugin sämtliches CSS in deinem Projekt verarbeitet, einschließlich jeglicher Dateien die nach CSS kompiliert wurden (wie zum Beispiel `.scss`-Sass-Dateien).

_Beachte: CSS unterhalb des `public/`-Verzeichnisses **wird nicht verarbeitet!** Platziere es stattdessen unterhalb des `src/`-Verzeichnisses, wenn PostCSS es vearbeiten soll._

## Bündeln

Sämtliches CSS wird minifiziert und automatisch gebündelt, wenn du `astro build` ausführst. Ohne zu sehr in die Tiefe zu gehen, die grundlgenden Regeln lauten wie folgt:

- Wenn ein Style nur innerhalb einer Route auftaucht, wird er nur für diese Route geladen (`/_astro/[page]-[hash].css`)
- Wenn ein Style innerhalb mehrerer Routen auftaucht, wird er in einem `/_astro/common-[hash].css`-Bündel zusammengefasst
- Sämtliche Styles erhalten ihre Hashes in Bezug auf die Inhalte, für die sie gelten (das bedeutet, die Hashes ändern sich nur, wenn die Inhalte sich ändern)

Wir werden unsere Styling-Optimierungen im Laufe der Zeit stetig weiterentwickeln und würden gerne euer Feedback dazu hören! Falls `astro build` unerwartete Styles generiert, oder wenn du Vorschläge zur Verbesserung hast, [eröffne bitte ein Issue][issues].

_Beachte: Wenn einige Seiten-Styles gemeinsam gebündelt werden und andere Seiten-Styles auf die Seite bezogen bleiben, entwickeln sich hieraus meistens keine Probleme. Aber wenn Teile deiner Styles gebündelt werden, könnten sie \_technisch_ auch in einer anderen Reihenfolge laden, als von dir in deiner Kaskade intendiert. Auch wenn dieses Problem nicht nur Astro zu eigen ist - es besteht potentiell bei so ziemlich jedem Bündelungsprozess - so kann es dich doch unerwartet treffen, wenn du diese Möglichkeit nicht von vorne herein in Betracht ziehst. Stelle sicher, dass du deinen abschließenden Build eingehend diesbezüglich inspizierst - und [melde bitte auftretende Probleme][issues], auf die du stößt.\_

## Fortgeschrittene Styling-Architektur

Zu viele Entwicklungsumgebungen legen die Hände in den Schoß, wen es um CSS geht - oder sie warten im besten Fall mit erfundenen Beispielen auf, die dich nicht wirklich weiter bringen. Entwicklern zu sagen "Verwende einfach die Styling-Lösung, die dir gefällt!", ist ein netter Ansatz, der sich in der Praxis nicht bewährt. Nur sehr wenige Styling-Lösungen taugen für wirklich jedes Setup. Mit Astro verhält es sich in dieser Hinsicht nicht anders - manche Ansätze _werden_ besser funktionieren als andere.

Ein Beispiel, um dies zu bebildern: Astro entfernt JS welches zur Laufzeit ausgeführt wird (sogar das eigentliche Framework wenn möglich). Somit wäre es eine schlechte Idee für sämtliche Styles auf gestylte JS-Elemente zu setzen, da dann React auch auf Seiten geladen werden müsste, wo es eigentlich nicht gebraucht wird. Oder du erzeugst mit dem Laden einen "[FOUC][fouc]", wenn dein statisches HTML geladen wird, aber der Browser noch darauf wartet, dass JavaScript vollständig heruntergeladen und ausgeführt wird. Oder stelle dir ein weiteres Beispiel am anderen Ende des Spektrums vor: _BEM_. Du kannst in Astro einen vollständig entkoppelten [BEM][bem]- oder [SMACSS][smacss]-Ansatz verfolgen. Doch das bedeutet eine große Menge manueller Wartung, die du vermeiden könntest - und es lässt dich vieles von dem Komfort verpassen, den dir [Astro-Komponenten](/de/core-concepts/astro-components) bieten können.

Wir denken, es gibt einen Mittelweg zwischen intuitivem, aber langsamem CSS-in-JS und schnellem, aber mühseligem globalem CSS: **Hybrides Scoped-CSS + Utility-CSS**. Dieser Ansatz funktioniert gut in Astro, ist performant für die Nutzerinnen und Nutzer und ist entsprechend die wohl beste Styling-Lösung in Astro für _die meisten Leute_ (vorausgesetzt du bist bereit dich damit auseinanderzusetzen). Eine kurze Übersicht:

**Dieser Ansatz ist gut für…**

- Entwickler und Entwicklerinnen die etwas Neues bezüglich Styling ausprobieren wollen
- Entwickler und Entwicklerinnen die ein paar dogmatische Annahmen bezüglich der CSS-Architektur zu schätzen wissen

**Dieser Ansatz ist _NICHT_ gut für…**

- Entwickler und Entwicklerinnen die bereits selbst starke dogmatische Annahmen bezüglich des Styling haben - und alles selbst kontrollieren wollen

Lies weiter, wenn du nach ein paar dogmatischen Annahmen suchst 🙂. Wir werden den Ansatz beschreiben, indem wir ein paar Grundregeln festlegen, die dich anleiten sollen deine Styles zu definieren:

### Hybrides Scoped-CSS + Utility-CSS

#### Scoped Styles

Du benötigst keine Erläuterung zu Komponenten-basiertem Design. Dir ist bereits klar, dass die Wiederverwendung von Komponenten eine gute Idee ist. Und es war diese Idee, die die Leute dazu brachte sich an Konzepte wie [gestylte Komponenten][styled-components] und [gestyltes JSX][styled-jsx] zu gewöhnen. Aber anstatt deine Nutzerinnen und Nutzer mit den langen Ladezeiten von CSS-in-JS zu belasten, kannst du mit Astro etwas Besseres einsetzen: **eingebaute Styles im Scope der Komponente**.

```astro
---
// src/components/Button.astro -->
---
<style lang="scss">
  /* ✅ Lokal im Scope! */
  .btn {
    padding: 0.5em 1em;
    border-radius: 3px;
    font-weight: 700;
  }
</style>
<button type="button" class="btn">
  <slot></slot>
</button>
```

_Beachte: Wir verwenden hier in sämtlichen Beispielen `lang="scss"`, welches das Verschachteln und Teilen von [Farben und Variablen][sass-use] stark vereinfacht. Dies ist jedoch gänzlich optional, und du kannst ebenso gut normales CSS verwenden._

Die `.btn`-Klasse ist auf die Komponente begrenzt und wird nicht über das Dokument hinaus wirksam. Dies bedeutet, du kannst dich **auf das Styling und musst dich nicht auf die Benennung konzentrieren**. Dieser Ansatz, der das Lokale an den Anfang stellt, fügt sich sehr gut in das ESM-getriebene Design von Astro, das Einkapselung und Wiederverwendbarkeit über eine globale Wirksamkeit stellt. Auch wenn es sich um ein einfaches Beispiel handelt, sollte festgehalten werden, dass dies **extrem gut skaliert**. Und für den Fall, dass du gemeinsame Werte zwischen Komponenten teilen willst, empfehlen wir das [Sass-Modulsystem][sass-use], das sehr einfach zu verwenden ist und sich perfekt in ein Design einfügt, in dem die Komponente an den Anfang gestellt wird.

Im Kontrast zu diesem Ansatz erlaubt Astro auch globale Styles mittels der `:global()` und `<style global>`-Notlösungen. Es sollte jedoch soweit möglich vermieden werden sie einzusetzen. Ein einfaches Beispiel: Nehmen wir an, du hast deinen Button in einer `<Nav />`-Komponente verwendet und willst ihn dort anders gestalten. Du könntest versucht sein, das folgendermaßen zu probieren:

```astro
---
// src/components/Nav.astro
import Button from './Button.astro';
---

<style lang="scss">
  .nav :global(.btn) {
    /* ❌ Dies wird einen Konflikt mit <Button>-Styles erzeugen */
  }
</style>

<nav class="nav">
  <Button>Menü</Button>
</nav>
```

Dies ist allerdings nicht erstrebenswert, da nun `<Nav>` und `<Button>` bei der endgültigen Gestaltung des Buttons konkurrieren. Sobald du jetzt den einen veränderst, musst du auch den anderen anpassen, und sie sind nicht mehr wirklich isoliert, so wie zuvor (sie sind nun verbunden in bidirektionaler Abhängigkeit). Es ist sehr leicht sich vorzustellen, dass dieses Modell nur ein paar mal wiederholt werden muss, bis die Befürchtung aufkommt, dass jede Veränderung von Styles _irgendwo_ das Styling in einem ganz anderem Teil der Anwendung kaputt macht.

Stattdessen kannst du `<Button>` seine eigenen Styles kontrollieren lassen und es mit einer Prop versuchen:

```astro
---
// src/components/Button.astro
const { theme } = Astro.props;
---
<style lang="scss">
  .btn {
    /* ✅  <Button> hat nun wieder die Kontrolle über das Styling! */
    [data-theme='nav'] {
      // nav-friendly styles here…
    }
  }
</style>

<button type="button" data-theme={theme}>
  <slot></slot>
</button>
```

An anderer Stelle kannst du nun `<Button theme="nav">` verwenden, um zu bestimmen, welche Art von Button es ist. Dies bewahrt den Vertrag, in dem steht, dass _Button sich um seine Styles kümmert und Nav sich um seine_. Und du kannst den einen bearbeiten ohne den anderen zu beeinflussen. Der schlimmstmögliche Fall bei der Verwendung globaler Styles ist, dass eine Komponente kaputt und nicht mehr nutzbar ist (ihr fehlen wesentliche Teile ihrer Styles). Aber der schlimmstmögliche Fall bei der Verwendung von Props (z. B. bei einem Tippfehler) ist, dass die Komponente zurückgesetzt wird auf ihren ursprünglichen, aber immer noch nutzbaren, Zustand.

💁 **Warum dies mit Astro gut funktioniert**. Astro ist im Wesentlichen von JavaScript-Modulen inspiriert: Du musst zu jeder Zeit nur wissen, was sich in deiner Datei befindet, und du musst dir niemals Gedanken darüber machen, welches Element aus einer anderen Datei Einfluss darauf hat, wie der Code ausgeführt wird. Aber wir sind damit nicht allein; Vue und Svelte haben beide die Idee vorangetrieben und popularisiert, dass Markup und Styles in ein und derselben Komponenten-Datei gut zusammenpassen. [Du kannst verschiedene Belange immer noch gut voneinander trennen][peace-on-css], sogar wenn Markup, Styles und Logik in einer Datei enthalten sind. Und tatsächlich ist es genau das, was Komponeten-Design so mächtig macht! Du kannst also einfach CSS schreiben ohne fürchten zu müssen, dass du einen Namen verwendest, der bereits von einer anderen Komponente in der App verwendet wird.

#### Utility-CSS

Vor Kurzem gab es eine Debatte über die ausschließliche Verwendung von Komponenten-Styles im Scope vs. die ausschließliche Verwendung von Utility-CSS. Aber wir stimmen Leuten wie Sarah Dayan zu, die fragen, [warum können wir nicht beides haben][utility-css]? Tatsache ist doch, dass während es großartig ist, Styles im Scope der Komponente zu haben, es immer noch hunderte von Male vorkommt, dass wenn die Website vollständig zusammengesetzt ist, zwei Elemente nicht _gut_ zusammenspielen und eines von beiden einen kleinen Stupser braucht. Oder es wird vielleicht eine abweichende Behandlung eines Textes in einer Komponenten-Instanz benötigt.

Zwar ist die Vorstellung von perfekten, makellosen Komponenten schön, aber sie ist auch unrealistisch. Kein Design-System ist absolut perfekt, und jedes Design-System zeigt auch Ungereimtheiten. Und es passiert bei dem Versuch diese Ungereimtheiten aufzulösen, dass Komponenten ohne Utility-CSS durcheinander geraten. Utility-CSS ist großartig darin kleinere Optimierungen hinzuzufügen, um die Website fertigzustellen und ausliefern zu können. Aber es ist an sich auch unvollständig auf ganz eigene Art - wenn du z. B. jemals versuchst responsive Styles oder Fokussierungen mit Utility-CSS zu verwalten, kann das schnell zu einem großen Durcheinander werden!  
**Utility-CSS funktioniert am besten in Partnerschaft mit Styles im Scope der Komponente**. Und um so leicht wie möglich anwendbar zu sein, sollte Utility-CSS global sein (und sollte möglicherweise auch das einzige globale CSS sein - vielleicht neben reset.css), so dass du nicht mit Importen arbeiten musst, die allesamt willkürlich sind.

Einige größere Probleme, die am besten mit Utility-CSS gelöst werden, sind:

- [margin](https://github.com/drwpow/sass-utils#-margin--padding)
- [padding](https://github.com/drwpow/sass-utils#-margin--padding)
- [text- und background-color](https://github.com/drwpow/sass-utils#-color)
- [font-size und font-family](https://github.com/drwpow/sass-utils#%F0%9F%85%B0%EF%B8%8F-font--text)
- [Standardelement-Styling](https://github.com/kognise/water.css)

In Astro empfehlen wir folgendes Setup hierfür:

```html
<head>
  <link rel="stylesheet" href={Astro.resolve("../styles/global.css")} >
</head>
```

Und in deinem lokalen Dateisystem kannst du natürlich auch Sass' [@use][sass-use] verwenden, um Dateien umstandslos miteinander zu kombinieren:

```
├── src/
│   └── styles/
│       ├── _base.scss
│       ├── _tokens.scss
│       ├── _typography.scss
│       ├── _utils.scss
│       └── global.scss
```

Was in jeder dieser Dateien stehen sollte, musst du selbst bestimmen, aber es lohnt sich, klein anzufangen. Füge Utilities immer erst hinzu, sobald du sie benötigst, und du wirst dein CSS-Gewicht unglaublich gering halten können. Und Utilities die du selbst geschrieben hast, um deinen realen Bedarf zu erfüllen, werden immer besser sein als etwas aus dem Regal.

Zusammengefasst kannst du dir Styles im Scope der Komponente als das Rückgrat deiner gesamten Styles vorstellen, was etwa 80% ausmacht - und die fehlenden 20% füllen CSS-Utilities. Beide funktionieren gut im Tandem und gleichen gegenseitig ihre Schwächen aus.

💁 **Warum dies in Astro gut funktioniert**: Astro wurde um die Idee von **"Scoped-CSS und globales Utility-CSS leben harmonisch zusammen** ♥️!" herum entwickelt. Nutze das so gut du kannst.

### Weitere Vorschläge

"Aber halt!", wirst du vielleicht sagen, nachdem du den vorherigen Abschnitt gelesen hast. "Das berücksichtigt nicht [meinen Anwendungsfall]!" Wenn du nach weiteren Ratschlägen zu einigen gängigen Styling-Problemen suchst, könnten dich die folgenden Vorschläge ineteressieren. Sie stehen alle miteinander in Verbindung und passen zu der Philosophie von **Hybrides Scoped-CSS + Utility-CSS**.

1. Unterteile deine App in Layout-Komponenten und Basis-Komponenten
2. Vermeide Flexbox- und Grid-Bibliotheken (schreibe deine eigenen!)
3. Vermeide die Verwendung von `margin` in Wrappern für Komponenten
4. Vermeide globale Media-Queries

#### Vorschlag #1: Unterteile deine App in Layout-Komponenten und Basis-Komponenten

Sicher wird diese Anleitung niemals lang genug sein, um die Frage zu beantworten _"Wie sollte eine Seite aufgebaut sein?"_ (das ist ein [Design-Problem!][cassie-evans-css]).
Und doch liegt darin versteckt auch eine etwas spezifischere Frage, die wir beantworten _können_: _"Ein bestimmtes Layout angenommen - wie sollten Komponenten und Styles darin organisiert sein?"_ Die Antwort ist, **brenne niemals das Layout in Komponenten ein**. Erzeuge Layout-Komponenten, die das Layout bestimmen, und Basis-Komponenten (Buttons, Karten etc.) die nicht das Layout bestimmen. _Was bedeutet das?_ Gehen wir das an einem Beispiel durch, damit es klarer wird. Angenommen wir haben eine Seite, die folgendermaßen aussieht (die Zahlen stehen für unterschiedliche Komponenten):

```
|---------------|
|       1       |
|-------+-------|
|   2   |   2   |
|---+---|---+---|
| 3 | 3 | 3 | 3 |
|---+---+---+---|
| 3 | 3 | 3 | 3 |
|---+---+---+---|
```

Das Layout besteht aus einem riesig großen Post über die gesamte Breite, gefolgt von Posts mit halber Breite darunter. Und darunter wollen wir einen Haufen kleinerer Posts, die den Rest der Seite auffüllen. Der Einfachheit halber nennen wir sie `<RiesenPost>` (1), `<HalbePosts>` (2), und `<KleinePosts>` (3). Wir fügen sie wie folgt unserer Seite hinzu:

```astro
---
// src/pages/index.astro

import Nav from '../components/Nav.astro';
import RiesenPost from '../components/RiesenPost.astro';
import Grid from '../components/Grid.astro';
import HalbePosts from '../components/HalberPost.astro';
import KleinePosts from '../components/KleinerPost.astro';
import Footer from '../components/Footer.astro';
---
<html>
  <body>
    <Nav />

    <Grid>
      <RiesenPost />
      <HalbePosts />
      <KleinePosts />
    </Grid>

    <Footer />
  </body>
</html>
```

Das ist _anscheinend_ sauber voneinander getrennt, aber der Schein kann trügen. Auf den ersten Blick nehmen wir vielleicht an, dass `<Grid>` das Layout kontrolliert, aber dieser Eindruck täuscht. Tatsächlich bestimmt `<RiesenPost>` seine Breite selbst, `<HalbePosts>` lädt zwei Komponenten und bestimmt die eigene Breite, und `<KleinePosts>` lädt vier oder mehr Komponenten und bestimmt seine eigene Breite. Insgesamt - `<Grid>` eingeschlossen - streiten sich **vier Komponenten** um dasselbe Layout. Entferne einen Post von `<HalbePosts>` und das Layout zerbricht. Bearbeite `<RiesenPost>`, das Layout zerbricht. Bearbeite `<Grid>`, das Layout zerbricht. Wenn du es dir genau überlegst, ist keine dieser Komponenten wirklich wiederverwendbar - sie könnten auch einfach in einer einzigen großen Datei stehen.

Das ist tatsächlich das **Problem mit globalem CSS** in hübscher Verkleidung - mehrere Komponenten kämpfen darum, wie sie angeordnet werden, ohne dass es ein Layout in zentraler Verantwortung gibt (in der Art wie globales CSS)! Nun, da wir das Problem identifiziert haben, bestünde eine Möglichkeit es zu lösen darin, das gesamte Layout auf die oberste Ebene zu heben und dort ebenfalls alle Komponenten zu laden:

```astro
---
// src/pages/index.astro

import Nav from '../components/Nav.astro';
import RiesenPost from '../components/RiesenPost.astro';
import HalbePosts from '../components/HalberPost.astro';
import KleinePosts from '../components/KleinerPost.astro';
import Footer from '../components/Footer.astro';
---

<html>
  <head>
    <style lang="scss">
      .wrapper {
        max-width: 60rem;
        margin-right: auto;
        margin-left: auto;
        padding-right: 2rem;
        padding-left: 2rem;
      }

      .grid {
        display: grid;
        grid-gap: 1.5rem;
        grid-template columns: 1fr 1fr 1fr 1fr;
      }

      .riesen-post {
        grid-column: span 4;
      }

      .halber-post {
        grid-column: span 2;
      }

      .kleiner-post {
        grid-column: span 1;
      }
    </style>
  </head>
  <body>
    <Nav />

    <div class="wrapper">
      <div class="grid">
        <div class="riesen-post"><RiesenPost postId={12345} /></div>

        <div class="halber-post"><HalberPost postId={12345} /></div>
        <div class="halber-post"><HalberPost postId={12345} /></div>

        <div class="kleiner-post"><KleinerPost postId={12345} /></div>
        <div class="kleiner-post"><KleinerPost postId={12345} /></div>
        <div class="kleiner-post"><KleinerPost postId={12345} /></div>
        <div class="kleiner-post"><KleinerPost postId={12345} /></div>
        <div class="kleiner-post"><KleinerPost postId={12345} /></div>
        <div class="kleiner-post"><KleinerPost postId={12345} /></div>
        <div class="kleiner-post"><KleinerPost postId={12345} /></div>
        <div class="kleiner-post"><KleinerPost postId={12345} /></div>
      </div>
    </div>

    <Footer />
  </body>
</html>
```

Einmal davon abgesehen, dass das mehr Code ist, bedeutet es tatsächlich eine viel klarere Trennung. Was zuvor ein 4-Komponenten-Layout war, wird nun zu 100% innerhalb der `index.astro`-Datei auf der obersten Ebene verwaltet (welche wir nun als **Layout-Komponente** betrachten - und wenn wir es weiterverwenden wollten, könnten wir es auch in eine eigene Datei extrahieren). Dein Layout ist jetzt zentralisiert, und die Komponenten sind nun wirklich wiederverwendbar, da es ihnen komplett egal ist, ob sie sich mit den anderen im selben Grid befinden oder nicht. Du kannst in jeder dieser Dateien die Styles bearbeiten ohne Gefahr zu laufen, dadurch Styles in anderen zu stören.

Die Grundregel beim Arrangieren mehrerer Komponenten lautet, **es handelt sich um eine besondere Verantwortung**, die an einem zentralen Ort wahrgenommen werden sollte, anstatt über vier Komponenten hinweg, wie wir es angelegt hatten. Und tatsächlich sind Seiten auf der obersten Ebene sehr gut darin und sie sollten dir stets als Ausgangspunkt für deine Layout-Komponenten dienen. Probiere aus, wie weit du damit kommst, und extrahiere nur dann Layout-Komponenten hieraus, wenn es absolut notwendig ist.

Zusammengefasst: **Wenn du mehrere Dateien anfassen musst, um dein Layout zu ändern, solltest du vielleicht alles gmeinsam in einer einzelnen Layout-Komponente neu organisieren.**

💁 **Warum das in Astro gut funktioniert**: In Astro kann alles eine `.astro`-Komponente sein, und du bekommst niemals Performance-Probleme, gleichgültig wieviele Komponenten du hinzufügst. Aber der größte Vorteil beim Einsatz von [Layout-Isolierung][layout-isolated] besteht in den Einsparungen bei der Menge an CSS, die du benötigst.

#### Vorschlag #2: Vermeide Flexbox- und Grid-Bibliotheken (schreibe deine eigenen!)

Es mag sich sehr übergriffig anfühlen, wenn dir gesagt wird, du solltest deine geliebte Layout-Bibliothek, mit der du gut vertraut bist, nicht verwenden. Immerhin hat sie dich bis hierher gebracht! Aber die Zeiten von [Float-Madness](https://zellwk.com/blog/responsive-grid-system/) sind vorbei, ersetzt durch Flexbox und Grid - und um die zu verwalten brauchen wir keine Bibliotheken (Bibliotheken können die Aufgabe sogar erschweren).

Viele Front-End-Entwicklerinnen und -Entwickler kennen den folgenden Gedankengang:

1. Ich sollte soviel CSS wie möglich mehrfach verwenden (_gut!_)
2. Viele Seiten verwenden dasselbe Layout (_hmm?_)
3. Ich könnte eine bereits bestehende Lösung einsetzen, um meine gesamten Layout-Duplikate zu verwalten (_Moment mal!_)

Während die Logik in sich stimmig ist, ist es in Wirklichkeit doch so, dass #2 nur selten auf ein Projekt zutrifft. Möglicherweise wurden viele Teile der Website nicht entwickelt, um in diese netten, gepflegten 12-Säulen-Raster einer Bibliothek zu passen. Sogar relativ bescheidene Websites können _hunderte_ Layouts enthalten, wenn du sämtliche Breakpoints mit einrechnest. Frage dich einmal selbst: _Wenn die Website, die ich baue, wirklich soviele unterschiedliche Layouts beinhaltet, warum verwende ich dann eine schwergewichtige Grid-Bibliothek, die mir nur generische Layouts ermöglicht?_

Ein paar gut geschriebene Zeilen CSS-Grid hier und da werden sich perfekt an jede Situation anpassen; das Ganze ist höchstwahrscheinlich leichtgewichtiger und einfacher zu verwalten, als die schwergewichtige Bibliothek, mit der du doch so lange gekämpft hast. Anders herum betrachtet: Wenn du schon einige Stunden benötigst, um eine proprietäre Styling-Bibliothek zu lernen, dich mit ihr auseinanderzusetzen, Probleme zu melden etc., wäre es nicht besser diese Zeit darauf zu verwenden den Umgang mit Flexbox und Grid zu erlernen? Viele Leute brauchen nur eine Stunde, um die Grundlagen ausreichend zu verstehen - und damit kommt man schon ziemlich weit! Es gibt großartige kostenlose Lernmöglichkeiten, in die du deine Zeit investieren kannnst:

- [Flexbox Froggy](https://flexboxfroggy.com/)
- [CSS Grid Garden](https://cssgridgarden.com/)

Kurz gesagt: Hör auf Layouts zu vereinfachen, wenn da nichts zu vereinfachen ist! Du wirst sehen, dass nicht nur deine Styles leichter zu organisieren, sondern dein CSS auch leichter und die Ladezeiten kürzer sind.

💁 **Warum das in Astro gut funktioniert**: Grid-Bibliotheken sind ein einfacher und schneller Weg, um Stylesheets aufzublähen - und damit auch ein wesentlicher Beitrag zum Gebrauch von [Treeshaking][css-treeshaking], um überflüssige Styles wieder loszuwerden. Astro verwendet **kein** Treeshaking, um ungenutztes CSS für dich zu entfernen, da dies zu [Problemen][css-treeshaking] führen kann. Wir sagen nicht, dass du vollständig ohne Bibliotheken arbeiten sollst; wir sind große Fans von einigen Bibliotheken, wie zum Beispiel [Material UI][material-ui]. Aber wenn du zumindest die abertausende Layouts, die du nicht verwendest, aus deiner Bibliothek entfernen kannst, musst du später möglicherweise auch kein automatisches Treeshaking einsetzen.

#### Vorschlag #3: Vermeide die Verwendung von `margin` in Wrappern für Komponenten

Anders ausgedrückt, tu Folgendes nicht:

```astro
<!-- src/components/MeineKomponente.astro -->
<style lang="scss">
  .wrapper {
    /* ❌ Tu das nicht! */
    margin-top: 3rem;
  }
</style>

<div class="wrapper"></div>
```

Wenn du dir das [CSS-Box-Model][box-model] vor Augen führst, dehnt sich darin `margin` stets über die Grenzen einer Box hinweg aus. Das bedeutet, wenn du `margin` auf das äußerste Element deiner Komponente anwendest, wird dies die Position angrenzender Komponenten beeinflussen. Selbst wenn die Styles im Scope der Komponete sind, betreffen sie _technisch_ auch Elemente um die Komponente herum - somit bricht dies mit dem [Konzept der Einschließung von Styles][layout-isolated].

Wenn du Komponenten verwendest, die sich neu arrangieren oder anders dargestellt werden, sobald sie sich in der Nähe anderer Komponenten befinden, bedeutet dies einen Kampf, den du nur schwer gewinnen kannst. **Komponenten sollten sich identisch verhalten und aussehen, unabhängig davon wo sie platziert werden.** Das ist es, was sie zu Komponenten macht!

💁 **Warum das in Astro gut funktioniert**: `margins` die andere Komponenten herumschubsen, unterwandern deine Styling-Architektur auf heimtückische Weise, und das kann zu wackeligen oder brüchigen Layout-Komponenten führen. Solche Dinge grundsätzlich zu vermeiden, erlaubt dir deine Layout-Komponenten einfach zu halten - und du wirst weniger Zeit mit Styling zubringen.

#### Vorschlag #4: Vermeide globale Media-Queries

Dieser letzte Punkt behandelt eine natürliche Beschränkung von **Styles im Scope**. Und diese bezieht sich auch auf Breakpoints! Du kennst diesen einen, seltsamen Breakpoint, bei dem deine `<Card />`-Komponente bei einer bestimmten Größe ungünstig umbricht? Du solltest dieses Problem innerhalb von `<Card />` lösen, und nicht _irgendwo_ anders.

Selbst wenn du am Ende einen willkürlichen Wert wie `@media (min-width: 732px)` verwendest, wird das wahrscheinlich besser funktionieren, als es irgendwo mit einer _globalen_ [magischen Zahl][magic-number] zu probieren, die aber doch nur _in einem einzigen Kontext_ angewandt wird (eine willkürliche Zahl mag für den Rest der Anwendung "rätselhaft" sein, aber sie hat immer noch eine "konkrete" Bedeutung im Kontext einer Komponente, die diesen Wert benötigt).

Zugegeben, diese Art von Konflikt vollständig zu lösen war bisher nahezu unmöglich; glücklicherweise gibt es inzwischen wachsende [Unterstützung für Container-Queries!][container-queries].

Ein weiterer Anlass zur Beschwerde bei diesem Ansatz liegt in der Frage, "_Was ist aber, wenn ich zwei Komponenten habe, die dasselbe am selben Breakpoint tun?_", worauf ich antworten würde: Ein oder zwei solcher Punkte wird es immer geben; behandle sie einfach wie _Sonderfälle_. Wenn aber deine gesamte Anwendung aus Dutzenden solcher Fälle besteht, solltest du versuchen die Unterteilung deiner Komponenten so zu verändern, dass sie grundsätzlich deine [Layout-Isolierung][layout-isolated] besser unterstützen.

💁 **Warum das in Astro gut funktioniert**: Dies ist wahrscheinlich der am wenigsten wichtige Punkt, weshalb er auch am Ende steht. Tatsächlich kannst du ihn auch überspringen, wenn er so für dich keine Rolle spielt. Aber es handelt sich um etwas, dem Leute versuchen in größerem Umfang Rechnung zu tragen - und dafür ein _globales_ System zu verwenden kann auch vollkommen unnötig sein. Versuche einmal _nicht_ auf globale Media-Queries ausgerichtet zu entwickeln - und schau wie weit du damit kommst!

### 👓 Weitere Lektüre

Diese Anleitung wäre nicht möglich ohne die folgenden Blogposts, die auf diese Themen eingehen und sie vertiefend erklären. Bitte lies sie - es lohnt sich!

- [**Layout-isolated Components**][layout-isolated] von Emil Sjölander
- [**In defense of utility-first CSS**][utility-css] von Sarah Dayan

Wirf bitte auch einen Blick auf das [Stylelint][stylelint]-Projekt, mit dem du deine Styles in Form bringen kannst. Du bringst dein JS in Form, warum nicht auch dein CSS?

[autoprefixer]: https://github.com/postcss/autoprefixer
[astro-component]: /de/core-concepts/astro-components#css-styles
[astro-resolve]: /reference/api-reference#astroresolve
[bem]: http://getbem.com/introduction/
[box-model]: https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/The_box_model
[browserslist]: https://github.com/browserslist/browserslist
[browserslist-defaults]: https://github.com/browserslist/browserslist#queries
[cassie-evans-css]: https://twitter.com/cassiecodes/status/1392756828786790400?s=20
[container-queries]: https://ishadeed.com/article/say-hello-to-css-container-queries/
[css-modules]: https://github.com/css-modules/css-modules
[css-treeshaking]: https://css-tricks.com/how-do-you-remove-unused-css-from-a-site/
[fouc]: https://en.wikipedia.org/wiki/Flash_of_unstyled_content
[layout-isolated]: https://web.archive.org/web/20210227162315/https://visly.app/blogposts/layout-isolated-components
[less]: https://lesscss.org/
[issues]: https://github.com/withastro/astro/issues
[magic-number]: https://css-tricks.com/magic-numbers-in-css/
[material-ui]: https://material.io/components
[peace-on-css]: https://didoo.medium.com/let-there-be-peace-on-css-8b26829f1be0
[sass]: https://sass-lang.com/
[sass-use]: https://sass-lang.com/documentation/at-rules/use
[smacss]: http://smacss.com/
[styled-components]: https://styled-components.com/
[stylus]: https://stylus-lang.com/
[styled-jsx]: https://github.com/vercel/styled-jsx
[stylelint]: https://stylelint.io/
[svelte-style]: https://svelte.dev/docs#style
[tailwind]: https://tailwindcss.com
[tailwind-utilities]: https://tailwindcss.com/docs/adding-new-utilities#using-css
[utility-css]: https://frontstuff.io/in-defense-of-utility-first-css
[vite-preprocessors]: https://vitejs.dev/guide/features.html#css-pre-processors
[vue-css-modules]: https://vue-loader.vuejs.org/guide/css-modules.html
[vue-scoped]: https://vue-loader.vuejs.org/guide/scoped-css.html
