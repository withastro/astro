---
'astro': patch
---

Fixes localized error pages such as `src/pages/pt/404.astro` returning a `200` status when rendered through the `pages()` handler from `astro/fetch` or `astro/hono`
