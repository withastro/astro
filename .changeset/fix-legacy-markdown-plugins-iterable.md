---
'astro': patch
---

Fixes a `plugins is not iterable` crash when using a pre-6.0 `@astrojs/mdx` alongside integrations (e.g. Starlight) that set `markdown.remarkPlugins`, `markdown.rehypePlugins`, or `markdown.remarkRehype`.
