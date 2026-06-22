---
'astro': major
---

Makes Sätteri the default Markdown processor

Astro now renders `.md` files with `satteri()` from `@astrojs/markdown-satteri`, its native Markdown pipeline, instead of the remark/rehype pipeline. `@astrojs/markdown-remark` is no longer installed by default.

To keep using the remark/rehype pipeline, install `@astrojs/markdown-remark` and set it as your processor:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';

export default defineConfig({
  markdown: {
    processor: unified(),
  },
});
```

The deprecated `markdown.remarkPlugins`, `markdown.rehypePlugins`, and `markdown.remarkRehype` options still work, but now require `@astrojs/markdown-remark` to be used.
