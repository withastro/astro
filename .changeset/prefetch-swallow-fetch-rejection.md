---
'astro': patch
---

Prevents an unhandled promise rejection from the prefetch `fetch` fallback. In WebKit (Safari), `<link rel="prefetch">` is unsupported, so prefetch uses the `fetch()` fallback; on a flaky connection that fetch rejects with `TypeError: Load failed`, and because the promise was not awaited or caught, it surfaced as an unhandled rejection to the page's global error handlers. The best-effort prefetch now swallows the failure with `.catch()`.
