---
'astro': patch
---

Fixes a regression introduced in 6.3.6 (#16776) where dynamic SSR routes logged `Internal Warning: route cache overwritten.` on every request after the first, per worker isolate.

The SSR branch in `callGetStaticPaths` stored its empty static-paths entry without `mod`, so the new `cached.mod === mod` fast-path check always failed, control fell back into the SSR branch and `routeCache.set()` ran again. In production this triggered the warning at the top of `RouteCache.set()`.

The SSR-branch entry now includes `mod`, so the fast-path hits cleanly on subsequent requests and no spurious warning is logged.
