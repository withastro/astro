---
astro: minor
'@astrojs/cloudflare': minor
---

Adds a `waitUntil` option to the `RenderOptions` so that adapters can forward runtime background-task hooks to Astro.

When provided by an adapter, runtime cache providers receive `context.waitUntil` in
`CacheProvider.onRequest()`, which allows background cache work such as stale-while-revalidate
without blocking the response. The Cloudflare adapter now forwards
`ExecutionContext.waitUntil` to this API.
