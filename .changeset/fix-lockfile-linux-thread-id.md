---
"astro": patch
---

Fixes `astro dev` treating a stale lock file containing a Linux thread ID as a running Astro server. A successful process lookup with no matching PID now marks the lock as stale, preventing `astro dev stop` and `astro dev --force` from killing the unrelated process that owns the thread.
