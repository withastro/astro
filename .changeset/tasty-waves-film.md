---
'@astrojs/mdx': patch
---

Fixes an incompatibility where `@astrojs/mdx` v8 could be installed with `astro` versions that bundle an older `@astrojs/markdown-satteri` lacking MDX support. Also improves the error message when the processor is too old to suggest updating `astro` itself.
