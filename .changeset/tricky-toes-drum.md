---
'astro': patch
---

Fixes a bug where `HEAD` and `OPTIONS` requests for non-prerendered pages were incorrectly rejected with 403 FORBIDDEN
