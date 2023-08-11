---
'astro': patch
---

Fix a bug where the middleware entry point was passed to integrations even though the configuration `build.excludeMiddleware` was set to `false`.
