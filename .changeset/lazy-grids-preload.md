---
'astro': patch
---

Fixes a 404 for a CSS file preloaded by a dynamic import when the imported module uses a hydrated component whose styles are also bundled by the server build. Astro no longer preloads that CSS when every page that can load it already has the styles, and keeps the file when a page may not.
