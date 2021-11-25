---
layout: ~/layouts/MainLayout.astro
title: Partial Hydration in Astro
description: Lerne wie Partial Hydration unter Verwendung der "Insel-Architektur" in Astro funktioniert.
---

**Astro generiert jede Website standardmäßig mit Null Client-seitigem JavaScript.** Verwende irgendeine Frontend-UI-Bibliothek, die dir gefällt (React, Svelte, Vue etc.), und Astro wird deine Arbeit im Build-Prozess automatisch als HTML rendern und sämtliches JavaScript entfernen. Dies führt dazu, dass jede Seite standardmäßig schnell lädt.

Doch manchmal wird Client-seitiges JavaScript zwingend benötigt. Diese Anleitung zeigt, wie interaktive Komponenten in Astro funktionieren - unter Verwendung einer Technik die Partial Hydration (Partielle Anreicherung) genannt wird.

```astro
---
// Beispiel: Eine React-Komponente importieren und anschließend verwenden.
// Standardmäßig rendert Astro die Komponente als HTML und CSS während deines Build
// - ohne Client-seitiges JavaScript.
// (Du brauchst Client-seitiges JavaScript? Lies weiter...)
import MeineReactKomponente from '../components/MeineReactKomponente.jsx';
---
<!-- 100% HTML, Null JavaScript! -->
<MeineReactKomponente />
```

## Konzept: Partial Hydration

Es gibt viele Fälle in denen du eine interaktive UI-Komponente benötigst, die im Browser ausgeführt wird:

- Ein Bilder-Karussel
- Eine Suche mit Auto-Vervollständigung
- Ein Toggle-Button zum Öffnen und Schließen einer Sidebar
- Ein "Jetzt kaufen"-Button

In Astro ist es deine Aufgabe als Entwicklerin oder Entwickler innerhalb einer Seite die Ausführbarkeit von Komponenten im Browser ausdrücklich zu "deklarieren". Astro kann anschließend diese Information verwenden, um herauszufinden welches JavaScript benötigt wird - und die Seite um exakt das anreichern, was benötigt wird. Diese Technik wird als Partial Hydration bezeichnet.

**Partial Hydration** -- das ausschließliche Anreichern der Komponenten, die JavaScript benötigen, während der Rest der Seite statisches HTML bleibt -- klingt eigentlich sehr einfach - und das sollte es auch sein! Websites wurden über Jahrzehnte so gebaut. Erst in den letzten Jahren erschienen immer mehr so genannte Single-Page-Anwendungen (SPAs), die die Idee ins Spiel brachten, dass deine gesamte Website in JavaScript geschrieben werden und das Ganze schließlich von jeder einzelnen Nutzerin und jedem einzelnen Nutzer im Browser kompiliert und ausgeführt werden könne.

_Beachte: Partial Hydration (Partielle Anreicherung) wird manchmal auch als “Progressive Enhancement” oder “Progressive Hydration.” bezeichnet. Während durchaus leichte Unterschiede zwischen den Begriffen bestehen, kannst du sie für unsere Zwecke als verschiedene Synonyme des selben Konzeptes betrachten._

**Partial Hydration ist das Geheimnis hinter der Geschichte von der standardmäßigen Schnelligkeit von Astro.** Next.js, Gatsby und andere JavaScript-Bibliotheken können Partial Hydration nicht unterstützen, da sie deine gesamte Website als eine einzelne JavaScript-Anwendung betrachten.

## Konzept: Islands Architecture

**Islands Architecture** ist die Idee Partial Hydration zu verwenden, um komplette Websites zu erzeugen. Islands Architecture ist eine Alternative zu der beliebten Idee deine gesamte Website in eine Client-seitige JavaScript-Anwendung zu packen, welche von den Nutzerinnen und Nutzern heruntergeladen werden muss.

Um Jason Miller zu zitieren, der [den Begriff aufgebracht hat](https://jasonformat.com/islands-architecture/):

> In einem Modell aus "Inseln" ist Server-seitiges Rendering nicht die angeflanschte Optimierung, die darauf abzielt die SEO- oder UX-Werte zu verbessern. Stattdessen ist es die grundlegende Methode mit der Seiten an den Browser ausgeliefert werden. Das HTML das als Antwort auf eine Navigation zurückgegeben wird, enthält eine bedeutsame und unmittelbar gerenderte Repräsentation des Inhaltes, den die Nutzerin oder der Nutzer angefordert hat.

Neben den offensichtlichen Leistungsvorteilen, wenn weniger JavaScript an den Browser geschickt und dort ausgeführt wird, verfügt eine Islands Architecture über zwei wesentliche Vorteile:

- **Komponenten laden einzeln.** Eine leichtgewichtige Komponente (wie ein Sidebar-Toggle) wird schnell laden und rendern ohne von den schwereren Komponenten auf der Seite blockiert zu werden.
- **Komponenten laden isoliert voneinander.** Jeder Teil einer Seite ist eine isolierte Einheit, und ein Leistungsproblem einer Einheit hat keinen direkten Einfluss auf die anderen.

![Diagram](https://res.cloudinary.com/wedding-website/image/upload/v1596766231/islands-architecture-1.png)

## Interaktive Komponenten anreichern

Astro rendert jede Komponente auf dem Server **während des Build-Prozesses**, solange nicht [client:only](#mycomponent-clientonly-) verwendet wird. Um Komponenten Client-seitig **während der Laufzeit** anzureichern, kannst du jede der folgenden `client:*`-Direktiven verwenden. Eine Direktive ist das Attribut einer Komponente (getrennt durch einen `:`), das Astro mitteilt, wie deine Komponente gerendert werden sollte.

```astro
---
// Beispiel: eine React-Komponente im Browser anreichern.
import MeineReactKomponente from '../components/MeineReactKomponente.jsx';
---
<!-- "client:visible" bedeutet, die Komponente lädt solange kein
     Client-seitiges JavaScript, bis sie im Browser sichtbar wird. -->
<MeineReactKomponente client:visible />
```

### `<MeineKomponente client:load />`

Reichere die Komponente beim Laden der Seite an.

### `<MeineKomponente client:idle />`

Reichere die Komponente an, sobald der Haupt-Thread frei ist (verwendet [requestIdleCallback()][mdn-ric]).

### `<MeineKomponente client:visible />`

Reichere die Komponente an, sobald das Element im Viewport der Nutzerin bzw. des Nutzers sichtbar wird (verwendet [IntersectionObserver][mdn-io]). Nützlich für Inhalte weiter unten auf der Seite.

### `<MeineKomponente client:media={QUERY} />`

Reichere die Komponente an, wenn der Browser der vorgegebenen Media-Query entspricht (verwendet [matchMedia][mdn-mm]). Nützlich für Sidebar-Toggles oder andere Elemente, die nur auf Mobil- oder nur auf Desktop-Geräten angezeigt werden sollen.

### `<MeineKomponente client:only />`

Reichert die Komponente beim Laden der Seite an, ähnlich wie `client:load`. Die Komponente wird während des Build-Prozessses **ausgelassen**, nützlich für Komponenten die vollständig von Client-seitigen API abhängig sind. Diese Direktive sollte am besten vermieden werden, solange sie nicht unbedingt benötigt wird. In den meisten Fällen ist es am besten, Server-seitig Platzhalter-Inhalte zu rendern und etwaige API-Aufrufe im Browser solange zu verzögern, bis die Komponente im Browser angereichert wurde.

Falls mehr als ein Renderer in der Astro-[Konfiguration](/reference/configuration-reference) angegeben werden, benötigt `client:only` einen Hinweis, um zu wissen, welcher Renderer für die Komponente eingesetzt werden soll. Zum Beispiel würde `client:only="react"` sicherstellen, dass die Komponente im Browser mit dem React-Renderer angereichert wird. Bei eigenen Renderern, die nicht über `@astrojs` bereitgestellt werden, verwende den vollen Namen, so wie er in der Astro-Konfiguration erscheint, z. B. `<client:only="mein-eigener-renderer" />`.

## Kann ich Astro-Komponenten anreichern?

[Astro-Komponenten](./astro-components) (`.astro`-Dateien) sind reine HTML-Templating-Komponenten ohne Client-seitige Laufzeit. Wenn du versuchst eine Astro-Komponente über einem `client`-Modifikator anzureichern, wird ein Fehler ausgegeben.

Um deine Astro-Komponente interaktiv zu machen, musst du sie zu einer Frontend-Bibliothek deiner Wahl konvertieren: React, Svelte, Vue etc. Für den Fall, dass du keine bestimmte Bibliothek bevorzugst, empfehlen wir React oder Preact, da sie am meisten Ähnlichkeit mit Astros Syntax aufweisen.

Alternativ hierzu könntest du auch ein `<script>`-Tag zu deiner Astro-Komponente hinzufügen und auf diesem Weg JavaScript an den Browser senden. Das kann bei einfachen Funktionen noch ein guter Weg sein, bei komplexeren oder interaktiven Komponenten empfehlen wir eine Frontend-Bibliothek zu verwenden.

```astro
---
// Beispiel: Astro mit script-Tags verwenden
---
<h1>Nicht geklickt</h1>
<button>Klicke, um die Überschrift zu ändern</button>
<script>
document.querySelector("button").addEventListener("click",() => {
    document.querySelector("h1").innerText = "geklickt"
})
</script>
```

[mdn-io]: https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
[mdn-ric]: https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback
[mdn-mm]: https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia
