# i18n Fallback 500 Sentinel — Astro Reference

## Why this matters

During prerendering, i18n fallback routes produce a **500 response with a null body**. This is not an error — it's an internal signaling mechanism that tells the i18n layer "no page exists for this locale, apply fallback logic." Any code that inspects response status codes in the render or prerender pipeline must account for this sentinel.

---

## How fallback routes are created

When an Astro config defines i18n with fallbacks:

```ts
i18n: {
  defaultLocale: 'en',
  locales: ['en', 'fr'],
  fallback: { fr: 'en' },
  routing: { fallbackType: 'rewrite' }
}
```

And only English pages exist (`src/pages/about.astro` but no `src/pages/fr/about.astro`), the manifest creates synthetic routes with `type: 'fallback'` for the missing French pages (`packages/astro/src/core/routing/create-manifest.ts:877,951`). These routes are included in the list of paths to prerender via `StaticPaths.getAll()` (`packages/astro/src/runtime/prerender/static-paths.ts:51-55,130-134`).

---

## The sentinel

When `PagesHandler` encounters a route with `type: 'fallback'`, it does not attempt to render it — there is no page file. Instead it returns a sentinel response:

```ts
// packages/astro/src/core/pages/handler.ts:90-92
case 'fallback': {
    return new Response(null, { status: 500, headers: { [ROUTE_TYPE_HEADER]: 'fallback' } });
}
```

The `ROUTE_TYPE_HEADER` (`X-Astro-Route-Type: fallback`) tells downstream handlers this is a fallback sentinel, not a real server error. The 500 status (rather than 404) ensures it won't be confused with user-authored 404 responses.

---

## How the i18n layer resolves it

Inside `BaseApp.render()`, the i18n handler intercepts the sentinel:

1. **`packages/astro/src/core/i18n/handler.ts:132-136`** — Recognizes the `ROUTE_TYPE_HEADER` and converts the 500 to an effective 404 for fallback computation.
2. **`packages/astro/src/i18n/fallback.ts:45-117`** — `computeFallbackRoute()` determines whether to rewrite or redirect to the default locale's page based on `fallbackType` in the config.
3. For **rewrites**, `state.rewrite('/about/')` re-renders the English page, producing a 200 with the English HTML.
4. For **redirects**, a 301/302 is returned.

---

## What reaches `renderPath()`

The response that `prerenderer.render()` returns to `renderPath()` depends on whether the i18n layer fully resolved the sentinel:

| Scenario | Status | Body | Result |
|----------|--------|------|--------|
| i18n rewrite succeeds | 200 | HTML content | File is written normally |
| i18n redirect | 301/302 | null | Redirect HTML is generated |
| Sentinel passes through unresolved | **500** | **null** | `!response.body` returns `null`, file is skipped |

The third case occurs in practice. When the sentinel reaches `renderPath()` unresolved, the `!response.body` check returns `null` and the file is correctly skipped — the content is served via the default locale's page.

Note: the `ROUTE_TYPE_HEADER` set by `PagesHandler` is **not** present on the response by the time it reaches `renderPath()` — the headers are empty. However, `route.type` (passed as a parameter from the manifest) is reliably `'fallback'` for these routes.

---

## Effects on downstream code

Any status code check in the prerender pipeline must handle the sentinel:

- **`renderPath()`** in `packages/astro/src/core/build/generate.ts` — If checking for 500+ errors, must exclude `route.type === 'fallback'`.
- **Error handlers** in `packages/astro/src/core/errors/build-handler.ts` — The `BuildErrorHandler` sees the sentinel as a 500 with a response object, and returns it as-is (doesn't throw).
- **`AstroHandler.render()`** in `packages/astro/src/core/routing/handler.ts:179-195` — Checks for reroutable status codes (404, 500) after i18n finalization. If the sentinel wasn't resolved by i18n, this path calls `renderError()` which returns the sentinel through the `BuildErrorHandler`.

---

## Key files

| File | Role |
|------|------|
| `packages/astro/src/core/pages/handler.ts:90-92` | Produces the 500 sentinel for fallback routes |
| `packages/astro/src/core/i18n/handler.ts:62-74, 132-156` | Intercepts the sentinel and applies rewrite/redirect logic |
| `packages/astro/src/i18n/fallback.ts:45-117` | Computes the fallback target (rewrite path or redirect URL) |
| `packages/astro/src/core/routing/create-manifest.ts:877,951` | Creates fallback routes with `type: 'fallback'` |
| `packages/astro/src/core/build/generate.ts` | `renderPath()` — consumes the final response |
| `packages/astro/src/core/errors/build-handler.ts:22-28` | Passes sentinel 500s through without throwing |

## Debugging

To see what responses reach `renderPath()`, add a `console.log` before response handling:

```ts
console.log(`renderPath "${pathname}" => status=${response.status}, body=${response.body != null}, route.type=${route.type}`);
```

Expected output for a fallback route:
```
renderPath "/fr/about" => status=500, body=false, route.type=fallback
```

A `route.type=page` with `status=500` indicates a real error, not a sentinel.
