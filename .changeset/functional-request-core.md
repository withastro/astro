---
'astro': patch
---

Refactors Astro's internal server-side request handling. This is an internal change: all public APIs, including `App` and `NodeApp`, keep their existing signatures and behavior.

As a result of this refactor, `new FetchState(request)` from `astro/fetch` now works anywhere inside a built Astro server — including custom `src/fetch.ts` entrypoints — without the request needing to first pass through `app.render()`. Previously this threw an error, breaking patterns like the Cloudflare adapter's advanced custom-worker setup.
