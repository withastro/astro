---
'astro': patch
---

Fixes cache options that only set `swr` (for example the documented `routeRules: { '/api/[...path]': { swr: 600 } }`) being ignored: the `stale-while-revalidate` cache header is now emitted, and `memoryCache()` caches and revalidates responses with an swr-only rule. Cache headers are also applied when only validators (`lastModified` or `etag`) are set.
