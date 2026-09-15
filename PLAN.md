# Personalised `3xx.astro` redirect page (roadmap #1170)

## Context

### The proposal

[withastro/roadmap#1170](https://github.com/withastro/roadmap/issues/1170) (Stage 2, May 2025, champions @ematipico + @avevotsira, from discussion #844) asks for a `3xx.astro` special page so users can control the markup of Astro's redirect page, adjust its refresh delay, and translate it. Original API sketch: a `redirectDelay` config option plus `Astro.redirectTo` / `Astro.redirectFrom`. @matthewp's review comment asked that `redirectFrom`/`redirectTo` be **regular props**, not `Astro` globals.

### Is it still relevant? Yes — with a narrower scope than in May 2025

Verified against `astro@7.3.2` at HEAD:

- The template is still entirely hardcoded — `packages/astro/src/core/routing/3xx.ts` builds a fixed `<!doctype html>` string with `const delay = status === 302 ? 2 : 0`, fixed English copy, and fixed `robots`/`canonical` tags. There is no config knob; the only escape hatch is `build.redirects: false`, which drops the file entirely.
- Static builds still emit that page for **every** 3xx: `redirects:` config entries, `Astro.redirect()` from a prerendered page, i18n `redirectToDefaultLocale`, and i18n fallback 302s — all funnel through `core/build/generate.ts:551-573`.
- `i18n.routing.redirectToDefaultLocale: true` still causes `dist/index.html` to be replaced by the built-in redirect page, discarding the user's `src/pages/index.astro` render. That was @delucis's objection in #844 and it is still live (though `redirectToDefaultLocale: false` is now a workaround).

Two things **have** changed since the proposal was written, and they shrink the scope:

- SSR redirects return `new Response(null, …)` (`core/redirects/render.ts:88`) — there is no body to personalise. Browsers follow `Location`. `redirectTemplate` survives in SSR only for the trailing-slash normaliser, whose body nobody reads.
- `i18n.routing.fallbackType` defaults to `'rewrite'`, so i18n fallbacks no longer redirect by default. One of the three motivating pain points is already gone.

**Net: the feature is worth building, but it is a static-output feature.** The `redirectDelay` config option from the proposal is subsumed — a custom `3xx.astro` writes its own `<meta http-equiv="refresh">` and therefore owns the delay.

### Decisions taken

- **Scope**: `output: 'static'` only. SSR/dev keep their current bodies.
- **Location**: `src/pages/3xx.astro`, routable like `404.astro`/`500.astro`.
- **Data**: props only (`Astro.props = { from, to, status, delay }`); the user writes the meta refresh tag. The build inspects the rendered HTML and warns when the tag is missing or points elsewhere.
- **Rollout**: behind `experimental.redirectPage`.

---

## Approach

`3xx.astro` is a normal page route. What changes is that, **during prerendering only**, a 3xx response with a null body gets its body filled by rendering that route with per-redirect props — the exact mechanism `500.astro` already uses to receive `Astro.props.error`.

The render happens **inside the app**, not in `generate.ts`. `generate.ts` only talks to a prerenderer through the public `AstroPrerenderer.render(request, { routeData, collectMetadata })` (`types/public/integrations.ts:282`), which has no props channel, and adapters may replace the prerenderer wholesale. Putting the render behind `app.render()` means any prerenderer gets it for free and no public API changes.

`generate.ts` then simply prefers `response.body` over `redirectTemplate()`.

## Files to change

### 1. Experimental flag — `experimental.redirectPage`

Clone the `chromeDevtoolsWorkspace` pattern exactly (PR #14122 touched 5 files):

- `src/core/config/schemas/defaults.ts:58-64` — add `redirectPage: false`.
- `src/core/config/schemas/base.ts:510-540` — `redirectPage: z.boolean().optional().default(ASTRO_CONFIG_DEFAULTS.experimental.redirectPage)`.
- `src/types/public/config.ts` (experimental block, ~`:3388-3597`) — `@docs`-tagged JSDoc with `@name experimental.redirectPage`, `@version 7.4`, a config snippet, a `3xx.astro` example showing the required meta refresh, and a link to `https://docs.astro.build/en/reference/experimental-flags/redirect-page/`. Note the `@docs` JSDoc exemption in `AGENTS.md` — this block is end-user prose.

### 2. Route predicate and constants

- `src/core/routing/internal/route-errors.ts` — add `ROUTE3XX_RE = /^\/3xx\/?$/` and `isRoute3xx()`, next to `isRoute404`/`isRoute500`. This file deliberately has no imports; keep it that way.
- `src/core/build/common.ts:8` and `src/core/output-filename.ts:5` — add `'/3xx'` to both `STATUS_CODE_PAGES` sets so the standalone page emits `dist/3xx.html` rather than `dist/3xx/index.html`, matching 404/500.
- `src/i18n/router.ts:123` — add `/3xx` to the `pathname.includes('/404') || pathname.includes('/500')` skip list so i18n doesn't try to prefix it with a locale.

### 3. Rendering the page — new `src/core/routing/redirect-page.ts`

Model it on `renderDefaultError` in `src/core/errors/default-handler.ts:104-120`, which is the existing, proven way to render a special page out of band:

```ts
// shape, not final code
export async function renderRedirectPage(
  manifest: SSRManifest,
  request: Request,
  props: { from: string; to: string; status: number; delay: number },
): Promise<Response | undefined>;
```

- Find the route with `getRouteTable(manifest)` + `isRoute3xx`; return `undefined` when absent so the caller falls back to `redirectTemplate`.
- `const mod = await getEnvironment(manifest).getComponentByRoute(manifest, route3xx)`.
- `const state = new FetchState(manifest, request)`; set `routeData`, `pathname`, `componentInstance`, and `state.initialProps = props` — consumed at `fetch-state.ts:1147-1151`.
- Set `state.skipMiddleware = true`. Middleware already ran for the originating request; re-running it around a template render invites loops for no benefit. Document this in the JSDoc.
- Call `handlePages(state)`, and `await state.finalizeAll()` in a `finally`.
- On throw: log and return `undefined` so the build still emits a working default redirect page rather than failing.

Export `hasMetaRefreshTo(html, location): boolean` from `src/core/routing/3xx.ts` — a small parse of `<meta http-equiv="refresh" content="…;url=…">`. Keep it in `3xx.ts` so it sits beside the template it mirrors and stays unit-testable in isolation.

### 4. Wiring the app hook

- `src/core/environment/index.ts:74` (the `Environment` interface) — add an optional `redirectPageEnabled?: boolean`. Only `src/core/build/environment.ts` sets it, from `settings.config.experimental.redirectPage`; every other environment leaves it undefined. This is the static-only gate, and it avoids serialising anything new into `SSRManifest`.
- `src/core/routing/handler.ts` — in `handleRequest`, wrap the `return render(state)` at `:86`. When `redirectPageEnabled`, the status is 3xx, and `response.body === null`, call `renderRedirectPage` and return a new `Response` carrying its HTML with the original status and headers. Placing it in `handleRequest` rather than `render` catches **both** producers in one spot: the redirect-route short-circuit at `:120-132` and the i18n / `Astro.redirect()` responses returned at the end of `render`.
- `delay` prop: keep today's `status === 302 ? 2 : 0` (the comment at `3xx.ts:19-20` explains why — Google reads a delayed meta refresh as temporary). `from` is the request pathname, `to` is the `Location` header.

### 5. Using the body + the warning — `src/core/build/generate.ts:551-573`

In the existing 3xx branch:

- Keep `if (routeIsRedirect(route) && !config.build.redirects) return null;` and the `getRedirectLocationOrThrow` / `absoluteLocation` computation unchanged.
- If `response.body` is non-null, use `await response.text()` as `body`; otherwise fall back to the current `redirectTemplate(...)` call.
- When a custom body was used and `!hasMetaRefreshTo(body, locationSite)`, `logger.warn('redirects', …)` naming the source pathname and the expected tag. This is the footgun guard: in static output the meta refresh **is** the redirect, so a page that omits it silently breaks. The warning cannot misfire on the standalone `/3xx` prerender, because that render returns 200 and never enters this branch.
- Leave the `compressHTML` line as is — a custom page render already honours `compressHTML` through the normal renderer, and collapsing newlines in the fallback template stays correct.

## Explicit non-goals

- SSR and dev redirect bodies (`trailing-slash-handler.ts`, `vite-plugin-astro-server/response.ts`) keep `redirectTemplate`.
- No `redirectDelay` config option — the page owns its meta tag.
- No localised `/{locale}/3xx.astro`. `src/i18n/error-routes.ts` hardcodes a `404 | 500` union that is load-bearing; the `from`/`to` props let a page derive the locale itself.
- Rendering `/3xx` directly (e.g. `dist/3xx.html`) yields `Astro.props` of `{}`. That falls out of the "routable like 404/500" decision; document that page authors should guard, e.g. `const { to } = Astro.props;`.

## Verification

Unit tests first (`reference/unit-testing.md`: `node:test` + `node:assert/strict`, import from `dist/`, reuse `test/units/mocks.ts`):

1. `test/units/redirects/template.test.ts` — extend with `hasMetaRefreshTo` cases: present-and-matching, present-but-different-url, absent, differing quote style.
2. New `test/units/redirects/redirect-page.test.ts` — modelled on `test/units/render/custom-500.test.ts`. Use `createTestApp([createPage(RedirectPage, { route: '/3xx' }), createRedirect({ route: '/old', redirect: '/new' })])` and assert the rendered body contains the props, that a missing `/3xx` route falls back to the default template, and that a throwing `3xx.astro` falls back rather than failing.
3. `test/units/redirects/static-build.test.ts` — assert `generate.ts` prefers the custom body and emits the fallback when the flag is off.
4. `test/units/build/output-filename.test.ts` — `/3xx` → `3xx.html`.

Then end-to-end:

```
pnpm -C packages/astro build
pnpm -C packages/astro exec astro-scripts test "test/units/redirects/**/*.test.ts"
pnpm -C packages/astro exec astro-scripts test "test/units/build/**/*.test.ts"
```

Manual check in a fixture with `experimental: { redirectPage: true }`, `redirects: { '/old': '/new', '/temp': { status: 302, destination: '/new' } }`, and a `src/pages/3xx.astro`:

- `pnpm -C <fixture> exec astro build`, then inspect `dist/old.html` (or `dist/old/index.html`) — it should contain the custom markup with `from: '/old'`, `to: '/new'`, `status: 301`, `delay: 0`, and `dist/temp*` should show `status: 302`, `delay: 2`.
- Delete the meta refresh from `3xx.astro`, rebuild, and confirm the warning fires and names the offending path.
- Flip the flag off, rebuild, confirm the built-in template returns and `/3xx` still builds as an ordinary page.
- A second fixture with `i18n.routing: { prefixDefaultLocale: true, redirectToDefaultLocale: true }` to confirm `dist/index.html` now uses `3xx.astro` — the case from discussion #844.

Finally `pnpm format`, `pnpm lint:ai`, and a **minor** changeset in `.changeset/` following the `chromeDevtoolsWorkspace` precedent (`.changeset/plain-dragons-bow.md`): prose, config snippet, docs link.
