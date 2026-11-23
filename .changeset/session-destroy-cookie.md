---
'astro': patch
---

Fixes `session.set()` after `session.destroy()` not sending a cookie for the new session when the session had already been written earlier in the same request
