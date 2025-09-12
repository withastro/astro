---
'astro': patch
---

Improves error reporting for content collections by adding logging for configuration errors that had previously been silently ignored. Also adds a new error that is thrown if a live collection is used in `content.config.ts` rather than `live.config.ts`.
