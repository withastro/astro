---
'astro': patch
---

Fixes the JSON logger crashing with `process is not defined` in non-Node runtimes like Cloudflare's workerd. The JSON logger now uses `console.log`/`console.error` instead of `process.stdout`/`process.stderr`, matching the pattern already used by the console logger.
