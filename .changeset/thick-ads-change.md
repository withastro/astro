---
'astro': patch
---

Improves error handling for custom log destinations. When the configured logger fails to load, Astro now reports the error and continues with the default console logger instead of failing the first request.
