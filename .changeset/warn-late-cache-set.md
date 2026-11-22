---
'astro': patch
---

Logs a warning when `Astro.cache.set()` is called after the cache headers have already been applied to the response, for example from a layout or component that awaits data while the page is streaming. These calls have no effect on the response headers and were previously ignored without any message.
