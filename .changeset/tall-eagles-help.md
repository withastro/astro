---
'@astrojs/netlify': patch
---

Fixes a case where build would fail with `edgeMiddleware: true` while using node modules without the `node:` prefix
