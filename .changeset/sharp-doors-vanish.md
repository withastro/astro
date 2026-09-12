---
'@astrojs/node': patch
---

Fixes aborted request bodies causing duplicate unhandled rejection logs in standalone mode when using `src/fetch.ts`
