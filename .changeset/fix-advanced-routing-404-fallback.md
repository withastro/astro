---
'astro': patch
---

Fixes a bug where `experimental.advancedRouting` with `astro/hono` handlers threw `TypeError: Cannot read properties of undefined (reading 'route')` for unmatched routes instead of rendering the custom 404 page.

The 404 fallback in `FetchState.#resolveRouteData()` compared route components by bare filename (`'404.astro'`), but the built manifest stores the full relative path (`'src/pages/404.astro'`). The comparison never matched, leaving `routeData` undefined and crashing downstream handlers. Fixed by using the existing `getCustom404Route()` helper which matches by route path (`/404`).
