---
layout: ~/layouts/MainLayout.astro
title: Schnellstart
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

# Wenn du bereit bist: Exportiere deine Seite nach `dist/`
npm run build
```

Um mehr über den Installationsprozess und den ersten Gebrauch von Astro zu lernen, [lies unseren Installations-Leitfaden.](installation)

Wenn du es bevorzugst anhand eines Beispiels zu lernen, schau dir die [komplette Liste an Beispielen](https://github.com/snowpackjs/astro/tree/main/examples) auf GitHub an. 
Du kannst jedes Beispiel ausprobieren, indem du `npm init astro -- --template "EXAMPLE_NAME"` ausführst.

## Starte dein Projekt

Führe den folgenden Befehl in deinem Projektverzeichnis aus:

```bash
npm run dev
```

Astro fängt nun an deine Anwendung unter [http://localhost:3000](http://localhost:3000) bereitzustellen. Wenn du diese URL in deinem Browser öffnest, solltest du Astro’s „Hello, World“ sehen.

Der Server beobachtet alle Dateiänderungen in deinem `src/`-Verzeichnis, sodass du deine Anwendung nicht bei jeder Änderung neu starten musst.

## Bereite dein Projekt für die Veröffentlichung vor

Um dein Projekt zu kompilieren, gebe in deinem Verzeichnis den folgenden Befehl in dein Terminal ein:

```bash
npm run build
```

Dadurch wird Astro beauftragt, deine Website zu erstellen und sie direkt auf der Festplatte zu speichern. Deine Anwendung steht nun im `dist/`-Verzeichnis für dich bereit.

## Veröffentliche dein Projekt

Astro-Webseiten sind statisch, sodass sie bei deinem bevorzugten Hoster veröffentlicht werden können:

- [AWS S3 bucket](https://aws.amazon.com/s3/)
- [Google Firebase](https://firebase.google.com/)
- [Netlify](https://www.netlify.com/)
- [Vercel](https://vercel.com/)
- [Erfahre mehr über die Veröffentlichung deines Projektes in unserem Astro Deploy guide.](/guides/deploy)

## Nächste Schritte

Du hast es geschafft! Du kannst jetzt mit dem Entwickeln beginnen!

Wir empfehlen dir, dass du dir etwas Zeit nimmst, um mit Astro vertraut zu werden. Am Besten indem du dir weitere Seiten unserer Dokumentation durchliest. Hier ein paar Empfehlungen:

📚 Lerne mehr über Astro’s [Projektstruktur.](/core-concepts/project-structure)

📚 Lerne mehr über Astro’s Komponenten-Syntax in unserem [Astro-Komponenten-Handbuch.](/core-concepts/astro-components)

📚 Lerne mehr über Astro’s dateibasiertes Routing in unserem [Routing-Handbuch.](core-concepts/astro-pages)
