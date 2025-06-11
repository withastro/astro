---
'astro': patch
---
Fixes issues with fallback route pattern matching when `i18n.routing.fallbackType` is `rewrite`.

- Adds conditions for route matching in `generatePath` when building fallback routes and checking for existing translated pages

Now for a route to be matched it needs to be inside a named `[locale]` folder. This fixes an issue where `route.pattern.test()` incorrectly matched dynamic routes, causing the page to be skipped.

- Adds conditions for route matching in `findRouteToRewrite`

Now the requested pathname must exist in `route.distURL` for a dynamic route to match. This fixes an issue where `route.pattern.test()` incorrectly matched dynamic routes, causing the build to fail.
