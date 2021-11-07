---
layout: ~/layouts/MainLayout.astro
title: Installation
description: So installieren Sie Astro mit NPM, PNPM oder Yarn.
---

Es gibt verschiedene Möglichkeiten, Astro in einem neuen Projekt zu installieren.

## Voraussetzungen

- **Node.js** - `v12.20.0`, `v14.13.1`, `v16.0.0`, or höher.
- **Texteditor** - WIr empfehlen [VS Code](https://code.visualstudio.com/) mit unserer [Offiziellen Astro Erweiterung](https://marketplace.visualstudio.com/items?itemName=astro-build.astro-vscode).
- **Terminal** - Auf Astro wird hauptsächlich über die Befehlszeile des Terminals zugegriffen.

Zu Demonstrationszwecken verwenden wir in den folgenden Beispielen [`npm`](https://www.npmjs.com/), aber Sie können auch [`yarn`](https://yarnpkg.com/) oder [`pnpm`](https://pnpm.io/) verwenden, wenn Sie eine npm-Alternative bevorzugen.

## Projekt mit Astro erzeugen

`npm init astro` ist der einfachste Weg, Astro in einem neuen Projekt zu installieren. Führen Sie diesen Befehl in Ihrem Terminal aus, um unseren `create-astro`-Installationsassistenten zu starten, der Ihnen bei der Einrichtung eines neuen Projekts hilft.

```shell
# Mit NPM
npm init astro

# Yarn
yarn create astro

# Pnpm
pnpm create astro
```

Der [`create-astro`](https://github.com/snowpackjs/astro/tree/main/packages/create-astro) Assistent lässt Sie aus einer Reihe von [Starter-Vorlagen](https://github.com/snowpackjs/astro/tree/main/examples) wählen. Alternativ können Sie auch Ihr eigenes Astro-Projekt direkt von GitHub importieren.

```bash
# Hinweis: Ersetzen Sie "my-astro-project" durch den Namen Ihres Projekts.

# npm 6.x
npm init astro my-astro-project --template starter
# npm 7+ (zusätzliche Bindestriche sind erforderlich)
npm init astro my-astro-project -- --template starter
# yarn
yarn create astro my-astro-project --template starter
# pnpm
pnpm create astro my-astro-project --template starter
# Verwenden einer Drittanbietervorlage
npm init astro my-astro-project -- --template [GITHUB_USER]/[REPO_NAME]
# Verwenden einer Drittanbietervorlage innerhalb eines repos
npm init astro my-astro-project -- --template [GITHUB_USER]/[REPO_NAME]/path/to/template
```

Nachdem `create-astro` Ihr Projekt vorbereitet hat, denken Sie daran, Ihre Projektabhängigkeiten mit npm oder dem Paketmanager Ihrer Wahl zu installieren. In diesem Beispiel verwenden wir npm:

```bash
npm install
```

Sie können Ihr Astro-Projekt nun [Starten](#start-astro). Nachdem Sie Ihr Astro-Projekt fertiggestellt haben, können Sie Ihr Projekt [Bauen](#build-astro). Astro wird dann die statischen Seiten generieren und für Sie bereitstellen, welche Sie anschließend bei Ihrem bevorzugten Hosting-Anbieter [Ausrollen](/guides/deploy) können.


## Manuelle Installation

Sie können Astro auch ohne die Hilfe des `create-astro` Assistenten einrichten. Nachfolgend sind die wenigen zusätzlichen Schritte aufgeführt, die erforderlich sind, um Astro zum Laufen zu bringen. 

### Ihr Projekt aufsetzen

```bash
# Verzeichnis erzeugen und hinein wechseln
mkdir my-astro-project
cd my-astro-project
```

Erstellen Sie ein leeres Verzeichnis mit dem Namen Ihres Projekts und navigieren Sie dann in dieses:

### `package.json` erzeugen

```bash
# Dieser Befehl erstellt eine grundlegende package.json Datei für Sie 
npm init --yes
```

Astro wurde entwickelt, um mit dem gesamten npm-Paket-Ökosystem zu arbeiten. Dies wird durch ein Projektmanifest im Stammverzeichnis Ihres Projekts verwaltet, das als `package.json` bekannt ist. Wenn Sie mit der Datei `package.json` nicht vertraut sind, empfehlen wir Ihnen dringend, sich ein wenig einzulesen [npm-Dokumentation] (https://docs.npmjs.com/creating-a-package-json-file). 

### Astro installieren

Wenn Sie die obigen Anweisungen ausgeführt haben, sollten Sie ein Verzeichnis mit einer einzelnen `package.json` Datei darin haben. Sie können Astro jetzt in Ihrem Projekt einrichten. 

```bash
npm install astro
```
Sie können jetzt den Platzhalter-Abschnitt "scripts" Ihrer `package.json` Datei, welche durch `npm init` für Sie erstellt wurde, durch Folgendes ersetzen: 

```diff
  "scripts": {
-    "test": "echo \"Error: no test specified\" && exit 1"
+    "dev": "astro dev",
+    "build": "astro build",
+    "preview": "astro preview"
  },
}
```
Der Befehl [`dev`](#start-astro) startet den Astro Entwicklungs Server auf `http://localhost:3000`. Sobald Ihr Projekt fertig ist, generiert der Befehl [`build`](#build-astro) Ihr fertiges Projekt in das Verzeichnis `dist/` . [Lesen Sie mehr über das Ausrollen im Deployment Leitfaden.](/guides/deploy) 

### Erstellen Sie Ihre erste Seite


Öffnen Sie Ihren bevorzugten Texteditor und erstellen Sie eine neue Datei in Ihrem Projekt: 

1. Erstellen Sie eine neue Datei unter `src/pages/index.astro`
2. Kopieren Sie den folgenden Code-Schnipsel (einschließlich `---` Bindestriche) und fügen Sie ihn ein. 

```astro
---
// JavaScript/TypeScript-Code, der zwischen dem (---) Bindestrichen geschrieben wurde, wird ausschließlich auf dem Server ausgeführt!
console.log('Sehen Sie mich im Terminal ')
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
 console.log('Sehen Sie mich in den devTools')
</script>
```

Oben ist ein Beispiel für die Syntax von Astro-Komponenten, die sowohl HTML als auch JSX umfasst.

Sie können weitere Seiten im Verzeichnis `src/pages` erstellen - Astro verwendet den Dateinamen, um neue Seiten auf Ihrer Site zu erstellen. Durch das Erstellen einer neuen Datei unter `src/pages/about.astro` (der voherige Code-Schnipsel kann wiedervewendet werden) generiert Astro beispielsweise eine neue Seite unter der URL: `http://localhost/about` 


## [Astro starten](#start-astro)

```bash
npm run dev
```

Astro stellt nun Ihre Anwendung auf `http://localhost:3000` bereit. Wenn Sie diese URL in Ihrem Browser öffnen, sollten Sie das „Hello, World“ von Astro sehen. 

Wenn Sie Ihren Entwicklungsfortschritt im lokalen Netzwerk teilen oder die App von einem Telefon aus testen möchten, fügen Sie einfach die folgende Option [snowpack](https://www.snowpack.dev/reference/configuration#devoptionshostname) zu `astro.config.mjs`: 

```js
devOptions: {
  hostname: '0.0.0.0';
}
```

## [Astro bauen](#build-astro)

```bash
npm run build
```

Dadurch wird Astro angewiesen, Ihre Site zu erstellen und direkt auf der Festplatte zu speichern. Ihre Anwendung steht nun im Verzeichnis `dist/` bereit.

## Nächste Schritte

Erfolg! Sie können jetzt mit der Entwicklung beginnen!

Wir empfehlen Ihnen dringend, sich mit der Funktionsweise von Astro vertraut zu machen. Sie können dies tun, indem Sie unsere Dokumentation weiter erkunden. Wir empfehlen Ihnen insbesondere folgende weiterführende Informationen:

📚 Erfahren Sie mehr über die Projektstruktur von Astro in unserem [Leitfaden zur Projektstruktur.](/core-concepts/project-structure)

📚 Erfahren Sie mehr über die Komponentensyntax von Astro in unserem [Leitfaden zu Astro Components.](/core-concepts/astro-components) 

📚 Erfahren Sie mehr über das dateibasierte Routing von Astro in unserem [Routing-Leitfaden.](core-concepts/astro-pages)
