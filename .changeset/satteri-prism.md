---
'@astrojs/markdown-satteri': minor
'@astrojs/mdx': patch
---

Adds support for Prism syntax highlighting to the Sätteri Markdown and MDX processors. Setting `markdown.syntaxHighlight` to `'prism'` now highlights your code blocks with Prism.

```js
// astro.config.mjs
import { satteri } from '@astrojs/markdown-satteri';

export default defineConfig({
  markdown: {
    processor: satteri(),
    syntaxHighlight: 'prism',
  },
});
```
