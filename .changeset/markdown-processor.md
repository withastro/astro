---
'astro': minor
'@astrojs/mdx': minor
'@astrojs/markdown-remark': minor
---

Adds a new `markdown.processor` configuration option, allowing you to choose an alternative Markdown processor.

Websites with many Markdown/MDX files tend to be slow to build because the unified ecosystem (e.g., remark, rehype) is slow to process. This feature introduces the ability to replace this part of the build pipeline with another processor.

The default processor is `unified()`. This means that existing configurations remain unchanged and your remark/rehype plugins continue to work.

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import remarkToc from 'remark-toc';

export default defineConfig({
  markdown: {
    processor: unified({
      remarkPlugins: [remarkToc],
    }),
  },
});
```

In addition to this new configuration option, Astro provides a new alternative processor based on Rust: [Sätteri](https://satteri.bruits.org/). You can choose to use it now by installing `@astrojs/markdown-satteri`, importing the `satteri()` processor, and adapting your existing configuration:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import remarkToc from 'remark-toc';

export default defineConfig({
  markdown: {
    processor: satteri({
      features: { directive: true },
    }),
  },
});
```

This processor does not support the remark and rehype plugins. This means you may need to convert them to [MDAST or HAST plugins](https://satteri.bruits.org/docs/plugins/) to retain your current functionality.

The existing top-level `markdown.remarkPlugins`, `markdown.rehypePlugins`, `markdown.remarkRehype`, `markdown.gfm`, and `markdown.smartypants` options still work, but are now deprecated and will be removed in a future major update. To anticipate their removal, move them onto `unified({...})` (or your preferred plugin processor) :

```diff
// astro.config.mjs
import { defineConfig } from 'astro/config';
import remarkToc from 'remark-toc';
import rehypeSlug from 'rehype-slug';
+ import { unified } from '@astrojs/markdown-remark';

export default defineConfig({
  markdown: {
+    processor: unified({
+      remarkPlugins: [remarkToc],
+      rehypePlugins: [rehypeSlug],
+      remarkRehype: true,
+      gfm: true,
+      smartypants: true,
+    }),
-    remarkPlugins: [remarkToc],
-    rehypePlugins: [rehypeSlug],
-    remarkRehype: true,
-    gfm: true,
-    smartypants: true,
  },
});
```

For more information on enabling and using this feature in your project, see our [Markdown guide](https://docs.astro.build/en/guides/markdown-content/). To give feedback on this new Rust processor, see the [Native Markdown / MDX parsing and processing RFC](https://github.com/withastro/roadmap/pull/1364).
