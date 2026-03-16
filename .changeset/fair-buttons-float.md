---
'astro': patch
---

Fixes `astro:actions` validation to check resolved routes, so projects using default static output with at least one `prerender = false` page or endpoint no longer fail during startup.
