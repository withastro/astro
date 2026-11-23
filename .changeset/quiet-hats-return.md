---
'astro': patch
---

Fixes `Astro.session.set()` after `Astro.session.destroy()` not sending a cookie for the new session when the session had already been written to earlier in the same request
