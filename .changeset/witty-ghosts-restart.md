---
'astro': patch
---

Fixes `astro dev` refusing to start with "Another astro dev server is already running" after a Docker container restart, where the persisted lock file's PID gets reused by an unrelated process. On Linux, the lock file now records the process start time alongside the PID and startup verifies both, so a stale lock file is detected and cleaned up instead of blocking startup — and since stale lock files are removed before `--force` would signal the recorded PID, the unrelated process that recycled it is no longer killed. Platforms without `/proc` keep the previous PID-existence check.
