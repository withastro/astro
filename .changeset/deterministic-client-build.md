---
'astro': patch
---

Fixes a bug where emitted assets during a client build would contain always fresh, new hashes in their name. Now the build should be more stable.
