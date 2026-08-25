---
'@astrojs/mdx': major
---

Fixes `.mdx` files still using `markdown.processor` when `extendMarkdownConfig` is `false`. They now use a clean default processor instead; pass `mdx({ processor })` to choose one explicitly.

MDX support now requires `@astrojs/markdown-satteri` 0.4.0 or later, and `@astrojs/markdown-remark` 7.3.0 or later if you use `unified()`. Update whichever appears in your own `package.json` — a `^0.3.x` or `^7.2.x` range will not move on its own.

The deprecated `remarkPlugins`, `rehypePlugins`, `recmaPlugins` and `remarkRehype` options are no longer merged into the processor you configured. They are ignored, with a warning, when that processor does not run them. Pass them to `unified({ ... })` instead.
