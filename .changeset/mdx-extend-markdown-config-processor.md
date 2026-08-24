---
'@astrojs/mdx': minor
---

Fixes `.mdx` files still inheriting your site's `markdown.processor` when `extendMarkdownConfig` is `false` ([#17030](https://github.com/withastro/astro/issues/17030)).

Rendering `.mdx` files now requires `@astrojs/markdown-satteri` 0.4.0 or later (or `@astrojs/markdown-remark` 7.3.0 or later), and `astro` 7.2.5 or later. If either Markdown processor package is in your own `package.json`, update it — a `^0.3.x` or `^7.2.x` range will not pick it up on its own.

The deprecated `remarkPlugins`, `rehypePlugins`, `recmaPlugins` and `remarkRehype` options on `mdx({...})` are now ignored, with a warning, when your Markdown processor does not run them.
