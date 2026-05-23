---
'@astrojs/markdown-satteri': minor
'@astrojs/mdx': minor
'@astrojs/internal-helpers': minor
---

Adds the new opt-in `@astrojs/markdown-satteri` package — a Sätteri (Rust/WASM) based markdown processor. Install it and pass `satteri()` to `markdown.processor` to use it; the default remains `unified()`.

```sh
npm install @astrojs/markdown-satteri
```

```js
// astro.config.mjs
import { satteri } from '@astrojs/markdown-satteri';

export default defineConfig({
  markdown: {
    processor: satteri(),
  },
});
```

`@astrojs/mdx` now dispatches `.mdx` files through the Sätteri pipeline when `markdown.processor` is `satteri()`. The package is wired as an optional peer dep of `@astrojs/mdx`, so users who stay on the default `unified()` pipeline don't need to install it.

Sätteri does not support remark/rehype plugins (those are remark-only). Use `satteri({ mdastPlugins, hastPlugins, features })` to extend the Sätteri pipeline, or stay on `unified()` if you need remark/rehype plugin support.

The shared markdown contract types (`AstroMarkdownProcessorOptions`, `MarkdownProcessor`, `MarkdownHeading`, `ShikiConfig`, etc.) now also live in `@astrojs/internal-helpers/markdown`, so third-party processors can implement them without depending on `@astrojs/markdown-remark`.
