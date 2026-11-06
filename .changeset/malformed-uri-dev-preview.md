---
'astro': patch
---

Fixes `astro dev` and `astro preview` returning a 500 error for request paths with malformed percent-encoding (e.g. `/%` or `/%C0%AF`). These requests now receive a 400 Bad Request response, matching the behavior of the production server.
