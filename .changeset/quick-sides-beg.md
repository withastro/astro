---
'astro': patch
---

Validates the request origin against `allowedDomains` before fetching prerendered error pages. When `allowedDomains` is configured and the Host header matches, the original origin is used. Otherwise, the fetch falls back to `localhost`.
