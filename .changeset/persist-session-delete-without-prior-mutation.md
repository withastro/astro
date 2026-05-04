---
'astro': patch
---

Fixes session persistence when `session.delete()` is the first mutation in a request (no prior `get`, `set`, `has`, or `keys`). The session was marked dirty in memory, but persistence skipped the save because `#data` stayed `undefined`, so the backing store could still return the deleted key on the next request.
