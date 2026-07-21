---
'astro': patch
---

Fixes a bug where cookies set by custom error pages (`404.astro`/`500.astro`) via `Astro.cookies.set()` were silently dropped from the final response.
