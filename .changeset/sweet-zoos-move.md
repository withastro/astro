---
'astro': patch
---

Fixes a bug where users could use `Astro.request.headers` during a rewrite inside prerendered routes. This an invalid behaviour, and now Astro will show a warning if this happens.
