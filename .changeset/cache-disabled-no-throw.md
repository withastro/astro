---
'astro': patch
---

Makes `Astro.cache` / `context.cache` no longer throw when caching is not configured. Instead, `set()`, `tags`, and `options` silently no-op, with a one-time console warning on first `set()` call. `invalidate()` still throws since it implies the caller expects purging to work.

Adds a `cache.enabled` property to `CacheLike` so libraries can check whether caching is active without try/catch.
