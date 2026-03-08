---
'astro': patch
'@astrojs/node': patch
---

Fixes CSRF origin check mismatch by passing the actual server listening port to `createRequest`, ensuring the constructed URL origin includes the correct port (e.g., `http://localhost:4321` instead of `http://localhost`). Also restricts `X-Forwarded-Proto` to only be trusted when `allowedDomains` is configured.
