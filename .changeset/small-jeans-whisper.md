---
'astro': patch
---

Fix `Astro.url.pathname` for the root page when using `build.format: "file"` so it resolves to `/index.html` instead of `/.html` during builds.
