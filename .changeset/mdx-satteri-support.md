---
'@astrojs/mdx': minor
---

Adds support for using [`@astrojs/markdown-satteri`](https://www.npmjs.com/package/@astrojs/markdown-satteri) to parse `.mdx` files.

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { satteri } from '@astrojs/markdown-satteri';

export default defineConfig({
  markdown: {
    processor: satteri({
      features: { directive: true },
    }),
  },
  integrations: [mdx()],
});
```

Note that the [`recmaPlugins` option](https://docs.astro.build/en/guides/integrations-guide/mdx/#recmaplugins) is not supported when using Sätteri as your MDX processor. If you would like to use Sätteri for Markdown files, but still use Unified for MDX, you can pass a different Markdown processor to the MDX integration:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { satteri } from '@astrojs/markdown-satteri';
import { unified } from '@astrojs/markdown-remark';
import myPlugin from "./my-recma-plugin.js";

export default defineConfig({
  markdown: {
    processor: satteri({
      features: { directive: true },
    }),
  },
  integrations: [
    mdx({
      recmaPlugins: [myPlugin],
      processor: unified(),
    }),
  ],
});
```
