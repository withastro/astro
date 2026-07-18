---
'astro': patch
---

Fixes a bug where mutated `Astro.locals` during the request lifecycle are lost and not passed to custom error pages (`404.astro`/`500.astro`)
