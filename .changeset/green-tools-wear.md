---
'@astrojs/vercel': minor
---

Adds a CDN cache provider for Astro [experimental route caching](https://docs.astro.build/en/reference/experimental-flags/route-caching/) on Vercel

#### Setup

Import `cacheVercel()` from `@astrojs/vercel/cache` and set it as your cache provider:

```js
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import { cacheVercel } from '@astrojs/vercel/cache';

export default defineConfig({
  adapter: vercel(),
  experimental: {
    cache: {
      provider: cacheVercel(),
    },
  },
});
```

#### Caching responses

Use `Astro.cache.set()` in your pages and API routes to cache responses on Vercel's edge network. The provider sets `Vercel-CDN-Cache-Control` and `Vercel-Cache-Tag` headers on responses.

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
  cache: { provider: cacheVercel() },
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

// Path-based invalidation
await cache.invalidate({ path: '/products/123' });
```

Tag-based invalidation uses `invalidateByTag()` from `@vercel/functions`, which performs a soft invalidation (marks cached responses as stale so they can be revalidated in the background via stale-while-revalidate). Path-based invalidation works by auto-tagging each response with its request path.
