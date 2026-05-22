---
'astro': patch
---

Fixes an issue where on-demand (SSR) dynamic routes would return 404 when a prerendered dynamic route with the same URL pattern was sorted first alphabetically. In production builds with `@astrojs/node` adapter, if `[a_prebuild].astro` (prerender=true) came before `[b_ssr].astro` alphabetically, requests to URLs not in the prerendered route's static paths would 404 instead of falling through to the SSR route. The fix adds fallthrough logic so that when a prerendered dynamic route matches but can't serve the request, Astro tries subsequent matching routes.
