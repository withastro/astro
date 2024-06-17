---
'astro': patch
---

Corrects an inconsistency in dev where middleware would run for prerendered 404 routes.
Middleware is not run for prerendered 404 routes in production, so this was incorrect.

