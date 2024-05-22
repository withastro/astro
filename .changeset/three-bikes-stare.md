---
"@astrojs/web-vitals": patch
---

Fixes requests to the web vitals endpoint in setups like Vercel’s `trailingSlash: true` that redirect from `/web-vitals` to `/web-vitals/`
