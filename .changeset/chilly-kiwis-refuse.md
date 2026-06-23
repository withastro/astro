---
'astro': patch
---

Fixes localized 404 and 500 pages generating as `[locale]/404/index.html` instead of `[locale]/404.html` when using `build.format: 'directory'`
