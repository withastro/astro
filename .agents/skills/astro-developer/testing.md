# Testing Guide

Comprehensive guide to writing and debugging tests in the Astro monorepo.

## Testing Philosophy

**Prefer unit tests over integration tests.** The codebase is being refactored to be more unit-testable.

**Guidelines:**

- **Default to unit tests**: Test pure functions and business logic with unit tests
- **Use integration tests sparingly**: Only for features that cannot be unit tested (e.g., virtual modules, full build pipeline)
- **Write unit-testable code**: Extract business logic from infrastructure, avoid tight coupling, use dependency injection

**When writing new code:**

1. Design code to be unit-testable (pure functions, minimal side effects)
2. Write unit tests first
3. Only use integration tests when absolutely necessary

## CRITICAL: Test Isolation Requirement

**Every test fixture MUST have a unique `outDir`**. This is the #1 cause of mysterious test failures.

```javascript
// BAD - Will cause cache pollution
await loadFixture({
  root: './fixtures/my-test/',
  // No outDir specified - uses default, shared with other tests
});

// GOOD - Isolated output
await loadFixture({
  root: './fixtures/my-test/',
  outDir: './dist/my-test/', // Unique per test
});
```

**Why**: Build artifacts are cached and shared via ESM between test runs. Without unique `outDir`, tests contaminate each other.

**Reference**: `/CONTRIBUTING.md:203-214`

## Test Types (Prefer Unit Tests)

### Unit Tests (node:test) - PREFERRED

**Location**: `packages/astro/test/*.test.js`

**Runner**: `node:test` via `astro-scripts test`

**When to use** (default for most code):

- Testing pure functions and business logic
- Testing utilities and helpers
- Testing data transformations
- Testing configuration parsing
- Testing any code that can be isolated from infrastructure

**Run**:

```bash
# All tests in package
pnpm -C packages/astro exec astro-scripts test "test/**/*.test.js"

# Single test file
pnpm -C packages/astro exec astro-scripts test "test/actions.test.js"

# Filter by pattern
pnpm -C packages/astro exec astro-scripts test "test/**/*.test.js" --match "CSS"

# Multiple files
pnpm -C packages/astro exec astro-scripts test "test/{actions,css,middleware}.test.js"
```

**Flags**:

- `--match` / `-m` → Filter tests by name pattern (regex)
- `--only` / `-o` → Run only tests marked with `.only`
- `--parallel` / `-p` → Run tests in parallel (default: sequential)
- `--timeout` / `-t` → Set timeout in milliseconds
- `--watch` / `-w` → Watch mode

**Writing unit-testable code:**

```typescript
// BAD - tightly coupled, hard to test
export function processConfig(configPath) {
  const fs = require('node:fs');
  const config = JSON.parse(fs.readFileSync(configPath));
  const result = transformConfig(config);
  fs.writeFileSync(configPath, JSON.stringify(result));
}

// GOOD - pure function, easy to test
export function transformConfig(config) {
  // Pure business logic, no side effects
  return {
    ...config,
    transformed: true,
  };
}

// Infrastructure layer (test with integration test if needed)
export function processConfigFile(configPath) {
  const fs = require('node:fs');
  const config = JSON.parse(fs.readFileSync(configPath));
  const result = transformConfig(config); // Unit-tested function
  fs.writeFileSync(configPath, JSON.stringify(result));
}
```

### Integration Tests - USE SPARINGLY

**When to use** (only when unit tests are insufficient):

- Testing virtual modules (cannot be unit tested)
- Testing full build pipeline integration
- Testing Vite plugin integration
- Testing adapter integration
- Testing features that require full Astro context

**Location**: `packages/astro/test/*.test.js` (same location, different purpose)

**Pattern**: Uses `loadFixture()` and builds full Astro projects

**⚠️ Avoid when possible**: Integration tests are slower and harder to debug. Extract business logic into unit-testable functions.

### E2E Tests (Playwright) - USE FOR BROWSER ONLY

**Location**: `packages/astro/e2e/*.test.js`

**When to use**:

- Testing client-side hydration
- Verifying HMR behavior
- Browser-specific interactions
- Testing dev server behavior in real browser

**When NOT to use**:

- Testing `astro build` output (use unit tests)
- Testing server-side logic (use unit tests)
- Static HTML validation (use unit tests)

**Run**:

```bash
# All E2E tests
pnpm run test:e2e

# Filter by pattern
pnpm run test:e2e:match "Tailwind CSS"
```

### Integration Package Tests

**Location**: `packages/integrations/*/test/`

**Pattern**: Each integration has its own test suite

**Run**:

```bash
# Single integration
pnpm -C packages/integrations/react run test

# All integrations
pnpm run test:integrations
```

## Writing Unit-Testable Code

**Goal**: Make business logic testable without infrastructure dependencies.

### Principles

1. **Separate business logic from infrastructure**
   - Business logic: Pure functions, data transformations, algorithms
   - Infrastructure: File I/O, network calls, Vite plugins, Astro context

2. **Use pure functions**
   - Same input → same output
   - No side effects
   - Easy to test

3. **Inject dependencies**
   - Don't hardcode dependencies
   - Pass them as parameters

4. **Avoid tight coupling**
   - Don't import concrete implementations
   - Use interfaces/contracts

### Patterns

#### Pattern 1: Extract Business Logic

```typescript
// BAD - business logic mixed with infrastructure
export async function processMarkdown(filePath: string) {
  const fs = await import('node:fs/promises');
  const content = await fs.readFile(filePath, 'utf-8');

  // Business logic buried in infrastructure
  const withFrontmatter = content.split('---')[2];
  const processed = withFrontmatter.replace(/TODO:/g, 'NOTE:');

  await fs.writeFile(filePath, processed);
}

// GOOD - business logic extracted (unit testable)
export function transformMarkdownContent(content: string): string {
  const withFrontmatter = content.split('---')[2];
  return withFrontmatter.replace(/TODO:/g, 'NOTE:');
}

// Infrastructure layer (integration test if needed)
export async function processMarkdownFile(filePath: string) {
  const fs = await import('node:fs/promises');
  const content = await fs.readFile(filePath, 'utf-8');
  const processed = transformMarkdownContent(content);
  await fs.writeFile(filePath, processed);
}

// Unit test (fast, no file I/O)
it('transforms markdown content', () => {
  const input = '---\ntitle: Test\n---\nTODO: Fix this';
  const result = transformMarkdownContent(input);
  assert.equal(result, 'NOTE: Fix this');
});
```

#### Pattern 2: Dependency Injection

```typescript
// BAD - hardcoded dependency
export function buildRoutes(config: AstroConfig) {
  const pages = scanFilesystem('./src/pages'); // Hardcoded
  return pages.map((page) => createRoute(page, config));
}

// GOOD - inject dependency (unit testable)
export function buildRoutes(pages: string[], config: AstroConfig): Route[] {
  return pages.map((page) => createRoute(page, config));
}

// Unit test (no filesystem access)
it('builds routes from pages', () => {
  const pages = ['index.astro', 'about.astro'];
  const config = { base: '/' };
  const routes = buildRoutes(pages, config);
  assert.equal(routes.length, 2);
});
```

#### Pattern 3: Use Interfaces

```typescript
// BAD - tight coupling to concrete type
export function validateConfig(viteConfig: ViteUserConfig) {
  // Requires full Vite config object
}

// GOOD - accept minimal interface
interface ConfigLike {
  build?: { outDir?: string };
  server?: { port?: number };
}

export function validateConfig(config: ConfigLike) {
  // Only needs what it uses, easy to mock
}

// Unit test (simple mock)
it('validates config', () => {
  const config = { build: { outDir: './dist' } };
  const result = validateConfig(config);
  assert.ok(result);
});
```

#### Pattern 4: Return Data, Don't Mutate

```typescript
// BAD - mutation, side effects
export function updateManifest(manifest: Manifest, route: Route) {
  manifest.routes.push(route);
  manifest.version++;
}

// GOOD - pure function returning new data
export function addRouteToManifest(manifest: Manifest, route: Route): Manifest {
  return {
    ...manifest,
    routes: [...manifest.routes, route],
    version: manifest.version + 1,
  };
}

// Unit test (predictable, no side effects)
it('adds route to manifest', () => {
  const manifest = { routes: [], version: 1 };
  const route = { path: '/test' };
  const result = addRouteToManifest(manifest, route);

  assert.equal(result.routes.length, 1);
  assert.equal(result.version, 2);
  assert.equal(manifest.routes.length, 0); // Original unchanged
});
```

### When Integration Tests Are Necessary

Use integration tests only when unit tests are insufficient:

1. **Virtual modules**: Cannot mock Vite's virtual module system
2. **Full build pipeline**: Testing end-to-end build process
3. **Vite plugin behavior**: Testing actual Vite plugin execution
4. **Adapter integration**: Testing how adapters work with Astro

**Even then**, extract as much business logic as possible into unit-testable functions.

## Test Utilities

**Location**: `packages/astro/test/test-utils.js`

### loadFixture(config)

Load a test fixture with configuration.

```javascript
import { loadFixture } from './test-utils.js';

const fixture = await loadFixture({
  root: './fixtures/my-test/',
  outDir: './dist/my-test/', // REQUIRED
  adapter: testAdapter(),
  integrations: [react()],
});
```

**Returns**: Fixture object with methods

### Fixture Methods

#### fixture.build()

Build the fixture (runs `astro build`).

```javascript
await fixture.build();
```

#### fixture.startDevServer(options)

Start dev server.

```javascript
const devServer = await fixture.startDevServer();
// Use server
await devServer.stop();
```

#### fixture.preview(options)

Start preview server (serves build output).

```javascript
await fixture.build();
const previewServer = await fixture.preview();
// Use server
await previewServer.stop();
```

#### fixture.fetch(url, init)

Fetch from dev/preview server.

```javascript
const res = await fixture.fetch('/about');
const html = await res.text();
```

#### fixture.readFile(path)

Read file from build output.

```javascript
const html = await fixture.readFile('/index.html');
```

#### fixture.pathExists(path)

Check if file exists in build output.

```javascript
const exists = await fixture.pathExists('/index.html');
```

### testAdapter()

Test adapter for SSR testing.

```javascript
import testAdapter from './test-adapter.js';

const fixture = await loadFixture({
  adapter: testAdapter(),
});
```

## Test Structure Pattern

### Standard Test Structure

```javascript
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { loadFixture } from './test-utils.js';

describe('Feature Name', () => {
  let fixture;

  before(async () => {
    fixture = await loadFixture({
      root: './fixtures/feature-name/',
      outDir: './dist/feature-name/', // Unique!
    });
  });

  describe('dev', () => {
    let devServer;

    before(async () => {
      devServer = await fixture.startDevServer();
    });

    after(async () => {
      await devServer.stop();
    });

    it('should work in dev', async () => {
      const res = await fixture.fetch('/');
      assert.equal(res.status, 200);
    });
  });

  describe('build', () => {
    before(async () => {
      await fixture.build();
    });

    it('should work in build', async () => {
      const html = await fixture.readFile('/index.html');
      assert.match(html, /expected content/);
    });
  });
});
```

### Using .only for Focused Testing

```javascript
// Run only this test
it.only('focused test', async () => {
  // ...
});

// Run only this describe block
describe.only('focused suite', () => {
  // All tests here will run
});
```

**Run with**:

```bash
node --test --test-only test/my-test.test.js
```

**Warning**:

- All parent `describe` blocks must also have `.only`
- `--test-only` flag must come before file path

## Fixture Structure

### Minimal Fixture

```
test/fixtures/my-test/
├── package.json         # REQUIRED
├── astro.config.mjs     # Optional
└── src/
    └── pages/
        └── index.astro
```

### Fixture package.json

**REQUIRED**: Use workspace dependencies

```json
{
  "name": "@test/my-test",
  "version": "0.0.0",
  "private": true,
  "dependencies": {
    "astro": "workspace:*",
    "@astrojs/react": "workspace:*",
    "react": "catalog:",
    "react-dom": "catalog:"
  }
}
```

**Pattern**:

- `"astro": "workspace:*"` → Links to local astro package
- `"@astrojs/*": "workspace:*"` → Links to local integrations
- `"react": "catalog:"` → Uses version from catalog in root package.json

### Fixture astro.config.mjs

```javascript
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()],
  outDir: './dist', // Can be overridden by test
});
```

## Test Isolation Best Practices

### 1. Unique Output Directories

```javascript
// Pattern: Use test name in outDir
describe('Actions', () => {
  const fixture = await loadFixture({
    root: './fixtures/actions/',
    outDir: './dist/actions/',  // Matches test name
  });
});

describe('Actions with adapter', () => {
  const fixture = await loadFixture({
    root: './fixtures/actions/',
    outDir: './dist/actions-adapter/',  // Different from above
  });
});
```

### 2. Clean Build Artifacts

If tests still fail with unique outDir:

```bash
# Manual cleanup
rm -rf test/fixtures/my-test/.astro
rm -rf test/fixtures/my-test/dist
```

### 3. Avoid Parallel Execution for Flaky Tests

```bash
# Sequential execution (default)
pnpm -C packages/astro exec astro-scripts test "test/**/*.test.js"

# Parallel (faster but can cause issues)
pnpm -C packages/astro exec astro-scripts test "test/**/*.test.js" --parallel
```

## Testing Patterns

### Testing Vite Plugins

```javascript
describe('Vite Plugin', () => {
  it('should transform .astro files', async () => {
    const fixture = await loadFixture({
      root: './fixtures/astro-components/',
      outDir: './dist/astro-components/',
    });

    await fixture.build();
    const html = await fixture.readFile('/index.html');
    assert.match(html, /<h1>.*<\/h1>/);
  });
});
```

### Testing Virtual Modules

```javascript
describe('Virtual Modules', () => {
  it('should load virtual:astro:middleware', async () => {
    const fixture = await loadFixture({
      root: './fixtures/middleware/',
      outDir: './dist/middleware/',
    });

    const devServer = await fixture.startDevServer();
    const res = await fixture.fetch('/');
    assert.equal(res.headers.get('x-middleware'), 'true');
    await devServer.stop();
  });
});
```

### Testing SSR

```javascript
import testAdapter from './test-adapter.js';

describe('SSR', () => {
  let fixture;

  before(async () => {
    fixture = await loadFixture({
      root: './fixtures/ssr/',
      outDir: './dist/ssr/',
      output: 'server',
      adapter: testAdapter(),
    });
    await fixture.build();
  });

  it('should render dynamically', async () => {
    const app = await fixture.loadTestAdapterApp();
    const request = new Request('http://example.com/');
    const response = await app.render(request);
    const html = await response.text();
    assert.match(html, /dynamic content/);
  });
});
```

### Testing Content Collections

```javascript
describe('Content Collections', () => {
  it('should generate types', async () => {
    const fixture = await loadFixture({
      root: './fixtures/content-collections/',
      outDir: './dist/content-collections/',
    });

    await fixture.build();

    // Check data store
    const dataStore = await fixture.readFile('../.astro/data-store.json');
    const parsed = JSON.parse(dataStore);
    assert.ok(parsed.collections.blog);

    // Check types
    const types = await fixture.readFile('../.astro/types.d.ts');
    assert.match(types, /declare module 'astro:content'/);
  });
});
```

### Testing Errors

```javascript
describe('Error Handling', () => {
  it('should throw on invalid config', async () => {
    await assert.rejects(async () => {
      await loadFixture({
        root: './fixtures/invalid-config/',
        outDir: './dist/invalid-config/',
      });
    }, /Expected configuration error/);
  });
});
```

## Business Logic vs Infrastructure

**Pattern**: Separate pure logic from side effects for testability

### Bad: Hard to Test

```typescript
// create-key.ts
import { logger } from '../utils.js';

export async function createKey() {
  const key = await crypto.subtle.generateKey(/* ... */);
  logger.info(`Key: ${key}`);
  return key;
}
```

**Issues**:

- Global logger dependency
- Crypto API hardcoded
- Can't easily mock

### Good: Testable

```typescript
// create-key.ts
import type { Logger, KeyGenerator } from './types.js';

interface Options {
  logger: Logger;
  keyGenerator: KeyGenerator;
}

export async function createKey({ logger, keyGenerator }: Options) {
  const key = await keyGenerator.generate();
  logger.info(`Key: ${key}`);
  return key;
}

// test/create-key.test.js
import { SpyLogger } from './test-utils.js';
import { FakeKeyGenerator } from './test-utils.js';

it('logs the generated key', async () => {
  const logger = new SpyLogger();
  const keyGenerator = new FakeKeyGenerator('test-key');

  await createKey({ logger, keyGenerator });

  assert.equal(logger.logs[0].message, 'Key: test-key');
});
```

### Test-Specific Abstractions

```javascript
// test/test-utils.js

export class SpyLogger {
  logs = [];

  info(message) {
    this.logs.push({ level: 'info', message });
  }

  error(message) {
    this.logs.push({ level: 'error', message });
  }
}

export class FakeKeyGenerator {
  constructor(key) {
    this.key = key;
  }

  async generate() {
    return this.key;
  }
}
```

## Debugging Test Failures

### 1. Run Test in Isolation

```bash
# Single test file
node --test test/my-test.test.js

# With focused test
node --test --test-only test/my-test.test.js
```

### 2. Check Fixture Setup

```javascript
// Add logging
before(async () => {
  console.log('Loading fixture:', fixturePath);
  fixture = await loadFixture({
    root: fixturePath,
    outDir: './dist/unique/',
  });
  console.log('Fixture loaded');
});
```

### 3. Inspect Build Output

```javascript
// After build, inspect files
await fixture.build();
const files = await fs.readdir(fixture.config.outDir);
console.log('Built files:', files);
```

### 4. Check for Cache Issues

```bash
# Clean fixture manually
rm -rf test/fixtures/my-test/.astro
rm -rf test/fixtures/my-test/dist
rm -rf test/fixtures/my-test/node_modules/.vite
```

### 5. Verify outDir Uniqueness

```javascript
// Check if another test uses same outDir
grep -r "outDir.*dist/my-test" test/**/*.test.js
```

### 6. Debug Timeouts in CI

**Symptom**: Tests pass locally but timeout in CI

**Fix**: Add `--parallel` to see which file times out

```json
// package.json
{
  "test": "astro-scripts test --parallel \"test/**/*.test.js\""
}
```

**After identifying problematic file**, remove `--parallel` and fix the test.

## Running Tests

### Local Development

```bash
# Fast iteration
pnpm -C packages/astro exec astro-scripts test "test/my-feature.test.js" --watch

# Filter by pattern
pnpm -C packages/astro exec astro-scripts test -m "should handle errors"
```

### Full Test Suite

```bash
# All tests (slow)
pnpm run test

# Just astro package
pnpm run test:astro

# Just integrations
pnpm run test:integrations

# E2E tests
pnpm run test:e2e
```

### CI Testing

```bash
# Run in CI mode (no cache)
pnpm run build:ci:no-cache
pnpm run test
```

## Common Test Failures

### "Test timeout exceeded"

**Cause**: Test takes too long (default: 30s)

**Fix**:

```bash
# Increase timeout
pnpm -C packages/astro exec astro-scripts test --timeout 60000 "test/slow.test.js"
```

### "Port already in use"

**Cause**: Previous dev server not stopped

**Fix**:

```javascript
// Always stop servers in after() hook
after(async () => {
  await devServer?.stop();
});
```

### "ENOENT: no such file"

**Cause**: File path wrong or build didn't complete

**Fix**:

1. Check file path relative to outDir
2. Verify `await fixture.build()` completed
3. Check if file should exist

### "Fixture contamination"

**Cause**: Shared outDir between tests

**Fix**: Ensure unique outDir per test (see top of this guide)

## Test Organization

### Group Related Tests

```javascript
describe('Feature', () => {
  describe('dev mode', () => {
    // Dev-specific tests
  });

  describe('build mode', () => {
    // Build-specific tests
  });

  describe('SSR mode', () => {
    // SSR-specific tests
  });
});
```

### Share Setup Between Tests

```javascript
describe('Feature', () => {
  let fixture;

  // Shared setup
  before(async () => {
    fixture = await loadFixture({
      root: './fixtures/shared/',
      outDir: './dist/shared/',
    });
    await fixture.build();
  });

  // Multiple tests use same fixture
  it('test 1', async () => {
    const html = await fixture.readFile('/page1.html');
    // ...
  });

  it('test 2', async () => {
    const html = await fixture.readFile('/page2.html');
    // ...
  });
});
```

## Testing Checklist

Before considering a feature complete:

- [ ] Unit tests cover happy path
- [ ] Unit tests cover error cases
- [ ] E2E tests if browser interaction needed
- [ ] Tests use unique outDir
- [ ] Tests clean up servers/resources
- [ ] Tests pass locally
- [ ] Tests pass with `--parallel` (if applicable)
- [ ] Fixture has proper package.json
- [ ] Business logic separated from infrastructure

## Further Reading

- CONTRIBUTING.md: Testing section
- CONTRIBUTING.md: Making code testable (lines 347-531)
- Fixtures: `packages/astro/test/fixtures/`
- Test utils: `packages/astro/test/test-utils.js`
