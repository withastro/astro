---
'astro': patch
---

Fixes `Astro.request.url` not reflecting validated `X-Forwarded-Proto`/`X-Forwarded-Host` headers when `security.allowedDomains` is configured. Previously, only `Astro.url` was updated with the forwarded origin while `Astro.request.url` retained the socket-derived URL, causing the two to diverge behind TLS-terminating proxies.
