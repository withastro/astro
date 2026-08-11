---
'astro': patch
---

Fixes `astro dev` refusing to start after a Docker container restart when an unrelated process reuses the PID from a persisted lock file. Astro now checks the process command across platforms, so stale lock files are cleaned up and `--force` does not signal the unrelated process.
