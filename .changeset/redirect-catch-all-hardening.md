---
'astro': patch
---

Hardens config-based redirects with catch-all parameters to prevent producing protocol-relative URLs (e.g. `//example.com`) in the `Location` header
