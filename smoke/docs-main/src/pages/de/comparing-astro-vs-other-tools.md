---
layout: ~/layouts/MainLayout.astro
title: Vergleiche Astro
description: Vergleiche Astro mit anderen statischen Site-Renderern wie Gatsby, Next.js, Nuxt, Hugo, Eleventy und weiteren.
---

Wir werden oft gefragt, "Wie verhält sich Astro im Vergleich zu meinem bevorzugten Site-Renderer **\_\_\_\_**?" Diese Anleitung wurde verfasst, um diese Frage für verschiedene populäre Site-Renderer und Astro-Alternativen zu beantworten.

Falls dein bevorzugter Site-Renderer hier nicht aufgeführt ist, [frag uns danach in Discord](https://astro.build/chat).

## Projektstatus

Eine kurze Anmerkung zum Entwicklungsstand des Projektes: **Astro ist noch im Beta-Stadium.** Viele der Werkzeuge, die hier aufgeführt werden, sind sehr viel weiter fortgeschritten. Einige sind mehr als zwölf Jahre älter als Astro!

Einige Features sind noch nicht verfügbar und Teile der API noch nicht vollständig. Wie auch immer, das Projekt wird bezüglich seiner Fehleranfälligkeit als stabil angesehen und verschiedene Websites wurden schon für den produktiven Einsatz mit Astro umgesetzt. Dies ist ein wichtiger Punkt, wenn es um eine Entscheidung in Bezug auf den Einsatz von Astro geht.

## Docusaurus vs. Astro

[Docusaurus](https://docusaurus.io/) ist ein populärer Dokumentationssite-Renderer. Docusaurus verwendet React, um deine Website-UI zu generieren, während Astro in diesem Bereich React, Preact, Vue, Svelte, Solid und andere unterstützt - sowie auch eine an HTML angelehnte Komponenten-Syntax, die sich ähnlich verhält wie HTML + JSX.

Docusaurus wurde entwickelt, um Dokumentationswebsites zu erzeugen und bietet einige dokumentationsspezifische Features, über die Astro nicht verfügt. Stattdessen kannst du in Astro auf dokumentationsspezifische Features mittels einer offiziellen [`docs`](https://github.com/withastro/astro/tree/main/examples/docs)-Vorlage zugreifen, die du für deine Site verwenden kannst. Diese Dokumentationswebsite wurde unter Verwendung dieser Vorlage erstellt!

### Leistungsvergleich Docusaurus vs. Astro

In den meisten Fällen werden Astro-Websites deutlich schneller laden als Docusaurus-Websites. Dies liegt vor allem daran, dass Astro unnötiges JavaScript vermeidet und nur diejenigen Komponenten einer Seite mit JavaScript anreichert, die dies benötigen. Dieses Feature wird [Partial Hydration](/de/core-concepts/component-hydration) genannt.

Docusaurus unterstützt Partial Hydration nicht. Stattdessen wird die gesamte Seite im Browser mit JavaScript angereichert, selbst wenn der größte Teil der Seite statisch ist. Dies führt zu längeren Ladezeiten und insgesamt schlechterer Leistung deiner Website. Es gibt keine Möglichkeit dieses Verhalten in Docusaurus abzuschalten.

### Fallstudie: Kompilieren einer Dokumentationswebsite

[docusaurus.io/docs](https://docusaurus.io/docs) ist die offizielle Docusaurus-Dokumentationswebsite - kompiliert mit Docusaurus. Die Website bietet ein ausreichend ähnliches Design und ausreichend ähnliche Funktionalität, um sie mit der offiziellen Astro-Dokumentationswebsite zu vergleichen. Dies ermöglicht uns einen **_grob realistischen_** Vergleich zwischen beiden Site-Renderern.

- **Docusaurus Leistungswert**: 61 von 100 [(vollständige Prüfung)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocusaurus.io%2Fdocs)
- **Astro Leistungswert**: 99 von 100 [(vollständige Prüfung)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocs.astro.build%2Fgetting-started)

Ein wesentlicher Grund für diesen Leistungsunterschied liegt in Astros geringerer JavaScript-Last: [docusaurus.io/docs](https://docusaurus.io/docs) lädt **238kB** JavaScript mit dem ersten Seitenaufruf während [docs.astro.build](https://docs.astro.build) **78.7kB** (67% weniger JavaScript insgesamt) _nach_ dem ersten Seitenaufruf lädt.

## Elder.js vs. Astro

[Elder.js](https://elderguide.com/tech/elderjs/) ist ein Site-Renderer für Svelte mit stark ausgeprägten eigenen Vorstellungen.

Elder.js verwendet Svelte, um deine Website zu rendern. Astro ist hierin flexibler: Du kannst frei entscheiden mit welcher UI-Komponenten-Bibliothek du deine Oberfläche erzeugen willst (React, Preact, Vue, Svelte, Solid und andere), oder du verwendest die an HTML angelehnte Komponenten-Syntax von Astro, die sich ähnlich verhält wie HTML + JSX.

Elder.js hat eine besondere Stellung in dieser Auflistung, da es neben Astro der einzige Site-Renderer ist, der [Partial Hydration](/de/core-concepts/component-hydration) unterstützt. Sowohl Astro als auch Elder.js vermeiden automatisch unnötiges JavaScript auf der Seite und reichern nur die Komponenten damit an, die dies benötigen. Elders API für Partial Hydration unterscheidet sich etwas von der, die Astro verwendet. Und Astro unterstützt einige Features, über die Elder.js nicht verfügt (wie z. B. `client:media`). Wie auch immer, beide Werkzeuge erzeugen bezüglich der Leistung betrachtet sehr ähnliche Sites.

Elder.js verwendet eine spezifische Routing-Lösung, die für neue Entwickler ungewohnt erscheinen kann. Astro verwendet [dateibasiertes Routing](/de/core-concepts/routing), das sich für alle vertraut anfühlen sollte, die Erfahrung mit Next.js, SvelteKit oder auch anderen Site-Renderern wie Eleventy haben.

Elder.js wurde entwickelt, um große Websites zu erzeugen - und behauptet, es könne eine Website mit ca 20.000 Seiten in weniger als 10 Minuten rendern (auf einer durchschnittlichen VM). Zum Zeitpunkt der Erstellung dieses Textes rendert Astro ca 1.000 Seiten in 66 Sekunden, aber wurde noch nicht mit Projekten im Umfang von 20.000 Seiten getestet. Astro ist noch in einem frühen Beta-Stadium, und Elder.js Render-Geschwindigkeit zu erreichen ist ein Ziel für Astro v1.0.

Elder.js unterstützt sowohl statische Site-Generierung (SSG) als auch Server-seitiges Rendering (SSR). Zum jetzigen Zeitpunkt unterstützt Astro nur statische Site-Generierung (SSG).

## Eleventy vs. Astro

[Eleventy](https://www.11ty.dev/) ist ein beliebter statischer Site-Renderer auf der Grundlage von Node.js.

Eleventy verwendet verschiedene [ältere Sprachen für HTML-Templates](https://www.11ty.dev/docs/languages/), um deine Website zu rendern: Nunjucks, Liquid, Pug, EJS und andere. Astro erlaubt dir deine Websites mit deiner bevorzugten UI-Komponenten-Bibliothek (React, Preact, Vue, Svelte und andere) zu erzeugen, oder du verwendest die an HTML angelehnte Komponenten-Syntax von Astro, die sich ähnlich verhält wie HTML + JSX. Eleventy unterstützt keine modernen UI-Bibliotheken für die Erstellung von HTML-Templates.

### Leistungsvergleich Eleventy vs. Astro

Konzeptuell ist Eleventy auf Augenhöhe mit Astros "minimalistischem Einsatz von Client-seitigem JavaScript" bei der Web-Entwicklung. Eleventy und Astro bieten somit eine ähnliche Leistungsgrundlage durch ihre jeweilige Null-JavaScript-Strategie.

Eleventy erreicht dies, indem es dich dazu anhält JavaScript gänzlich zu vermeiden. Eleventy-Sites werden oft mit sehr wenig bis hin zu gar keinem JavaScript geschrieben. Dies wird allerdings dann zum Thema, wenn du tatsächlich Client-seitig JavaScript einsetzen musst. Es bleibt dann dir überlassen eine entsprechende Build-Pipeline für deine Skripte und weitere Elemente aufzubauen. Dies kann sich sehr zeitaufwendig gestalten, und es zwingt dich das Packen der Anwendung, sowie Minifizierung und weitere komplizierte Optimierungen von Hand aufzusetzen.

Im Gegensatz dazu kompiliert Astro automatisch dein Client-seitiges JavaScript & CSS für dich. Astro entfernt automatisch unnötiges JavaScript von der Seite und reichert nur die individuellen Komponenten damit an, die dies benötigen. Dieses Feature wird [Partial Hydration](/de/core-concepts/component-hydration) genannt. Während es dir natürlich möglich ist dieses Feature in Eleventy von Hand einzurichten, steht es dir in Astro bereits von vornherein zur Verfügung.

## Gatsby vs. Astro

[Gatsby](https://www.gatsbyjs.com/) ist eine beliebte Website- und Anwendungsbibliothek für React.

Gatsby verwendet React, um deine Website zu rendern. Astro ist hierin flexibler: Du kannst frei entscheiden mit welcher UI-Komponenten-Bibliothek du deine Oberfläche erzeugen willst (React, Preact, Vue, Svelte, Solid und andere), oder du verwendest die an HTML angelehnte Komponenten-Syntax von Astro, die sich ähnlich verhält wie HTML + JSX.

Gatsby v4 unterstützt statische Site-Generierung (Static Site Generation, SSG) mit inkrementellen Rebuilds sowie verzögerte statische Generierung (Deferred Static Generation, DSG), aber auch Server-seitiges Rendering (Server-Side Rendering, SSR). Zur Zeit unterstützt Astro nur statische Site-Generierung (SSG).

Gatsby erfordert für deine gesamte Arbeit mit Site-Inhalten eine eigene GraphQL-API. Während einige Entwicklerinnen und Entwickler an diesem Modell Gefallen finden, besteht eine häufig geäußerte Kritik an Gatsby darin, dass dieses Modell auf Dauer zu komplex und schwer aufrechtzuerhalten ist, insbesondere wenn Sites sehr umfangreich werden. Für die Arbeit mit Astro ist GraphQL nicht erforderlich, stattdessen bietet es gewohnte API (wie `fetch()` und `await` auf oberster Ebene), um Daten nah bei ihrer Anwendung zu laden.

### Leistungsvergleich Gatsby vs. Astro

In den meisten Fällen werden Astro-Websites deutlich schneller laden als Gatsby-Websites. Dies liegt vor allem daran, dass Astro unnötiges JavaScript vermeidet und nur diejenigen Komponenten einer Seite mit JavaScript anreichert, die dies benötigen. Dieses Feature wird [Partial Hydration](/de/core-concepts/component-hydration) genannt.

Gatsby unterstützt Partial Hydration nicht und lässt stattdessen den Browser die gesamte Seite erneut laden und mit JavaScript anreichern, selbst wenn der größte Teil der Seite statisch ist. Dies führt zu längeren Ladezeiten und schlechterer Leistung für deine Website. Gatsby verfügt über ein [Community Plugin](https://www.gatsbyjs.com/plugins/gatsby-plugin-no-javascript/), das sämtliches JavaScript von einer Seite entfernt, doch dies führt auch dazu, dass viele Websites nicht mehr wie beabsichtigt funktionieren. In Bezug auf Interaktivität auf einzelnen Seiten ist entprechend nur eine Entscheidung zwischen ganz oder gar nicht möglich.

Gatsby verfügt über ein großes Plugin-Ökosystem, was in Abhängigkeit von dem, was du benötigst, Gatsby zur besseren Wahl machen kann. [gatsby-plugin-image](https://www.gatsbyjs.com/plugins/gatsby-plugin-image/) z. B. ist ein beliebtes Plugin für Bildoptimierungen, das Gatsby zur besseren Wahl für bilderlastige Websites machen könnte.

### Fallstudie: Kompilieren einer Dokumentationswebsite

[gatsbyjs.com/docs](https://www.gatsbyjs.com/docs/quick-start/) ist die offizielle Gatsby-Dokumentationswebsite - kompiliert mit Gatsby. Die Website bietet ein ausreichend ähnliches Design und ausreichend ähnliche Funktionalität, um sie mit der offiziellen Astro-Dokumentationswebsite zu vergleichen. Dies ermöglicht uns einen **_grob realistischen_** Vergleich zwischen beiden Site-Renderern.

- **Gatsby Leistungswert**: 64 von 100 [(vollständige Prüfung)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fwww.gatsbyjs.com%2Fdocs%2Fquick-start%2F)
- **Astro Leistungswert**: 99 von 100 [(vollständige Prüfung)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocs.astro.build%2Fgetting-started)

Ein wesentlicher Grund für diesen Leistungsunterschied liegt in Astros geringerer JavaScript-Last: [gatsbyjs.com/docs](https://www.gatsbyjs.com/docs/quick-start/) lädt **417kB** JavaScript mit dem ersten Seitenaufruf während [docs.astro.build](https://docs.astro.build) **78.7kB** (81% weniger JavaScript insgesamt) _nach_ dem ersten Seitenaufruf lädt.

## Hugo vs. Astro

[Hugo](https://gohugo.io/) ist ein beliebter statischer Site-Renderer auf der Grundlage von Go.

Hugo verwendet eine eigene [Templating Language](https://gohugo.io/templates/introduction/), um deine Website zu rendern. Astro erlaubt dir deine Websites mit deiner bevorzugten UI-Komponenten-Bibliothek (React, Preact, Vue, Svelte, Solid und andere) zu erzeugen, oder du verwendest die an HTML angelehnte Komponenten-Syntax von Astro, die sich ähnlich verhält wie HTML + JSX. Hugo unterstützt keine modernen UI-Bibliotheken für die Erstellung von HTML-Templates.

### Leistungsvergleich Hugo vs. Astro

Konzeptuell ist Hugo auf Augenhöhe mit Astros "minimalistischem Einsatz von Client-seitigem JavaScript" bei der Web-Entwicklung. Hugo und Astro bieten somit eine ähnliche Leistungsgrundlage durch ihre jeweilige Null-JavaScript-Strategie.

Sowohl Hugo als auch Astro bieten von vornherein Unterstützung beim Kompilieren, Packen und Minifizieren von JavaScript. Astro entfernt automatisch unnötiges JavaScript von der Seite und reichert nur die individuellen Komponenten damit an, die dies benötigen. Dieses Feature wird [Partial Hydration](/de/core-concepts/component-hydration) genannt. Während es dir natürlich möglich ist dieses Feature in Hugo von Hand einzurichten, steht es dir in Astro ebenfalls bereits von vornherein zur Verfügung.

## Jekyll vs. Astro

[Jekyll](https://jekyllrb.com/) ist ein beliebter statischer Site-Renderer auf der Grundlage von Ruby.

Jekyll verwendet eine ältere [Templating Language](https://jekyllrb.com/docs/liquid/) mit dem Namen Liquid, um deine Website zu rendern. Astro erlaubt dir deine Websites mit deiner bevorzugten UI-Komponenten-Bibliothek (React, Preact, Vue, Svelte, Solid und andere) zu erzeugen, oder du verwendest die an HTML angelehnte Komponenten-Syntax von Astro, die sich ähnlich verhält wie HTML + JSX. Jekyll unterstützt keine modernen UI-Bibliotheken für die Erstellung von HTML-Templates.

### Leistungsvergleich Jekyll vs. Astro

Konzeptuell ist Jekyll auf Augenhöhe mit Astros "minimalistischem Einsatz von Client-seitigem JavaScript" bei der Web-Entwicklung. Jekyll und Astro bieten somit eine ähnliche Leistungsgrundlage durch ihre jeweilige Null-JavaScript-Strategie.

Jekyll erreicht dies, indem es dich dazu anhält JavaScript gänzlich zu vermeiden. Jekyll-Sites werden oft mit sehr wenig bis hin zu gar keinem JavaScript geschrieben. Dies wird allerdings dann zum Thema, wenn du tatsächlich Client-seitig JavaScript einsetzen musst. Es bleibt dann dir überlassen eine entsprechende Build-Pipeline für deine Skripte und weitere Elemente aufzubauen. Dies kann sich sehr zeitaufwendig gestalten, und es zwingt dich das Packen der Anwendung, sowie Minifizierung und weitere komplizierte Optimierungen von Hand aufzusetzen.

Im Gegensatz dazu kompiliert Astro automatisch dein Client-seitiges JavaScript für dich. Astro sendet nur die minimal notwendige Menge an JavaScript an den Browser, minifiziert, gepackt und optimiert für die Veröffentlichung. Dieses Feature wird [Partial Hydration](/de/core-concepts/component-hydration) genannt. Während es dir natürlich möglich ist dieses Feature in Jekyll von Hand einzurichten, steht es dir in Astro bereits von vornherein zur Verfügung.

## SvelteKit vs. Astro

[SvelteKit](https://kit.svelte.dev/) ist eine beliebte Website- und Anwendungsbibliothek für Svelte.

SvelteKit verwendet Svelte, um deine Website zu rendern. Astro ist hierin flexibler: Du kannst frei entscheiden mit welcher UI-Komponenten-Bibliothek du deine Oberfläche erzeugen willst (React, Preact, Vue, Svelte, Solid und andere), oder du verwendest die an HTML angelehnte Komponenten-Syntax von Astro, die sich ähnlich verhält wie HTML + JSX.

Sowohl SvelteKit als auch Astro sind Bibliotheken für die Erzeugung von Websites. SvelteKit funktioniert am besten mit hochdynamischen Websites (wie Dashboards und Nachrichteneingängen), während Astro am besten mit größtenteils statischen Websites funktioniert (wie Content- und E-Commerce-Websites).

SvelteKit unterstützt sowohl statische Site-Generierung (Static Site Generation, SSG) als auch Server-seitiges Rendering (Server-Side Rendering, SSR). Zur Zeit unterstützt Astro nur statische Site-Generierung (SSG).

### Leistungsvergleich SvelteKit vs. Astro

In den meisten Fällen werden Astro-Websites schneller laden als SvelteKit-Websites. Dies liegt vor allem daran, dass Astro unnötiges JavaScript vermeidet und nur diejenigen Komponenten einer Seite mit JavaScript anreichert, die dies benötigen. Dieses Feature wird [Partial Hydration](/de/core-concepts/component-hydration) genannt.

SvelteKit unterstützt Partial Hydration nicht und lässt stattdessen den Browser die gesamte Seite erneut laden und mit JavaScript anreichern, selbst wenn der größte Teil der Seite statisch ist. Dies führt zu längeren Ladezeiten und schlechterer Leistung für deine Website. SvelteKit unterstützt mit [Page-Level Static und Zero-JavaScript Pages](https://kit.svelte.dev/docs#ssr-and-javascript-hydrate) das Entfernen von JavaScript per Seite oder für die gesamte Anwendung. Wie auch immer, eine Unterstützung für die Anreicherung individueller Komponenten einer Seite ist nicht geplant. In Bezug auf Interaktivität auf einzelnen Seiten ist entprechend nur eine Entscheidung zwischen ganz oder gar nicht möglich.

### Fallstudie: Kompilieren einer Dokumentationswebsite

[kit.svelte.dev](https://kit.svelte.dev/docs#ssr-and-javascript-hydrate) ist die offizielle SvelteKit-Dokumentationswebsite - kompiliert mit SvelteKit. Die Website bietet ein ausreichend ähnliches Design und ausreichend ähnliche Funktionalität, um sie mit der offiziellen Astro-Dokumentationswebsite zu vergleichen. Dies ermöglicht uns einen **_grob realistischen_** Vergleich zwischen beiden Site-Renderern.

Ein wichtiger zu beachtender Unterschied zwischen beiden Sites im Test: SveltKits Dokumentation wird als einzelne Seite ausgeliefert, während Astros Dokumentation in einzelne Seiten geteilt ausgeliefert wird. Diese höhere Content-Last dürfte einen leicht negativen Einfluss auf die Leistung haben und ist nicht auf das Werkzeug an sich zurückzuführen.

- **SvelteKit Leistungswert**: 92 von 100 [(vollständige Prüfung)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fkit.svelte.dev%2Fdocs)
- **Astro Leistungswert**: 99 von 100 [(vollständige Prüfung)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocs.astro.build%2Fgetting-started)

Der Leistungswert von SvelteKit in diesem Test ist vergleichbar mit dem von Astro.

## Next.js vs. Astro

[Next.js](https://nextjs.org/) ist eine beliebte Website- und Anwendungsbibliothek für React.

Next.js verwendet React, um deine Website zu rendern. Astro ist hierin flexibler: Du kannst frei entscheiden mit welcher UI-Komponenten-Bibliothek du deine Oberfläche erzeugen willst (React, Preact, Vue, Svelte, Solid und andere), oder du verwendest die an HTML angelehnte Komponenten-Syntax von Astro, die sich ähnlich verhält wie HTML + JSX.

Sowohl Next.js als auch Astro sind Bibliotheken für die Erzeugung von Websites. Next.js funktioniert am besten mit hochdynamischen Websites (wie Dashboards und Nachrichteneingängen), während Astro am besten mit größtenteils statischen Websites funktioniert (wie Content- und E-Commerce-Websites).

Next.js unterstützt sowohl statische Site-Generierung (Static Site Generation, SSG) als auch Server-seitiges Rendering (Server-Side Rendering, SSR). Zur Zeit unterstützt Astro nur statische Site-Generierung (SSG).

### Leistungsvergleich Next.js vs. Astro

In den meisten Fällen werden Astro-Websites deutlich schneller laden als Next.js-Websites. Dies liegt vor allem daran, dass Astro unnötiges JavaScript vermeidet und nur diejenigen Komponenten einer Seite mit JavaScript anreichert, die dies benötigen. Dieses Feature wird [Partial Hydration](/de/core-concepts/component-hydration) genannt.

Next.js unterstützt Partial Hydration nicht und lässt stattdessen den Browser die gesamte Seite erneut laden und mit JavaScript anreichern, selbst wenn der größte Teil der Seite statisch ist. Dies führt zu längeren Ladezeiten und schlechterer Leistung für deine Website. Next.js verfügt über [Experimental Support](https://piccalil.li/blog/new-year-new-website/#heading-no-client-side-react-code) für vollständig statische, Null-JavaScript-Seiten. Wie auch immer, eine Unterstützung für die Anreicherung individueller Komponenten einer Seite ist nicht geplant. In Bezug auf Interaktivität auf einzelnen Seiten ist entprechend nur eine Entscheidung zwischen ganz oder gar nicht möglich.

Next.js verfügt über sehr gute integrierte Bildoptimierungen, was Next.js zur besseren Wahl für bilderlastige Websites machen könnte.

### Fallstudie: Kompilieren einer Dokumentationswebsite

[nextjs.org/docs](https://nextjs.org/docs/getting-started) ist die offizielle Next.js-Dokumentationswebsite - kompiliert mit Next.js. Die Website bietet ein ausreichend ähnliches Design und ausreichend ähnliche Funktionalität, um sie mit der offiziellen Astro-Dokumentationswebsite zu vergleichen. Dies ermöglicht uns einen **_grob realistischen_** Vergleich zwischen beiden Site-Renderern.

- **Next.js Leistungswert**: 59 von 100 [(vollständige Prüfung)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fnextjs.org%2Fdocs%2Fgetting-started)
- **Astro Leistungswert**: 99 von 100 [(vollständige Prüfung)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocs.astro.build%2Fgetting-started)

Ein wesentlicher Grund für diesen Leistungsunterschied liegt in Astros geringerer JavaScript-Last: [nextjs.org/docs](https://nextjs.org/docs/getting-started) lädt **463kB** JavaScript mit dem ersten Seitenaufruf, während [docs.astro.build](https://docs.astro.build) **78.7kB** (83% weniger JavaScript insgesamt) _nach_ dem ersten Seitenaufruf lädt.

## Nuxt vs. Astro

[Nuxt](https://nuxtjs.org/) ist eine beliebte Website- und Anwendungsbibliothek für Vue. Es ist ähnlich aufgebaut wie Next.js.

Nuxt verwendet Vue, um deine Website zu rendern. Astro ist hierin flexibler: Du kannst frei entscheiden mit welcher UI-Komponenten-Bibliothek du deine Oberfläche erzeugen willst (React, Preact, Vue, Svelte, Solid und andere), oder du verwendest die an HTML angelehnte Komponenten-Syntax von Astro, die sich ähnlich verhält wie HTML + JSX.

Sowohl Nuxt als auch Astro sind Bibliotheken für die Erzeugung von Websites. Nuxt funktioniert am besten mit hochdynamischen Websites (wie Dashboards und Nachrichteneingängen), während Astro am besten mit größtenteils statischen Websites funktioniert (wie Content- und E-Commerce-Websites).

Nuxt unterstützt sowohl statische Site-Generierung (Static Site Generation, SSG) als auch Server-seitiges Rendering (Server-Side Rendering, SSR). Zur Zeit unterstützt Astro nur statische Site-Generierung (SSG).

### Leistungsvergleich Nuxt vs. Astro

In den meisten Fällen werden Astro-Websites deutlich schneller laden als Nuxt-Websites. Dies liegt vor allem daran, dass Astro unnötiges JavaScript vermeidet und nur diejenigen Komponenten einer Seite mit JavaScript anreichert, die dies benötigen. Dieses Feature wird [Partial Hydration](/de/core-concepts/component-hydration) genannt.

Nuxt unterstützt Partial Hydration nicht und lässt stattdessen den Browser die gesamte Seite erneut laden und mit JavaScript anreichern, selbst wenn der größte Teil der Seite statisch ist. Dies führt zu längeren Ladezeiten und schlechterer Leistung für deine Website. Es besteht keine Möglichkeit dieses Verhalten abzuschalten.

Nuxt verfügt über sehr gute integrierte Bildoptimierungen, was Nuxt zur besseren Wahl für bilderlastige Websites machen könnte.

### Fallstudie: Kompilieren einer Dokumentationswebsite

[nuxtjs.org/docs](https://nuxtjs.org/docs/2.x/get-started/installation) ist die offizielle Nuxt-Dokumentationswebsite - kompiliert mit Nuxt. Die Website bietet ein ausreichend ähnliches Design und ausreichend ähnliche Funktionalität, um sie mit der offiziellen Astro-Dokumentationswebsite zu vergleichen. Dies ermöglicht uns einen **_grob realistischen_** Vergleich zwischen beiden Site-Renderern.

- **Nuxt Leistungswert**: 48 von 100 [(vollständige Prüfung)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fnuxtjs.org%2Fdocs%2F2.x%2Fget-started%2Finstallation)
- **Astro Leistungswert**: 99 von 100 [(vollständige Prüfung)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocs.astro.build%2Fgetting-started)

Ein wesentlicher Grund für diesen Leistungsunterschied liegt in Astros geringerer JavaScript-Last: [nuxtjs.org/docs](https://nuxtjs.org/docs/2.x/get-started/installation) lädt **469kb** JavaScript mit dem ersten Seitenaufruf, während [docs.astro.build](https://docs.astro.build) **78.7kB** (83% weniger JavaScript insgesamt) _nach_ dem ersten Seitenaufruf lädt.

## VuePress vs. Astro

[VuePress](https://vuepress.vuejs.org/guide/) ist ein populärer Dokumentationssite-Renderer auf der Grundlage von Vue. VuePress verwendet Vue, um deine Website-UI zu generieren, während Astro in diesem Bereich React, Preact, Vue, Svelte, Solid und andere unterstützt - sowie auch eine an HTML angelehnte Komponenten-Syntax, die sich ähnlich verhält wie HTML + JSX.

VuePress wurde entwickelt, um Dokumentationswebsites zu erzeugen und bietet einige dokumentationsspezifische Features, über die Astro nicht verfügt. Stattdessen verfügst du in Astro über dokumentationsspezifische Features mittels einer offiziellen [`docs`](https://github.com/withastro/astro/tree/main/examples/docs)-Vorlage, die du für deine Site verwenden kannst. Diese Website wurde unter Verwendung dieser Vorlage erstellt!

Evan You (Erfinder von Vue) arbeitet zur Zeit an einer neuen Version von VuePress, genannt [VitePress](https://vitepress.vuejs.org/). Wenn du eine moderne Alternative zu VuePress suchst, [lies Evans Post](https://github.com/withastro/astro/issues/1159#issue-974035962) darüber, warum VitePress hierfür eine bessere Option darstellen kann.

### Leistungsvergleich VuePress vs. Astro

In den meisten Fällen werden Astro-Websites deutlich schneller laden als VuePress-Websites. Dies liegt vor allem daran, dass Astro unnötiges JavaScript vermeidet und nur diejenigen Komponenten einer Seite mit JavaScript anreichert, die dies benötigen. Dieses Feature wird [Partial Hydration](/de/core-concepts/component-hydration) genannt.

VuePress unterstützt Partial Hydration nicht und lässt stattdessen den Browser die gesamte Seite erneut laden und mit JavaScript anreichern, selbst wenn der größte Teil der Seite statisch ist. Dies führt zu längeren Ladezeiten und schlechterer Leistung für deine Website. Es besteht keine Möglichkeit dieses Verhalten abzuschalten.

### Fallstudie: Kompilieren einer Dokumentationswebsite

[vuepress.vuejs.org](https://vuepress.vuejs.org/guide/) ist die offizielle VuePress-Dokumentationswebsite - kompiliert mit VuePress. Die Website bietet ein ausreichend ähnliches Design und ausreichend ähnliche Funktionalität, um sie mit der offiziellen Astro-Dokumentationswebsite zu vergleichen. Dies ermöglicht uns einen **_grob realistischen_** Vergleich zwischen beiden Site-Renderern.

- **Vuepress Leistungswert**: 63 von 100 [(vollständige Prüfung)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fvuepress.vuejs.org%2Fguide%2F)
- **Astro Leistungswert**: 99 von 100 [(vollständige Prüfung)](https://lighthouse-dot-webdotdevsite.appspot.com//lh/html?url=https%3A%2F%2Fdocs.astro.build%2Fgetting-started)

Ein wesentlicher Grund für diesen Leistungsunterschied liegt in Astros geringerer JavaScript-Last: [vuepress.vuejs.org](https://vuepress.vuejs.org/guide/) lädt **166kb** JavaScript mit dem ersten Seitenaufruf, während [docs.astro.build](https://docs.astro.build) **78.7kB** (53% weniger JavaScript insgesamt) _nach_ dem ersten Seitenaufruf lädt.

## Zola vs. Astro

[Zola](https://www.getzola.org/) ist ein beliebter statischer Site-Renderer auf der Grundlage von Rust.

Zola verwendet [Tera](https://tera.netlify.app/), um deine Website zu rendern. Astro erlaubt dir deine Websites mit deiner bevorzugten UI-Komponenten-Bibliothek (React, Preact, Vue, Svelte, Solid und andere) zu erzeugen, oder du verwendest die an HTML angelehnte Komponenten-Syntax von Astro, die sich ähnlich verhält wie HTML + JSX. Zola unterstützt keine modernen UI-Bibliotheken für die Erstellung von HTML-Templates.

### Leistungsvergleich Zola vs. Astro

Konzeptuell ist Zola auf Augenhöhe mit Astros "minimalistischem Einsatz von Client-seitigem JavaScript" bei der Web-Entwicklung. Zola und Astro bieten somit eine ähnliche Leistungsgrundlage durch ihre jeweilige Null-JavaScript-Strategie.

Sowohl Zola als auch Astro bieten Unterstützung beim Kompilieren, Packen und Minifizieren von JavaScript. Zola benötigt hierfür ein zusätzliches Werkzeug wie Webpack, um JavaScript zu packen und zu verarbeiten. Astro entfernt automatisch unnötiges JavaScript von der Seite und reichert nur die individuellen Komponenten damit an, die dies benötigen. Dieses Feature wird [Partial Hydration](/de/core-concepts/component-hydration) genannt. Während es dir natürlich möglich ist dieses Feature in Zola von Hand einzurichten, steht es dir in Astro bereits von vornherein zur Verfügung.
