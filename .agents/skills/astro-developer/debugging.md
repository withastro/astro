# Debugging Guide

Practical debugging strategies for common issues in Astro development.

## Quick Debugging Decision Tree

**What's failing?** → **Debug with:**

| Symptom          | First Check      | Debug Command                                | Section                                   |
| ---------------- | ---------------- | -------------------------------------------- | ----------------------------------------- |
| Build fails      | Astro build logs | `DEBUG=astro:* pnpm -C packages/astro build` | [Build Issues](#debugging-build-failures) |
| Dev server crash | Core logs        | `DEBUG=astro:* astro dev`                    | [Core Issues](#debugging-core-nodejs)     |
| HMR not working  | Browser network  | `agent-browser` (not curl)                   | [HMR Issues](#debugging-hmr)              |
| SSR fails        | Runtime context  | `DEBUG=astro:* astro dev`                    | [SSR Issues](#debugging-ssr-issues)       |
| Content missing  | Data store       | `cat .astro/data-store.json`                 | [Content](#debugging-content-collections) |
| Tests failing    | Fixture setup    | Check `outDir` uniqueness                    | [Tests](testing.md)                       |

## Debugging Approaches

### 1. Use DEBUG Environment Variable (Recommended)

**Most issues are in Astro's code, not Vite.** Use Astro-specific debugging first.

```bash
# Debug everything in Astro
DEBUG=astro:* astro dev
DEBUG=astro:* astro build

# Debug specific subsystems
DEBUG=astro:build astro build       # Build process
DEBUG=astro:content astro dev       # Content collections
DEBUG=astro:server astro dev        # Dev server
DEBUG=astro:render astro dev        # Page rendering
DEBUG=astro:config astro dev        # Configuration

# Combine multiple namespaces
DEBUG=astro:build,astro:config astro build
DEBUG=astro:render,astro:server astro dev
```

### 2. Add Direct Logging

**Fastest approach**: Add console.log directly in source files.

```typescript
// Pattern: Add logs with context prefix
console.log('[CONTEXT] Message:', data);

// Example
console.log('[BUILD] Processing routes:', routes.length);
console.log('[RENDER] Component:', component.name);
console.log('[CONTENT] Collections:', collections);
```

**Workflow:**

1. Add logs to relevant file (see [Strategic Logging Locations](#strategic-logging-locations))
2. Run `pnpm -C packages/astro build` to rebuild
3. Test your change

**Use Astro's debug logger** (optional):

```typescript
import { debug } from '../logger/core.js';
const logger = debug('astro:feature-name');
logger('Operation starting', { data });
```

### 3. Node Inspector (Advanced)

```bash
# Start with debugger
node --inspect node_modules/.bin/astro dev
node --inspect node_modules/.bin/astro build

# Connect with Chrome DevTools
# Open chrome://inspect in Chrome
# Click "inspect" on the Node.js process
```

**Set breakpoints** in Chrome DevTools, navigate to source files, click line numbers.

## Strategic Logging Locations

**Where to add logs based on issue type:**

| Issue Type        | File Location                                        | Context     |
| ----------------- | ---------------------------------------------------- | ----------- |
| Build fails       | `packages/astro/src/core/build/index.ts`             | Core        |
| Routes not found  | `packages/astro/src/core/routing/manifest/create.ts` | Core        |
| Content missing   | `packages/astro/src/content/content-layer.ts`        | Core        |
| Rendering errors  | `packages/astro/src/core/render/core.ts`             | Runtime     |
| Config issues     | `packages/astro/src/core/config/config.ts`           | Core        |
| Dev server issues | `packages/astro/src/core/dev/dev.ts`                 | Core        |
| Component compile | `packages/astro/src/vite-plugin-astro/index.ts`      | Vite        |
| Virtual modules   | `packages/astro/src/vite-plugin-*/`                  | Vite        |
| Middleware issues | `packages/astro/src/core/middleware/`                | Core        |
| Adapter issues    | Check specific adapter in `packages/integrations/`   | Integration |

## Debugging Core (Node.js)

Core code runs in Node.js context: `packages/astro/src/core/`

**This is where most Astro bugs live.**

### Build Pipeline Flow

**Entry point**: `packages/astro/src/core/build/index.ts`

**Flow:**

1. `build()` → Main entry
2. `staticBuild()` or `viteBuild()` → Build strategy
3. Build plugins execute in order (see below)
4. Assets emitted to `dist/`

**Build plugin order** (`packages/astro/src/core/build/plugins/README.md`):

1. middleware
2. renderers
3. pages
4. ssr
5. manifest

**Add tracing logs** to understand flow:

```typescript
// In build/index.ts
console.log('[1] build() entry');
console.log('[2] Settings created');
console.log('[3] Build complete');
```

### Component Identification

**Astro Vite plugins**: `packages/astro/src/vite-plugin-*/`

- `vite-plugin-astro` → `.astro` file compilation
- `vite-plugin-astro-server` → Dev server integration
- `vite-plugin-env` → Environment variables
- `vite-plugin-html` → HTML injection

**Build plugins**: `packages/astro/src/core/build/plugins/`

- `plugin-middleware.ts` → Middleware emission
- `plugin-renderers.ts` → Renderer collection
- `plugin-pages.ts` → Page virtual modules
- `plugin-ssr.ts` → SSR entry points
- `plugin-manifest.ts` → Manifest generation

## Debugging SSR Issues

SSR issues span multiple contexts. Identify context first.

### Context Identification

**Determine which context the issue occurs in:**

1. Does issue occur in `astro dev`? → Dev/render context
2. Does issue occur after `astro build`? → Build context
3. Does issue occur in `astro preview`? → Runtime/adapter context

See [architecture.md](architecture.md) for pipeline details.

### Debug by Context

**Dev SSR:**

- Location: `packages/astro/src/core/render/`
- Command: `DEBUG=astro:render,astro:server astro dev`
- Check: Components loading, middleware executing, virtual modules available

**Build SSR:**

- Location: `packages/astro/src/core/build/`
- Command: `DEBUG=astro:build astro build`
- Check: `dist/` structure, hashed chunks in `dist/server/chunks/`

**Runtime SSR:**

- Location: `packages/astro/src/core/app/`
- Command: `astro preview`
- Check: Adapter implementation, middleware presence, routing, environment variables

### Inspect Build Output

```bash
# Inspect dist/ structure
ls -laR dist/

# SSR build structure (varies by adapter pattern):
# dist/client/            → Client assets (hashed)
# dist/server/chunks/     → All server code (hashed files)
# dist/server/virtual_astro_middleware.mjs → Middleware
# dist/server/[entrypoint] → Entry point (filename depends on adapter)

# Legacy adapters: Use entry.mjs
# Self adapters: Adapter decides filename (e.g., custom.mjs, _render.mjs)
```

**Adapter patterns:**

- **Legacy** (`adapter.entrypointResolution = 'explicit'`): Always uses `entry.mjs`
- **Self** (`adapter.entrypointResolution = 'self'`): Adapter controls entrypoint filename

**Find entrypoint:**

```bash
# List server files (entrypoint is typically at top level)
ls dist/server/*.mjs

# Check entrypoint content (always a re-export to chunks)
cat dist/server/entry.mjs  # or whatever the adapter named it
```

**Find actual code:**

```bash
# All server code is in hashed chunks
ls dist/server/chunks/

# Search for specific code in chunks
grep -r "function.*render" dist/server/chunks/
```

## Debugging Virtual Modules

Virtual modules use `virtual:astro:*` prefix.

### Common Virtual Modules

- `virtual:astro:manifest` → Manifest data
- `virtual:astro:routes` → Route definitions
- `virtual:astro:middleware` → Middleware module
- `virtual:astro:renderers` → Framework renderers

### Debug Virtual Module Generation

Add logging to Vite plugin hooks:

```typescript
// In Vite plugin
{
  resolveId: {
    handler(id) {
      if (id.includes('virtual:astro')) {
        console.log('[VIRTUAL] Resolving:', id);
      }
      // ...
    }
  },
  load: {
    handler(id) {
      if (id.includes('\0virtual:astro')) {
        console.log('[VIRTUAL] Loading:', id);
        const code = generateCode();
        console.log('[VIRTUAL] Generated code:', code);
        return { code };
      }
    }
  }
}
```

### Inspect at Runtime

```bash
# See loaded virtual modules
DEBUG=astro:* astro dev 2>&1 | grep "virtual:astro"
```

## Debugging Content Collections

Content layer issues often relate to data store or type generation.

### Inspect Data Store

```bash
# View entire data store
cat .astro/data-store.json | jq

# Check specific collection
cat .astro/data-store.json | jq '.collections["blog"]'

# Count entries per collection
cat .astro/data-store.json | jq '.collections | to_entries | map({key: .key, count: .value.entries | length})'
```

### Debug Content Layer

**Location**: `packages/astro/src/content/content-layer.ts`

**Enable debugging:**

```bash
DEBUG=astro:content astro dev
DEBUG=astro:content astro build
```

### Check Type Generation

**Location**: `.astro/types.d.ts`

```bash
# View generated types
cat .astro/types.d.ts | grep -A 20 "declare module 'astro:content'"
```

### Debug Loaders

Add logging in your loader implementation:

```typescript
export function myLoader() {
  return {
    name: 'my-loader',
    async load({ store, logger }) {
      logger.info('Loading data...');
      const data = await fetchData();
      logger.info(`Loaded ${data.length} entries`);

      for (const entry of data) {
        console.log('[LOADER] Setting:', entry.id);
        store.set({ id: entry.id, data: entry });
      }
    },
  };
}
```

## Debugging HMR

HMR testing requires a browser. **Do not use `curl`** for HMR issues.

### Use agent-browser

```bash
# Start dev server in background
pnpm exec bgproc start -n devserver --wait-for-port 10 -- pnpm -C examples/minimal dev

# Open browser
agent-browser open http://localhost:4321

# Get snapshot
agent-browser snapshot -i

# Make changes to source files
# Verify HMR updates the page

# View logs
pnpm exec bgproc logs -n devserver

# Cleanup
pnpm exec bgproc stop -n devserver
```

### Check HMR Boundaries

Vite maintains HMR boundaries. If HMR isn't working, check module boundaries.

```bash
DEBUG=vite:hmr astro dev
```

**Look for:**

- "hmr update" messages
- Module invalidation chains
- Boundary violations

### Common HMR Issues

| Issue                  | Cause               | Fix                     |
| ---------------------- | ------------------- | ----------------------- |
| Full page reload       | No HMR boundary     | Add HMR accept          |
| Styles not updating    | CSS module cache    | Check Vite CSS handling |
| Component not updating | Module not in graph | Check import chain      |

## Debugging Build Failures

### Check Build Output

```bash
# Build with full output
astro build

# Inspect dist/ structure
ls -laR dist/

# SSR build structure:
# dist/client/            → Client assets (hashed)
# dist/server/[entrypoint] → Entry shim (filename varies by adapter)
# dist/server/chunks/     → All server code (hashed files)

# Find entrypoint (adapter-dependent filename)
ls dist/server/*.mjs

# Check entry point (always a re-export to chunks)
cat dist/server/entry.mjs  # or whatever filename adapter uses

# All actual code is in hashed chunks
ls dist/server/chunks/
```

### Build Plugin Execution

**Order matters.** Plugins execute sequentially.

```bash
# Check plugin execution
DEBUG=vite:* astro build 2>&1 | grep "plugin-"
```

### Asset Processing

**Check:**

- `dist/client/` → Client assets
- `dist/server/` → SSR code
- Image optimization
- CSS bundling

```bash
# Find asset references
find dist/ -name "*.html" -exec grep -l "asset-file.jpg" {} \;
```

## Debugging Test Failures

See [testing.md](testing.md) for comprehensive test debugging.

**Quick checks:**

1. **Unique outDir**: Each test must have unique output directory
2. **Fixture structure**: Verify package.json has workspace dependencies
3. **Build cache**: Clean `.astro/` and `dist/` in fixture
4. **Parallel execution**: Check if `--parallel` is causing issues

## Common Error Patterns

### "Cannot find module 'node:fs'"

**Cause**: Using Node.js API in `runtime/` code

**Fix**: Move code to `core/` or use `@astrojs/internal-helpers`

**See**: [constraints.md](constraints.md)

### "Virtual module not found"

**Cause**: Virtual module not registered or plugin not loaded

**Fix:**

1. Check plugin registration
2. Verify `resolveId` and `load` hooks use filter/handler pattern
3. Confirm virtual module prefix is `virtual:astro:*`

### "Test fails intermittently"

**Cause**: Shared `outDir` between tests causing cache pollution

**Fix**: Set unique `outDir` for each test fixture

**See**: [testing.md](testing.md)

### "Port already in use"

**Cause**: Previous dev server still running

**Fix:**

```bash
# List running processes
pnpm exec bgproc list

# Stop specific server
pnpm exec bgproc stop -n devserver

# Kill all node processes (nuclear option)
killall node
```

### "HMR not working"

**Cause**: Module boundaries, full reload triggered, or browser cache

**Fix:**

1. Use `agent-browser` (not curl)
2. Check HMR boundaries with `DEBUG=vite:hmr`
3. Clear browser cache
4. Check HMR accept statements in modules

## Debugging Checklist

Before asking for help or filing an issue:

- [ ] Read error message completely
- [ ] Identified execution context (core/runtime/client)
- [ ] Enabled appropriate DEBUG flags
- [ ] Verified with minimal reproduction
- [ ] Checked if issue exists in `examples/`
- [ ] Reviewed related documentation
- [ ] Searched existing issues on GitHub
- [ ] Isolated to specific component/plugin

## Further Reading

- Architecture: [architecture.md](architecture.md)
- Constraints: [constraints.md](constraints.md)
- Testing: [testing.md](testing.md)
- Vite debugging: https://vitejs.dev/guide/troubleshooting.html
