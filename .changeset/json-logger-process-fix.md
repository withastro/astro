---
'astro': patch
---

Fixes JSON and node loggers crashing with "process is not defined" in non-Node runtimes like Cloudflare's workerd. The loggers now use `console.log`/`console.error` instead of `process.stdout`/`process.stderr`, matching the pattern already used by the console logger.
