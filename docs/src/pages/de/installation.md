---
layout: ~/layouts/MainLayout.astro
title: Installation
description: So installierst du Astro mit NPM, PNPM oder Yarn.
---

Es gibt verschiedene Möglichkeiten, Astro in einem neuen Projekt zu installieren.

## Voraussetzungen

- **Node.js** - `v12.20.0`, `v14.13.1`, `v16.0.0`, or höher.
- **Texteditor** - Wir empfehlen [VS Code](https://code.visualstudio.com/) mit unserer [Offiziellen Astro Erweiterung](https://marketplace.visualstudio.com/items?itemName=astro-build.astro-vscode).
- **Terminal** - Auf Astro wird hauptsächlich über die Befehlszeile des Terminals zugegriffen.

Zu Demonstrationszwecken verwenden wir in den folgenden Beispielen [`npm`](https://www.npmjs.com/), aber du kannst auch [`yarn`](https://yarnpkg.com/) oder [`pnpm`](https://pnpm.io/) verwenden, wenn du eine npm-alternative bevorzugst.

## Projekt mit Astro erzeugen

`npm init astro` ist der einfachste Weg, Astro in einem neuen Projekt zu installieren. Führe den Befehl in deinem Terminal aus, um unseren `create-astro`-Installationsassistenten zu starten, der dir bei der Einrichtung eines neuen Projekts hilft.

```shell
# Mit NPM
npm init astro

# Yarn
yarn create astro

# Pnpm
pnpm create astro
```

Mit dem [`create-astro`](https://github.com/snowpackjs/astro/tree/main/packages/create-astro) Assistenten kannst du aus einer Reihe von [Starter-Vorlagen](https://github.com/snowpackjs/astro/tree/main/examples) wählen. Alternativ kannst du auch dein eigenes Astro-Projekt direkt von GitHub importieren.

```bash
# Hinweis: Ersetze "my-astro-project" durch den Namen deines Projekts.

# npm 6.x
npm init astro my-astro-project --template starter
# npm 7+ (zusätzliche Bindestriche sind erforderlich)
npm init astro my-astro-project -- --template starter
# yarn
yarn create astro my-astro-project --template starter
# pnpm
pnpm create astro my-astro-project -- --template starter
# Verwenden einer Drittanbietervorlage
npm init astro my-astro-project -- --template [GITHUB_USER]/[REPO_NAME]
# Verwenden einer Drittanbietervorlage innerhalb eines repos
npm init astro my-astro-project -- --template [GITHUB_USER]/[REPO_NAME]/path/to/template
```

Nachdem `create-astro` dein Projekt vorbereitet hat, denke daran, die Projektabhängigkeiten mit npm oder dem Paketmanager deiner Wahl zu installieren. In diesem Beispiel verwenden wir npm:

```bash
npm install
```

Du kannst dein Astro-Projekt nun [Starten](#start-astro). Nachdem du dein Astro-Projekt fertiggestellt hast, kannst du dein Projekt [Bauen](#build-astro). Astro wird dann die statischen Seiten generieren und für dich bereitstellen, welche du anschließend bei deinem bevorzugten Hosting-Anbieter [Ausrollen](/guides/deploy) kannst.

## Manuelle Installation

Du kannst Astro auch ohne die Hilfe des `create-astro` Assistenten einrichten. Nachfolgend sind die wenigen zusätzlichen Schritte aufgeführt, die erforderlich sind, um Astro zum Laufen zu bringen.

### Dein Projekt aufsetzen

```bash
# Verzeichnis erzeugen und hinein wechseln
mkdir my-astro-project
cd my-astro-project
```

Erstelle ein leeres Verzeichnis mit dem Namen deines Projekts und navigiere dann in dieses:

### `package.json` erzeugen

```bash
# Dieser Befehl erstellt eine grundlegende package.json Datei für dich
npm init --yes
```

Astro wurde entwickelt, um mit dem gesamten npm-Paket-Ökosystem zu arbeiten. Dies wird durch ein Projektmanifest im Stammverzeichnis Ihres Projekts verwaltet, das als `package.json` bekannt ist. Wenn du mit der Datei `package.json` nicht vertraut bist, empfehlen wir dir dringend, dich ein wenig einzulesen [npm-Dokumentation] (https://docs.npmjs.com/creating-a-package-json-file).

### Astro installieren

Wenn du die obigen Anweisungen ausgeführt hast, solltest du ein Verzeichnis mit einer einzelnen `package.json` Datei darin haben. Du kannst Astro jetzt in deinem Projekt einrichten.

```bash
npm install astro
```

Du kannst jetzt den Platzhalter-Abschnitt "scripts" deiner `package.json` Datei, welche durch `npm init` für dich erstellt wurde, durch Folgendes ersetzen:

```diff
  "scripts": {
-    "test": "echo \"Error: no test specified\" && exit 1"
+    "dev": "astro dev",
+    "build": "astro build",
+    "preview": "astro preview"
  },
}
```

Der Befehl [`dev`](#start-astro) startet den Astro Entwicklungs Server auf `http://localhost:3000`. Sobald dein Projekt fertig ist, generiert der Befehl [`build`](#build-astro) dein fertiges Projekt in das Verzeichnis `dist/`. [Lese mehr über das Veröffentlichen im Deployment Leitfaden.](/guides/deploy)

### Erstelle deine erste Seite

Öffne deinen bevorzugten Texteditor und erstelle eine neue Datei in deinem Projekt:

1. Erstelle eine neue Datei unter `src/pages/index.astro`
2. Kopiere den folgenden Code-Schnipsel (einschließlich der Bindestriche `---`) und füge ihn ein.

```astro
---
// JavaScript/TypeScript-Code, der zwischen den (---) Bindestrichen geschrieben wurde, wird ausschließlich auf dem Server ausgeführt!
console.log('Sieh mich mich im Terminal ')
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
 // Hier eingegebener JS-Code wird vollständig im Browser ausgeführt
 console.log('Sieh mich in den devTools')
</script>
```

Oben ist ein Beispiel für die Syntax von Astro-Komponenten, die sowohl HTML als auch JSX umfasst.

Du kannst weitere Seiten im Verzeichnis `src/pages` erstellen - Astro verwendet den Dateinamen, um neue Seiten auf deiner Seite zu erstellen. Durch das Erstellen einer neuen Datei unter `src/pages/about.astro` (der voherige Code-Schnipsel kann wiedervewendet werden) generiert Astro beispielsweise eine neue Seite unter der URL: `http://localhost/about`

## [Astro starten](#start-astro)

```bash
npm run dev
```

Astro stellt nun deine Anwendung auf `http://localhost:3000` bereit. Wenn du diese URL in deinem Browser öffnest, solltest du das „Hello, World“ von Astro sehen.

Wenn Du deinen Entwicklungsfortschritt im lokalen Netzwerk teilst oder die App von einem Telefon aus testen möchtest, füge einfach die folgende Option [snowpack](https://www.snowpack.dev/reference/configuration#devoptionshostname) zu `astro.config.mjs`:

```js
devOptions: {
  hostname: '0.0.0.0';
}
```

## [Astro bauen](#build-astro)

```bash
npm run build
```

Dadurch wird Astro angewiesen, deine Seite zu erstellen und direkt auf der Festplatte zu speichern. Deine Anwendung steht nun im Verzeichnis `dist/` bereit.

## Nächste Schritte

Erfolg! Du kannst jetzt mit der Entwicklung beginnen!

Wir empfehlen dir dringend, dich mit der Funktionsweise von Astro vertraut zu machen. Du kannst dies tun, indem du unsere Dokumentation weiter erkundest. Wir empfehlen dir insbesondere folgende weiterführende Informationen:

📚 Erfahre mehr über die Projektstruktur von Astro in unserem [Leitfaden zur Projektstruktur.](/core-concepts/project-structure)

📚 Erfahre mehr über die Komponentensyntax von Astro in unserem [Leitfaden zu Astro Components.](/core-concepts/astro-components)

📚 Erfahre mehr über das dateibasierte Routing von Astro in unserem [Routing-Leitfaden.](core-concepts/astro-pages)
