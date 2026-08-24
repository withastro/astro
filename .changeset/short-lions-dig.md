---
'astro': patch
---

Fixes cached routes emitting `Last-Modified` with no `Cache-Control`, which caused browsers to apply heuristic freshness and serve stale pages from disk cache. Routes with cache rules now include `Cache-Control: public, max-age=0, must-revalidate` when validators are present, so browsers always revalidate with the server.
