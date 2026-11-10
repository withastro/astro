---
'astro': patch
'@astrojs/runtime': patch
---

Fixes errors thrown after a page has started streaming bypassing the configured `logger`. They are now reported once through it, as one `error` record, in both production and `astro dev`
