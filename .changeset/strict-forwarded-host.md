---
'astro': patch
---

Tightens how `security.allowedDomains` validates the `Host` and `X-Forwarded-Host` headers. Only a plain hostname with an optional port is accepted, and the validated host is applied to `Astro.url` exactly as it was matched.
