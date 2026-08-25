---
'@astrojs/mdx': patch
---

Fixes `.mdx` files still using `markdown.processor` when `extendMarkdownConfig` is `false`. They now use a clean default processor instead; pass `mdx({ processor })` to choose one explicitly.
