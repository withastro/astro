---
'@astrojs/mdx': major
---

`@astrojs/mdx` now picks up the processor from `markdown.processor` automatically, so a single Sätteri or unified configuration drives both `.md` and `.mdx` files. To run `.mdx` files through a different processor (or the same processor with different options) than your `.md` files, pass the `processor` option to the integration:

```js
// astro.config.mjs
import { defineConfig, satteri } from 'astro/config';
import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';

export default defineConfig({
  markdown: { processor: satteri() },
  integrations: [mdx({ processor: unified({ remarkPlugins: [/* ... */] }) })],
});
```
