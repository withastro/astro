---
'astro': minor
---

Adds a new `deferRender` option to the `glob()` content loader

When set to `true`, renderable entries (such as Markdown) are not rendered during content sync. Instead, rendering is deferred until the entry is actually rendered in a page, using the same on-demand path that `.mdx` files already use.

This reduces memory usage during `astro build` for large collections whose rendered output is much larger than the source — for example, Markdown that uses heavy rehype plugins like `rehype-katex`. Such builds could previously run out of memory while storing the eagerly-rendered HTML for every entry.

```js
// src/content.config.ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const docs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/docs', deferRender: true }),
});
```

By default `deferRender` is `false`, preserving the existing behavior of rendering entries eagerly during sync so their rendered HTML can be cached across builds.
