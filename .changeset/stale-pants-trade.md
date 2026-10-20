---
'@astrojs/cloudflare': patch
---

Fixes `astro sync`, `astro check`, and `astro build` overwriting the dependency cache of a running `astro dev` server, which caused it to fail with "The file does not exist ... in the optimize deps directory" errors
