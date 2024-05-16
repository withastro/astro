---
"astro": patch
---

Fixes a bug in the Astro rewrite logic, where rewriting the index with parameters - `next("/?foo=bar")` - didn't work as expected.
