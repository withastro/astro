---
'@astrojs/markdown-satteri': minor
'@astrojs/mdx': minor
---

Adds `@astrojs/markdown-satteri`, a Markdown processor based on [Sätteri](https://satteri.bruits.org), a fast Markdown pipeline written in Rust. Sätteri is much faster than the default Remark-based processor, and supports a wide range of Markdown features out of the box, without requiring additional plugins. In the future, we plan to make this the default Markdown processor in Astro.

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

Note that this processor currently does not support Prism syntax highlighting, and require using `syntaxHighlight: 'shiki'` or disabling syntax highlighting altogether for now.
