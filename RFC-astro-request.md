# RFC: `astro request` — A CLI Command for Route Rendering

**Status:** Draft / Early Exploration
**Inspired by:** [Hono CLI's `hono request`](https://blog.yusu.ke/hono-cli/)
**Goal:** Provide a fast, serverless way to render any Astro route to HTML from the command line — for humans, AI agents, and the test suite.

---

## Problem Statement

Astro's test suite spends the vast majority of its time starting dev servers and running full builds, just to render a route and check the resulting HTML. Approximately **47-67% of integration tests** (117-165 of 246 files) follow this pattern:

1. Start a dev server or run a full build
2. Fetch a route (e.g., `/about`)
3. Parse the HTML with cheerio
4. Assert on element content, attributes, presence

The dev server startup involves creating a full Vite server (plugin initialization, dependency scanning, file watching, HMR websocket). A full build involves Vite multi-environment builds, page generation, and asset processing. Both are dramatically more work than what these tests actually need: **compile a `.astro` file and render it to HTML**.

Beyond tests, this same capability would be valuable for:

- **AI coding agents** verifying their changes without starting a server
- **Users debugging** rendering issues quickly
- **CI pipelines** doing lightweight validation

## Proposed Solution

A new `astro request` CLI command:

```bash
# Basic usage
astro request /about

# With options
astro request /about --root ./my-project
astro request /api/users -X POST -d '{"name":"Alice"}'

# Output is JSON to stdout
# { "status": 200, "headers": {...}, "body": "<html>..." }
```

The command:

1. Takes a project directory (or uses cwd) and a route path
2. Creates a minimal Vite server internally (no HTTP listener, no file watcher, no HMR, no dev toolbar)
3. Resolves the route using `createRoutesList()` + `matchRoute()`
4. Compiles the target `.astro` route on-demand via Vite's SSR module loader
5. Renders it through the existing `RenderContext` + `Pipeline` architecture
6. Returns the HTTP response (status, headers, HTML body) to stdout as JSON

## Existing Infrastructure to Build On

### Container API (`packages/astro/src/container/`)

`experimental_AstroContainer` already provides rendering abstraction with **zero Vite dependency**:

```typescript
// packages/astro/src/container/index.ts
export class experimental_AstroContainer {
  public async renderToString(component: AstroComponentFactory, options?): Promise<string>;
  public async renderToResponse(component: AstroComponentFactory, options?): Promise<Response>;
}
```

`ContainerPipeline` extends `Pipeline` with minimal implementations. The container creates a `RenderContext` and renders immediately — no Vite, no HTTP server.

**Current limitation:** The container takes **pre-compiled `AstroComponentFactory` objects**, not `.astro` source files. The gap is bridging compilation to rendering.

### Dev Container (`packages/astro/src/core/dev/container.ts`)

`createContainer()` already supports creating a Vite server **without starting an HTTP listener**:

```typescript
// Creates full Vite server but does NOT call viteServer.listen()
const container = await createContainer({ ... });
// Can handle requests via mock HTTP objects
container.handle(req, res);
```

This is used by `runInContainer()` in the unit test utilities. The issue is that `createContainer()` still spins up the full Vite infrastructure (watchers, plugin pipeline, module graph, HMR websocket).

### Pipeline Architecture

Three `Pipeline` implementations exist, each with clear contracts:

| Pipeline            | Location                          | Vite Required? | Purpose                 |
| ------------------- | --------------------------------- | -------------- | ----------------------- |
| `ContainerPipeline` | `src/container/pipeline.ts`       | No             | Container API rendering |
| `BuildPipeline`     | `src/core/build/pipeline.ts`      | Yes            | Production build        |
| `RunnablePipeline`  | `src/vite-plugin-app/pipeline.ts` | Yes            | Dev server              |

`RenderContext` has no direct Vite dependency — all Vite coupling is hidden behind the `Pipeline` abstraction.

### Pure Functions Available for Route Resolution

These can be called independently without a build or dev server:

- `createRoutesList(settings, logger)` — scans filesystem, creates route manifest
- `matchRoute(pathname, manifest)` — pure pattern matching
- `matchAllRoutes(pathname, manifest)` — finds all matching routes
- `collectPagesData(settings, manifest)` — pure synchronous function
- `resolveConfig(inlineConfig)` → `AstroConfig`
- `createSettings(config)` → `AstroSettings`

## Architecture

```
astro request /about --root ./my-project

Internally:
1. resolveConfig() → AstroConfig
2. createSettings() → AstroSettings
3. createRoutesList() → find matching route for /about
4. Create minimal Vite server (no watcher, no HMR, no listener)
   - server.watch: null (disable file watching)
   - server.hmr: false (disable HMR)
   - server.middlewareMode: true (no HTTP listener)
   - Minimal plugin set (compilation only, no dev toolbar)
5. Use Vite's ssrLoadModule to compile the matched .astro file
6. Feed compiled ComponentInstance into ContainerPipeline + RenderContext
7. Output: { status: 200, headers: {...}, body: "<html>..." }
8. Close Vite server
```

### Two Implementation Approaches

**Approach A: Thin Vite wrapper (recommended for v1)**

Create a minimal Vite server with watchers/HMR disabled, use it purely as a module loader:

```typescript
const viteServer = await vite.createServer({
  server: { watch: null, hmr: false, middlewareMode: true },
  plugins: [
    /* minimal astro compilation plugins only */
  ],
  logLevel: 'silent',
});

// Use Vite's SSR module loading to compile .astro files
const mod = await viteServer.ssrLoadModule(routeComponent);
// mod.default is an AstroComponentFactory

// Feed into existing Container rendering
const container = await AstroContainer.create();
const html = await container.renderToString(mod.default);
```

Pros: Full `.astro` compilation support including CSS preprocessing, TypeScript, imports. Minimal new code.
Cons: Still has Vite startup cost (~1-3 seconds). But this is shared across multiple renders.

**Approach B: Container API extension (future)**

Extend `experimental_AstroContainer` to accept `.astro` file paths directly:

```typescript
const container = await AstroContainer.create({ root: './my-project' });
const html = await container.renderRoute('/about');
```

This would need an internal module loader (could use esbuild or `@astrojs/compiler` directly). More architecturally clean but harder to implement because:

- Compiled `.astro` output imports other modules (layouts, components, npm packages)
- CSS preprocessing calls `vite.preprocessCSS()`
- TypeScript in frontmatter needs transpilation
- Component imports need recursive compilation

### Hard Vite Dependencies

| Component                     | Vite Required? | Why                                                     |
| ----------------------------- | -------------- | ------------------------------------------------------- |
| `@astrojs/compiler` transform | No             | Pure AST transform                                      |
| CSS preprocessing             | **Yes**        | `preprocessCSS()` uses Vite's CSS pipeline              |
| Module loading/execution      | **Yes**        | `.astro` compiled output has imports needing resolution |
| `Pipeline` base class         | No             | Abstract, no Vite imports                               |
| `ContainerPipeline`           | No             | Works with pre-compiled components                      |
| `RenderContext`               | No             | Only depends on `Pipeline` abstraction                  |
| Route matching                | No             | Pure pattern matching                                   |

## Scope and Limitations

### In scope (v1)

- Render any page route to HTML
- Support for middleware
- Support for route params (dynamic routes)
- Support for `Astro.props`, `Astro.locals`
- Support for content collections (requires sync step)
- JSON output to stdout (status, headers, body)
- Reusable as a test utility (create once, render many routes)

### Out of scope (v1)

- Asset fingerprinting / bundling
- CSS bundling (styles may be inlined or absent)
- Client-side JavaScript bundling
- HMR / file watching
- Image optimization
- Full build output fidelity

### Acceptable for the test suite

Per discussion: ~47.6% of integration tests (117 files) are purely "render route, check HTML content with cheerio" — they don't check status codes, headers, CSS files, or JS assets. These could migrate to `astro request` immediately.

An additional ~20% check status codes or response headers, which `astro request` would also support via the full `Response` object.

Tests that need full build fidelity (CSS bundling, JS assets, HMR behavior) would remain on the existing `fixture.build()` / `fixture.startDevServer()` pattern.

## Impact on Test Suite

### Current state

- 583 combined build + dev server starts for ~1,947 test cases
- 1 expensive Vite operation per 3.3 tests
- ~25-27 minutes for full integration test run on Ubuntu

### With `astro request`

- ~117 test files could migrate immediately (pure HTML assertion)
- ~200+ builds and ~80+ dev server starts eliminated
- One shared Vite instance across all `astro request` calls in a test run
- Expected: individual test goes from seconds to milliseconds
- Expected: 5-10 minute reduction in total test time from migration alone

### New test pattern

```javascript
// Old pattern: ~3-5 seconds per describe block
describe('About page', () => {
  let fixture;
  before(async () => {
    fixture = await loadFixture({ root: './fixtures/about/' });
    await fixture.build();
  });
  it('renders heading', async () => {
    const html = await fixture.readFile('/about/index.html');
    const $ = cheerio.load(html);
    assert.equal($('h1').text(), 'About');
  });
});

// New pattern: ~50-100ms per test (shared Vite instance)
describe('About page', () => {
  it('renders heading', async () => {
    const res = await astroRequest('./fixtures/about/', '/about');
    const $ = cheerio.load(res.body);
    assert.equal($('h1').text(), 'About');
  });
});
```

## Open Questions

1. **Should this be a public API?** The Hono CLI model suggests yes — it's useful for users and agents, not just tests. The Container API is already `experimental_`. This could graduate both.

2. **Caching between renders:** When rendering multiple routes from the same project, the Vite module cache should persist. How do we expose this? A persistent `astro request --serve` mode? Or just rely on the test utility keeping the Vite instance alive?

3. **Content collections:** These require `syncInternal()` to generate types and data. Should `astro request` run sync automatically? It adds startup cost but is required for content-heavy sites.

4. **Framework components:** React, Vue, Svelte components need their renderers registered. The Container API supports `addServerRenderer()`. Should `astro request` auto-detect and register renderers from the project's integrations?

5. **Middleware:** The Container API already supports middleware. Should `astro request` automatically load the project's middleware, or require an explicit flag?

6. **Error handling:** When a route fails to render, should `astro request` return the error overlay HTML (like dev mode), a JSON error object, or just fail with a non-zero exit code?

## Related Work

- **Hono CLI `hono request`:** Direct inspiration. Sends requests to a Hono app without starting a server. [Blog post](https://blog.yusu.ke/hono-cli/), [Repository](https://github.com/honojs/cli).
- **`experimental_AstroContainer`:** Existing Astro API for serverless rendering of pre-compiled components.
- **`runInContainer` test utility:** Existing unit test helper that creates a Vite server without an HTTP listener.

## Implementation Plan

### Phase 1: Test utility prototype

1. Create a `requestRoute(fixtureRoot, pathname, options?)` test helper
2. Internally: create a stripped-down Vite server, load the route component, render via ContainerPipeline
3. Share the Vite instance across calls within the same fixture root
4. Migrate 5-10 simple test files to validate the approach
5. Measure performance improvement

### Phase 2: CLI command

1. Add `astro request` as a CLI subcommand
2. JSON output to stdout
3. Support for common HTTP options (-X method, -d body, -H headers)
4. Document in `AGENTS.md` for AI agent usage

### Phase 3: Incremental test migration

1. Create a migration guide for converting existing tests
2. Move tests incrementally, starting with pure "render and check HTML" files
3. Maintain canary tests that run in both modes to detect divergence
4. Track performance improvement over time

### Phase 4: Public API

1. Graduate from experimental if the approach proves reliable
2. Extend Container API to accept file paths (Approach B)
3. Consider `astro request --serve` for persistent mode
