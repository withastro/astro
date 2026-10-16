---
'@astrojs/node': patch
---

Fixes the standalone server not logging `Server listening on …` when `HOST` is an IP address, which happens on Node.js 26.12 and later
