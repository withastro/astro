---
'astro': patch
---

Fixes a bug where errors thrown after a page started streaming were printed with `console.error` instead of being reported through the configured `logger`
