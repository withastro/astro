---
'@astrojs/node': patch
---

Fixes standalone mode logging an unhandled rejection that happens during a request twice, once as "outside request context", and setting `process.exitCode` to `1`
