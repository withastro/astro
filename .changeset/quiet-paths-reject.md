---
'astro': patch
---

Fixes request paths with invalid percent-encoding (e.g. `/%C0%AF` or a bare `%`) being logged as an `Invalid URL encoding` error and routed with the undecoded path. These requests now return a `400`, the same as a path that is encoded too many times.
