---
'astro': major
'@astrojs/mdx': major
'@astrojs/markdown-remark': major
'@astrojs/internal-helpers': minor
---

The default markdown processor is now `satteri()` (Sätteri Rust/WASM pipeline). To keep the previous remark/rehype-based pipeline, install `@astrojs/markdown-remark` and configure it explicitly:

```sh
npm install @astrojs/markdown-remark
```

```js
// astro.config.mjs
import { unified } from '@astrojs/markdown-remark';

export default defineConfig({
  markdown: {
    processor: unified({
      remarkPlugins: [/* ... */],
      rehypePlugins: [/* ... */],
    }),
  },
});
```

The `@astrojs/markdown-remark` package is no longer a bundled dependency of `astro`. It is now an optional peer dependency — install it only if you need the remark/rehype pipeline.

`@astrojs/markdown-satteri` is now bundled with `astro` (no install needed). The `markdown.remarkPlugins`, `markdown.rehypePlugins`, `markdown.remarkRehype`, `markdown.gfm`, and `markdown.smartypants` options remain deprecated but still work (they auto-swap the processor to `unified()` and require `@astrojs/markdown-remark` to be installed). They will be fully removed in a future major.

Shared markdown contract types (`AstroMarkdownProcessorOptions`, `MarkdownProcessor`, `MarkdownHeading`, `ShikiConfig`, etc.) and `parseFrontmatter` now live in `@astrojs/internal-helpers/markdown` and `@astrojs/internal-helpers/frontmatter` so they can be consumed without depending on `@astrojs/markdown-remark`. They remain re-exported from `@astrojs/markdown-remark` for backwards compatibility.
