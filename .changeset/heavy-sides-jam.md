---
'@astrojs/netlify': minor
---

Adds a CDN cache provider for Astro route caching on Netlify

#### Setup

Import `cacheNetlify()` from `@astrojs/netlify/cache` and set it as your cache provider:

```js
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import { cacheNetlify } from '@astrojs/netlify/cache';

export default defineConfig({
  adapter: netlify(),
  experimental: {
    cache: {
      provider: cacheNetlify(),
    },
  },
});
```

#### Caching responses

Use `Astro.cache.set()` in your pages and API routes to cache responses on Netlify's edge network. The provider uses [Netlify's durable cache](https://docs.netlify.com/platform/caching/#durable-directive) so cached responses are shared across all edge nodes, reducing function invocations.

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
  cache: { provider: cacheNetlify() },
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

Tag-based invalidation uses `purgeCache()` from `@netlify/functions`. Path-based invalidation works by auto-tagging each response with its request path.
