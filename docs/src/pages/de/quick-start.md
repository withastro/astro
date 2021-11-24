---
layout: ~/layouts/MainLayout.astro
title: Schnellstart
description: Die einfachste Art, schnell mit Astro loszulegen.
---

```shell
# Voraussetzung: Node.js 12.20.0+, 14.13.1+, oder 16+
node --version

# Erstelle einen neuen Projektordner und navigiere in das Verzeichnis
mkdir my-astro-project && cd $_

# Bereite dich vor abzuheben...
npm init astro

# Dependencies installieren
npm install

# Fange an zu entwickeln!
npm run dev
```

Für Produktionsstandorte,

```shell
# Wenn du bereit bist: Exportiere deine Seite nach `dist/`
npm run build
```

Um mehr über den Installationsprozess und den ersten Gebrauch von Astro zu lernen, [lies unseren Installations-Leitfaden.](de/installation)

Wenn du es bevorzugst, anhand eines Beispiels zu lernen, schau Dir die [komplette Liste an Beispielen](https://github.com/withastro/astro/tree/main/examples) auf GitHub an.
Du kannst jedes Beispiel ausprobieren, indem Du `npm init astro -- --template "EXAMPLE_NAME"` ausführst.

## Starte dein Projekt

Führe den folgenden Befehl in Deinem Projektverzeichnis aus:

```bash
npm run dev
```

Astro fängt nun an, Deine Anwendung unter [http://localhost:3000](http://localhost:3000) bereitzustellen. Wenn Du diese URL in Deinem Browser öffnest, solltest du Astro’s „Hello, World“ sehen.

Der Server beobachtet alle Dateiänderungen in Deinem `src/`-Verzeichnis, sodass du Deine Anwendung nicht bei jeder Änderung neu zu starten brauchst.

## Bereite dein Projekt für die Veröffentlichung vor

Um Dein Projekt zu kompilieren, gib in Deinem Verzeichnis den folgenden Befehl in Dein Terminal ein:

```bash
npm run build
```

Dadurch wird Astro beauftragt, Deine Website zu erstellen und sie direkt auf der Festplatte zu speichern. Deine Anwendung steht nun im `dist/`-Verzeichnis für Dich bereit.

## Veröffentliche dein Projekt

Astro-WebSites sind statisch, sodass sie bei deinem bevorzugten Hoster veröffentlicht werden können:

- [AWS S3 bucket](https://aws.amazon.com/s3/)
- [Google Firebase](https://firebase.google.com/)
- [Netlify](https://www.netlify.com/)
- [Vercel](https://vercel.com/)
- [Erfahre mehr über die Veröffentlichung Deines Projektes in unserem Astro Deploy Guide.](/guides/deploy)

## Nächste Schritte

Du hast es geschafft! Du kannst jetzt mit der Entwicklung beginnen!

Wir empfehlen Dir, dass Du Dir etwas Zeit nimmst, um mit Astro vertraut zu werden. Am Besten indem Du Dir weitere Seiten unserer Dokumentation durchliest. Hier ein paar Empfehlungen:

📚 Lerne mehr über Astro’s [Projektstruktur.](/core-concepts/project-structure)

📚 Lerne mehr über Astro’s Komponenten-Syntax in unserem [Astro-Komponenten-Handbuch.](/core-concepts/astro-components)

📚 Lerne mehr über Astro’s dateibasiertes Routing in unserem [Routing-Handbuch.](core-concepts/astro-pages)
