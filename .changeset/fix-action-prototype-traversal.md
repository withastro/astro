---
'astro': patch
---

Fixes action route handling to return 404 for requests to prototype method names like `constructor` or `toString` used as action paths
