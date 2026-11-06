---
'astro': patch
---

Fixes `security.allowedDomains` accepting non-HTTP(S) `X-Forwarded-Proto` values (such as `ftp` or `ws`) when the list mixes patterns with and without a `protocol`
