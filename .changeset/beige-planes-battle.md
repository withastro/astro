---
'@astrojs/node': minor
---

Add graceful shutdown to standalone mode: SIGTERM and SIGINT now drain in-flight requests before closing. Configure this with the `shutdown` adapter option:

- `shutdown: { timeout }` (default `10_000`ms) sets how long to wait for in-flight requests before force-closing remaining connections. Use `0` to force-close immediately, or `Infinity` to wait indefinitely.
- `shutdown: { exit }` (default `false`) calls `process.exit()` once shutdown completes, guaranteeing the process exits even if something else (a timer, an open connection) would otherwise keep it running. Leave this off if your app registers its own `SIGTERM`/`SIGINT` cleanup that needs a chance to finish too.
