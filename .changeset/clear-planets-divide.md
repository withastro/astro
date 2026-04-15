---
'@astrojs/cloudflare': minor
---

Adds a CDN cache provider for Astro [experimental route caching](https://docs.astro.build/en/reference/experimental-flags/route-caching/) on Cloudflare Workers

#### Setup

Import `cacheCloudflare()` from `@astrojs/cloudflare/cache` and set it as your cache provider:

```js
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import { cacheCloudflare } from '@astrojs/cloudflare/cache';

export default defineConfig({
  adapter: cloudflare(),
  experimental: {
    cache: {
      provider: cacheCloudflare(),
    },
  },
});
```

The adapter automatically enables the Worker caching layer when a Cloudflare cache provider is configured. No manual wrangler.jsonc changes are needed.

#### Caching responses

Use `Astro.cache.set()` in your pages and API routes to cache responses. The provider sets `Cloudflare-CDN-Cache-Control` and `Cache-Tag` headers, which are read by Cloudflare's built-in caching layer. Cache hits bypass Worker execution entirely, meaning your Worker is not invoked for cached responses.

```astro
---
Astro.cache.set({ maxAge: 300, tags: ['products'] });
const data = await fetchProducts();
---
<ProductList items={data} />
```

You can also set cache rules for groups of routes in your config:

```js
experimental: {
  cache: { provider: cacheCloudflare() },
  routeRules: {
    '/products/*': { maxAge: 3600, tags: ['products'] },
    '/api/*': { maxAge: 60, swr: 600 },
  },
},
```

#### Invalidation

Purge cached responses by tag or path from any API route or server endpoint:

```ts
// src/pages/api/purge.ts
export async function POST({ request, cache }) {
  await cache.invalidate({ tags: ['products'] });
  return new Response('Purged');
}

// Path-based invalidation (uses native prefix purge)
await cache.invalidate({ path: '/products/123' });
```

Tag-based invalidation uses the Worker cache purge API. Path-based invalidation uses Cloudflare's native path prefix purge, so no auto-tagging is needed.
