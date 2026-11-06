---
'astro': patch
---

Fixes an `Unterminated string` build error when application code imports from `astro/config` (for example, `fontProviders` in a shared fonts module)
