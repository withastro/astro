---
'@astrojs/cloudflare': patch
---

Fixes a case where the types of `handle()` could mismatch with the ones from the user's project. They now rely on globals, that can be obtained by running `wrangler types`
