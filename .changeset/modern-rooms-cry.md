---
'@astrojs/cloudflare': patch
---

Fixed a bug where a cascade of reloads would cause the page to crash during the first visit when building or developing with Cloudflare SSR in Astro v6 due to dependency loading issues.
