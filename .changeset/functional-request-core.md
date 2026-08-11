---
'astro': patch
---

Refactors Astro's internal server-side request handling. This is an internal change: all documented public APIs, including `App` and `NodeApp`, keep their existing signatures and behavior.

The undocumented internal `app.pipeline` property and the `AppPipeline` export from `astro/app` have been removed. Adapters that used `app.pipeline.getLogger()` to wait for the configured log destination can call the new `app.getLogger()` instead.

As a result of this refactor, `new FetchState(request)` from `astro/fetch` now works anywhere inside a built Astro server — including custom `src/fetch.ts` entrypoints — without the request needing to first pass through `app.render()`. Previously this threw an error, breaking patterns like the Cloudflare adapter's advanced custom-worker setup.
