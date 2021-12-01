---
layout: ~/layouts/MainLayout.astro
title: Layouts
description: Eine Einführung in Layouts - eine Art Astro-Komponente, die für gemeinsame Layouts auf verschiedenen Seiten verwendet wird.
---

**Layouts** sind eine besondere Art der [Komponente](/core-concepts/astro-components) - sie können dir helfen gemeinsame Seiten-Layouts über dein Projekt verteilt zu nutzen.

Layouts verhalten sich so, wie andere mehrfach verwendbare Astro-Komponenten auch. Es gibt keine neue Syntax oder API zu erlernen. Allerdings sind mehrfach verwendbare Layouts ein so weit verbreitetes Modell im Bereich der Web-Entwicklung, dass wir diese Anleitung verfasst haben, um dich bei der Verwendung zu unterstützen.

## Anwendung

Astro-Layouts unterstützen Props, Slots und alle anderen Merkmale von Astro-Komponenten. Layouts sind letztendlich einfach normale Komponenten!

Anders als andere Komponenten enthalten Layouts allerdings oft auch die einfassenden Seitenelemente `<html>`, `<head>` und `<body>` (die so genannte **Page Shell**).

Es ist ein allgemein übliches Verfahren alle Layout-Komponenten unter einem einzigen `src/layouts`-Verzeichnis anzulegen.

## Beispiel

```astro
---
// src/layouts/BasisLayout.astro
const {title} = Astro.props;
---
<html>
  <head>
    <title>Beispiel-Layout: {title}</title>
  </head>
  <body>
    <!-- Fügt jeder Seite eine Navigationsleiste hinzu. -->
    <nav>
      <a href="#">Home</a>
      <a href="#">Posts</a>
      <a href="#">Kontakt</a>
    </nav>
    <!-- slot: Deine Seiteninhalte werden hier eingefügt. -->
    <slot />
  </body>
</html>
```

📚 Über das `<slot />`-Element lässt sich in Astro definieren, wo untergeordnete Elemente (die an das Layout übergeben werden) erscheinen sollen. Erfahre mehr darüber wie `<slot />` funktioniert in unserer [Anleitung zu Astro-Komponenten](/core-concepts/astro-components).

Sobald du dein erstes Layout erstellt hast, kannst du es so verwenden, wie du jede andere Komponente in einer Seite verwenden würdest. Denke daran, dass dein Layout den gesamten Seitenaufbau enthält: `<html>`, `<head>`, und `<body>`. Du musst nur den Seiteninhalt hinzufügen.

```astro
---
// src/pages/index.astro
import BasisLayout from '../layouts/BasisLayout.astro'
---
<BasisLayout title="Homepage">
  <h1>Hallo Welt!</h1>
  <p>Dies ist mein Seiteninhalt, er wird innerhalb eines Layouts ausgegeben.</p>
</BasisLayout>
```

## Verschachtelte Layouts

Du kannst Layouts ineinander verschachteln, wenn du vom Basis-Layout abweichende Layout-Elemente auf einzelnen Seiten einsetzen willst, ohne dabei jedes Mal das gesamte Layout zu wiederholen. Es ist ein übliches Verfahren in Astro ein generisches `BasisLayout` zu verwenden und auf diesem weitere spezifische Layouts (`PostLayout`, `ProduktLayout` etc.) aufzusetzen, die das `BasisLayout` als Grundlage verwenden.

```astro
---
// src/layouts/PostLayout.astro
import BasisLayout from '../layouts/BasisLayout.astro'
const {title, author} = Astro.props;
---
  <!-- Dieses Layout verwendet das Basis-Layout (siehe obiges Beispiel): -->
<BasisLayout title={title}>
  <!-- Fügt neue Post-spezifische Inhalte zu jeder Seite hinzu. -->
  <div>Post-Autor/Autorin: {author}</div>
  <!-- slot: Deine Seiteninhalte werden hier eingefügt. -->
  <slot />
</BasisLayout>
```

## Layouts zusammenstellen

Manchmal benötigst du detailliertere Kontrolle über deine Seiten. Zum Beispiel willst du vielleicht SEO- oder Social-Media-`meta`-Tags auf bestimmten Seiten hinzufügen, auf anderen aber nicht. Das kannst du mit Props in deinem Layout erreichen (`<BasisLayout addMeta={true} ...`) - ab einem bestimmten Punkt ist es möglicherweise jedoch leichter deine Layouts nicht zu verschachteln.

Anstatt deine gesamte `<html>`-Seite als ein einziges großes Layout zu definieren, kannst du die `head`- und `body`-Inhalte als kleinere, getrennte Komponenten definieren. Hierdurch kannst du verschiedene Layouts auf jeder Seite zusammenstellen.

```astro
---
// src/layouts/BasisHead.astro
const {title, description} = Astro.props;
---
<meta charset="UTF-8">
<title>{title}</title>
<meta name="description" content={description}>
<link rel="preconnect" href="https://fonts.gstatic.com">
<link href="https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">
```

Beachte dass dieses Layout deine **page shell** nicht mit einschließt und nur einige generische Elemente auflistet, die in deinem `<head>`-Block erscheinen sollen. Du hast mehr Kontrolle über die Struktur der einzelnen Seite und kannst mehrere Layout-Komponenten kombinieren.

```astro
---
// src/pages/index.astro
import BasisHead from '../layouts/BasisHead.astro';
import OpenGraphMeta from '../layouts/OpenGraphMeta.astro';
---
<html>
  <head>
    <!-- Nun hast du volle Kontrole über `head` - pro Seite. -->
    <BasisHead title="Title der Seite" description="Beschreibung der Seite" />
    <OpenGraphMeta />
    <!-- Du kannst je nach Bedarf sogar eigene einmalig benötigte Elemente hinzufügen. -->
    <link rel="alternate" type="application/rss+xml" href="/feed/posts.xml">
  </head>
  <body>
    <!-- ... -->
  </body>
</html>
```

Der Nachteil bei diesem Ansatz ist, dass du die `<html>`-, `<head>`- und `<body>`-Elemente dabei auf jeder Seite definieren musst. Diese werden benötigt, um die Seite vollständig zusammenzustellen, da die Layout-Komponenten nicht mehr die gesamte **Page Shell** beinhalten.

## Markdown-Layouts

Für Markdown-Dateien ist ein Layout unerlässlich. Markdown-Dateien können ein bestimmtes Layout im Frontmatter aufrufen. Jede Markdown-Datei wird als HTML gerendert und anschließend an der Stelle in den `<slot />` eingespeist, wo dieser im Layout definiert ist.

```markdown
---
title: Blog-Post
layout: ../layouts/PostLayout.astro
---

Dieser Blog-Post wird innerhalb des `<PostLayout />`-Layout **gerendert**.
```

Markdown-Seiten übergeben immer eine oder mehrere `content`-Eigenschaften an ihr Layout. Dies ist sehr hilfreich, um Informationen über die Seite, einen Titel, Metadaten, eine Index-Tabelle, Kopfzeilen und anderes für die Seite zur Verfügung zu haben.

```astro
---
// src/layouts/PostLayout.astro
const { content } = Astro.props;
---
<html>
  <head>
    <title>{content.title}</title>
  </head>
  <body>
    <h1>{content.title}</h1>
    <h2>{content.description}</h2>
    <img src={content.image} alt="">
    <article>
      <!-- slot: Markdown-Inhalte erscheinen hier! -->
      <slot />
    </article>
  </body>
</html>
```

📚 Lerne mehr über die Verwendung von Markdown in Astro in unserer [Markdown-Anleitung](/guides/markdown-content).
