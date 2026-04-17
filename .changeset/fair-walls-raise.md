---
astro: minor
'@astrojs/cloudflare': patch
---

Adds a `waitUntil` option to `app.render()` / `RenderOptions` so adapters can forward
runtime background-task hooks to Astro.

When provided by an adapter, runtime cache providers receive `context.waitUntil` in
`CacheProvider.onRequest()`, which allows background cache work such as stale-while-revalidate
without blocking the response. The Cloudflare adapter now forwards
`ExecutionContext.waitUntil` to this API.
