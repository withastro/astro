# Route Caching Implementation Plan

RFC: https://github.com/withastro/roadmap/pull/1245
Proposal: https://github.com/withastro/roadmap/blob/feat/route-caching/proposals/0056-route-caching.md ( ~/Repos/astro-roadmap/proposals/0056-route-caching.md )

## Overview

Route caching provides a platform-agnostic API for caching SSR responses. The
implementation follows the same architecture as sessions: pluggable drivers
loaded via virtual modules, adapters providing defaults, and a per-request
object exposed on `Astro.cache` / `context.cache`.

### API Surface

```ts
interface AstroCache {
  set(options: CacheOptions | CacheHint | LiveDataEntry | false): void;
  readonly tags: string[];
  invalidate(options: InvalidateOptions | LiveDataEntry): Promise<void>;
}

interface CacheOptions {
  maxAge?: number;
  swr?: number;
  tags?: string[];
  lastModified?: Date;
  etag?: string;
}

interface InvalidateOptions {
  path?: string;
  tags?: string | string[];
}
```

### Key Design Decisions

- `cache.set()` not `cache()` — consistent with `cookies.set()`, `session.set()`
- Multiple `set()` calls merge: scalars last-write-wins, `lastModified` most-recent-wins, tags accumulate
- `cache.set(false)` opts out of config-level rules
- `cache.set(entry)` extracts `entry.cacheHint` automatically
- No caching in dev — API is available but no-ops
- `onRequest` on the provider handles runtime caching (not registered as user middleware)
- `CDN-Cache-Control` and `Cache-Tag` stripped by framework for runtime providers

---

## Phase 1: Core Types, Config & AstroCache Runtime

The foundation: types, config schema, the `AstroCache` class, utility functions,
and unit tests for all of them. No pipeline wiring yet — just the building
blocks that can be tested in isolation.

### 1.1 Types

**New file:** `packages/astro/src/core/cache/types.ts`

```ts
export interface CacheOptions {
  maxAge?: number;
  swr?: number;
  tags?: string[];
  lastModified?: Date;
  etag?: string;
}

export interface InvalidateOptions {
  path?: string;
  tags?: string | string[];
}

export interface CacheProvider {
  name: string;
  setHeaders?(options: CacheOptions): Headers;
  onRequest?(context: MiddlewareContext, next: () => Promise<Response>): Promise<Response>;
  invalidate(options: InvalidateOptions): Promise<void>;
}

export type CacheProviderFactory = (config: Record<string, any> | undefined) => CacheProvider;

export interface CacheDriverConfig {
  entrypoint: string | URL;
  config?: Record<string, any>;
}

export interface SSRManifestCache {
  driver: string;
  options?: Record<string, any>;
  routes?: Record<string, CacheOptions>;
}
```

### 1.2 Config Schema

**New file:** `packages/astro/src/core/cache/config.ts`

Zod schema mirroring session's `SessionSchema`:

```ts
import * as z from 'zod/v4';

export const CacheDriverConfigSchema = z.object({
  config: z.record(z.string(), z.any()).optional(),
  entrypoint: z.union([z.string(), z.instanceof(URL)]),
});

export const CacheOptionsSchema = z.object({
  maxAge: z.number().optional(),
  swr: z.number().optional(),
  tags: z.array(z.string()).optional(),
});

export const CacheSchema = z.object({
  driver: CacheDriverConfigSchema.optional(),
  routes: z.record(z.string(), CacheOptionsSchema).optional(),
});
```

**Modify:** `packages/astro/src/types/public/config.ts` — add inside `experimental`:

```ts
cache?: {
  driver?: CacheDriverConfig;
  routes?: Record<string, CacheOptions>;
};
```

**Modify:** `packages/astro/src/core/config/schemas/base.ts` — add to experimental:

```ts
import { CacheSchema } from '../../cache/config.js';
// ...
cache: CacheSchema.optional(),
```

### 1.3 Utility Functions

**New file:** `packages/astro/src/core/cache/utils.ts`

```ts
export function normalizeCacheDriverConfig(
  driver: CacheDriverConfig
): NormalizedCacheDriverConfig { ... }

export function cacheConfigToManifest(
  config: AstroConfig['experimental']['cache']
): SSRManifestCache | undefined { ... }

export function defaultSetHeaders(options: CacheOptions): Headers {
  // CDN-Cache-Control, Cache-Tag, Last-Modified, ETag
}

export function isCacheHint(value: unknown): value is CacheHint {
  return value != null && typeof value === 'object' && 'tags' in value;
}

export function isLiveDataEntry(value: unknown): value is LiveDataEntry {
  return value != null && typeof value === 'object'
    && 'id' in value && 'data' in value && 'cacheHint' in value;
}
```

### 1.4 AstroCache Runtime

**New file:** `packages/astro/src/core/cache/runtime.ts`

```ts
export class AstroCache {
  #options: CacheOptions = {};
  #tags: Set<string> = new Set();
  #disabled = false;
  #provider: CacheProvider | null;

  constructor(provider: CacheProvider | null) {
    this.#provider = provider;
  }

  set(input: CacheOptions | CacheHint | LiveDataEntry | false): void {
    if (input === false) {
      this.#disabled = true;
      this.#tags.clear();
      this.#options = {};
      return;
    }
    this.#disabled = false;

    // Extract CacheHint from LiveDataEntry
    let options: CacheOptions | CacheHint;
    if (isLiveDataEntry(input)) {
      if (!input.cacheHint) return;
      options = input.cacheHint;
    } else {
      options = input;
    }

    // Merge scalars: last-write-wins
    if ('maxAge' in options && options.maxAge !== undefined) this.#options.maxAge = options.maxAge;
    if ('swr' in options && options.swr !== undefined) this.#options.swr = options.swr;
    if ('etag' in options && options.etag !== undefined) this.#options.etag = options.etag;

    // lastModified: most recent wins
    if (options.lastModified !== undefined) {
      if (!this.#options.lastModified || options.lastModified > this.#options.lastModified)
        this.#options.lastModified = options.lastModified;
    }

    // Tags: accumulate
    if (options.tags) {
      for (const tag of options.tags) this.#tags.add(tag);
    }
  }

  get tags(): string[] {
    return [...this.#tags];
  }

  async invalidate(input: InvalidateOptions | LiveDataEntry): Promise<void> {
    if (!this.#provider) throw new Error('Cache invalidation requires a cache provider');
    let options: InvalidateOptions;
    if (isLiveDataEntry(input)) {
      options = { tags: input.cacheHint?.tags ?? [] };
    } else {
      options = input;
    }
    return this.#provider.invalidate(options);
  }

  /** Called by the framework after rendering to apply headers */
  _applyHeaders(response: Response): void {
    if (this.#disabled) return;
    const finalOptions: CacheOptions = { ...this.#options, tags: this.tags };
    if (finalOptions.maxAge === undefined && !finalOptions.tags?.length) return;

    const headers = this.#provider?.setHeaders?.(finalOptions) ?? defaultSetHeaders(finalOptions);
    for (const [key, value] of headers) response.headers.set(key, value);
  }

  get _isActive(): boolean {
    return !this.#disabled && (this.#options.maxAge !== undefined || this.#tags.size > 0);
  }
}
```

**New file:** `packages/astro/src/core/cache/noop.ts`

```ts
export class NoopAstroCache {
  set(_input: any): void {}
  get tags(): string[] {
    return [];
  }
  async invalidate(_input: any): Promise<void> {}
  _applyHeaders(_response: Response): void {}
  get _isActive(): boolean {
    return false;
  }
}
```

### 1.5 Phase 1 Tests

**New file:** `packages/astro/test/units/cache/runtime.test.js`

Unit tests for `AstroCache` in isolation (no pipeline, no server):

- `set()` with `CacheOptions` — sets maxAge, swr, tags, lastModified, etag
- `set()` with `CacheHint` — extracts tags and lastModified
- `set()` with `LiveDataEntry` — extracts `entry.cacheHint`
- `set()` with entry that has no cacheHint — no-op
- `set(false)` — disables and clears everything
- Multiple `set()` calls — scalar last-write-wins
- Multiple `set()` calls — `lastModified` most-recent-wins (not last-write)
- Multiple `set()` calls — tags accumulate and deduplicate
- `set(false)` after other calls — clears everything
- `set()` after `set(false)` — re-enables
- `tags` getter — returns a copy, mutations don't affect internal state
- `invalidate()` — calls `provider.invalidate()` with correct options
- `invalidate(entry)` — extracts tags from `entry.cacheHint`
- `invalidate()` without provider — throws
- `_applyHeaders()` — generates correct `CDN-Cache-Control`
- `_applyHeaders()` — generates correct `Cache-Tag`
- `_applyHeaders()` — generates correct `Last-Modified` and `ETag`
- `_applyHeaders()` — uses `provider.setHeaders()` when available
- `_applyHeaders()` — skips when disabled
- `_applyHeaders()` — skips when nothing was set
- `_isActive` — true/false in correct states

**New file:** `packages/astro/test/units/cache/utils.test.js`

- `defaultSetHeaders()` — correct CDN-Cache-Control for maxAge only
- `defaultSetHeaders()` — correct CDN-Cache-Control for maxAge + swr
- `defaultSetHeaders()` — Cache-Tag header from tags array
- `defaultSetHeaders()` — Last-Modified header formatting
- `defaultSetHeaders()` — ETag header
- `defaultSetHeaders()` — empty options produces no headers
- `isCacheHint()` — true for `{ tags: [...] }`
- `isCacheHint()` — false for `CacheOptions`, null, string, etc.
- `isLiveDataEntry()` — true for `{ id, data, cacheHint }`
- `isLiveDataEntry()` — false for `CacheHint`, `CacheOptions`, null
- `normalizeCacheDriverConfig()` — handles URL entrypoint
- `normalizeCacheDriverConfig()` — handles string entrypoint
- `cacheConfigToManifest()` — serializes correctly
- `cacheConfigToManifest()` — returns undefined when no config

**New file:** `packages/astro/test/units/cache/noop.test.js`

- All methods are callable and do nothing
- `tags` returns empty array
- `_isActive` returns false

---

## Phase 2: Pipeline Wiring & RenderContext Integration

Wire the cache driver into the SSR manifest, pipeline, and render context.
After this phase, `Astro.cache` and `context.cache` work end-to-end.

### 2.1 SSR Manifest

**Modify:** `packages/astro/src/core/app/types.ts` — add to `SSRManifest`:

```ts
cacheDriver?: () => Promise<{ default: CacheProviderFactory | null }>;
cacheConfig?: SSRManifestCache;
```

**Modify:** `packages/astro/src/manifest/serialized.ts` — add alongside `sessionDriver`:

```ts
cacheDriver: () => import('${VIRTUAL_CACHE_DRIVER_ID}'),
```

**Modify:** `packages/astro/src/core/build/plugins/plugin-manifest.ts` — serialize:

```ts
cacheConfig: cacheConfigToManifest(settings.config.experimental?.cache),
```

### 2.2 Virtual Module & Vite Plugin

**New file:** `packages/astro/src/core/cache/vite-plugin.ts`

Mirrors `session/vite-plugin.ts`. Resolves `virtual:astro:cache-driver` to the
configured driver entrypoint.

**Modify:** `packages/astro/src/core/create-vite.ts` — register plugin:

```ts
import { vitePluginCacheDriver } from './cache/vite-plugin.js';
// Add to plugins array:
vitePluginCacheDriver({ settings }),
```

### 2.3 Pipeline Integration

**Modify:** `packages/astro/src/core/base-pipeline.ts`

```ts
// Field
resolvedCacheProvider: CacheProvider | null | undefined = undefined;

// Constructor
readonly cacheDriver = manifest.cacheDriver,
readonly cacheConfig = manifest.cacheConfig,

// Method
async getCacheProvider(): Promise<CacheProvider | null> {
  if (this.resolvedCacheProvider !== undefined) return this.resolvedCacheProvider;
  if (this.cacheDriver) {
    const mod = await this.cacheDriver();
    const factory = mod?.default;
    this.resolvedCacheProvider = factory ? factory(this.cacheConfig?.options) : null;
    return this.resolvedCacheProvider;
  }
  this.resolvedCacheProvider = null;
  return null;
}
```

### 2.4 RenderContext

**Modify:** `packages/astro/src/core/render-context.ts`

Add `cache` as a constructor parameter (like `session`). In `RenderContext.create()`:

```ts
const cacheProvider =
  pipeline.runtimeMode === 'development' ? null : await pipeline.getCacheProvider();

const cache =
  pipeline.runtimeMode === 'development' ? new NoopAstroCache() : new AstroCache(cacheProvider);
```

Expose on API context and Astro global (same getter pattern as session, with
warnings for prerendered routes and missing config).

After rendering, apply cache headers:

```ts
renderContext.cache._applyHeaders(response);
```

### 2.5 Runtime Provider Wrapping

For runtime providers with `onRequest`, wrap the request at the pipeline level
(before user middleware). This is NOT user middleware.

```ts
// In the app's request handler:
async handleRequest(request: Request): Promise<Response> {
  const cacheProvider = await this.getCacheProvider();
  if (cacheProvider?.onRequest) {
    return cacheProvider.onRequest(
      { request, url: new URL(request.url) },
      () => this.renderRoute(request)
    );
  }
  return this.renderRoute(request);
}
```

For runtime providers, strip CDN headers from the outgoing response after the
provider's `onRequest` has read them:

```ts
if (cacheProvider?.onRequest) {
  response.headers.delete('CDN-Cache-Control');
  response.headers.delete('Cache-Tag');
}
```

### 2.6 Phase 2 Tests

**New file:** `packages/astro/test/cache-route.test.js`
**New fixture:** `packages/astro/test/fixtures/cache-route/`

Integration tests using a mock/test cache provider:

- Route with `Astro.cache.set({ maxAge: 300 })` generates `CDN-Cache-Control` header
- Route with `Astro.cache.set({ tags: ['a'] })` generates `Cache-Tag` header
- Route with `Astro.cache.set({ lastModified, etag })` generates correct headers
- API route can access `cache.set()` and generates headers
- API route can call `cache.invalidate()` — provider's invalidate is called
- `Astro.cache.tags` returns accumulated tags in route
- Multiple `set()` calls in a route compose correctly
- `Astro.cache.set(false)` produces no cache headers
- Prerendered route accessing `Astro.cache` warns (does not throw)
- Dev mode: `Astro.cache` is available, no cache headers set
- Middleware can access `context.cache.set()` and `context.cache.tags`
- `Astro.cache.set()` in route overrides middleware `cache.set()`

---

## Phase 3: Config Route Matching

Config-level `cache.routes` patterns that apply as defaults.

### 3.1 Route Pattern Matcher

**New file:** `packages/astro/src/core/cache/route-matching.ts`

Reuses Astro's existing route parsing infrastructure — `getParts()`,
`getPattern()`, and `routeComparator()` from `core/routing/`. Cache route
patterns use the same `[param]` / `[...rest]` syntax as file-based routing and
`redirects` in config.

```ts
import { getParts } from '../routing/manifest/create.js';
import { getPattern } from '../routing/manifest/pattern.js';
import { routeComparator } from '../routing/priority.js';

interface CompiledCacheRoute {
  pattern: RegExp;
  options: CacheOptions;
  segments: RoutePart[][];
  route: string;
}

// Called once at startup to compile patterns
export function compileCacheRoutes(
  routes: Record<string, CacheOptions>,
  base: string,
  trailingSlash: AstroConfig['trailingSlash'],
): CompiledCacheRoute[] {
  const compiled = Object.entries(routes).map(([path, options]) => {
    const segments = removeLeadingForwardSlash(path)
      .split(posix.sep)
      .filter(Boolean)
      .map((s) => getParts(s, path));
    const pattern = getPattern(segments, base, trailingSlash);
    return { pattern, options, segments, route: path };
  });
  // Sort by Astro's standard route priority (most specific first)
  compiled.sort((a, b) => routeComparator(a, b));
  return compiled;
}

// Called per-request to find the matching cache rule
export function matchCacheRoute(
  pathname: string,
  compiledRoutes: CompiledCacheRoute[],
): CacheOptions | null {
  for (const route of compiledRoutes) {
    if (route.pattern.test(pathname)) return route.options;
  }
  return null;
}
```

Compiled routes should be cached on the pipeline (computed once, not per-request).

Wire into `RenderContext.create()`: apply matched config route as initial state
before user code runs.

### 3.2 Phase 3 Tests

**New file:** `packages/astro/test/units/cache/route-matching.test.js`

Unit tests for the matcher:

- Exact path `/about` matches `"/about"`
- Rest param `/blog/[...path]` matches `/blog/foo` and `/blog/foo/bar`
- Dynamic param `/blog/[slug]` matches `/blog/foo` but not `/blog/foo/bar`
- Most specific wins: `/blog/featured` over `/blog/[...path]`
- Dynamic param wins over rest: `/blog/[slug]` over `/blog/[...path]`
- No merging: matched pattern is returned as-is
- No match returns null
- Empty routes config returns empty compiled list

**Add to:** `packages/astro/test/cache-route.test.js`

Integration tests:

- Config route `"/blog/[...path]": { maxAge: 300 }` applies to `/blog/foo`
- Config route does NOT apply to non-matching path
- `Astro.cache.set()` in route overrides config rule
- `Astro.cache.set(false)` in route overrides config rule
- Config route tags and in-route tags merge correctly

---

## Phase 4: Node Adapter

First adapter — provides end-to-end proof that the full stack works.

### 4.1 In-Memory LRU Provider

**New file:** `packages/integrations/node/src/cache-driver.ts`

Uses `lru-cache` for in-memory caching with SWR support.

```ts
export default function nodeMemoryProvider(options?: {
  max?: number;
  ttl?: number;
}): CacheProvider {
  const cache = new LRUCache({ ... });
  return {
    name: 'node-memory',
    async onRequest(context, next) {
      const key = context.url.pathname + context.url.search;
      const cached = cache.get(key);
      if (cached && !isExpired(cached)) return cached.response.clone();
      // SWR: serve stale, trigger background revalidation
      if (cached && isStale(cached)) {
        next().then(response => storeResponse(key, response));
        return cached.response.clone();
      }
      const response = await next();
      storeResponse(key, response);
      return response;
    },
    async invalidate(options) { ... },
  };
}
```

**Modify:** `packages/integrations/node/src/index.ts` — set default cache driver
in `astro:config:setup` hook (same pattern as session driver default).

**Add subpath export** in `packages/integrations/node/package.json`:

```json
"./cache": "./dist/cache-driver.js"
```

### 4.2 Phase 4 Tests

**New/extend:** `packages/integrations/node/test/cache.test.js`

- Default driver is set when user doesn't configure one
- User-configured driver overrides the default
- Cached response is served on second request (cache hit)
- Cache miss renders fresh response
- SWR: stale response served immediately, background revalidation fires
- TTL expiry: expired entries are not served
- `cache.invalidate({ tags })` removes matching entries
- `cache.invalidate({ path })` removes matching entries
- LRU eviction: oldest entries are evicted when max is reached
- CDN-Cache-Control and Cache-Tag headers are stripped from client response
- Response body is correctly cloned and served from cache

---

## Phase 5: Cloudflare Adapter (CacheW)

CacheW is a Cloudflare platform feature that inserts a Pingora cache stage
_before_ Worker execution. On cache hit, the Worker never runs. On cache miss,
Pingora invokes the Worker, caches the response based on standard HTTP headers,
and returns it. This is far superior to the old Cache API + KV approach because:

- **Zero Worker invocations on cache hit** — Pingora serves directly
- **No subrequest overhead** — no `caches.default.match()` round-trips
- **SWR handled natively** by Pingora via `stale-while-revalidate` directive
- **Cache tags supported** via `Cache-Tag` header for granular purge
- **Works with service bindings** — each Worker/entrypoint gets its own cache

### How CacheW works

1. Worker opts in via `cache_fetch_handler_responses = "enabled"` on the
   entrypoint class or default export.
2. The framework adapter splits the Worker into two entrypoints: a thin router
   that calls `ctx.exports.App.fetch(request)`, and the actual `App` entrypoint
   that has caching enabled.
3. On cache miss, the App entrypoint runs and returns a Response with standard
   cache headers (`Cache-Control`, `CDN-Cache-Control`, `Cache-Tag`).
4. Pingora caches the response and serves it on subsequent hits.
5. Purge is done via `ctx.cache.purge()` from Worker code. This sends a POST
   to `coreless-purge-ingest` (the standard Cloudflare purge pipeline) with
   zone/account metadata. Supports purge by tags, hosts, prefixes, or
   purge_everything. The purge flows through cache-indexer (local) and
   coreless-flex-purge-queue (global broadcast to all colos).
6. **No external purge API** — Workers use hidden zones, so the public
   Dashboard/API purge endpoints don't work. All purge must originate from
   Worker code.
7. **No single-file purge by URL** — CacheW uses custom cache keys (containing
   script_id, version, pipeline_args, etc.) that can't be derived from URL alone.

Reference: [RFC: Project CacheW](https://wiki.cfdata.org/display/~dlapid/RFC%3A+Project+CacheW+-+Cache+Before+and+Between+Workers),
[PRD: Cache in-between Workers](https://wiki.cfdata.org/display/~birvine-broque/%5BPRD%5D+Cache+in-between+Workers),
[Cache Changes Spec](https://wiki.cfdata.org/display/CACHE/Spec%3A+Cache+Changes+for+CacheW),
[Framework use cases](https://wiki.cfdata.org/pages/viewpage.action?pageId=1304118607)

### 5.1 Cloudflare CDN Provider (header-based)

**New file:** `packages/integrations/cloudflare/src/cache-driver.ts`

Since CacheW handles the actual caching at the Pingora layer, the Astro cache
driver is a pure **header-based provider** — no `onRequest`, no runtime cache
management. It just translates `Astro.cache.set()` into the right response
headers for Pingora to consume.

```ts
export default function cloudflareProvider(): CacheProvider {
  return {
    name: 'cloudflare',
    // No onRequest — Pingora handles cache lookup/store natively.
    // Astro's CDN header flow applies: _applyHeaders() sets
    // CDN-Cache-Control and Cache-Tag on the response, and
    // CacheW/Pingora reads them to decide caching behavior.

    setHeaders(options) {
      const headers = new Headers();
      // Use CDN-Cache-Control for Cloudflare (not visible to browsers)
      const directives: string[] = [];
      if (options.maxAge !== undefined) {
        directives.push(`max-age=${options.maxAge}`);
      }
      if (options.swr !== undefined) {
        directives.push(`stale-while-revalidate=${options.swr}`);
      }
      if (directives.length > 0) {
        headers.set('CDN-Cache-Control', directives.join(', '));
      }
      if (options.tags?.length) {
        headers.set('Cache-Tag', options.tags.join(', '));
      }
      if (options.lastModified) {
        headers.set('Last-Modified', options.lastModified.toUTCString());
      }
      if (options.etag) {
        headers.set('ETag', options.etag);
      }
      return headers;
    },

    async invalidate(options) {
      // Phase 1: ctx.purgeWorkerCache() — purge everything
      // Phase 2 (when available): use cache binding for tag-based purge
      //   e.g. env.CACHE.purge({ tags: options.tags })
      // For now, throw with a helpful message if tag-based purge is attempted
      if (options.tags) {
        throw new Error(
          'Tag-based cache purge on Cloudflare requires a cache binding. ' +
            'See https://developers.cloudflare.com/workers/runtime-apis/cache/',
        );
      }
    },
  };
}
```

### 5.2 Adapter Integration

**Modify:** `packages/integrations/cloudflare/src/index.ts`

In the `astro:config:setup` hook, set default cache driver (same pattern as
session driver default):

```ts
updateConfig({
  experimental: {
    cache: {
      driver: {
        entrypoint: '@astrojs/cloudflare/cache',
      },
    },
  },
});
```

### 5.3 Entrypoint Splitting (future)

For CacheW to work, the Worker needs to be split into two entrypoints: a thin
router and the cacheable App. This requires changes to the Cloudflare adapter's
build output:

```ts
// Generated entry — thin router (default export, no caching)
export default {
  async fetch(request, env, ctx) {
    return ctx.exports.App.fetch(request);
  },
};

// The actual Astro app entrypoint (caching enabled)
export class App extends WorkerEntrypoint {
  cache_fetch_handler_responses = 'enabled';

  async fetch(request) {
    // ... existing Astro SSR handler
  }
}
```

This is a larger change to the adapter's build pipeline and may need to be
coordinated with CacheW's GA timeline. In the interim, the header-based driver
still works — it sets the right headers, and when CacheW is enabled on the
Worker those headers will be respected automatically.

### 5.4 Phase 5 Tests

**New/extend:** `packages/integrations/cloudflare/test/cache.test.js`

- Default driver is set when user doesn't configure one
- User-configured driver overrides the default
- `setHeaders()` generates correct `CDN-Cache-Control` for maxAge + swr
- `setHeaders()` generates correct `Cache-Tag`
- `setHeaders()` generates correct `Last-Modified` and `ETag`
- Headers are present on response (CDN provider — headers are NOT stripped)
- `invalidate()` throws helpful error for tag-based purge (until cache binding available)

---

## Phase 6: Vercel & Netlify Adapters

Header-based providers — simpler since the CDN handles actual caching.

### 6.1 Vercel Provider

**New file:** `packages/integrations/vercel/src/cache-driver.ts`

Header-based (no `onRequest`):

```ts
export default function vercelProvider(): CacheProvider {
  return {
    name: 'vercel',
    setHeaders(options) {
      // CDN-Cache-Control, Cache-Tag, Last-Modified, ETag
    },
    async invalidate(options) {
      // POST to Vercel edge cache invalidation API
    },
  };
}
```

**Modify:** `packages/integrations/vercel/src/index.ts` — set default.

### 6.2 Netlify Provider

**New file:** `packages/integrations/netlify/src/cache-driver.ts`

Uses `Netlify-CDN-Cache-Control`, `Netlify-Cache-Tag`, and `purgeCache()`
from `@netlify/functions`.

**Modify:** `packages/integrations/netlify/src/index.ts` — set default.

### 6.3 Phase 6 Tests

**Vercel tests** (`packages/integrations/vercel/test/cache.test.js`):

- Default driver is set when user doesn't configure one
- `setHeaders()` generates correct `CDN-Cache-Control` for maxAge + swr
- `setHeaders()` generates correct `Cache-Tag`
- `setHeaders()` generates correct `Last-Modified` and `ETag`
- `invalidate({ tags })` calls Vercel purge API with correct payload
- `invalidate()` handles missing `VERCEL_TOKEN` gracefully

**Netlify tests** (`packages/integrations/netlify/test/cache.test.js`):

- Default driver is set when user doesn't configure one
- `setHeaders()` uses `Netlify-CDN-Cache-Control` (not standard)
- `setHeaders()` uses `Netlify-Cache-Tag` (not standard)
- `invalidate({ tags })` calls `purgeCache()` with correct tags
- `durable` directive is included in cache-control

---

## Phase 7: Documentation

- Add `experimental.cache` to the experimental flags reference
- Write guide: "Route Caching" (concepts, when to use, examples)
- Write per-adapter docs for platform-specific behavior
- Write integration guide for live collections
- Add changelog entry

---

## Implementation Order

Recommended PR sequence:

1. **Phase 1** — Core types, config, AstroCache runtime, unit tests
2. **Phase 2** — Pipeline wiring, RenderContext, integration tests
3. **Phase 3** — Config route matching + tests
4. **Phase 4** — Node adapter + end-to-end tests
5. **Phase 5** — Cloudflare adapter + tests
6. **Phase 6** — Vercel + Netlify adapters + tests
7. **Phase 7** — Documentation

Phases 1–3 can be a single PR or split into two (1 + 2–3).
Adapter phases (4–6) are independent of each other and can land in any order.

---

## File Summary

### New files

| File                                                     | Phase | Purpose                                        |
| -------------------------------------------------------- | ----- | ---------------------------------------------- |
| `packages/astro/src/core/cache/types.ts`                 | 1     | CacheProvider, CacheOptions, InvalidateOptions |
| `packages/astro/src/core/cache/config.ts`                | 1     | Zod schema for cache config                    |
| `packages/astro/src/core/cache/utils.ts`                 | 1     | normalization, default headers, type guards    |
| `packages/astro/src/core/cache/runtime.ts`               | 1     | `AstroCache` class                             |
| `packages/astro/src/core/cache/noop.ts`                  | 1     | `NoopAstroCache` for dev mode                  |
| `packages/astro/src/core/cache/vite-plugin.ts`           | 2     | Virtual module for cache driver                |
| `packages/astro/src/core/cache/route-matching.ts`        | 3     | Config route pattern matcher                   |
| `packages/astro/test/units/cache/runtime.test.js`        | 1     | AstroCache unit tests                          |
| `packages/astro/test/units/cache/utils.test.js`          | 1     | Utility function unit tests                    |
| `packages/astro/test/units/cache/noop.test.js`           | 1     | NoopAstroCache unit tests                      |
| `packages/astro/test/units/cache/route-matching.test.js` | 3     | Route matching unit tests                      |
| `packages/astro/test/cache-route.test.js`                | 2     | Integration tests                              |
| `packages/astro/test/fixtures/cache-route/`              | 2     | Test fixture                                   |
| `packages/integrations/node/src/cache-driver.ts`         | 4     | Node in-memory LRU provider                    |
| `packages/integrations/cloudflare/src/cache-driver.ts`   | 5     | Cloudflare Cache API provider                  |
| `packages/integrations/vercel/src/cache-driver.ts`       | 6     | Vercel CDN header provider                     |
| `packages/integrations/netlify/src/cache-driver.ts`      | 6     | Netlify CDN header provider                    |

### Modified files

| File                                                       | Phase | Change                                                    |
| ---------------------------------------------------------- | ----- | --------------------------------------------------------- |
| `packages/astro/src/types/public/config.ts`                | 1     | Add `experimental.cache` type                             |
| `packages/astro/src/core/config/schemas/base.ts`           | 1     | Add cache schema to experimental                          |
| `packages/astro/src/core/create-vite.ts`                   | 2     | Register cache vite plugin                                |
| `packages/astro/src/core/app/types.ts`                     | 2     | Add `cacheDriver`, `cacheConfig` to SSRManifest           |
| `packages/astro/src/manifest/serialized.ts`                | 2     | Add cache driver import                                   |
| `packages/astro/src/core/build/plugins/plugin-manifest.ts` | 2     | Serialize cache config                                    |
| `packages/astro/src/core/base-pipeline.ts`                 | 2     | Add `getCacheProvider()` method                           |
| `packages/astro/src/core/render-context.ts`                | 2     | Create AstroCache, expose on context/Astro, apply headers |
| `packages/integrations/node/src/index.ts`                  | 4     | Set default cache driver                                  |
| `packages/integrations/cloudflare/src/index.ts`            | 5     | Set default cache driver                                  |
| `packages/integrations/vercel/src/index.ts`                | 6     | Set default cache driver                                  |
| `packages/integrations/netlify/src/index.ts`               | 6     | Set default cache driver                                  |
