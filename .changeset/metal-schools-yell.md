---
'astro': patch
---

Fixes `Astro.url.pathname` missing the `.html` extension in dev for non-index pages when `build.format` is set to `'preserve'` or `'file'`
