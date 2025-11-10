---
'astro': patch
---

Improves `X-Forwarded` header validation to prevent cache poisoning and header injection attacks. Now properly validates `X-Forwarded-Proto`, `X-Forwarded-Host`, and `X-Forwarded-Port` headers against configured `allowedDomains` patterns, rejecting malformed or suspicious values. This is especially important when running behind a reverse proxy or load balancer.
