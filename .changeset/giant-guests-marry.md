---
'create-astro': patch
---

Fixes proxy support by respecting `HTTP_PROXY` and `HTTPS_PROXY` environment variables when downloading templates. On Node.js v22.21.0+ and v24.5.0+, `create-astro` now automatically enables the `--use-env-proxy` flag so that native `fetch()` routes requests through the configured proxy.
