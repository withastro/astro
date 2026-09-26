---
'@astrojs/vercel': patch
---

Fixes server output responding with a forced 404 for paths that Astro middleware rewrites to valid routes. The catch-all fallback route no longer stamps `status: 404` at the platform level when the 404 page is server-rendered — the render function resolves the real status instead (a `404` for genuinely unmatched paths, but the page's own status for middleware-rewritten URLs such as locale-prefixed i18n paths).
