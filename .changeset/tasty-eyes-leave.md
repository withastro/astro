---
'astro': patch
---

Fixes content collection HMR not updating prerendered pages when an adapter enables a separate prerender environment (e.g. `@astrojs/cloudflare` with `prerenderEnvironment: 'node'`)
