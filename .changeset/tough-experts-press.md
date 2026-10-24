---
'astro': patch
---

Logs a warning when `Astro.cache.set()` is called after the cache headers have already been applied to the response, such as from a layout that calls `await` before `Astro.cache.set()` while streaming. Previously, these cache directives were silently ignored.
