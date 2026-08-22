---
'@astrojs/node': minor
---

Add graceful shutdown to standalone mode: SIGTERM and SIGINT now drain in-flight requests before closing, with a configurable force-destroy timeout via `ASTRO_NODE_GRACEFUL_SHUTDOWN_TIMEOUT` (default 10s). Opt out with `ASTRO_NODE_GRACEFUL_SHUTDOWN=disabled`.
