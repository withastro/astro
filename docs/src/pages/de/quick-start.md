---
layout: ~/layouts/MainLayout.astro
title: Schnellstart
description: Die einfachste Weg schnell mit Astro loszulegen.
---

```shell
# Vorbereitung: Überprüfe, ob Node.js 12.20.0+, 14.13.1+, oder 16+ ist
node --version

# Erstelle einen neuen Projektordner und navigiere direkt dorthin
mkdir my-astro-project && cd $_

# Bereite dich auf den Start vor
npm init astro

# Installiere benötigte Pakete
npm install

# Beginne mit dem Entwickeln!
npm run dev
```

Export für die Produktion:

```shell
# Wenn du soweit bist - exportiere deine Site nach `dist/`
npm run build
```

Um mehr über den Installationsprozess und den ersten Einsatz von Astro zu lernen [lies unsere Installationsanleitung](de/installation).

Wenn du bevorzugst anhand eines Beispiels zu lernen, wirf einen Blick auf die [komplette Liste der Beispiele](https://github.com/snowpackjs/astro/tree/main/examples) auf GitHub.
Du kannst jedes dieser Beispiele ausprobieren, indem du `npm init astro -- --template "EXAMPLE_NAME"` ausführst.

## Starte dein Projekt

In deinem Projektverzeichnis führe den folgenden Befehl in deinem Terminal aus:

```bash
npm run dev
```

Astro wird von nun an deine Anwendung unter [http://localhost:3000](http://localhost:3000) bereitstellen. Wenn du diese URL in deinem Browser öffnest, solltest du Astros "Hello, World" sehen.

Der Server wird nun auf alle Änderungen in deinem `src/`-Verzeichnisch lauschen, sodass du deine Anwendung nicht nach jeder Änderung neu starten mussst. 

## Kompiliere dein Projekt

In deinem Projektverzeichnis führe den folgenden Befehl in deinen Terminal aus:

```bash
npm run build
```

Dies weist Astro an deine Site zu erstellen und direkt zu speichern. Deine Anwendung steht nun im `dist/`-Verzeichnis bereit.

## Veröffentliche dein Projekt

Astro-Sites sind statisch, sodass sie bei deinem bevorzugten Hoster veröffentlicht werden können:

- [AWS S3 bucket](https://aws.amazon.com/s3/)
- [Google Firebase](https://firebase.google.com/)
- [Netlify](https://www.netlify.com/)
- [Vercel](https://vercel.com/)
- [Erfahre mehr über das Veröffentlichen in Astro in der Anleitung zum Veröffentlichen](/guides/deploy).

## Nächste Schritte

Geschafft! Du kannst jetzt mit der Entwicklung beginnen!

Wir empfehlen dir, dir etwas Zeit zu nehmen, um mit der Art und Weise vertraut zu werden wie Astro funktioniert. Am besten ist, wenn du dich weiterführend mit der Dokumentation vertraut machst. Hier ein paar Empfehlungen:

📚 Lerne mehr über Astros Projektstruktur in unserer [Anleitung zur Projektstruktur.](/core-concepts/project-structure)

📚 Lerne mehr über Astros Komponenten-Syntax in unserem [Astro-Komponenten-Anleitung.](/core-concepts/astro-components)

📚 Lerne mehr über Astros dateibasiertes Routing in unserem [Routing-Anleitung.](core-concepts/astro-pages)
