# Route Caching: Platform Cache Providers Implementation Plan

**Status:** Draft
**Author:** Matt Kane
**Date:** April 14, 2026

## Context

Astro 6 shipped route caching as an experimental feature with a single provider: an in-memory LRU cache for the Node adapter (`memoryCache()` from `astro/config`). The RFC and docs describe built-in providers for Netlify, Vercel, and Cloudflare Workers, but none have been implemented yet. No adapter currently sets a default cache provider.

This document covers the implementation of three first-party CDN-style cache providers, shipped as subpath exports of each adapter package:

- `@astrojs/netlify/cache`
- `@astrojs/vercel/cache`
- `@astrojs/cloudflare/cache`

## Architecture Overview

### What already exists

The route caching system (`packages/astro/src/core/cache/`) is fully built:

- **Types:** `CacheProvider`, `CacheProviderFactory`, `CacheProviderConfig`, `CacheOptions`, `InvalidateOptions` (in `types.ts`)
- **Runtime:** `AstroCache` class handles `set()`/`tags`/`options`/`invalidate()` with merge semantics, route rule matching, and live collection integration
- **Pipeline integration:** `base-pipeline.ts` lazy-loads the provider; `app/base.ts` wraps rendering with `onRequest()` for runtime providers, or applies `setHeaders()` for CDN-style ones
- **Header generation:** `runtime/utils.ts` has `defaultSetHeaders()` producing `CDN-Cache-Control`, `Cache-Tag`, `Last-Modified`, `ETag`
- **Vite plugin:** Virtual module `virtual:astro:cache-provider` resolves the configured provider entrypoint
- **Memory provider:** Full LRU implementation in `memory-provider.ts` (538 lines) with query normalization, Vary support, SWR
- **Tests:** `cache-route.test.js`, `cache-memory.test.js`, `cache-memory-query.test.js` with fixtures

### Provider types recap

**CDN-style providers** (what we're building):

- Implement `setHeaders()` to translate cache options into platform-specific response headers
- Implement `invalidate()` to call platform purge APIs
- Do NOT implement `onRequest()` -- the external CDN handles actual caching
- Headers are applied to the response, CDN reads them, Astro strips `CDN-Cache-Control` and `Cache-Tag` before the response reaches the browser

**Runtime providers** (already built -- memory cache):

- Implement `onRequest()` middleware to intercept requests
- Handle caching in-process

### How the pipeline uses providers

1. User calls `Astro.cache.set({ maxAge: 300, tags: ['products'] })`
2. `AstroCache` accumulates options (merge semantics: tags union, scalars last-write-wins, lastModified most-recent-wins)
3. After rendering, `setHeaders()` is called with accumulated options -> returns `Headers`
4. Those headers are applied to the Response
5. For CDN providers: headers pass through to the CDN, which does the caching. `CDN-Cache-Control` and `Cache-Tag` are stripped from the final response per RFC 9213.
6. For `invalidate()`: called directly from user code (API routes, webhooks), hits the platform's purge API

---

## Provider 1: Netlify (`@astrojs/netlify/cache`)

### Platform behavior

Netlify uses targeted cache control headers and has a mature purge-by-tag API.

**Headers:**
| Astro option | Netlify header |
|---|---|
| `maxAge` + `swr` | `Netlify-CDN-Cache-Control: public, durable, max-age={maxAge}, stale-while-revalidate={swr}` |
| `maxAge` only | `Netlify-CDN-Cache-Control: public, durable, max-age={maxAge}` |
| `tags` | `Netlify-Cache-Tag: {comma-separated}` |
| `lastModified` | `Last-Modified: {HTTP date}` |
| `etag` | `ETag: {value}` |

Key details:

- Use `Netlify-CDN-Cache-Control` (most specific, Netlify-only). Also set `CDN-Cache-Control` as fallback for any intermediate caches.
- Always include `durable` directive -- stores in Netlify's shared durable cache across edge nodes, reducing function invocations. This is critical for SSR caching.
- Always include `public` directive.
- Use `Netlify-Cache-Tag` (Netlify-specific). Also set `Cache-Tag` for downstream caches.

**Invalidation:**

```ts
import { purgeCache } from '@netlify/functions';
await purgeCache({ tags: ['tag1', 'tag2'] });
```

- `purgeCache` is from `@netlify/functions` (runtime dependency on Netlify)
- Supports `tags` array and site-wide purge (no args)
- Path-based invalidation: not directly supported by Netlify's purge API. We can work around this by using the path as a tag (add it automatically in `setHeaders`), or throw a descriptive error.
- Rate limit: each tag/site can only be purged twice every 5 seconds

**Config options:**

```ts
export function cacheNetlify(options?: {
  durable?: boolean; // default: true -- use durable cache
}): CacheProviderConfig;
```

Minimal config needed -- Netlify's runtime environment provides auth context automatically via `purgeCache`.

### Implementation

```
packages/integrations/netlify/
  src/
    cache/
      index.ts      -- cacheNetlify() config helper
      provider.ts   -- CacheProviderFactory default export
  package.json      -- add "./cache" export, add @netlify/functions as optional peer dep
```

### Open questions

- Should we auto-add the request path as a cache tag to enable path-based invalidation? The RFC says path invalidation is exact-match. We could tag responses with a normalized `path:/products/laptop` tag and translate `invalidate({ path })` into a tag purge. This is the same approach Netlify's own frameworks use.

---

## Provider 2: Vercel (`@astrojs/vercel/cache`)

### Platform behavior

Vercel supports targeted cache control via `Vercel-CDN-Cache-Control` and tag-based purging.

**Headers:**
| Astro option | Vercel header |
|---|---|
| `maxAge` + `swr` | `Vercel-CDN-Cache-Control: public, max-age={maxAge}, stale-while-revalidate={swr}` |
| `maxAge` only | `Vercel-CDN-Cache-Control: public, max-age={maxAge}` |
| `tags` | `Vercel-Cache-Tag: {comma-separated}` |
| `lastModified` | `Last-Modified: {HTTP date}` |
| `etag` | `ETag: {value}` |

Key details:

- Use `Vercel-CDN-Cache-Control` (highest priority, Vercel-only). Vercel strips this before forwarding to client.
- Use `Vercel-Cache-Tag` for tags. Also set `Cache-Tag` for downstream caches.
- Vercel uses `s-maxage` in `Cache-Control` traditionally, but `Vercel-CDN-Cache-Control` with `max-age` is the modern approach and takes priority.
- Limits: 256 chars per tag, 128 tags per response

**Invalidation:**

Uses `@vercel/functions` directly at runtime:

```ts
import { invalidateByTag } from '@vercel/functions';
await invalidateByTag('products');
```

- `@vercel/functions` is always available in the Vercel runtime. No REST API fallback -- if you need external invalidation (webhook running outside Vercel), call the Vercel API yourself.
- Path-based invalidation: same approach as Netlify -- auto-tag with path, translate `invalidate({ path })` to tag purge.
- `invalidateByTag` is a soft invalidation (marks stale, SWR serves stale while revalidating). This is the right default -- matches the SWR semantics of route caching.

**Config options:**

```ts
export function cacheVercel(options?: {}): CacheProviderConfig;
```

No config needed -- `@vercel/functions` handles auth automatically in the Vercel runtime.

### Implementation

```
packages/integrations/vercel/
  src/
    cache/
      index.ts      -- cacheVercel() config helper
      provider.ts   -- CacheProviderFactory default export
  package.json      -- add "./cache" export, add @vercel/functions as peer dep
```

---

## Provider 3: Cloudflare Workers (`@astrojs/cloudflare/cache`)

### Platform behavior

Cloudflare Workers supports a built-in caching layer that sits immediately before Worker execution. When enabled:

1. Request enters the cache-enabled pipeline
2. Cache stage checks Cloudflare's cache infrastructure (Pingora)
3. On cache **HIT**: response returned immediately, Worker never executes
4. On cache **MISS**: the Worker is invoked, its response is cached, then returned

This is fundamentally different from the existing Workers Cache API (`caches.default`). The built-in cache uses Cloudflare's full cache infrastructure (disk cache, tiered caching, global distribution) rather than per-colo in-memory cache.

**How it works for SSR:**

- The Worker sets standard `Cache-Control` headers on its response (e.g., `Cache-Control: public, s-maxage=300`)
- The cache layer respects these headers and caches according to standard HTTP semantics
- Cache hits bypass Worker execution entirely -- massive performance win for SSR

**Headers:**

The cache layer supports Cloudflare's targeted cache-control header, following the same pattern as Netlify and Vercel:

| Astro option     | Response header                                                                        |
| ---------------- | -------------------------------------------------------------------------------------- |
| `maxAge` + `swr` | `Cloudflare-CDN-Cache-Control: public, max-age={maxAge}, stale-while-revalidate={swr}` |
| `maxAge` only    | `Cloudflare-CDN-Cache-Control: public, max-age={maxAge}`                               |
| `tags`           | `Cache-Tag: {comma-separated}`                                                         |
| `lastModified`   | `Last-Modified: {HTTP date}`                                                           |
| `etag`           | `ETag: {value}`                                                                        |

Key details:

- Use `Cloudflare-CDN-Cache-Control` (Cloudflare-specific, highest priority, stripped before reaching the client)
- Use standard `Cache-Tag` header for tag-based purging
- Worker caching is opt-in per Worker version at upload time (wrangler config)

**Invalidation:**

The `cache` object is available as a module import from `cloudflare:workers`, same pattern as `env`:

```ts
import { cache } from 'cloudflare:workers';

// Tag-based purge
await cache.purge({ tags: ['products', 'product:123'] });

// Path prefix purge (native -- no tag workaround needed)
await cache.purge({ pathPrefixes: ['/products'] });

// Purge everything
await cache.purge({ purgeEverything: true });
```

This eliminates the ctx threading problem entirely -- no execution context needed, no module-level holder, no interface changes. The provider just imports `cache` from `cloudflare:workers` and calls `purge()`.

**Path-based invalidation:** `invalidate({ path })` uses `cache.purge({ pathPrefixes: [path] })` natively. No tag overhead. `pathPrefixes` is technically prefix-matching, but an exact path like `/products/123` won't collide with `/products/1234` because Cloudflare matches on path separators.

```ts
interface CachePurgeOptions {
  tags?: string[];
  pathPrefixes?: string[];
  purgeEverything?: boolean;
}
```

**Config:**

```ts
export function cacheCloudflare(options?: {
  // Worker caching is configured at the wrangler level, not here
  // This provider just needs to know caching is enabled
}): CacheProviderConfig;
```

The Cloudflare adapter will enable Worker caching automatically when route caching is configured, via its existing wrangler config mutation (`cloudflareConfigCustomizer` in `wrangler.ts`). This follows the same pattern the adapter already uses to auto-provision KV bindings for sessions, image bindings, and the assets binding. The config customizer will add `cache: { enabled: true }` to the Worker metadata at upload time. No manual wrangler.jsonc editing needed.

### Invalidation

**Target API:** `import { cache } from 'cloudflare:workers'`

The `cache` object will be available as a module import from `cloudflare:workers`, the same pattern as `env`. This eliminates the ctx threading problem entirely -- no execution context needed, no module-level holder, no changes to `CacheProvider` interface. The provider just imports and calls `cache.purge()`:

```ts
// cache/provider.ts -- target implementation
import { cache } from 'cloudflare:workers';

async invalidate(options: InvalidateOptions) {
  if (options.tags) {
    const tags = Array.isArray(options.tags) ? options.tags : [options.tags];
    await cache.purge({ tags });
  }
  if (options.path) {
    await cache.purge({ pathPrefixes: [options.path] });
  }
}
```

**Temporary implementation:** Until `import { cache } from 'cloudflare:workers'` is available, use a module-scoped `ctx.cache` reference set by the adapter. The adapter's `handle()` function stashes the execution context before calling `app.render()`:

```ts
// cache/context.ts -- TEMPORARY, remove when cloudflare:workers exports cache
let currentCtx: ExecutionContext | undefined;
export function setCurrentCtx(ctx: ExecutionContext) { currentCtx = ctx; }
export function getCurrentCtx() { return currentCtx; }

// handler.ts -- one-line addition before app.render()
// TODO: remove when `import { cache } from 'cloudflare:workers'` is available
setCurrentCtx(context);

// cache/provider.ts -- TEMPORARY implementation
// TODO: replace with `import { cache } from 'cloudflare:workers'` when available
async invalidate(options: InvalidateOptions) {
  const ctx = getCurrentCtx();
  if (!ctx?.cache) {
    throw new Error('Worker cache not available. Ensure caching is enabled in your Worker config.');
  }
  if (options.tags) {
    const tags = Array.isArray(options.tags) ? options.tags : [options.tags];
    await ctx.cache.purge({ tags });
  }
  if (options.path) {
    await ctx.cache.purge({ pathPrefixes: [options.path] });
  }
}
```

### Dependency requirements

The temporary `ctx.cache` approach requires:

- **`@cloudflare/vite-plugin`**: latest version with Worker caching support
- **`@cloudflare/workers-types`**: latest version with `CachePurgeOptions` types

Both are very recently published, which means we'll need a **temporary exception for pnpm's minimum release age** policy (`minReleaseAge` in `.npmrc` / pnpm config). Add a comment explaining the exception and that it can be removed once these packages age past the threshold.

### Implementation

```
packages/integrations/cloudflare/
  src/
    cache/
      index.ts      -- cacheCloudflare() config helper
      provider.ts   -- CacheProviderFactory default export
      context.ts    -- TEMPORARY: module-level ctx getter/setter
    utils/
      handler.ts    -- TEMPORARY: setCurrentCtx(context) before app.render()
  package.json      -- add "./cache" export
```

When `import { cache } from 'cloudflare:workers'` is available: delete `context.ts`, remove the `setCurrentCtx` call from `handler.ts`, and update `provider.ts` to import directly. The `setHeaders()` implementation is unaffected.

### Open questions

- **`cache` types:** `CachePurgeOptions` is in `@cloudflare/workers-types`. The `cache` export on `cloudflare:workers` won't be typed until it ships -- until then we type `ctx.cache` ourselves.

---

## Provider Registration

During the experimental phase, providers are **not auto-registered by adapters**. Users must explicitly configure them in `astro.config.mjs`, same as the existing Node memory provider:

```ts
// @astrojs/cloudflare example
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

```ts
// @astrojs/netlify example
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

```ts
// @astrojs/vercel example
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

Auto-registration by adapters is deferred until route caching graduates from experimental. For Cloudflare, the adapter will still auto-enable Worker caching in the wrangler config when it detects a Cloudflare cache provider is configured.

---

## Shared Utilities

All three CDN providers share patterns that should be extracted:

### Path-based invalidation

Each platform handles `invalidate({ path })` differently:

| Platform       | Implementation                                                                 |
| -------------- | ------------------------------------------------------------------------------ |
| **Cloudflare** | Native: `cache.purge({ pathPrefixes: [path] })` -- exact path, no tag overhead |
| **Netlify**    | Auto-tag with `astro-path:{pathname}`, purge via tag                           |
| **Vercel**     | Auto-tag with `astro-path:{pathname}`, purge via `invalidateByTag`             |

For Netlify and Vercel, `setHeaders()` auto-includes `pathTag(url.pathname)` in the response tags. When `invalidate({ path })` is called, it translates to a tag purge. This costs one tag per response. CDN tag limits (Vercel: 128, Netlify: 500) are generous enough that this isn't a concern.

For Cloudflare, `invalidate({ path })` uses `pathPrefixes` with the exact path -- no auto-tagging needed. Note: `pathPrefixes` is technically a prefix match, but an exact path like `/products/123` won't match `/products/1234` because Cloudflare matches on path separators. We may expose prefix purge as a separate API in the future.

```ts
// Shared helper for Netlify/Vercel path-as-tag
function pathTag(path: string): string {
  return `astro-path:${path}`;
}
```

### Default header generation as a base

The existing `defaultSetHeaders()` in `runtime/utils.ts` generates `CDN-Cache-Control` and `Cache-Tag`. Each provider overrides to use platform-specific header names, but the logic is identical. We should expose `defaultSetHeaders` as a utility the providers can wrap.

---

## Implementation Order

### Phase 1: Shared utilities

Extract the common building blocks that all three providers depend on.

1. Extract `pathTag()` helper and `normalizeInvalidateToTags()` utility for Netlify/Vercel path invalidation
2. Expose `defaultSetHeaders()` from `runtime/utils.ts` as a reusable base for platform-specific header generation
3. Add shared test helpers for CDN provider assertions (verify headers, verify tag stripping)

### Phase 2: Netlify provider

**Why first:** Simplest API surface. `purgeCache` from `@netlify/functions` handles auth automatically. Well-documented public API.

1. Create `packages/integrations/netlify/src/cache/provider.ts`
2. Create `packages/integrations/netlify/src/cache/index.ts` (config helper exporting `cacheNetlify()`)
3. Add `"./cache"` subpath export to package.json
4. Add integration test (CDN-style: verify correct headers are set)
5. Add e2e test fixture

### Phase 3: Vercel provider

Similar to Netlify but uses `@vercel/functions` for invalidation. Slightly more complex header hierarchy (`Vercel-CDN-Cache-Control` > `CDN-Cache-Control` > `Cache-Control`).

1. Create `packages/integrations/vercel/src/cache/provider.ts`
2. Create `packages/integrations/vercel/src/cache/index.ts` (config helper exporting `cacheVercel()`)
3. Add `"./cache"` subpath export
4. Tests

### Phase 4: Cloudflare Workers provider

`import { cache } from 'cloudflare:workers'` is confirmed shipping this week (w/c Apr 14, 2026). Initial implementation uses `ctx.cache` via module-scoped holder as a temporary bridge.

1. Add temporary pnpm `minReleaseAge` exception for `@cloudflare/vite-plugin` and `@cloudflare/workers-types`
2. Update `@cloudflare/vite-plugin` and `@cloudflare/workers-types` to latest
3. Create provider with temporary `ctx.cache` module-scoped holder (comment all temporary code for easy cleanup)
4. Add `setCurrentCtx(context)` call in `handler.ts` (temporary, commented)
5. Add cache enablement to `cloudflareConfigCustomizer` (`cache: { enabled: true }` in Worker metadata)
6. Add `"./cache"` subpath export (config helper exporting `cacheCloudflare()`)
7. Tests (will need Worker caching enabled in test environment)
8. **Follow-up:** When `cloudflare:workers` exports `cache`, remove `context.ts`, remove `setCurrentCtx` from handler, switch provider to direct import, remove pnpm age exception

### Phase 5: Documentation and changesets

1. Update documentation (adapter docs, route caching docs)
2. Add changeset entries

---

## Test Strategy

### Unit tests per provider

- `setHeaders()` produces correct platform-specific headers for all option combinations
- `setHeaders()` with no options returns empty headers
- `invalidate({ tags })` calls platform API correctly
- `invalidate({ path })` uses native prefix purge (Cloudflare) or tag-based purge (Netlify/Vercel)
- Error handling when platform API fails (timeout, auth error, rate limit)

### Integration tests

Extend existing `cache-route.test.js` pattern:

- Mock CDN provider fixture per platform
- Verify headers on responses
- Verify `CDN-Cache-Control`/`Cache-Tag` are stripped from final response
- Verify route rules work with CDN providers
- Verify `cache.set(false)` opt-out works

### E2E tests

- Deploy to each platform and verify actual caching behavior
- Verify invalidation works end-to-end
- These likely live outside the main test suite (platform-specific CI)

---

## Risk Assessment

| Risk                                 | Likelihood | Impact | Mitigation                                                                                    |
| ------------------------------------ | ---------- | ------ | --------------------------------------------------------------------------------------------- |
| Netlify/Vercel API changes           | Low        | Low    | These APIs are stable and public                                                              |
| Tag limits hit in practice           | Low        | Medium | Document limits. Warn when approaching limits.                                                |
| Path-based invalidation expectations | Medium     | Low    | Cloudflare uses native path purge. Netlify/Vercel use tag-based approach -- document clearly. |

---

## References

- [Route Caching RFC](https://github.com/withastro/roadmap/blob/feat/route-caching/proposals/0056-route-caching.md)
- [Current experimental docs](https://docs.astro.build/en/reference/experimental-flags/route-caching/)
- (internal) Workers cache RFC: wiki.cfdata.org/display/~dlapid/RFC:+Project+CacheW
- (internal) Workers cache runtime spec: wiki.cfdata.org/display/EW/SPEC:+Runtime+Changes+for+CacheW
- (internal) Workers cache infra spec: wiki.cfdata.org/display/CACHE/Spec:+Cache+Changes+for+CacheW
- [Netlify caching docs](https://docs.netlify.com/platform/caching/)
- [Vercel CDN cache docs](https://vercel.com/docs/caching/cdn-cache)
- [Vercel cache purging docs](https://vercel.com/docs/caching/cdn-cache/purge)
- Working cache example: `~/Downloads/index.ts` (purge via `cache.purge()`)
- Existing implementation: `packages/astro/src/core/cache/`
- Existing tests: `packages/astro/test/cache-route.test.js`, `cache-memory.test.js`
