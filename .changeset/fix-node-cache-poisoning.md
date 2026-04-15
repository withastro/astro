---
'@astrojs/node': patch
---

Fixes static asset error responses incorrectly including immutable cache headers. Conditional request failures (e.g. `If-Match` mismatch) now return the correct status code without far-future cache directives.
