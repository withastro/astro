---
'astro': patch
---

Fixes a false "does not call the middleware() handler" warning when using `astro()` in a custom `src/app.ts` and the first request is a redirect route.
