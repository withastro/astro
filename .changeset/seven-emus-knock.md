---
'astro': major
'@astrojs/markdown-remark': major
'@astrojs/markdown-satteri': major
'@astrojs/mdx': major
---

Adds the new `markdown.processor` config option, which uses [satteri](https://github.com/bruits/satteri) (a Rust-based Markdown/MDX compiler) by default. Both `.md` and `.mdx` files are now rendered through satteri unless you opt back into the legacy remark/rehype pipeline with the new `unified()` factory.

The previous `experimental.nativeMarkdown` flag has been removed; the same functionality is now available without an experimental opt-in:

```js
// astro.config.mjs — default, no changes needed
import { defineConfig } from 'astro/config';

export default defineConfig({});
```

To pass satteri plugins or enable additional parser features, use the new `satteri()` factory:

```js
// astro.config.mjs
import { defineConfig, satteri } from 'astro/config';

export default defineConfig({
  markdown: {
    processor: satteri({
      hastPlugins: [myPlugin],
      features: { directive: true, definitionList: true },
    }),
  },
});
```

To keep using your existing remark/rehype plugins, opt into the `unified()` processor from `@astrojs/markdown-remark`:

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

The top-level `markdown.remarkPlugins`, `markdown.rehypePlugins`, and `markdown.remarkRehype` options are deprecated. They continue to work when `@astrojs/markdown-remark` is installed — Astro automatically wraps them in `unified({...})` and prints a deprecation warning — but you should migrate to the new factory form.

The satteri processor (and its shared plugin factories) have been extracted from `@astrojs/markdown-remark` into a new dedicated `@astrojs/markdown-satteri` package, which Astro now ships with by default — no extra install needed.

`@astrojs/markdown-remark` is no longer a transitive dependency of `astro`. If you want the legacy `unified()` pipeline (either directly via `markdown.processor: unified({...})` or indirectly via the deprecated `markdown.remarkPlugins` / `rehypePlugins` / `remarkRehype` fields), install it explicitly:

```sh
pnpm add @astrojs/markdown-remark
```

`@astrojs/mdx` now picks up the processor from `markdown.processor` automatically, so a single satteri or unified configuration drives both `.md` and `.mdx` files. To run `.mdx` files through a different processor (or the same processor with different options) than your `.md` files, pass the `processor` option to the integration:

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

Third-party processors can plug into the same pipeline by exporting a factory whose return value implements the `MarkdownProcessorEntry` interface (exported from `astro/markdown`). Implement `createRenderer` for `.md` support, and optionally `createMdxRenderer` to enable `.mdx` rendering.
