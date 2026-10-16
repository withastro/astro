---
'@astrojs/node': patch
---

Fixes the standalone server sometimes not logging `Server listening on …` when `HOST` is an IP address, such as `127.0.0.1`
