---
'astro': patch
'@astrojs/cloudflare': minor
---

Adds concurrent rendering support for `experimental.incrementalBuild`, including when using `@astrojs/cloudflare`

Incremental builds no longer disable caching when `build.concurrency` is greater than `1`. Projects that set `build.concurrency: 1` to keep the cache enabled can remove that workaround. Cloudflare builds also reduce serialization overhead for large prerendered pages.
