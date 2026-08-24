---
'@astrojs/mdx': minor
---

Fixes `.mdx` files still inheriting your site's `markdown.processor` when `extendMarkdownConfig` is `false` ([#17030](https://github.com/withastro/astro/issues/17030)). Rendering `.mdx` files with `@astrojs/markdown-remark` now requires version 7.3.0 or later.
