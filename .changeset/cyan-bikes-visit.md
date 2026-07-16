---
'astro': patch
---

Reduces per-request CPU work in the SSR pipeline by skipping URL normalization writes that would not change the request path
