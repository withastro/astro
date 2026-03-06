---
'astro': patch
---

Hardens `clientAddress` resolution to respect `security.allowedDomains` for `X-Forwarded-For`, consistent with the existing handling of `X-Forwarded-Host`, `X-Forwarded-Proto`, and `X-Forwarded-Port`. The `X-Forwarded-For` header is now only used to determine `Astro.clientAddress` when the request's host has been validated against an `allowedDomains` entry. Without a matching domain, `clientAddress` falls back to the socket's remote address.
