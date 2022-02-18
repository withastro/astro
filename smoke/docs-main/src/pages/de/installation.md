---
layout: ~/layouts/MainLayout.astro
title: Installation
description: So installierst du Astro mit NPM, PNPM oder Yarn.
---

Es gibt verschiedene Möglichkeiten Astro mit einem neuen Projekt zu installieren.

## Vorbereitungen

- **Node.js** - `v14.15.0`, `v16.0.0` oder höher
- **Texteditor** - Wir empfehlen [VS Code](https://code.visualstudio.com/) mit unserer [offiziellen Astro-Erweiterung](https://marketplace.visualstudio.com/items?itemName=astro-build.astro-vscode)
- **Terminal** - Astro wird im Wesentlichen über die Befehlszeile des Terminals gesteuert

Zu Demonstrationszwecken verwenden wir in den folgenden Beispielen [`npm`](https://www.npmjs.com/), aber du kannst ebenso [`yarn`](https://yarnpkg.com/) oder [`pnpm`](https://pnpm.io/) verwenden, falls du eine npm-Alternative bevorzugst.

## Astro-Projekt erzeugen

`npm init astro` ist der einfachste Weg in einem neuen Projekt Astro zu installieren. Führe diesen Befehl in deinem Terminal aus, um unseren `create-astro`-Installationsassistenten zu starten, der dich bei der Einrichtung eines neuen Projekts unterstützt.

```shell
# Mit NPM
npm init astro

# Yarn
yarn create astro

# Pnpm
pnpm create astro
```

Der [`create-astro`](https://github.com/withastro/astro/tree/main/packages/create-astro)-Assistent lässt dich aus einer Reihe von [Start-Vorlagen](https://github.com/withastro/astro/tree/main/examples) auswählen. Alternativ könntest du auch dein eigenes Astro-Projekt direkt aus GitHub heraus importieren.

```bash
# Hinweis: Ersetze "mein-astro-projekt" durch den Namen deines Projekts.

# npm 6.x
npm init astro mein-astro-projekt --template starter
# npm 7+ (zusätzliche Bindestriche sind erforderlich)
npm init astro mein-astro-projekt -- --template starter
# yarn
yarn create astro mein-astro-projekt --template starter
# pnpm
pnpm create astro mein-astro-projekt -- --template starter
# Verwenden einer Drittanbietervorlage
npm init astro mein-astro-projekt -- --template [GITHUB_NAME]/[REPO_NAME]
# Verwenden einer Drittanbietervorlage innerhalb eines Repos
npm init astro mein-astro-projekt -- --template [GITHUB_NAME]/[REPO_NAME]/pfad/zur/vorlage
```

Nachdem `create-astro` dein Projekt eingerichtet hat, denke daran die Abhängigkeiten deines Projekts mittels npm oder dem Paketmanager deiner Wahl zu installieren. In diesem Beispiel verwenden wir npm:

```bash
npm install
```

Du kannst dein Astro-Projekt nun [starten](#start-astro). Sobald du dein Astro-Projekt fertiggestellt hast, kannst du dein Projekt [kompilieren](#build-astro). Astro wird dann deine Anwendung fertig packen und dafür die statischen Seiten generieren, die du bei deinem bevorzugten Hosting-Anbieter [veröffentlichen](/guides/deploy) kannst.

## Manuelle Installation

Du kannst Astro auch ohne die Hilfe des `create-astro`-Assistenten einrichten. Nachfolgend findest du die wenigen zusätzlichen Schritte, die erforderlich sind, um Astro zum Laufen zu bringen.

### Setze dein Projekt auf

```bash
# Verzeichnis erzeugen und in das Verzeichnis wechseln
mkdir mein-astro-projekt
cd mein-astro-projekt
```

Erstelle ein leeres Verzeichnis mit dem Namen deines Projekts und navigiere dann dorthin.

### Erzeuge `package.json`

```bash
# Dieser Befehl erstellt eine grundlegende package.json-Datei für dich
npm init --yes
```

Astro ist darauf ausgerichtet mit dem gesamten npm-Paket-Ökosystem zu arbeiten. Diese Arbeit wird durch ein Projektmanifest im Stammverzeichnis deines Projekts verwaltet, das als `package.json` bekannt ist. Für den Fall, dass du mit der `package.json`-Datei nicht vertraut bist, empfehlen wir dir dich kurz dazu in der [npm-Dokumentation] (https://docs.npmjs.com/creating-a-package-json-file) einzulesen.

### Installiere Astro

Soweit du den obigen Anweisungen gefolgt bist, solltest du ein Verzeichnis mit einer einzelnen `package.json`-Datei darin haben. Du kannst Astro jetzt in deinem Projekt aufsetzen.

```bash
npm install astro
```

Jetzt kannst du den Platzhalter im Abschnitt "scripts" deiner `package.json`-Datei, die `npm init` für dich erstellt hat, durch Folgendes ersetzen:

```diff
  "scripts": {
-    "test": "echo \"Error: no test specified\" && exit 1"
+    "dev": "astro dev",
+    "build": "astro build",
+    "preview": "astro preview"
  },
}
```

Der Befehl [`dev`](#start-astro) startet den Astro Entwicklungsserver auf `http://localhost:3000`. Sobald dein Projekt fertig ist, gibt der Befehl [`build`](#build-astro) dein Projekt in das Verzeichnis `dist/` aus. [Lese mehr über das Veröffentlichen von Astro-Builds](/guides/deploy).

### Erstelle deine erste Seite

Öffne deinen bevorzugten Texteditor und erstelle eine neue Datei in deinem Projekt:

1. Erstelle eine neue Datei unter `src/pages/index.astro`.
2. Kopiere den folgenden Code-Schnipsel (einschließlich der Bindestriche `---`) und füge ihn ein.

```astro
---
// JS/TS-Code, der zwischen den (---) Bindestrichen geschrieben wurde,
// wird ausschließlich auf dem Server ausgeführt!
console.log('Du siehst mich im Terminal')
---

<html>
  <body>
    <h1>Hello, World!</h1>
  </body>
</html>

<style lang='css||scss'>
  body{
    h1{
      color:orange;
    }
  }
</style>

<script>
 // Hier eingegebener JS-Code wird ausschließlich im Browser ausgeführt
 console.log('Du siehst mich in den devTools')
</script>
```

Das Obige ist ein Beispiel für Astros Komponenten-Syntax, die sowohl HTML als auch JSX umfasst.

Du kannst weitere Seiten im Verzeichnis `src/pages` erstellen - Astro verwendet den Dateinamen, um neue Seiten für deine Site zu erzeugen. Zum Beispiel wird Astro durch das Erzeugen einer neuen Datei unter `src/pages/about.astro` (auch unter Wiederverwendung des Code-Schnipsels) eine neue Seite unter der URL `http://localhost/about` generieren.

## [Starte Astro](#start-astro)

```bash
npm run dev
```

Astro wird von nun an deine Anwendung unter `http://localhost:3000` bereitstellen. Wenn du diese URL in deinem Browser öffnest, solltest du Astros "Hello, World" sehen.

Falls du deinen Entwicklungsfortschritt im lokalen Netzwerk teilen oder die Anwendung von einem Telefon aus testen möchtest, füge einfach die folgende Option in `astro.config.mjs` hinzu:

```js
devOptions: {
  hostname: '0.0.0.0';
}
```

## [Kompiliere dein Projekt](#build-astro)

Führe in deinem Projektverzeichnis den folgenden Befehl im Terminal aus:

```bash
npm run build
```

Dies weist Astro an deine Site zu erstellen und direkt zu speichern. Deine Anwendung steht nun im `dist/`-Verzeichnis bereit.

## Nächste Schritte

Geschafft! Du kannst jetzt mit dem Entwickeln beginnen!

Wir möchten dich ermutigen, dir etwas Zeit zu nehmen, um mit der Art und Weise vertraut zu werden, wie Astro funktioniert. Am besten befasst du dich weitergehend mit der Dokumentation. Hier ein paar Empfehlungen:

📚 Lerne mehr über die Projektstruktur in Astro in unserem [Artikel zur Projektstruktur](/de/core-concepts/project-structure)

📚 Lerne mehr über die Komponenten-Syntax in Astro in unserem [Artikel zu Astro-Komponenten](/de/core-concepts/astro-components)

📚 Lerne mehr über das dateibasierte Routing in Astro in unserem [Artikel zu Astro-Seiten](/de/core-concepts/astro-pages) und unserem [Artikel über Routing](/de/core-concepts/routing).
