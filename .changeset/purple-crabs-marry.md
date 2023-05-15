---
'@astrojs/cloudflare': minor
---

Continue using esbuild.platform 'browser' to match CloudFlare's standard build settings, but use resolve rewrites to point to the appropriate Lit.js package export for SSR support. Also, to allow workarounds for 3rd party integrations, add a `rewrites` option to the CloudFlare adapter.
