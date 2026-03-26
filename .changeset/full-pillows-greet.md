---
'astro': patch
---

Fixes `checkOrigin` CSRF protection in `astro dev` behind a TLS-terminating reverse proxy. The dev server now reads `X-Forwarded-Proto` (gated on `security.allowedDomains`, matching production behaviour) so the constructed request origin matches the `https://` origin the browser sends. Also ensures `security.allowedDomains` and `security.checkOrigin` are respected in dev.
