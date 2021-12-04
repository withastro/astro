---
layout: ~/layouts/MainLayout.astro
title: Projektstruktur
description: Lerne wie die Projektstruktur in Astro aufgebaut ist.
---

Astro verwendet eine dogmatische Verzeichnisstruktur für dein Projekt. Jedes Astro-Projekt muss die folgenden Verzeichnisse und Dateien enthalten:

- `src/*` - Dein Source-Code (Komponenten, Seiten etc.)
- `public/*` - Deine Nicht-Code-Assets (Schriften, Icons etc.)
- `package.json` - Ein Projekt-Manifest

Der einfachste Weg dein neues Projekt aufzusetzen, ist mittels `npm init astro`. Lies unsere [Installationsanleitung](/de/quick-start), um einen vollständigen Überblick darüber zu erhalten, wie ein Projekt automatisch (mit `npm init astro`) oder manuell aufgesetzt werden kann.

## Projektstruktur

```
├── src/
│   ├── components/
│   ├── layouts/
│   └── pages/
│       └── index.astro
├── public/
└── package.json
```

### `src/`

Das `src`-Verzeichnis beinhaltet den Großteil des Source-Code zu deinem Projekt. Dazu zählen:

- [Astro-Komponenten](/core-concepts/astro-components)
- [Astro-Seiten](/de/core-concepts/astro-pages)
- [Layouts](/de/core-concepts/layouts)
- [JavaScript-Komponenten](/de/core-concepts/component-hydration)
- [Styling (CSS, Sass)](/guides/styling)
- [Markdown](/guides/markdown-content)

Astro hat vollständige Kontrolle darüber, wie diese Dateien verarbeitet, optimiert und in deinem abschließenden Website-Build gepackt werden. Einige Dateien (wie Astro-Komponenten) kommen niemals direkt im Browser an - sie werden stattdessen als HTML gerendert und ausgegeben. Andere Dateien (wie CSS) werden an den Browser gesendet, werden möglicherweise aber gepackt - in Abhängigkeit davon, wie deine Site sie einsetzt.

### `src/components`

[Komponenten](/de/core-concepts/astro-components) sind mehrfach verwendbare Einheiten der UI deiner Seiten. Es wird empfohlen (aber dies ist nicht zwingend notwendig), Komponenten in diesem Verzeichnis anzulegen. Wie diese darin strukturiert sind, kannst du frei entscheiden.

Deine Nicht-Astro-Komponenten (React, Preact, Svelte, Vue etc.) können ebenfalls im `src/components`-Verzeichnis abgelegt werden. Astro wird automatisch alle Komponeneten als HTML rendern, solange du nicht mittels [Partial Hydration](/de/core-concepts/component-hydration) eine bestimmte Frontend-Komponente aktiviert hast.

### `src/layouts`

[Layouts](/de/core-concepts/layouts) sind mehrfach verwendbare Komponenten für die Gestaltung einzelner Seiten. Es wird empfohlen (aber dies ist nicht zwingend notwendig) Layout-Komponenten in diesem Verzeichnis anzulegen. Wie diese darin strukturiert sind, kannst du frei entscheiden.

### `src/pages`

[`src/pages`](/de/core-concepts/astro-pages) enthält alle Seiten (`.astro` und `.md` werden unterstützt) für deine Website. Es ist **zwingend** notwendig, dass du deine Seiten in diesem Verzeichnis anlegst.

### `public/`

Bei den meisten Nutzerinnen und Nutzern, wird der Großteil der Dateien innerhalb des `src`-Verzeichnisses liegen, so dass Astro sie in der richtigen Art und Weise während des Build-Prozesses verarbeiten und optimieren kann. Im Gegensatz dazu ist das `public`-Verzeichnis der passende Ort für alle Dateien, die nicht von Astros Build-Prozess abhängig sind.

Wenn du eine Datei im `public`-Verzeichnis ablegst, wird diese von Astro nicht bearbeitet. Stattdessen wird sie unverändert in das `build`-Verzeichnis kopiert. Dies kann nützlich sein bei Assets von Bildern und Schriften - oder wenn du spezielle Dateien wie `robots.txt` oder `manifest.webmanifest` unverändert im Build verwenden willst.
