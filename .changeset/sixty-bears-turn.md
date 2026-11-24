---
'@astrojs/node': patch
---

Fixes prerendered pages returning 404 in standalone mode with `build.format: 'file'` or `'preserve'` when the page has a folder with the same name (e.g. `blog.html` next to `blog/`), has a dot in its name (e.g. `/v1.2`), or is requested with a trailing slash
