---
'astro': patch
---

Fixes a case where `context.csp` was logging warnings in development that should be logged in production only
