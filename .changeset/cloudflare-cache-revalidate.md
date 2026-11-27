---
'@astrojs/cloudflare': minor
---

Adds an `invalidation` option to `cacheCloudflare()`. With `invalidation: 'revalidate'`, `cache.invalidate()` marks matching cached responses stale instead of deleting them. For a cached page sent with `swr`, Cloudflare can then serve the stale page to the next request while the Worker renders a fresh one in the background, instead of making that request wait for the render. The default, `'purge'`, keeps the current behavior.

```js
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import { cacheCloudflare } from '@astrojs/cloudflare/cache';

export default defineConfig({
  adapter: cloudflare(),
  cache: {
    provider: cacheCloudflare({ invalidation: 'revalidate' }),
  },
});
```

The option applies to every invalidation through the provider. Only use `'revalidate'` if every route's `ETag` changes whenever its content changes: a revalidation that answers with the same `ETag` can leave the old page cached. With the `CF_VERSION_METADATA` binding, a route that sets `lastModified` but no `etag` gets an `ETag` derived from `lastModified`, so `lastModified` must change with the content.
