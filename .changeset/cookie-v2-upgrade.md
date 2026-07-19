---
'astro': patch
---

Updates dependency `cookie` to v2. Cookie values made entirely of URL-safe characters are no longer percent-encoded in `Set-Cookie` headers; encoded values round-trip exactly as before.
