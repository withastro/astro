---
'astro': minor
---

Adds an experimental `astro/hono` entrypoint with composable Hono middleware for Astro

Introduces a new `Pages` class and a set of Hono middleware (`pages()`, `actions()`, `i18n()`, `redirects()`, `context()`, `rewrite()`) that let you compose an Astro app as a standard Hono application via a `src/app.ts` entrypoint.
