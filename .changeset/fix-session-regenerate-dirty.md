---
'astro': patch
---

Fixes a bug that caused `session.regenerate()` to silently lose session data

Previously, regenerated session data was not saved under the new session ID unless `set()` was also called.
