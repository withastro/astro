---
layout: ~/layouts/MainLayout.astro
title: Einführung
description: Eine einfache Einführung in Astro
lang: de
---

Astro ist ein moderner Static-Site-Renderer (auch SSG - Static-Site-Generator). Erfahre worum es bei Astro eigentlich geht auf [unserer Homepage](https://astro.build/), oder lies [unseren Release Blogpost](https://astro.build/blog/introducing-astro).

Diese Seite dient als Übersicht für die Astro-Dokumentation und alle damit verbundenen Ressourcen.

## Astro ausprobieren

Der einfachste Weg Astro auszuprobieren ist `npm init astro` in einem neuen Verzeichnis auf deinem Rechner auszuführen. Der CLI-Wizard wird dir helfen ein neues Astro-Projekt aufzusetzen.

Um in fünf einfachen Schritten mit Astro loszulegen, lies [unsere Schnellstart-Anleitung](/de/quick-start).

Alternativ kannst du unsere [Installationsanleitung](/de/installation) lesen, um eine ausführlichere Schritt-für-Schritt-Anleitung zu erhalten.

### Beispiel-Projekte

Falls du Astro lieber anhand von Beispielen kennenlernen möchtest, sieh dir unsere [vollständige Beispiel-Bibliothek](https://github.com/snowpackjs/astro/tree/main/examples) auf GitHub an.

Du kanst jedes dieser Beispiele lokal auf deinem Rechner ausprobieren, indem du `npm init astro` mit der CLI-Kennzeichnung `--template` im Terminal aufrufst. Die Kennzeichnung `--template` unterstützt auch externe Vorlagen und Vorlagen der Community.

```bash
# Rufe den Wizard zur Initialisierung auf und verwende diese offizielle Vorlage
npm init astro -- --template [OFFIZIELLES_BEISPIEL_NAME]
# Rufe den Wizard zur Initialisierung auf und verwende diese Community-Vorlage
npm init astro -- --template [GITHUB_NAME]/[REPO_NAME]
npm init astro -- --template [GITHUB_NAME]/[REPO_NAME]/pfad/zur/vorlage
```

### Online-Playgrounds

Falls du Astro gerne in deinem Browser ausprobieren willst, kannst du einen Online-Code-Editor wie z. B. Stackblitz, CodeSandbox, Gitpod oder GitHub Codespaces verwenden. Nutze den "Open in Stackblitz"-Link zu einem beliebigen Besipiel aus unserer [Beispiel-Bibliothek](https://github.com/snowpackjs/astro/tree/main/examples), oder [klicke hier](https://stackblitz.com/fork/astro), um ein neues Projekt in [Stackblitz](https://stackblitz.com/fork/astro) aufzusetzen.

## Astro lernen

Verschiedene Menschen mit unterschiedlichen Hintergründen und unterschiedlichen Lernansätzen kommen zu Astro. Gleichgültig ob du einen theoretischen oder einen praktischen Ansatz bevorzugst, wir hoffen, dass dieser Abschnitt hilfreich für dich ist.

- Falls du **praktisches Lernen** bevorzugst, starte direkt mit ein Beispiel aus unserer [Beispiel-Liste](https://github.com/snowpackjs/astro/tree/main/examples).
- Falls du bevorzugst **Schritt für Schritt zu lernen**, starte mit unseren [grundlegenden Konzepten und Anleitungen](/core-concepts/project-structure).

Wie jede unbekannte Technik, bringt Astro eine gewisse Lernkurve mit sich. Wir sind jedoch sicher, dass du mit ein bisschen Übung und Geduld schnell lernen _wirst_, wie Astro funktioniert.

### Lerne die `.astro`-Syntax

Wenn du anfängst mit Astro zu arbeiten, wirst du viele Dateien mit der Dateiendung `.astro` sehen. Das ist **Astros Komponenten-Syntax**: ein spezielles, HTML-ähnliches Dateiformat, welches Astro für Vorlagen benutzt. Es wurde in Anlehnung an HTML und JSX entworfen und sollte allen, die mit diesen Formaten Erfahrung haben, bekannt vorkommen.

Unsere unterstützende Anleitung zu [Astro-Komponenten](/core-concepts/astro-components) ist eine gute Einführung in die Astro-Syntax - und der beste Weg sie zu lernen.

### API-Referenz

Dieser Abschnitt der Dokumentation ist nützlich, wenn du weitere Details zu einer bestimmen Astro-API erhalten möchtest. Zum Besipiel listet die [Referenz zur Konfiguration](/reference/configuration-reference) alle möglichen Konfigurationseigenschaften auf, die dir zur Verfügung stehen. Die [Referenz zu integrierten Komponenten](/reference/builtin-components) listet alle verfügbaren Kernkomponenten wie z. B. `<Markdown />` und `<Code />` auf.

### Versionsdokumentation

Diese Dokumentation ist immer auf dem Stand der letzten _stabilen_ Version von Astro. Sobald wir den v1.0-Meilenstein erreicht haben, werden wir auch die Möglichkeit anbieten eine versionsspezifische Dokumentation einzusehen.

## Auf dem Laufenden bleiben

Der [@astrodotbuild](https://twitter.com/astrodotbuild) Twitter-Account ist die offizielle Quelle für Ankündigungen vom Astro-Team.

Zusätzlich veröffentlichen wir alle Ankündigungen in unserer [Discord-Community](https://astro.build/chat) im `#announcements`-Channel.

Nicht jedes Astro-Release verdient einen eigenen Blogpost, aber du kannst ein detailliertes Log aller Änderungen für jedes Release im [`CHANGELOG.md` des Astro Repository](https://github.com/snowpackjs/astro/blob/main/packages/astro/CHANGELOG.md) nachlesen.

## Fehlt etwas?

Falls etwas in der Dokumentation fehlt, oder falls du einen bestimmten Teil verwirrend findest, [erstelle bitte ein Issue](https://github.com/snowpackjs/astro/issues/new/choose) mit deinen Verbesserungsvorschlägen oder tweete an den [@astrodotbuild](https://twitter.com/astrodotbuild) Twitter-Account. Wir freuen uns, von dir zu hören!

## Credit

Diese Einführung basierte ursprünglich auf der Einführung zu [React](https://reactjs.org/).
