---
'astro': major
'@astrojs/markdown-remark': major
'@astrojs/markdown-satteri': major
---

Adds a `markdown.processor` config option to configure the Markdown processor to use. By default, [Sätteri](https://github.com/bruits/satteri) a fast Rust-based Markdown/MDX compiler is used. Both `.md` and `.mdx` files now render through Sätteri.

To pass Sätteri plugins or enable additional parser features, use the `satteri()` explicitely:

```js
// astro.config.mjs
import { defineConfig, satteri } from 'astro/config';

export default defineConfig({
  markdown: {
    processor: satteri({
      hastPlugins: [myPlugin],
      features: { directive: true, smartPunctuation: false },
    }),
  },
});
```

To keep using your existing remark/rehype plugins, install `@astrojs/markdown-remark` into your project and use the `unified` export:

```sh
pnpm add @astrojs/markdown-remark
```

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import remarkToc from 'remark-toc';

export default defineConfig({
  markdown: {
    processor: unified({ remarkPlugins: [remarkToc] }),
  },
});
```

The top-level `markdown.remarkPlugins`, `markdown.rehypePlugins`, and `markdown.remarkRehype` options are deprecated. They'll continue to work when `@astrojs/markdown-remark` is installed for now, but this will be removed in the next major.
