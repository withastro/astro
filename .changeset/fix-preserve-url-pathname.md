---
'astro': patch
---

Fixes `Astro.url.pathname` for non-index pages when using `build.format: 'preserve'`. Previously, a page like `src/pages/about-me.astro` would output to `dist/about-me.html` but `Astro.url.pathname` would incorrectly return `/about-me/` instead of `/about-me.html`.
