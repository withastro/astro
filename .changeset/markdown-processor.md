---
'astro': minor
'@astrojs/mdx': minor
'@astrojs/markdown-remark': minor
---

Adds the `markdown.processor` config option, a pluggable abstraction over the underlying Markdown engine. The default processor is `unified()` (remark/rehype), so existing setups are unchanged.

```js
// astro.config.mjs
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

The existing top-level `markdown.remarkPlugins`, `markdown.rehypePlugins`, `markdown.remarkRehype`, `markdown.gfm`, and `markdown.smartypants` options still work but are now deprecated. Move them onto `unified({...})` (or your processor of choice) — they will be removed in a future major.

Third-party processors plug in by returning a `MarkdownProcessorEntry` descriptor (with `name`, optional `options`, `createRenderer`, and optional `createMdxRenderer`). `@astrojs/mdx` dispatches on `processor.name` and reads its plugin lists from the descriptor.
