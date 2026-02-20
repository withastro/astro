---
'astro': minor
'@astrojs/node': minor
---

Adds a new experimental Route Caching API for controlling SSR response caching. See the [RFC](https://github.com/withastro/roadmap/pull/1245) for full details.

Route caching gives you a platform-agnostic way to cache server-rendered responses, based on web standard cache headers. You set caching directives in your routes using `Astro.cache` (in `.astro` pages) or `context.cache` (in API routes and middleware), and Astro translates them into the appropriate headers or runtime behavior depending on your adapter.

#### Getting started

Enable the feature by configuring `experimental.cache` with a cache provider in your Astro config:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import { memoryCache } from 'astro/config';

export default defineConfig({
  adapter: node({ mode: 'standalone' }),
  experimental: {
    cache: {
      provider: memoryCache(),
    },
  },
});
```

#### Using `Astro.cache` and `context.cache`

In `.astro` pages, use `Astro.cache.set()` to control caching:

```astro
---
// src/pages/index.astro
Astro.cache.set({
  maxAge: 120,       // Cache for 2 minutes
  swr: 60,           // Serve stale for 1 minute while revalidating
  tags: ['home'],    // Tag for targeted invalidation
});
---
<html><body>Cached page</body></html>
```

In API routes and middleware, use `context.cache`:

```ts
// src/pages/api/data.ts
export function GET(context) {
  context.cache.set({
    maxAge: 300,
    tags: ['api', 'data'],
  });
  return Response.json({ ok: true });
}
```

#### Cache options

`cache.set()` accepts the following options:

- **`maxAge`** (number): Time in seconds the response is considered fresh.
- **`swr`** (number): Stale-while-revalidate window in seconds. During this window, stale content is served while a fresh response is generated in the background.
- **`tags`** (string[]): Cache tags for targeted invalidation. Tags accumulate across multiple `set()` calls within a request.
- **`lastModified`** (Date): When multiple `set()` calls provide `lastModified`, the most recent date wins.
- **`etag`** (string): Entity tag for conditional requests.

Call `cache.set(false)` to explicitly opt out of caching for a request.

Multiple calls to `cache.set()` within a single request are merged: scalar values use last-write-wins, `lastModified` uses most-recent-wins, and tags accumulate.

#### Invalidation

Purge cached entries by tag or path using `cache.invalidate()`:

```ts
// Invalidate all entries tagged 'data'
await context.cache.invalidate({ tags: ['data'] });

// Invalidate a specific path
await context.cache.invalidate({ path: '/api/data' });
```

#### Config-level route rules

Use `experimental.routeRules` to set default cache options for routes without modifying route code. Supports Nitro-style shortcuts for ergonomic configuration:

```js
import { memoryCache } from 'astro/config';

export default defineConfig({
  experimental: {
    cache: {
      provider: memoryCache(),
    },
    routeRules: {
      // Shortcut form (Nitro-style)
      '/api/*': { swr: 600 },

      // Full form with nested cache
      '/products/*': { cache: { maxAge: 3600, tags: ['products'] } },
    },
  },
});
```

Route patterns support static paths, dynamic parameters (`[slug]`), and rest parameters (`[...path]`). Per-route `cache.set()` calls merge with (and can override) the config-level defaults.

You can also read the current cache state via `cache.options`:

```ts
const { maxAge, swr, tags } = context.cache.options;
```

#### Cache providers

Cache behavior is determined by the configured **cache provider**. There are two types:

- **CDN providers** set response headers (e.g. `CDN-Cache-Control`, `Cache-Tag`) and let the CDN handle caching. Astro strips these headers before sending the response to the client.
- **Runtime providers** implement `onRequest()` to intercept and cache responses in-process, adding an `X-Astro-Cache` header (HIT/MISS/STALE) for observability.

#### Built-in memory cache provider

Astro includes a built-in in-memory LRU cache provider. Import `memoryCache` from `astro/config` to configure it.

Features:
- In-memory LRU cache with configurable max entries (default: 1000)
- Stale-while-revalidate support
- Tag-based and path-based invalidation
- `X-Astro-Cache` response header: `HIT`, `MISS`, or `STALE`

#### Writing a custom cache provider

A cache provider is a module that exports a factory function as its default export:

```ts
import type { CacheProviderFactory } from 'astro';

const factory: CacheProviderFactory = (config) => {
  return {
    name: 'my-cache-provider',
    // For CDN-style: set response headers
    setHeaders(options) {
      const headers = new Headers();
      if (options.maxAge !== undefined) {
        headers.set('CDN-Cache-Control', `max-age=${options.maxAge}`);
      }
      return headers;
    },
    // For runtime-style: intercept requests (optional)
    async onRequest(context, next) {
      // ... check cache, call next(), store response
    },
    // Handle invalidation
    async invalidate(options) {
      // ... purge by tags or path
    },
  };
};

export default factory;
```

#### Error handling

If you use `Astro.cache` or `context.cache` without enabling the feature, Astro throws an `AstroError` with the name `CacheNotEnabled` and a message explaining how to configure it. If the configured provider cannot be resolved, Astro throws `CacheProviderNotFound` at build time.
