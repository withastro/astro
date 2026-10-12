---
'astro': patch
---

Fixes `astro dev` treating a stale `.astro/dev.json` as a running server on Linux when the recorded PID has been reused as a thread ID by another process. Previously, `astro dev` refused to start, and `astro dev --force` or `astro dev stop` could kill that unrelated process.
