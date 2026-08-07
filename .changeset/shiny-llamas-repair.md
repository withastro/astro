---
'astro': patch
---

Fixes an issue where requests handled by the dev prerender environment (e.g. `/_image` with `@astrojs/cloudflare`'s `prerenderEnvironment: 'node'`) returned a 500 when a prerendered catch-all route existed, because non-prerendered route modules were imported in an environment where their runtime-specific APIs are unavailable
