# Unit Testing

Guide for writing unit tests in the Astro monorepo.

## Location

Unit tests live in `test/units/` inside each package — typically `packages/astro/test/units/`. Tests are organized into subfolders by area (e.g. `render/`, `middleware/`, `content-layer/`, `app/`, `cli/`).

- If a test file already exists for the module you're testing, **add your test case(s) to that file**.
- If no existing file covers the module, **create a new test file** named `<module-or-feature>.test.ts` in the appropriate subfolder. If no subfolder fits, create one named after the module or feature area.

## Conventions

- Use `node:test` (`describe`, `it`) and `node:assert/strict` — do NOT use vitest, jest, or other test frameworks.
- Import from the package's **built output** (`../../../dist/...`), not from source (`../../../src/...`). The package must be built before tests run.
- Keep tests focused and minimal. Test specific behavior, not entire modules.

## Running unit tests

```bash
# Run a single test file
pnpm -C <package-dir> exec astro-scripts test "test/units/<path-to-test>.test.ts"

# Run all unit tests for a package
pnpm -C <package-dir> exec astro-scripts test "test/units/**/*.test.ts"

# Filter by test name
pnpm -C <package-dir> exec astro-scripts test "test/units/<path>.test.ts" --match "some pattern"
```

## Shared test utilities

The repo has shared test helpers and mocks. **Always check these before writing your own setup code.** Also browse the existing test files in the relevant `test/units/` subfolder to see what utilities they import and how they use them.

### `test/units/test-utils.ts` — Core infrastructure

| Export                                              | Use when…                                                                       |
| --------------------------------------------------- | ------------------------------------------------------------------------------- |
| `defaultLogger`                                     | You need a logger instance (pre-configured at `'error'` level).                 |
| `SpyLogger`                                         | You need to assert on log output (captures all writes into a `.logs` array).    |
| `createBasicSettings(inlineConfig?)`                | You need a real `AstroSettings` object without a full project.                  |
| `createBasicPipeline(options?)`                     | You need a rendering pipeline without a dev server or build.                    |
| `createFixture(tree)`                               | You need real files on disk (creates a temp directory from a file tree object). |
| `createRequestAndResponse(reqOptions?)`             | You need mock HTTP `req`/`res` objects with `.text()` and `.json()` helpers.    |
| `renderThroughMiddleware(state, component, slots?)` | You need to render through the full middleware chain.                           |
| `createMockNext(response?)`                         | You need a mock `next()` for middleware testing.                                |

### `test/units/mocks.ts` — Mock factories

| Export                                     | Use when…                                                             |
| ------------------------------------------ | --------------------------------------------------------------------- |
| `createMockAPIContext(overrides?)`         | You need a mock `APIContext` with real cookies, redirect, rewrite.    |
| `createMockFetchState(overrides?)`         | You need a minimal `FetchState` for functions that take one.          |
| `createResponseFunction(body?, init?)`     | You need a page-rendering function for `callMiddleware`.              |
| `createTestApp(pages, manifestOverrides?)` | You need a real `App` instance with routes wired up.                  |
| `createPage(component, routeConfig)`       | You need a page entry for `createTestApp`.                            |
| `createRedirect(routeConfig)`              | You need a redirect route entry for `createTestApp`.                  |
| `createEndpoint(handlers, routeConfig)`    | You need an endpoint route entry for `createTestApp`.                 |
| `createRouteData(overrides)`               | You need a `RouteData` object with auto-generated segments.           |
| `spreadPropsSpan`                          | You need a simple component factory that renders `<span {...props}>`. |
| `installImageService(overrides?)`          | You need to set up a test image service on `globalThis.astroAsset`.   |
| `createMockAstroSource(html)`              | You need a minimal `.astro` source string.                            |

### Domain-specific helpers

Some subfolders have their own `test-helpers.ts` or `utils.ts` with more targeted factories. **Check for these in the subfolder you're writing tests in before creating new mocks:**

- `test/units/app/test-helpers.ts` — `createManifest()`, `createRouteInfo()`
- `test/units/routing/test-helpers.ts` — `makeRoute()`, `staticPart()`, `dynamicPart()`, `spreadPart()`
- `test/units/build/test-helpers.ts` — `createSettings()`, `virtualAstroModules()`, `createStaticBuildOptions()`, `createMockPrerenderer()`
- `test/units/i18n/test-helpers.ts` — `makeI18nRouterConfig()`, `makeRouterContext()`, `createManualRoutingContext()`
- `test/units/content-layer/test-helpers.ts` — `createTempDir()`, `createTestConfigObserver()`, `createMinimalSettings()`
- `test/units/cli/utils.ts` — Spy/fake implementations for CLI testing (`SpyCommandExecutor`, `FakePrompt`, etc.)

## Example

```typescript
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { someFunction } from '../../../dist/core/some-module.js';
import { createBasicSettings } from '../test-utils.ts';

describe('someFunction', () => {
  it('handles edge case from issue #1234', async () => {
    const settings = await createBasicSettings({ root: '/tmp/test' });
    const result = someFunction(settings, edgeCaseInput);
    assert.equal(result, expectedOutput);
  });
});
```
