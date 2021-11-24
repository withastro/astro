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

Zu Demonstrationszwecken verwenden wir in den folgenden Beispielen [`npm`](https://www.npmjs.com/), aber Du kannst auch [`yarn`](https://yarnpkg.com/) oder [`pnpm`](https://pnpm.io/) verwenden, wenn Du eine Alternative zu npm bevorzugst.

## Projekt mit Astro erzeugen

`npm init astro` ist der einfachste Weg, Astro in einem neuen Projekt zu installieren. Führe den Befehl in Deinem Terminal aus, um unseren `create-astro`-Installationsassistenten zu starten, der Dir bei der Einrichtung eines neuen Projektes hilft.

```shell
# Mit NPM
npm init astro

# Yarn
yarn create astro

# Pnpm
pnpm create astro
```

Mit dem [`create-astro`](https://github.com/withastro/astro/tree/main/packages/create-astro) Assistenten kannst Du aus einer Reihe von [Starter-Vorlagen](https://github.com/withastro/astro/tree/main/examples) wählen. Alternativ kannst Du auch Dein eigenes Astro-Projekt direkt von GitHub importieren.

```bash
# Hinweis: Ersetze "my-astro-project" durch den Namen Deines Projekts.

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
# Verwenden einer Drittanbietervorlage innerhalb eines Repos
npm init astro my-astro-project -- --template [GITHUB_USER]/[REPO_NAME]/path/to/template
```

Nachdem `create-astro` Dein Projekt vorbereitet hat, denke daran, die Projektabhängigkeiten mit npm oder dem Paketmanager Deiner Wahl zu installieren. In diesem Beispiel verwenden wir npm:

```bash
npm install
```

Du kannst Dein Astro-Projekt nun [starten](#start-astro). Nachdem Du Dein Astro-Projekt fertiggestellt hast, kannst Du Dein Projekt [bauen](#build-astro). Astro wird dann die statischen Seiten generieren und für Dich bereitstellen, welche Du anschließend bei Deinem bevorzugten Hosting-Anbieter [ausrollen](/guides/deploy) kannst.

## Manuelle Installation

Du kannst Astro auch ohne die Hilfe des `create-astro` Assistenten einrichten. Nachfolgend sind die wenigen zusätzlichen Schritte aufgeführt, die erforderlich sind, um Astro zum Laufen zu bringen.

### Dein Projekt aufsetzen

```bash
# Verzeichnis erzeugen und hinein wechseln
mkdir my-astro-project
cd my-astro-project
```

Erstelle ein leeres Verzeichnis mit dem Namen Deines Projekts und navigiere dann in dieses:

### `package.json` erzeugen

```bash
# Dieser Befehl erstellt eine grundlegende package.json Datei für Dich
npm init --yes
```

Astro wurde entwickelt, um mit dem gesamten npm-Paket-Ökosystem zu arbeiten. Dies wird durch ein Projektmanifest im Stammverzeichnis des Projektes verwaltet, das als `package.json` bekannt ist. Wenn Du mit der Datei `package.json` nicht vertraut bist, empfehlen wir Dir dringend, Dich ein wenig einzulesen [npm-Dokumentation] (https://docs.npmjs.com/creating-a-package-json-file).

### Astro installieren

Wenn Du die obigen Anweisungen ausgeführt hast, solltest Du ein Verzeichnis mit einer einzelnen `package.json` Datei darin haben. Du kannst Astro jetzt in Deinem Projekt einrichten.

```bash
npm install astro
```

Du kannst jetzt den Platzhalter-Abschnitt "scripts" Deiner `package.json` Datei, welche durch `npm init` für Dich erstellt wurde, durch folgende Zeilen ersetzen:

```diff
  "scripts": {
-    "test": "echo \"Error: no test specified\" && exit 1"
+    "dev": "astro dev",
+    "build": "astro build",
+    "preview": "astro preview"
  },
}
```

Der Befehl [`dev`](#start-astro) startet den Astro Entwicklungs Server auf `http://localhost:3000`. Sobald Dein Projekt fertig ist, generiert der Befehl [`build`](#build-astro) Dein fertiges Projekt in das Verzeichnis `dist/`. [Lies mehr über das Veröffentlichen im Deployment-Leitfaden.](/guides/deploy)

### Erstelle Deine erste Seite

Öffne Deinen bevorzugten Texteditor und erstelle eine neue Datei in Deinem Projekt:

1. Erstelle eine neue Datei unter `src/pages/index.astro`
2. Kopiere den folgenden Code-Schnipsel (einschließlich der Bindestriche `---`) und füge ihn ein.

```astro
---
// JavaScript/TypeScript-Code, der zwischen den (---) Bindestrichen geschrieben wurde, wird ausschließlich auf dem Server ausgeführt!
console.log('Sieh mich im Terminal.');
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
 // Hier eingegebener JS-Code wird vollständig im Browser ausgeführt:
 console.log('Sieh mich in den DevTools / WebInspector.')
</script>
```

Oben ist ein Beispiel für die Syntax von Astro-Komponenten, die sowohl HTML als auch JSX umfasst.

Du kannst weitere Seiten im Verzeichnis `src/pages` erstellen - Astro verwendet den Dateinamen, um neue Seiten auf Deiner Seite zu erstellen. Durch das Erstellen einer neuen Datei unter `src/pages/about.astro` (der voherige Code-Schnipsel kann wiedervewendet werden) generiert Astro beispielsweise eine neue Seite unter der URL: `http://localhost/about`

## [Astro starten](#start-astro)

```bash
npm run dev
```

Astro stellt nun Deine Anwendung auf `http://localhost:3000` bereit. Wenn Du diese URL in Deinem Browser öffnest, solltest Du das „Hello, World“ von Astro sehen.

Wenn Du Deinen Entwicklungsfortschritt im lokalen Netzwerk teilst, oder die App von einem Telefon aus testen möchtest, füge einfach die folgende Option [snowpack](https://www.snowpack.dev/reference/configuration#devoptionshostname) zu `astro.config.mjs`:

```js
devOptions: {
  hostname: '0.0.0.0';
}
```

## [Astro bauen](#build-astro)

```bash
npm run build
```

Dadurch wird Astro angewiesen, Deine Seite zu erstellen und direkt auf der Festplatte zu speichern. Deine Anwendung steht nun im Verzeichnis `dist/` bereit.

## Nächste Schritte

Erfolg! Du kannst jetzt mit der Entwicklung beginnen!

Wir empfehlen Dir dringend, Dich mit der Funktionsweise von Astro vertraut zu machen. Du kannst dies tun, indem Du unsere weitere Dokumentation erkundest. Wir empfehlen Dir insbesondere folgende weiterführende Informationen:

📚 Erfahre mehr über die Projektstruktur von Astro in unserem [Leitfaden zur Projektstruktur.](/core-concepts/project-structure)

📚 Erfahre mehr über die Komponentensyntax von Astro in unserem [Leitfaden zu Astro Components.](/core-concepts/astro-components)

📚 Erfahre mehr über das dateibasierte Routing von Astro in unserem [Routing-Leitfaden.](core-concepts/astro-pages)
