---
'astro': patch
---

Hardens forwarded header handling so the internal request helper validates `X-Forwarded-Host` against `security.allowedDomains` before trusting `X-Forwarded-For` for `clientAddress`. Previously it only checked that the header was present, which was inconsistent with the public `createRequest` helper. This aligns both code paths; behavior is unchanged for correctly configured proxies.
