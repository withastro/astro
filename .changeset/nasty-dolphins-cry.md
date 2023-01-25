---
'astro': patch
---

Fix usage of logger in Vercel Edge

This protects against usage of `process` global in shimmed environments.
