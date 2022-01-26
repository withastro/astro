---
layout: ~/layouts/MainLayout.astro
title: Schnellstart
description: Die einfachste Weg schnell mit Astro loszulegen.
---

```shell
# Vorbereitung: Überprüfe, ob Node.js die Version 14.15.0+, oder 16+ ist
node --version

# Erstelle einen neues Projektverzeichnis und navigiere direkt dorthin
mkdir mein-astro-projekt && cd $_

# Bereite dich auf den Start vor
npm init astro

# Installiere benötigte Pakete
npm install

# Beginne mit dem Entwickeln!
npm run dev
```

Export - fertig zum Veröffentlichen:

```shell
# Wenn du soweit bist, exportiere deine Site nach `dist/`
npm run build
```

Um mehr über den Installationsprozess und den ersten Einsatz von Astro zu lernen [lies unsere Installationsanleitung](/de/installation).

Wenn du es bevorzugst anhand eines Beispiels zu lernen, werfe einen Blick auf die [komplette Liste der Beispiele](https://github.com/withastro/astro/tree/main/examples) auf GitHub.  
Du kannst jedes dieser Beispiele ausprobieren, indem du `npm init astro -- --template "BEISPIEL_NAME"` ausführst.

## Starte dein Projekt

In deinem Projektverzeichnis führe den folgenden Befehl in deinem Terminal aus:

```bash
npm run dev
```

Astro wird von nun an deine Anwendung unter [http://localhost:3000](http://localhost:3000) bereitstellen. Wenn du diese URL in deinem Browser öffnest, solltest du Astros "Hello, World" sehen.

Der Server wird nun auf alle Änderungen in deinem `src/`-Verzeichnisch lauschen, sodass du deine Anwendung nicht nach jeder Änderung neu starten musst.

## Kompiliere dein Projekt

In deinem Projektverzeichnis führe den folgenden Befehl in deinem Terminal aus:

```bash
npm run build
```

Dies weist Astro an deine Site zu erstellen und direkt zu speichern. Deine Anwendung steht nun im `dist/`-Verzeichnis bereit.

## Veröffentliche dein Projekt

Astro-Sites sind statisch, sodass sie ganz einfach bei deinem bevorzugten Hoster veröffentlicht werden können:

- [AWS S3 bucket](https://aws.amazon.com/s3/)
- [Google Firebase](https://firebase.google.com/)
- [Netlify](https://www.netlify.com/)
- [Vercel](https://vercel.com/)
- [Erfahre mehr über das Veröffentlichen von Astro-Builds](/guides/deploy).

## Nächste Schritte

Geschafft! Du kannst jetzt mit dem Entwickeln beginnen!

Wir möchten dich ermutigen, dir etwas Zeit zu nehmen, um mit der Art und Weise vertraut zu werden, wie Astro funktioniert. Am besten befasst du dich weitergehend mit der Dokumentation. Hier ein paar Empfehlungen:

📚 Lerne mehr über die Projektstruktur in Astro in unserem [Artikel zur Projektstruktur](/de/core-concepts/project-structure)

📚 Lerne mehr über die Komponenten-Syntax in Astro in unserem [Artikel zu Astro-Komponenten](/de/core-concepts/astro-components)

📚 Lerne mehr über das dateibasierte Routing in Astro in unserem [Artikel zu Astro-Seiten](/de/core-concepts/astro-pages) und unserem [Artikel über Routing](/de/core-concepts/routing).
