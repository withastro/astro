---
layout: ~/layouts/MainLayout.astro
title: Astro-Komponenten
description: Eine Einführung in die .astro-Komponenten-Syntax.
---

**Astro-Komponenten** (Dateien mit der Endung `.astro`) sind die Grundlage des Server-seitigen Templating in Astro. Du kannst dir die Astro-Komponenten-Syntax als HTML - erweitert um JavaScript - vorstellen.

Eine neue Syntax kann zu Beginn einschüchternd wirken, daher haben wir bei der Entwicklung der Astro-Komponenten-Syntax besonders darauf geachtet, dass sie sich für Web-Entwickler so vertraut wie möglich anfühlt. Sie lehnt sich sehr stark an Modelle an, die du wahrscheinlich schon kennst: Komponenten, Frontmatter, Props und JSX-Ausdrücke. Wir sind zuversichtlich, dass du mit Hilfe dieser Anleitung in kürzester Zeit Astro-Komponenten schreiben wirst, besonders wenn du bereits mit HTML & JavaScript vertraut bist.

## Syntax-Übersicht

Eine einzelne `.astro`-Datei repräsentiert eine einzelne Astro-Komponente in deinem Projekt. Dieses Modell wird als **Single-File Component (SFC)** bezeichnet. Sowohl Svelte (`.svelte`) als auch Vue (`.vue`) folgen ebenfalls diesem Modell.

Im Weiteren findest du eine eingehende Beschreibung der verschiedenen Elemente und Merkmale der Astro-Komponenten-Syntax. Du kannst sie von Anfang bis Ende durchlesen oder auch zwischen den Abschnitten springen.

### HTML-Template

Die Astro-Komponenten-Syntax ist eine Obermenge von HTML. **Wenn du HTML kennst, weißt du bereits genug, um deine erste Komponente zu schreiben.**

Zum Beispiel ist diese dreizeilige Datei eine gültige Astro-Komponente:

```html
<!-- Beispiel1.astro - statisches HTML ist eine gültige Astro-Komponente! -->
<div class="beispiel-1">
  <h1>Hallo Welt!</h1>
</div>
```

Eine Astro-Komponente repräsentiert einen Schnipsel HTML in deinem Projekt. Dies kann eine mehrfach verwendbare Komponente sein, oder eine vollständige Seite HTML einschließlich `<html>`-, `<head>`- und `<body>`-Elementen. Lies auch unsere Anleitung zu [Astro-Seiten](/core-concepts/astro-pages), um zu lernen wie du deine erste vollständige HTML-Seite mit Astro erzeugen kannst.

**Jede Astro-Komponente muss ein HTML-Template beinhalten.** Auch wenn du deine Komponente auf vielfältige Weise erweitern kannst (siehe unten), bestimmt am Ende des Tages doch das HTML-Template, wie deine gerenderte Komponente aussehen wird.

### CSS-Styles

CSS-Regeln innerhalb eines `<style>`-Tag werden spezifisch nur auf diese Komponente angewendet. Das bedeutet auch, dass du Klassennamen über unterschiedliche Komponenten hinweg wiederholt verwenden kannst, ohne auf mögliche Konflikte achten zu müssen. Styles werden mit jedem Build automatisch extrahiert und optimiert, so dass du dir über das Laden der passenden Styles keine Gedanken machen musst.

Um dabei die besten Ergebnisse zu erzielen, solltest du nicht mehr als ein `<style>`-Tag pro Astro-Komponente verwenden. Dies ist keine zwingende Beschränkung, wird aber oftmals zu einer besseren Optimierung des CSS in einem Build führen. Wenn du mit kompletten Seiten arbeitest, kann das `<style>`-Tag innerhalb des `<head>`
-Blocks stehen. In alleinstehenden Komponenten kann ein `<style>`-Tag in der oberste Ebene eines Template gesetzt werden.

```html
<!-- Astro-Komponente CSS-Beispiel -->
<style>
  .kreis {
    background-color: red;
    border-radius: 999px;
    height: 50px;
    width: 50px;
  }
</style>
<div class="kreis"></div>
```

```html
<!-- Astro-Seite CSS-Beispiel -->
<html>
  <head>
    <style>
      .kreis {
        background-color: red;
        border-radius: 999px;
        height: 50px;
        width: 50px;
      }
    </style>
  </head>
  <body>
    ...
  </body>
</html>
```

Die Verwendung von `<style global>` schaltet die ausschließlich spezifische Anwendung auf die enthaltende Komponente oder Seite für jede CSS-Regel im `<style>`-Block aus. Diese Umgehung sollte wann immer möglich vermieden werden, kann aber nützlich sein, wenn du zum Beispiel das Styling von HTML-Elementen aus einer externen Bibliothek ändern musst.

Sass (eine Alternative zu CSS) ist ebenfalls verfügbar via `<style lang="scss">`.

📚 Lies unsere vollständige Anleitung zum [Styling von Komponenten](/guides/styling), um mehr zu erfahren.

### Frontmatter-Skript

Um dynamische Komponenten zu erzeugen, bringen wir die Idee eines Frontmatter-Komponenten-Skripts ein. [Frontmatter](https://jekyllrb.com/docs/front-matter/) ist ein in Markdown übliches Muster, bei dem Konfigurations- und Metadaten innerhalb einer Code-Begrenzung (`---`) am Anfang der Datei stehen. Astro bietet etwas Vergleichbares, jedoch mit vollständiger Unterstützung für JavaScript & TypeScript innerhalb deiner Komponenten.

Bedenke dass Astro eine Server-seitige Template-Sprache ist, also wird dein Komponenten-Skript während des Build ausgeführt, aber für den Browser wird nur das HTML gerendert. Um auch JavaScript an den Browser zu senden, kannst du ein `<script>`-Tag in deinem HTML-Template verwenden - oder du [konvertierst deine Komponente für die Verwendung einer bestimmten Frontend-Bibliothek](/core-concepts/component-hydration) wie React, Svelte, Vue etc.

```astro
---
// Alles innnerhalb der `---`-Code-Begrenzung ist dein Komponenten-Skript.
// Dieser JavaScript-Code wird während des Build ausgeführt.
// Siehe weiter unten, was du damit machen kannst.
console.log('Dies hier wird mit dem Build ausgeführt - ist in der CLI-Ausgabe zu sehen');
// Tipp: TypeScript wird ebenfalls direkt unterstützt!
const thisWorks: number = 42;
---
<div class="example-1">
  <h1>Hallo Welt!</h1>
</div>
```

### Komponenten-Importe

Eine Astro-Komponente kann andere Astro-Komponenten innerhalb des eigenen HTML-Template wiederverwenden. Dies legt den Grundstein für unser Komponenten-System: Erzeuge neue Komponenten und verwende sie anschließend überall in deinem Projekt.

Um eine Astro-Komponente in deinem Projekt zu verwenden, musst du sie zunächst im Frontmatter-Komponenten-Skript importieren. Eine Astro-Komponente ist immer der Standard-Import der Datei.

Einmal importiert, kannst du sie wie jedes andere HTML-Element in deinem Template verwenden. Beachte dass eine Astro-Komponente mit einem Großbuchstaben beginnen **MUSS**. Astro nutzt dies, um zwischen nativen HTML-Elementen (`form`, `input`, etc.) und deinen eigenen Astro-Komponenten zu unterscheiden.

```astro
---
// Importiere deine Komponenten in deinem Komponenten-Skript...
import EineKomponente from './EineKomponente.astro';
---
<!-- ... und verwende sie dann in deinem HTML! -->
<div>
  <EineKomponente />
</div>
```

📚 Du kannst auch Komponenten aus anderen Frontend-Bibliotheken wie React, Svelte, Vue und anderen importieren und verwenden. Lies unsere Anleitung zu [Partial Hydration](/core-concepts/component-hydration), um mehr zu erfahren.

### Dynamische JSX-Ausdrücke

Anstatt für dynamisches Templating unsere eigene Syntax zu entwickeln, geben wir dir den direkten Zugriff auf JavaScript innerhalb deines HTML, indem wir etwas verwenden, das sich wie [JSX](https://reactjs.org/docs/introducing-jsx.html) anfühlt.

Astro-Komponenten können lokale Variablen innerhalb des Frontmatter-Skriptes definieren. Jedes Skript-Variable ist anschließend automatisch im HTML-Template darunter verfügbar.

#### Dynamische Werte

```astro
---
const name = "Dein Name hier";
---
<div>
  <h1>Hallo {name}!</h1>
</div>
```

#### Dynamische Attribute

```astro
---
const name = "Dein Name hier";
---
<div>
  <div data-name={name}>Attribut-Ausdrücke unterstützt</div>
  <div data-hint={`Verwende Template Literals, um ${"variables"} zu mischen.`}>So gut!</div>
</div>
```

#### Dynamisches HTML

```astro
---
const items = ["Hund", "Katze", "Schnabeltier"];
---
<ul>
  {items.map((item) => (
    <li>{item}</li>
  ))}
</ul>
```

### Komponenten-Eigenschaften (Props)

Eine Astro-Komponente kann Eigenschaften definieren und annehmen. Eigenschaften sind über die `Astro.props` global in deinem Frontmatter-Skript verfügbar.

```astro
---
// Beispiel: <EineKomponente greeting="(Optional) Hallo" name="Erforderlicher Name" />
const { greeting = 'Hallo', name } = Astro.props;
---
<div>
    <h1>{greeting}, {name}!</h1>
</div>
```

Du kannst deine Eigenschaften mit TypeScript definieren, indem du eine `Props`-Type-Schnittstelle exportierst. Astro wird automatisch jede exportierte `Props`-Type-Schnittstelle erfassen und Type-Warnungen/Errors für dein Projekt generieren und ausgeben.

Stelle sicher, dass du alle `import`- und `export`-Anweisungen oben in der Komponente angibst - vor jeder weiteren JavaScript- oder TypeScript-Logik!

```astro
---
// Gib `import`- und `export`-Anweisungen zuerst
// Beispiel: <EineKomponente />  (WARNUNG: "name"-Prop ist erforderlich)
export interface Props {
  name: string;
  greeting?: string;
}

// Nachdem alle `import`- und `export`-Anweisungen gemacht sind, gib den Rest der Komponenten-Logik hier an
const { greeting = 'Hallo', name } = Astro.props;
---
<div>
    <h1>{greeting}, {name}!</h1>
</div>
```

Anschließend kannst du die Komponenten-Eigenschaften folgendermaßen weiterreichen:

```astro
---
// EineAndereKomponente.astro
import EineKomponente from "./EineKomponente.astro";
let firstName = "Welt!";
---
<EineKomponente name={firstName}/>
```

### Slots

`.astro`-Dateien verwenden das [`<slot>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/slot)-Tag, um Komponenten-Zusammenstellungen zu ermöglichen. Wenn du von React oder Preact kommst, entspricht dies dem Konzept der `children`. Du kannst dir das `<slot>`-Element als einen Platzhalter für Markup vorstellen, das von außerhalb der Komponente hinzugefügt wird.

```astro
<!-- Beispiel: MeineKomponente.astro -->
<div id="meine-komponente">
  <slot /> <!-- untergeordnete Elemente landen hier -->
</div>

<!-- Verwendung -->
<MeineKomponente>
  <h1>Hallo Welt!</h1>
</MeineKomponente>
```

Beachte dass, wenn der `<slot>`-Tag in einem HTML-Template nicht verwendet wird, alle untergeordneten Elemente, die an die Komponente übergeben werden, nicht gerendert werden.

Slots werden sogar noch mächtiger, wenn **benannte Slots** verwendet werden. Anders als ein einzelnes `<slot>`-Element, das _alle_ untergeordneten Elemente rendert, erlauben benannte Slots mehrere Orte zu bestimmen, an denen untergeordnete Elemente plaziert werden sollen.

> **Beachte:** Das `slot`-Attribut ist nicht auf reines HTML beschränkt, Komponenten können `slot` ebenfalls verwenden!

```astro
<!-- Beispiel: MeineKomponente.astro -->
<div id="meine-komponente">
  <header>
    <!-- Untergeordnete Elemente mit dem `slot="header"`-Attribut landen hier -->
    <slot name="header" />
  </header>
  <main>
    <!-- Untergeordnete Elemente ohne `slot`- oder mit dem `slot="default"`-Attribut landen hier -->
    <slot />
  </main>
  <footer>
    <!-- Untergeordnete Elemente mit dem `slot="footer"`-Attribut landen hier -->
    <slot name="footer" />
  </footer>
</div>

<!-- Verwendung -->
<MeineKomponente>
  <h1 slot="header">Hallo Welt!</h1>
  <p>Lorem ipsum ...</p>
  <FooterKomponente slot="footer" />
</MeineKomponente>
```

Slots können auch **Rückfall-Platzhalter** rendern. Wenn keine passenden untergeordneten Elemente an einen `<slot>` weitergereicht werden, wird dieses `<slot>`-Element seine eigenen untergeordneten Platzhalter-Elemente rendern.

```astro
<!-- MeineKomponente.astro -->
<div id="meine-komponente">
  <slot>
    <h1>Ich werde gerendert, wenn dieser Slot keine untergeordneten Elemente hat!</h1>
  </slot>
</div>

<!-- Verwendung -->
<MeineKomponente />
```

### Fragmente & Mehrfache Elemente

Ein Astro-Komponenten-Template kann so viele Elemente in der obersten Ebene rendern, wie du willst. Anders als bei anderen UI-Komponenten-Bibliotheken musst du nicht alles mit einzelnen `<div>`-Elementen umschließen, wenn du das nicht bevorzugst.

```html
<!-- Eine Astro-Komponente kann mehrere Elemente in der obersten Ebene beinhalten: -->
<div id="a" />
<div id="b" />
<div id="c" />
```

Allerdings musst du innerhalb eines JSX-Ausdrucks mehrere Elemente immer mit einem **Fragment** umschließen. Fragmente lassen dich auf einmal mehrere Elementen rendern, ohne dem DOM zusätzliche Nodes hinzuzufügen. Dies wird bei JSX-Ausdrücken auf Grund einer Beschränkung in JavaScript vorausgesetzt: Du kannst niemals mehr als ein Element in einem JavaScript-Ausdruck oder einer JavaScript-Funktion `zurückgeben`. Die Verwendung eines Fragments löst dieses Problem.

Ein Fragment muss mit `<>` öffnen und mit `</>` schließen. Keine Sorge, wenn du es vergisst, wird dich der Astro-Kompilierer daran erinnern.

```astro
---
const items = ["Hund", "Katze", "Schnabeltier"];
---
<ul>
  {items.map((item) => (
    <>
      <li>Rot {item}</li>
      <li>Blau {item}</li>
      <li>Grün {item}</li>
    </>
  ))}
</ul>
```

### Priorisierte Skripte

Standardmäßig macht Astro keine Annahmen dazu, wie deine Skripte bereitgestellt werden sollen. Wenn du also einer Seite oder einer Komponente ein `<script>`-Tag hinzufügst, wird es nicht angerührt.

Wenn du jedoch die Skripte aus der Komponente lösen und an den Anfang der Seite verschieben und anschließend für die Veröffentlichung gebündelt haben möchtest, kannst du das mit priorisierten Skripten machen.

Ein **priorisiertes Skript** sieht so aus:

```astro
<script hoist>
  // Ein Inline-Skript
</script>
```

Oder es kann auf eine externe Skript-Datei verweisen:

```astro
<script src={Astro.resolve('./meine-komponente.js')} hoist></script>
```

Ein priorisiertes Skript kann innerhalb einer Seite oder Komponente stehen, und unabhängig davon wie oft die Komponente verwendet wird, das Skript wird nur einmal hinzugefügt:

```astro
---
import TwitterTimeline from '../components/TwitterTimeline.astro';
---

<-- Das Skript wird nur einmal in den `head`-Block eingefügt. -->
<TwitterTimeline />
<TwitterTimeline />
<TwitterTimeline />
```

## Vergleich `.astro` vs. `.jsx`

`.astro`-Dateien können im Laufe der Entwicklung `.jsx`-Dateien sehr ähnlich werden, aber es gibt einige wesentliche Unterschiede. Hier ein Vergleich beider Formate.

| Merkmal                        | Astro                                               | JSX                                                   |
| ------------------------------ | --------------------------------------------------- | ----------------------------------------------------- |
| Dateiendungen                  | `.astro`                                            | `.jsx` or `.tsx`                                      |
| Selbstdefinierte Komponenten   | `<Großschreibung>`                                  | `<Großschreibung>`                                    |
| Syntax Ausdruck                | `{}`                                                | `{}`                                                  |
| Spread-Attribute               | `{...props}`                                        | `{...props}`                                          |
| Boolsche Attribute             | `autocomplete` === `autocomplete={true}`            | `autocomplete` === `autocomplete={true}`              |
| Inline-Funktionen              | `{items.map(item => <li>{item}</li>)}`              | `{items.map(item => <li>{item}</li>)}`                |
| IDE-Unterstützung              | WIP - [VS Code][code-ext]                           | Phänomenal                                            |
| Benötigt JS-Import             | Nein                                                | Ja, (`React` oder `h`) müssen im Geltungsbereich sein |
| Fragmente                      | Autom. oberste Ebene, `<>` innerhalb von Funktionen | Einfassen mit `<Fragment>` oder `<>`                  |
| Mehrere Bibliotheken pro Datei | Ja                                                  | Nein                                                  |
| Änderungen von `<head>`        | Einfach `<head>` verwenden                          | Je nach Bibliothek (`<Head>`, `<svelte:head>`, etc.)  |
| Kommentarstil                  | `<!-- HTML -->`                                     | `{/* JavaScript */}`                                  |
| Spezielle Zeichen              | `&nbsp;`                                            | `{'\xa0'}` oder `{String.fromCharCode(160)}`          |
| Attribute                      | `dash-case`                                         | `camelCase`                                           |

## URL-Auflösung

Es ist wichtig zu verstehen, dass Astro HTML-Referenzen **nicht** transformiert. Zum Beispiel in einem `<img>`-Tag mit einem relativen `src`-Attribut in `src/pages/about.astro`:

```html
<!-- ❌ Inkorrekt: wird versuchen `/about/thumbnail.png` zu laden -->
<img src="./thumbnail.png" />
```

Da `src/pages/about.astro` als `/about/index.html` gespeichert wird, wird es dich möglicherweise überraschen, dass das Bild nach `/about/thumbnail.png` gespeichert wird. Um Konflikte zu vermeiden, wähle eine der zwei folgenden Optionen:

#### Option 1: Absolute URL

```html
<!-- ✅ Korrekt: referenziert public/thumbnail.png -->
<img src="/thumbnail.png" />
```

Der empfohlene Ansatz ist Dateien innerhalb von `public/*` zu speichern. Dies referenziert eine Datei unter `public/thumbnail.png`, welche nach dem Build zu `/thumbnail.png` aufgelöst wird (da `public/` dabei unter `/` endet).

#### Option 2: Asset-Import-Referenzen

```astro
---
//  ✅ Korrekt: referenziert src/thumbnail.png
import thumbnailSrc from './thumbnail.png';
---

<img src={thumbnailSrc} />
```

Falls du bevorzugst Assets gemeinsam mit Astro-Komponenten zu verwalten, kannst du die Datei mit JavaScript innerhalb des Komponenten-Skriptes importieren. Dies wird wie beabsichtigt funktionieren, erschwert jedoch die Referenzierung von `thumnail.png` an anderen Stellen innerhalb der Anwendung, da die finale URL nur schwer vorhersagbar ist (anders als mit Assets in `public/*`, wo sich die Adresse garantiert nie ändern wird).

[code-ext]: https://marketplace.visualstudio.com/items?itemName=astro-build.astro-vscode
