---
'astro': minor
'@astrojs/cloudflare': minor
---

Reworks how the experimental incremental build cache attributes content entries and image transforms to prerendered paths. Attribution is now scoped to each render instead of relying on process-global collectors, so `build.concurrency > 1` now works together with `experimental.incrementalBuild` — the cache previously disabled itself with a warning whenever concurrency was configured, and that guard has been removed.

**Adapter API (experimental):** `astro/app` no longer exports `beginContentEntryCollection`, `endContentEntryCollection`, `beginImageCollection`, or `endImageCollection`. Per-render attribution is collected inside the rendering runtime and reported by value on `PrerenderResult.metadata`, which is now the only attribution channel. Astro passes a `collectMetadata` option to `AstroPrerenderer.render` exactly when the incremental cache is active.

For custom prerenderers:

- If you render in-runtime, install a render scope once for your rendering runtime — `installRenderScope(new AsyncLocalStorage())`, using an environment-appropriate `AsyncLocalStorage` — and wrap each render with `renderForPrerender(app, request, { routeData, collectMetadata })` (or `collectPrerenderMetadata(fn)` for custom pipelines), returning its result. Both are exported from `astro/app`.
- If you render out of process, collect in your runtime the same way and ship the metadata back by value, as `@astrojs/cloudflare` does.
- If you install your own `globalThis.astroAsset.addStaticImage`, keep calling `recordStaticImage` (still exported from `astro/app`) for every resolved transform, dedup hits included.
- A runtime without `AsyncLocalStorage` simply does not install a scope: renders succeed, `metadata` is `undefined`, and those paths are recorded as "not tracked".

**`@astrojs/cloudflare`** has been migrated to the new contract in the same change: the workerd prerender handler now scopes metadata collection per request, so concurrent prerender requests inside the worker attribute correctly. The adapter automatically appends the `nodejs_als` compatibility flag to the transient build-time prerender worker when none of `nodejs_als`, `nodejs_compat`, or `nodejs_compat_v2` is configured — the deployed configuration is never modified.
