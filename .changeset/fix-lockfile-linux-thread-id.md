---
"astro": patch
---

Fixed [#18343](https://github.com/withastro/astro/issues/18343): `astro dev` no longer treats a Linux thread-id as a live Astro server. On Linux, `process.kill(pid, 0)` succeeds for thread-ids but `ps` returns no row for them; the lockfile check now treats a missing `ps` row as stale rather than alive.
