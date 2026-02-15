---
'astro': patch
---

Fixes a case where accessing `context.csp` in development would always log a warning, although CSP is not available in development
