---
'astro': patch
---

Fixes action requests returning HTTP 500 in dev mode when a prerendered catch-all route (e.g. `[...page].astro`) exists alongside the Cloudflare adapter with `prerenderEnvironment: 'node'`

The dev prerender middleware was using `matchAllRoutes()` to decide whether to intercept a request. A prerendered catch-all route matches every URL — including internal SSR endpoints like `/_actions/*` and `/_server-islands/*` — causing the middleware to incorrectly intercept those requests and consume the request body before discovering the best match was actually an SSR route. Downstream handlers then failed because the body stream was already exhausted.

Switched to `matchRoute()`, which returns only the highest-priority match. This ensures internal SSR routes (actions, server islands, image endpoint) are correctly routed through the SSR handler when they have higher specificity than a prerendered catch-all.
