---
"astro": patch
---

Fixes a regression where constructing and returning 404 responses from a middleware resulted in the dev server getting stuck in a loop.
