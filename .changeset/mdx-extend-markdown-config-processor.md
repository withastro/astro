---
'@astrojs/mdx': minor
---

Fixes `.mdx` files still inheriting your site's `markdown.processor` when `extendMarkdownConfig` is `false` ([#17030](https://github.com/withastro/astro/issues/17030)). Using the deprecated `remarkPlugins`, `rehypePlugins`, `recmaPlugins` or `remarkRehype` options now requires `@astrojs/markdown-remark` 7.3.0 or later.
