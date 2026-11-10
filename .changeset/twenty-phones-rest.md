---
'astro': patch
---

Fixes duplicate CSS loading for hydrated islands that share modules or are imported through a path alias. The client build no longer emits and preloads stylesheets that are already linked on the page by the server build.
