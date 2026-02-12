# RFC: Faster Tests via Dev Container Unit Tests

## Proposal

We can cut CI test time significantly by converting integration tests to unit tests that use our existing dev container infrastructure. A proof-of-concept with 6 converted test files (37 tests) runs in **4.2 seconds** — testing the same behaviors that currently require full `astro build` or `astro dev` server starts.

The tooling is ready. Three new helpers in `test/units/test-utils.js` and 6 example test files in `test/units/dev/` demonstrate the pattern. This RFC proposes we adopt this as the default approach for new tests and incrementally migrate existing integration tests.

## The Problem

- Integration tests: **~22.7 min** (2,097 tests, 246 files) — 98% of total test time
- Unit tests: **~31s** (633 tests, 62 files)
- ~48% of integration tests (117 files) just render a route and check the HTML with cheerio. Most don't actually need a full build.

## The Approach

The dev container (`createContainer` from `src/core/dev/container.js`) gives us a real Vite-backed Astro environment without the overhead of a full build or dev server. Paired with `createFixture` (inline file trees, no fixture directories on disk) and mock HTTP via `node-mocks-http`, we can test route rendering, middleware, content collections, redirects, and more — all as fast unit tests.

The key optimization: **share one container across all tests in a `describe` block**. A container start costs ~300-400ms. By starting it once in `before()` and reusing it across `it()` blocks, individual tests drop to **5-15ms each**.

## Results

37 tests across 6 converted files, all passing:

| Test Suite            | Tests  | Time     |
| --------------------- | ------ | -------- |
| `astro-slots`         | 15     | 0.7s     |
| `middleware` (DEV)    | 12     | 0.4s     |
| `redirects` (DEV)     | 6      | 1.0s     |
| `custom-404-locals`   | 2      | 0.3s     |
| `content-collections` | 1      | 0.7s     |
| `import-ts-with-js`   | 1      | 0.3s     |
| **Total**             | **37** | **4.2s** |

For context, the `astro-slots` integration test with 15 tests takes ~1.1s (one build, then file reads). The naive unit test approach (one container per `it()`) took 6.3s — _worse_. With shared containers, it's 0.7s — faster and with no fixture directory on disk.

## What the Dev Container Supports

More than you'd expect:

- Real Vite compilation of `.astro`, `.ts`, `.js`, `.md` files
- Full routing — dynamic routes, 404 handling, config-level redirects
- Content collections — `getEntry`/`getEntries`/`reference()`/`glob()` loader
- Middleware — `defineMiddleware`, `sequence()`, locals, cookies, response cloning
- `Astro.locals`, `Astro.redirect()`, `Astro.slots`, `Astro.cookies`
- Endpoints (JSON APIs, status codes, headers)
- Virtual module imports (`astro:middleware`, `astro:content`, `astro/zod`, `astro/loaders`)
- Inline config (`redirects`, `output`, `site`, `security`, etc.)

Our existing unit tests in `test/units/` barely use any of this.

## What Should Stay as Integration Tests

Some things genuinely need a full build:

- **Production build output** — CSS bundling, asset hashing, code splitting, static HTML structure
- **Client-side hydration** — `client:load`, `client:visible`, island scripts
- **Framework components** — React/Vue/Svelte/Solid (need framework Vite plugins)
- **`astro preview`** — needs built output
- **Adapter-specific behavior** — Node, Cloudflare, Vercel output formats
- **SSR App rendering** — `app.render()` with test adapter
- **Build error tests** — asserting specific build failures

Everything else — which is most of the "render route, check HTML" tests — can use the dev container.

## Key Insights

**Mixed-mode tests are partially convertible.** Tests like `middleware.test.js` and `redirects.test.js` cover DEV, SSG, and SSR modes. The DEV portions convert cleanly to unit tests. The build-dependent portions stay as (smaller, faster) integration tests.

**Inline fixtures are more maintainable.** The entire fixture lives as strings in the test file — no jumping between `test/foo.test.js` and `test/fixtures/foo/src/pages/bar.astro`. Fixture directories also accumulate dead files that nobody cleans up.

**One API quirk to know about.** `res.getHeader('set-cookie')` returns an array in `node-mocks-http` vs. a string in real HTTP. Tests that check headers may need minor adjustments. This is the only mock/real gap we encountered.

## New Helpers

Three helpers added to `test/units/test-utils.js`:

**`startContainerFromFixture(options)`** — Creates a reusable dev container. Use in `before()`/`after()` to share across tests.

**`fetchFromContainer(container, url, reqOptions?)`** — Sends a GET through the container, returns `{ status, text, html, $ }` (cheerio). Eliminates the `createRequestAndResponse` + `container.handle` boilerplate.

**`runInContainerWithContent(options, callback)`** — Like `runInContainer` but boots the content layer so `getEntry()`/`getEntries()` work.

## Recommended Patterns

### Shared container (most common case)

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

### Different configs → sub-describes

```js
describe('Redirects', () => {
  describe('config redirects', () => {
    let fixture, container;
    before(async () => {
      /* fixture + container with redirects config */
    });
    after(async () => {
      /* cleanup */
    });
    it('simple redirect', async () => {
      /* ... */
    });
    it('dynamic redirect', async () => {
      /* ... */
    });
  });
  describe('Astro.redirect', () => {
    let fixture, container;
    before(async () => {
      /* different fixture */
    });
    after(async () => {
      /* cleanup */
    });
    it('returns 302', async () => {
      /* ... */
    });
  });
});
```

### Content collections

```js
await runInContainerWithContent({ inlineConfig: { root: fixture.path } }, async (container) => {
  const { $ } = await fetchFromContainer(container, '/blog/hello');
  assert.equal($('h1').text(), 'Hello World');
});
```

## Migration Plan

1. **For new tests** — use the dev container pattern by default unless the test genuinely needs a build
2. **For existing tests** — migrate incrementally, one file at a time, prioritizing the slowest integration tests first
3. **For mixed-mode tests** — extract the DEV-testable portions into unit tests, leave build-dependent portions as leaner integration tests
4. **Always use shared containers** — one container per `describe` block, never per `it()`
5. **Delete old tests only after** the new unit test equivalents pass in CI

## Scale Estimate

- ~117 integration test files (48%) are "render route, check HTML" — most should be convertible
- Many more are mixed-mode where the DEV portion can convert
- **Realistic estimate:** 40-60% of integration test time can move to unit tests
- **Projected savings: ~8-12 minutes** off the 22.7-minute integration run
