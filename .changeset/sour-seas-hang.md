---
"astro": patch
---

Fixes a regression where a response created with `Response.redirect` or containing `null` as the body never completed in node-based adapters.
