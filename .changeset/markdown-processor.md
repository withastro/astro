---
'astro': minor
'@astrojs/mdx': minor
'@astrojs/markdown-remark': minor
---

Adds a new `markdown.processor` config option, allowing one to choose alternative Markdown processors. The default processor is `unified()` (i.e. remark/rehype), so existing setups are unchanged.

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

The existing top-level `markdown.remarkPlugins`, `markdown.rehypePlugins`, `markdown.remarkRehype`, `markdown.gfm`, and `markdown.smartypants` options still work but are now deprecated. Move them onto `unified({...})` (or your processor of choice), they will be removed in a future major.

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
