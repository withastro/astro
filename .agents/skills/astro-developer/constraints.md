# Constraints & Gotchas

Critical constraints and common pitfalls when developing in the Astro monorepo.

## Node.js API Restrictions

**MOST IMPORTANT CONSTRAINT**

### The Rule (Conservative Approach)

**Location**: `/CONTRIBUTING.md:84-98`

Code in `packages/astro` has restricted Node.js API usage because Astro runs in multiple runtimes (Node.js, Cloudflare Workers, Deno, edge runtimes).

**Safe decision rule:**

```
1. In Vite plugin implementations → Node.js APIs allowed
2. In /runtime/ folders → Node.js APIs FORBIDDEN
3. Everywhere else → Avoid Node.js APIs, use @astrojs/internal-helpers
```

**Reality**: The codebase is messy. Not all code follows clear boundaries. The safest approach is to avoid Node.js APIs unless you're in a Vite plugin.

### Where Node.js APIs Are ABSOLUTELY FORBIDDEN

**Pattern** (enforced by Biome linter):

1. Any file in a `runtime/` folder: `**/packages/astro/src/**/runtime/**/*.ts`
2. Any file with `runtime` in its name: `**/packages/astro/src/**/*runtime*.ts`

**Examples of forbidden locations**:

- `packages/astro/src/runtime/server/` → FORBIDDEN (runtime folder)
- `packages/astro/src/runtime/client/` → FORBIDDEN (runtime folder)
- `packages/astro/src/vite-plugin-astro/runtime.ts` → FORBIDDEN (runtime in name)
- `packages/astro/src/core/render/runtime-utils.ts` → FORBIDDEN (runtime in name)

**Forbidden APIs**:

```typescript
// FORBIDDEN in runtime/ folders or *runtime*.ts files
import fs from 'node:fs';
import path from 'node:path';
import { Buffer } from 'node:buffer';
import process from 'node:process';
import crypto from 'node:crypto';
// etc.
```

**Enforcement**: Biome linter rule `noNodejsModules` prevents this at lint time.

### Where Node.js APIs Are SAFE

**Vite Plugin Implementations**: Node.js APIs are safe in Vite plugins

**Locations**:

- `packages/astro/src/vite-plugin-*/` → Safe for Node.js APIs
- `packages/astro/src/cli/` → Safe for Node.js APIs
- Test files → Safe for Node.js APIs

**Mixed/Unclear locations**:

- `packages/astro/src/core/` → Mixed (contains both build-time and runtime code)

**Safe approach for core/**:

```typescript
// AVOID in core/ unless in Vite plugin
import fs from 'node:fs';

// PREFER cross-platform utilities
import { fileURLToPath } from '@astrojs/internal-helpers/path';
```

### Special Case: Vite Plugins

**CAN use Node.js APIs**: In the plugin implementation itself

```typescript
// ALLOWED
export function myVitePlugin() {
  return {
    name: 'my-plugin',
    load: {
      filter: {
        id: /\.astro$/,
      },
      async handler(id) {
        // Can use Node.js APIs here
        const fs = await import('node:fs/promises');
        const content = await fs.readFile(id, 'utf-8');
        return { code: content };
      },
    },
  };
}
```

**CANNOT use Node.js APIs**: In virtual modules returned by plugins

```typescript
// FORBIDDEN
export function myVitePlugin() {
  return {
    name: 'my-plugin',
    load: {
      filter: {
        id: new RegExp(`^\\0virtual:my-module$`),
      },
      handler() {
        // This code runs in runtime/server context
        return {
          code: `
            import fs from 'node:fs';  // FORBIDDEN
            export const data = fs.readFileSync('/data.json');
          `,
        };
      },
    },
  };
}
```

### Critical: NonRunnableDevEnvironment

**Important**: Some adapters (like Cloudflare) set Vite's `NonRunnableDevEnvironment`, which imposes limitations on what Vite plugins can do.

**Limitation**: Vite plugins execute, but certain operations are restricted. For example, you cannot use `runner.import()` in this environment.

**Implication**: While Vite plugins still run their hooks (transform, load, etc.), they may not have access to all runtime capabilities. Code must work with these limitations.

**Rule**: Write code that doesn't depend on full Vite runtime capabilities. This is why runtime-agnostic code is essential.

### Why This Matters

**Multi-runtime support**: Astro code must run in:

- Node.js (traditional hosting)
- Cloudflare Workers (V8 isolates)
- Deno (alternative runtime)
- Edge runtimes (limited APIs)

**Implication**: Most code must be platform-agnostic.

**Reality**: The codebase doesn't have perfect separation yet. When in doubt, avoid Node.js APIs and use cross-platform utilities from `@astrojs/internal-helpers`.

### How to Handle This

#### Pattern 1: Use Cross-Platform Utilities

Use `@astrojs/internal-helpers` instead of Node.js APIs:

```typescript
// BAD: Direct Node.js API
import { resolve } from 'node:path';
const fullPath = resolve('./config.json');

// GOOD: Cross-platform utility
import { fileURLToPath } from '@astrojs/internal-helpers/path';
const fullPath = fileURLToPath(new URL('./config.json', import.meta.url));
```

#### Pattern 2: Vite Plugin for File Operations

If you need file operations, do them in a Vite plugin:

```typescript
// GOOD: In Vite plugin implementation
export function myVitePlugin() {
  return {
    name: 'my-plugin',
    load: {
      filter: {
        id: /\.config\.js$/,
      },
      async handler(id) {
        // Safe to use Node.js APIs here
        const fs = await import('node:fs/promises');
        const content = await fs.readFile(id, 'utf-8');
        return { code: content };
      },
    },
  };
}
```

#### Pattern 3: Build-Time Data Generation

Generate data at build time via Vite plugin, embed in virtual module:

```typescript
// Vite plugin - safe to use Node.js APIs
const VIRTUAL_MODULE_ID = 'virtual:my-config';
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;

export function myVitePlugin() {
  return {
    name: 'my-plugin',
    resolveId: {
      filter: {
        id: new RegExp(`^${VIRTUAL_MODULE_ID}$`),
      },
      handler() {
        return RESOLVED_VIRTUAL_MODULE_ID;
      },
    },
    load: {
      filter: {
        id: new RegExp(`^${RESOLVED_VIRTUAL_MODULE_ID}$`),
      },
      async handler() {
        // Read at build time (safe here)
        const fs = await import('node:fs/promises');
        const config = JSON.parse(await fs.readFile('./config.json', 'utf-8'));
        // Embed in generated code (no Node.js APIs in output)
        return {
          code: `export default ${JSON.stringify(config)}`,
        };
      },
    },
  };
}
```

### Detection

**Error message**: If you violate this, you'll typically see:

- `ReferenceError: fs is not defined`
- `ReferenceError: process is not defined`
- Build succeeds but runtime fails in edge environments

**Prevention**: Code review, test in multiple environments

## Test Isolation Requirements

**Every test fixture MUST have a unique `outDir`** to avoid cache pollution between tests.

**Why**: Build artifacts are cached and shared via ESM between test runs.

**Reference**: See [testing.md](testing.md) for detailed explanation, examples, and detection strategies.

## Circular Dependencies

### The Problem

TypeScript circular dependencies can cause:

- Undefined exports at runtime
- Type resolution issues
- Build failures

### Where It Happens

Most commonly in type imports.

### The Solution

**Types are centralized**: `packages/astro/src/types/`

```typescript
// BAD: Import type from implementation
import type { AstroConfig } from '../config/index.js';

// GOOD: Import type from types/
import type { AstroConfig } from '../types/public.js';
```

### Prevention

- Import types from `types/` directory
- Avoid importing implementation files for types
- Use `import type` (not `import`) for type-only imports

## Virtual Module Conventions

**Constraint**: New virtual modules must use `virtual:astro:*` prefix (not `@astro-page:*` which is legacy).

**Why**: Standard convention, avoids conflicts, follows Rollup/Vite patterns.

**Reference**: See [architecture.md](architecture.md) for virtual module registry, implementation patterns, and detailed conventions.

## Build vs Runtime Boundaries

### The Separation

Code must respect execution boundaries:

| Context        | Location          | When Runs         | Node APIs |
| -------------- | ----------------- | ----------------- | --------- |
| Build          | `core/`           | `astro build`     | Yes       |
| Dev            | `core/`           | `astro dev` setup | Yes       |
| Runtime Server | `runtime/server/` | SSR rendering     | No        |
| Runtime Client | `runtime/client/` | Browser           | No        |

### Common Violation

```typescript
// BAD: Runtime code importing build code
// In runtime/server/render.ts
import { buildSomething } from '../../core/build/utils.js';
```

**Why bad**: Runtime shouldn't depend on build-time code. Creates coupling and increases bundle size.

### Correct Pattern

```typescript
// GOOD: Data flows from build to runtime via manifest
// Build time (core/build/)
const manifest = {
  routes: processedRoutes,
  config: runtimeConfig,
};

// Runtime (runtime/server/)
import { manifest } from 'virtual:astro:manifest';
```

## Package Boundaries

### Workspace Dependencies

Test fixtures and examples MUST use workspace dependencies:

```json
// GOOD: fixture package.json
{
  "dependencies": {
    "astro": "workspace:*",
    "@astrojs/react": "workspace:*"
  }
}
```

```json
// BAD: specific versions
{
  "dependencies": {
    "astro": "^4.0.0",
    "@astrojs/react": "^3.0.0"
  }
}
```

### Why

- Links to local packages during development
- Automatically uses latest local code
- Prevents version mismatches

### Catalog Dependencies

For external packages, use catalog when available:

```json
{
  "dependencies": {
    "astro": "workspace:*",
    "react": "catalog:",
    "react-dom": "catalog:"
  }
}
```

**Catalog location**: Root `package.json`

## Changeset Requirements

### When Required

**Required for**:

- All packages in `packages/`
- Any user-facing changes

**NOT required for**:

- Examples in `examples/`
- Test fixtures
- Documentation only changes
- Internal refactors with no API changes

### Prerelease Mode

**Current state**: Repository in prerelease mode (check `.changeset/config.json`)

```json
{
  "baseBranch": "origin/next"
}
```

**Implication**: Changes go to `next` release, not `latest`

### Creating Changeset

```bash
pnpm exec changeset
```

Select packages and describe changes.

## Performance Constraints

### Build Cache

**Shared cache**: Build artifacts cached in `.astro/` and `dist/`

**Implication**:

- Tests must use unique `outDir`
- Manual cache clear may be needed
- Cache can speed up but also cause issues

### Content Layer Concurrency

**Location**: `packages/astro/src/content/content-layer.ts`

**Pattern**: Uses PQueue with concurrency: 1

```typescript
const queue = new PQueue({ concurrency: 1 });
```

**Implication**: Loaders run sequentially, not in parallel

**Reason**: Prevents race conditions in data store

### Memory Constraints

**Large sites**: May hit memory limits during build

**Mitigation**:

```bash
node --max-old-space-size=4096 node_modules/.bin/astro build
```

## Debugging Constraints

### Cannot Use Interactive Commands

**Forbidden in CI**:

```bash
# BAD: Interactive
git rebase -i
git add -i
```

**Reason**: No TTY in CI environment

### Log Levels

**Production**: Don't log verbosely by default

```typescript
// BAD: Always logs
console.log('Processing file:', file);

// GOOD: Use logger with levels
logger.debug('Processing file:', file);
```

## Common Gotchas

### 1. File Paths in Tests

```typescript
// BAD: Relative to cwd
const fixture = await loadFixture({
  root: 'fixtures/my-test/',
});

// GOOD: Relative to test file
const fixture = await loadFixture({
  root: './fixtures/my-test/',
});
```

### 2. Async/Await in Hooks

```typescript
// BAD: Forgetting await
before(async () => {
  fixture.build(); // Missing await
});

// GOOD: Proper await
before(async () => {
  await fixture.build();
});
```

### 3. Server Cleanup

```typescript
// BAD: Server not stopped
describe('dev', () => {
  before(async () => {
    devServer = await fixture.startDevServer();
  });
  // Missing after() hook
});

// GOOD: Always cleanup
describe('dev', () => {
  before(async () => {
    devServer = await fixture.startDevServer();
  });
  after(async () => {
    await devServer.stop();
  });
});
```

### 4. Type Imports

```typescript
// BAD: Runtime import for types
import { AstroConfig } from 'astro';

// GOOD: Type-only import
import type { AstroConfig } from 'astro';
```

### 5. Module Resolution

```typescript
// BAD: May fail in different contexts
import helper from '../utils';

// GOOD: Explicit extension
import helper from '../utils.js';
```

## Constraint Checklist

Before submitting code, verify:

- [ ] No Node.js APIs in `runtime/` code
- [ ] Tests have unique `outDir`
- [ ] No circular dependencies
- [ ] Virtual modules follow naming conventions
- [ ] Workspace dependencies in fixtures
- [ ] Changeset created (if needed)
- [ ] Servers cleaned up in tests
- [ ] Type imports use `import type`
- [ ] File extensions explicit (`.js`)

## Further Reading

- CONTRIBUTING.md: Node.js API restrictions (lines 84-98)
- CONTRIBUTING.md: Test isolation (lines 203-214)
- architecture.md: Execution contexts
- testing.md: Test patterns
