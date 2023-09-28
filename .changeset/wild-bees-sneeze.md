---
'astro': patch
---

Fixed an issue where a response with status code 404 led to an endless loop of implicit rerouting in dev mode.
