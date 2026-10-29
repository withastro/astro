---
'astro': patch
---

Fixes request paths with invalid percent-encoding (e.g. `/%C0/`) being logged as server errors and routed undecoded. These requests are now rejected with a `400` before middleware and routing run, matching paths that are encoded too many times
