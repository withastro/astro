---
'astro': minor
---

Adds a new, experimental Fonts API to provide first-party support for fonts in Astro.

This experimental feature allows you to use fonts from both your file system and several built-in supported providers (e.g. Google, Fontsource, Bunny) through a unified API. Keep your site performant thanks to sensible defaults and automatic optimizations including fallback font generation.

To enable this feature, configure an `experimental.fonts` object with one or more fonts:

```js title="astro.config.mjs"
import { defineConfig, fontProviders } from "astro/config"

export default defineConfig({
    experimental: {
        fonts: [{
            provider: fontProviders.google(),
      `      name: "Roboto",
            cssVariable: "--font-roboto",
        }]
    }
})
```

Then, add a `<Font />` component and site-wide styling in your `<head>`:

```astro title="src/components/Head.astro"
---
import { Font } from 'astro:assets'
---
<Font cssVariable='--font-roboto' preload />
<style>
body {
    font-family: var(--font-roboto);
}
</style>
```

Visit [the experimental Fonts documentation](https://docs.astro.build/en/reference/experimental-flags/fonts/) for the full API, how to get started, and even how to build your own custom `AstroFontProvider` if we don't yet support your preferred font service.

For a complete overview, and to give feedback on this experimental API, see the [Fonts RFC](https://github.com/withastro/roadmap/pull/1039) and help shape its future.
