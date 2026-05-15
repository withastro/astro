---
'astro': patch
---

Fixes action requests returning HTTP 500 in dev mode when a prerendered catch-all route (e.g. `[...page].astro`) exists alongside the Cloudflare adapter with `prerenderEnvironment: 'node'`

The dev prerender middleware intentionally uses a broad `matchAllRoutes()` gate and lets the dev router make the final route decision. The regression was that the prerender handler could consume a POST body before `prerenderOnly` routing finished deciding the request should fall through to the SSR runtime.

Body reads now wait until after the final dev route resolution confirms the prerender handler will actually handle the request, so action and other SSR POST endpoints can still fall through with an intact body stream.
