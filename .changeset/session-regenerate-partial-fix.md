---
'astro': patch
---

Fixes a session being left in a partial state after a storage failure during `session.regenerate()`, preventing unnecessary storage reads on subsequent operations
