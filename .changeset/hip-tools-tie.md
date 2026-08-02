---
'astro': patch
---

Fixes cookies set via `Astro.cookies.set()` inside a custom `404.astro` or `500.astro` error page being silently dropped from the final response
