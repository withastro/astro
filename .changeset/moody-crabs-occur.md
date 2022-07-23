---
'astro': patch
'@astrojs/markdown-remark': patch
---

Avoid parsing JSX, components, and Astro islands when using "plain" md mode. This brings `markdown.mode: 'md'` in-line with our docs description.
