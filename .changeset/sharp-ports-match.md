---
'astro': patch
---

Fixes the dev server blocking cross-origin requests from an origin allowed by a `security.allowedDomains` entry with a default `port`, such as `{ hostname: 'staging.myapp.com', protocol: 'https', port: '443' }`. `BaseApp.validateForwardedHost()` now applies the same `allowedDomains` rules as the rest of Astro.
