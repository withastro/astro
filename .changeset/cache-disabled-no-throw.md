---
'astro': patch
---

Improves the experience of working with experimental route caching in dev mode by replacing some errors with silent no-ops, avoiding the need to write conditional logic to handle different modes

Adds a `cache.enabled` property to `CacheLike` so libraries can check whether caching is active without try/catch.
