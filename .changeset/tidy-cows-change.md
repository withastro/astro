---
"@astrojs/db": patch
---

Fix `isDbError()` returning `false` for remote database errors. Astro will now return a `LibsqlError` in development and production.
