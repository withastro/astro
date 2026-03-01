---
'astro': minor
---

Adds a new Fonts API to provide first-party support for adding custom fonts in Astro.

This feature allows you to use fonts from both your file system and several built-in supported providers (e.g. Google, Fontsource, Bunny) through a unified API. Keep your site performant thanks to sensible defaults and automatic optimizations including preloading and fallback font generation.

To enable this feature, configure `fonts` with one or more fonts:

```js title="astro.config.mjs"
import { defineConfig, fontProviders } from "astro/config"

export default defineConfig({
    fonts: [{
        provider: fontProviders.fontsource(),
        name: "Roboto",
        cssVariable: "--font-roboto",
    }]
})
```

Import and include the `<Font />` component with the required `cssVariable` property in the head of your page, usually in a dedicated `Head.astro` component or in a layout component directly:

```astro
---
// src/layouts/Layout.astro
import { Font } from "astro:assets";
---

<html>
    <head>
        <Font cssVariable="--font-roboto" preload />
    </head>
    <body>
        <slot />
    </body>
</html>
```

In any page rendered with that layout, including the layout component itself, you can now define styles with your font's `cssVariable` to apply your custom font.

In the following example, the `<h1>` heading will have the custom font applied, while the paragraph `<p>` will not.

```astro
---
// src/pages/example.astro
import Layout from "../layouts/Layout.astro";
---
<Layout>
    <h1>In a galaxy far, far away...</h1>

    <p>Custom fonts make my headings much cooler!</p>

    <style>
    h1 {
      font-family: var("--font-roboto");
    }
    </style>
</Layout>
```

Visit the updated [fonts guide](https://v6.docs.astro.build/en/guides/fonts/) to learn more about adding custom fonts to your project.
