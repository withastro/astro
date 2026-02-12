# RFC: Converting Integration Tests to Unit Tests

## Summary

We investigated whether integration tests can be converted to unit tests using the existing dev container infrastructure (`runInContainer` + `createFixture`). We picked 6 integration test files (3 random, 3 targeted at easy/medium/hard), analyzed them, and successfully converted all 6. The dev container is far more capable than we're currently using it for, and with two small helper additions, we could migrate a large portion of the integration suite incrementally.

Both helpers (`runInContainerWithContent` and `fetchFromContainer`) have been implemented in `test/units/test-utils.js`. All 6 converted test suites are checked in under `test/units/dev/` and passing.

## Background

- Integration tests: ~1,363s (~22.7 min), 2,097 tests across 246 files
- Unit tests: ~31s, 633 tests across 62 files
- Integration tests account for **98% of total test time**
- ~47.6% of integration tests (117 files) are "render route, check HTML with cheerio" tests

The core question: how many of those integration tests _actually need_ a full `astro build` or `astro dev` server?

## Round 1: 3 Random Tests

We selected 3 integration test files at random and attempted to convert each to a unit test using the dev container pattern.

### Test 1: `import-ts-with-js.test.js`

**What it tests:** Importing `.ts` files using `.js` extensions (a common TypeScript pattern).

**Fixture:** 3 files — `index.astro` imports `foo.js` (resolved to `foo.ts`) which imports `bar.js` (resolved to `bar.ts`). Asserts `<h1>bar</h1>`.

**Verdict: Convertible.** Only needs Vite's TS resolution. The dev container handles this trivially.

```js
// Converted unit test — complete, self-contained, no fixture directory
it('works in .astro files', async () => {
  const fixture = await createFixture({
    '/src/bar.ts': `export default function() { return 'bar'; }`,
    '/src/foo.ts': `import bar from './bar.js';\nexport default bar;`,
    '/src/pages/index.astro': `
---
import foo from '../foo.js';
---
<html><head><title></title></head>
<body><h1>{ foo() }</h1></body></html>`,
  });

  await runInContainer({ inlineConfig: { root: fixture.path } }, async (container) => {
    const { req, res, text } = createRequestAndResponse({ method: 'GET', url: '/' });
    container.handle(req, res);
    const html = await text();
    const $ = cheerio.load(html);
    assert.equal($('h1').text(), 'bar');
  });
});
```

**Result:** Passes. 1.5s total.

### Test 2: `custom-404-locals.test.js`

**What it tests:** Custom 404 pages can access `Astro.locals` injected via an integration's `astro:server:setup` hook.

**Fixture:** `index.astro` (homepage), `404.astro` (reads `Astro.locals.runtime`), `404-return.astro` (returns raw 404 Response). An inline integration injects locals via Vite server middleware.

**Verdict: Convertible.** Locals flow through `Symbol.for('astro.locals')` on the request object. In unit tests, we set this directly on the mock request via `Reflect.set(req, Symbol.for('astro.locals'), { runtime: 'locals' })`.

**Nuance:** The original integration test also tests the `astro:server:setup` hook -> Vite middleware -> locals path. The unit test bypasses that, testing only the core behavior: 404 pages can read locals. The hook integration could be tested separately if needed.

**Result:** Passes. 1.6s total (2 tests).

### Test 3: `content-collection-references.test.js`

**What it tests:** Content collections with `reference()` schema helper, `glob()` loader, cross-collection references, `getEntry()`/`getEntries()` APIs, and rendered pages.

**Fixture:** 3 collections (blog, authors, banners), markdown + YAML + JSON content files, cross-references between collections, both a JSON endpoint and an Astro page that resolve references.

**Verdict: Convertible, but requires content layer boot.** The dev container alone doesn't initialize the content layer — we need to replicate the boot sequence from `src/core/dev/dev.ts`. This is now encapsulated in the `runInContainerWithContent()` helper.

**Result:** Passes. 1.3s total. Content collections with cross-references, glob loader, getEntry, getEntries, and rendered pages — all as a unit test with no fixture directory on disk.

### Round 1 Timing

| Test                            | Integration time   | Unit test time |
| ------------------------------- | ------------------ | -------------- |
| `import-ts-with-js`             | ~1.3s              | ~1.5s          |
| `custom-404-locals`             | ~2-3s (dev server) | ~1.6s          |
| `content-collection-references` | ~5-8s (build+dev)  | ~1.3s          |

## Round 2: Easy / Medium / Hard

Three more tests, deliberately chosen at different difficulty levels.

### Test 4 (Easy): `astro-slots.test.js`

**What it tests:** Astro's slot system — named slots, dynamic slot names, conditional slots, fallback content, `Astro.slots.has()`, `Astro.slots.render()` with arguments, multiple renders of same slot.

**Fixture:** 10 components, 15 pages. The largest fixture we converted. No config file needed.

**Verdict: Fully convertible.** All 15 tests pass. The entire fixture (10 components + 15 pages) was inlined as a single JS object.

**Key lesson: Container reuse matters.** Each `it()` creates its own container (~0.3-0.4s per start). With 15 tests, that's ~5s of just container starts. The original integration test does 1 build (~0.6s) then reads files for free. For large test suites that share one fixture, the unit test approach needs a pattern where the container is started once in `before()` and reused across tests. This is possible but requires the tests to be structured to share a container.

| Metric                | Integration | Unit           |
| --------------------- | ----------- | -------------- |
| Tests                 | 14          | 15             |
| Time                  | 1.1s        | 6.1s           |
| Fixture files on disk | 26          | 0 (all inline) |

**The unit test is slower here** because of per-test container overhead. With container reuse, it would be ~1-2s.

### Test 5 (Medium): `middleware.test.js` (DEV mode portion)

**What it tests:** Full middleware pipeline — `defineMiddleware`, `sequence()`, locals injection, response rewriting, cookie setting, response cloning, status codes, error handling, URL-encoded path handling.

**Fixture:** `src/middleware.js` with 4 chained middleware functions, 14 page files, integration middleware with `pre`/`post` ordering.

**Verdict: Mostly convertible.** 12 of the 20 DEV-mode tests converted directly. The remaining 8 (integration middleware hooks with `addMiddleware`, URL encoding edge cases) need the `addMiddleware` API which requires file-based entrypoints — doable but needs more wiring.

**Key lessons:**

- `astro:middleware` virtual module import works in the dev container
- `sequence()` and `defineMiddleware()` work as expected
- Cookies via `context.cookies.set()` work (though `res.getHeader('set-cookie')` returns an array in mocks vs. string in real HTTP)
- Response cloning and manipulation in middleware works
- Error states (middleware returning `undefined`, throwing errors) properly generate error pages

| Metric        | Integration (full file)    | Unit (DEV portion) |
| ------------- | -------------------------- | ------------------ |
| Tests         | 52 (all modes)             | 12 (DEV only)      |
| Time          | 6.0s                       | 5.3s               |
| Modes covered | DEV + SSG + SSR + tailwind | DEV only           |

The integration test covers more modes, but the DEV tests alone — which are often the ones you iterate on during development — convert cleanly.

### Test 6 (Hard): `redirects.test.js` (DEV mode portion)

**What it tests:** Config-level `redirects` with dynamic parameter forwarding, special character handling, multi-param routes, `Astro.redirect()` from pages, middleware-based redirects.

**Fixture:** Multiple page files with `getStaticPaths`, `Astro.redirect()`, middleware using `defineMiddleware`. Uses `redirects` config option with dynamic `[param]` and `[...spread]` patterns.

**Verdict: DEV portion fully convertible. Build portions stay as integration tests.**

6 tests converted covering:

- Simple config redirects (`/one` -> `/`)
- Dynamic param forwarding (`/more/old/[dynamic]` -> `/more/[dynamic]`)
- Special characters in redirect URLs (Unicode right quote)
- Multi-param forwarding (`/more/old/[dynamic]/[route]` -> `/more/[dynamic]/[route]`)
- `Astro.redirect()` returning 302
- Middleware-based 301 redirects

**What couldn't convert:** Static build output tests (HTML meta refresh tags, canonical links, noindex meta tags), SSR adapter tests, invalid config error tests. These genuinely need `fixture.build()`.

| Metric | Integration (full file) | Unit (DEV portion) |
| ------ | ----------------------- | ------------------ |
| Tests  | ~30 (all modes)         | 6 (DEV only)       |
| Time   | ~6s (estimated)         | 3.1s               |

## Combined Results

All 6 converted test suites run together (after container-reuse optimization — see below):

```
37 tests, 0 failures, 4.2 seconds total
```

| Test Suite                      | Tests | Time | Status |
| ------------------------------- | ----- | ---- | ------ |
| `import-ts-with-js`             | 1     | 0.3s | Pass   |
| `custom-404-locals`             | 2     | 0.3s | Pass   |
| `content-collection-references` | 1     | 0.7s | Pass   |
| `astro-slots`                   | 15    | 0.7s | Pass   |
| `middleware` (DEV)              | 12    | 0.4s | Pass   |
| `redirects` (DEV)               | 6     | 1.0s | Pass   |

## What the Dev Container Already Supports

The existing `runInContainer` + `createFixture` + `createRequestAndResponse` pattern gives you:

- Real Vite compilation of `.astro`, `.ts`, `.js`, `.md` files
- Full routing (including dynamic routes, 404 handling, redirects)
- Content collections with `getEntry`/`getEntries`/`reference()`/`glob()` loader
- `Astro.locals` access
- Middleware (`defineMiddleware`, `sequence()`)
- Config-level `redirects` with dynamic param forwarding
- Inline integrations with hooks (`astro:config:setup`, `astro:server:setup`, etc.)
- Endpoints (status codes, headers, response bodies)
- Head injection, layouts, CSS scoping
- Cookies (`context.cookies`, `Astro.cookies`)
- No fixture directory on disk (everything defined as strings in the test)
- ~0.3-0.7s per container start

The existing unit tests in `test/units/` barely scratch the surface of these capabilities.

## What Genuinely Needs Integration Tests

Tests that should stay as integration tests:

1. **Production build output** — CSS bundling, asset hashing, code splitting, static HTML output structure, meta refresh redirect pages
2. **Client-side hydration** — `client:load`, `client:visible`, island hydration scripts
3. **Framework component rendering** — React/Vue/Svelte/Solid components (need full Vite setup with framework plugins)
4. **`astro preview`** — needs a built output
5. **Adapter-specific behavior** — Node, Cloudflare, Vercel output formats
6. **SSR App rendering** — `app.render()` with test adapter requires a full build
7. **Build error tests** — tests that assert specific build failures

Everything else can use the dev container.

## Key Lessons Learned

### 1. Container reuse is critical for performance

The biggest surprise: for tests that share a fixture, the integration pattern ("build once, read files many times") can be _faster_ than the unit test pattern ("start container per test"). The `astro-slots` test was 1.1s as integration vs 6.1s as unit — purely due to 15 separate container starts.

**Fix (implemented):** Tests that share a fixture now share a container via `startContainerFromFixture()`. Start it in `before()`, make requests in each `it()`, close in `after()`. The impact is dramatic:

| Test Suite    | Before (per-test container) | After (shared container) | Speedup   |
| ------------- | --------------------------- | ------------------------ | --------- |
| `astro-slots` | 6,251ms                     | 714ms                    | **8.8x**  |
| `middleware`  | 5,341ms                     | 384ms                    | **13.9x** |
| `custom-404`  | 999ms                       | 314ms                    | **3.2x**  |
| `redirects`   | 2,598ms                     | 1,015ms                  | **2.6x**  |
| **Total**     | **17,130ms**                | **4,213ms**              | **4.1x**  |

Individual `it()` blocks now take 5-15ms instead of 350-450ms. The container start (~300-400ms) is amortized once per `describe` block.

### 2. Many integration tests are "mixed mode" — partially convertible

Tests like `middleware.test.js` and `redirects.test.js` have DEV, SSG, and SSR sections. The DEV sections convert cleanly; the SSG/SSR sections need builds. The migration strategy should be: extract the DEV-convertible portions into unit tests, leave the build-dependent portions as (smaller, faster) integration tests.

### 3. The inline fixture pattern is more maintainable

Having the entire fixture as strings in the test file makes tests self-contained and reviewable. No need to jump between `test/foo.test.js` and `test/fixtures/foo/src/pages/bar.astro`. Fixture directories also accumulate dead files that nobody cleans up.

### 4. Virtual module imports (`astro:middleware`, `astro:content`) work

The dev container resolves `astro:middleware`, `astro:content`, `astro/zod`, `astro/loaders`, and other virtual modules. This was the biggest unknown going in — if these didn't work, most non-trivial tests couldn't convert.

### 5. Small API differences between mock and real HTTP

`res.getHeader('set-cookie')` returns an array in `node-mocks-http` but a string in real HTTP responses. Tests that check headers may need minor adjustments. This is a known, manageable gap.

## What's Been Implemented

### Helpers added to `test/units/test-utils.js`

**`startContainerFromFixture(options)`** — Creates and starts a dev container that can be reused across multiple tests. Use in `before()`/`after()` blocks to avoid the cost of starting a new container for every `it()`. Call `container.close()` in `after()`.

**`runInContainerWithContent(options, callback)`** — Like `runInContainer`, but boots the content layer so `getEntry()`, `getEntries()`, `getCollection()` work. Replicates the boot sequence from `src/core/dev/dev.ts`.

**`fetchFromContainer(container, url, reqOptions?)`** — Convenience wrapper that sends a GET request through the container and returns `{ status, text, html, $ }` (where `$` is a cheerio instance). Eliminates the `createRequestAndResponse` + `container.handle` boilerplate.

### Test files added to `test/units/dev/`

- `import-ts-with-js.test.js` — 1 test
- `custom-404-locals.test.js` — 2 tests (shared container)
- `content-collection-references.test.js` — 1 test (uses `runInContainerWithContent`)
- `astro-slots.test.js` — 15 tests (shared container)
- `middleware.test.js` — 12 tests (shared container)
- `redirects.test.js` — 6 tests (3 sub-describes with shared containers, grouped by config)

## Scale Estimate (Revised)

Based on both rounds of testing:

- ~117 integration test files (47.6%) are "render route, check HTML" tests — most should be convertible
- Many more files are "mixed mode" where the DEV portion can convert, leaving smaller integration tests
- **Realistic estimate:** 40-60% of integration test _time_ can move to unit tests
- With container reuse, unit tests run at roughly the same speed as integration tests for shared-fixture patterns, but much faster for tests that currently do redundant builds
- **Projected savings: ~8-12 minutes** off the 22.7-minute integration run, bringing total CI test time to **~11-15 minutes**

## Recommended Patterns

### Shared container for tests with the same fixture

```js
describe('Feature X', () => {
  let fixture, container;
  before(async () => {
    fixture = await createFixture({
      /* inline files */
    });
    container = await startContainerFromFixture({ inlineConfig: { root: fixture.path } });
  });
  after(async () => {
    await container.close();
    await fixture.rm();
  });
  it('test 1', async () => {
    const { $ } = await fetchFromContainer(container, '/page1');
    assert.equal($('h1').text(), 'expected');
  });
  it('test 2', async () => {
    const { $ } = await fetchFromContainer(container, '/page2');
    assert.equal($('h1').text(), 'expected');
  });
});
```

### Sub-describes for tests with different configs

When tests need different `inlineConfig` (e.g. different `redirects`), group them into sub-`describe` blocks, each with its own `before()`/`after()`:

```js
describe('Redirects', () => {
  describe('config redirects', () => {
    let fixture, container;
    before(async () => {
      /* shared fixture + container for this group */
    });
    after(async () => {
      /* cleanup */
    });
    it('test A', async () => {
      /* ... */
    });
    it('test B', async () => {
      /* ... */
    });
  });
  describe('Astro.redirect', () => {
    let fixture, container;
    before(async () => {
      /* different fixture + container */
    });
    after(async () => {
      /* cleanup */
    });
    it('test C', async () => {
      /* ... */
    });
  });
});
```

### Content collections

Use `runInContainerWithContent` for tests that need `getEntry()`/`getEntries()`:

```js
await runInContainerWithContent({ inlineConfig: { root: fixture.path } }, async (container) => {
  const { $ } = await fetchFromContainer(container, '/blog/hello');
  assert.equal($('h1').text(), 'Hello World');
});
```

## Migration Strategy

1. **Helpers are done** — `startContainerFromFixture`, `runInContainerWithContent`, and `fetchFromContainer` are in `test/units/test-utils.js`
2. Convert tests **one file at a time** — new unit tests sit alongside existing integration tests
3. For mixed-mode tests (DEV + SSG + SSR), extract the DEV portion to a unit test, keep the build portions as a leaner integration test
4. **Always use shared containers** — never start a new container per `it()` unless the test genuinely needs a different config
5. Delete integration test files (or sections) only after their unit test equivalents pass in CI
6. Start with the simplest tests (single build, HTML assertions only) and work outward
7. Prioritize tests that are in the "top 20 slowest" list — they have the most redundant builds
8. Leave tests that genuinely need production builds as integration tests
