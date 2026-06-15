---
'astro': patch
---

Fixes a spurious `Astro.request.headers` warning on prerendered pages when `security.allowedDomains` is configured. The internal `allowedDomains` header validation now skips prerendered routes, since they use synthetic requests with no real headers.
