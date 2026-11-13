# Architecture Guide

Understanding Astro's internal architecture is critical for effective development. This guide covers execution contexts, pipelines, virtual modules, and content layer architecture.

## Three Execution Contexts

Astro code runs in three distinct environments. Understanding which context your code executes in determines what APIs you can use and how to debug it.

### Context 1: Node.js (Core)

**Location**: `packages/astro/src/core/`

**When it runs**: During `astro dev`, `astro build`, and CLI commands

**Characteristics**:

- Node.js environment (but contains mixed code)
- Contains both build-time AND runtime code
- Node.js API usage should be avoided except in Vite plugins
- Powers build orchestration and dev server setup

**Note**: `core/` is not purely build-time - avoid Node.js APIs unless in Vite plugin implementations

**Examples**:

- `packages/astro/src/core/build/` → Build orchestration (mixed)
- `packages/astro/src/core/dev/` → Dev server setup (mixed)
- `packages/astro/src/cli/` → CLI commands (pure Node.js)

**Debug with**: Standard Node debugging, console.log, `node --inspect`

### Context 2: Vite SSR (Runtime Server)

**Location**: `packages/astro/src/runtime/server/`

**When it runs**: Inside Vite's SSR environment during rendering

**Characteristics**:

- Node environment BUT isolated from core
- **CANNOT use Node.js APIs** (`node:fs`, `node:path`, etc.)
- Must work in non-Node runtimes (Cloudflare Workers, Deno)
- Use `@astrojs/internal-helpers` for cross-platform utilities

**Rule**: If the file path contains `/runtime/`, absolutely NO Node.js APIs

**Examples**:

- `packages/astro/src/runtime/server/render/` → Page rendering
- Virtual modules loaded during SSR

**Debug with**: `DEBUG=astro:*` environment variable

### Context 3: Browser (Runtime Client)

**Location**: `packages/astro/src/runtime/client/`

**When it runs**: In the browser after page load

**Characteristics**:

- Browser-only environment
- CANNOT use any Node.js APIs
- Only browser-compatible code allowed
- Handles partial hydration, client-side routing

**Examples**:

- `packages/astro/src/runtime/client/idle.ts` → Idle hydration
- `packages/astro/src/runtime/client/visible.ts` → Visible hydration

**Debug with**: Browser DevTools, console.log in browser

## Pipeline Architecture

Astro uses a base `Pipeline` class with multiple implementations for different environments.

### Pipeline Hierarchy

```
Pipeline (abstract base class)
├── RunnablePipeline       → Dev with RunnableDevEnvironment
├── NonRunnablePipeline    → Dev with NonRunnableDevEnvironment
├── BuildPipeline          → Build and prerendering
├── AppPipeline            → Production SSR/serverless
└── ContainerPipeline      → Container API
```

**Location**: `packages/astro/src/core/base-pipeline.ts`

### Pipeline Types

#### 1. RunnablePipeline

**When**: During `astro dev` with Vite RunnableDevEnvironment
**Purpose**: Handle dev server requests with runtime module loading
**Location**: `packages/astro/src/vite-plugin-app/pipeline.ts`
**Characteristics**:

- Contains reference to Vite loader system
- Can import modules at runtime via Vite environment APIs
- Hot module reloading support
- Standard dev workflow

**Best practice**: Avoid runtime module imports when possible. Prefer Vite plugins and virtual modules instead.

#### 2. NonRunnablePipeline

**When**: During `astro dev` with Vite NonRunnableDevEnvironment
**Purpose**: Handle dev server requests without runtime module loading
**Location**: `packages/astro/src/core/app/dev/pipeline.ts`
**Characteristics**:

- Used by adapters like Cloudflare
- No reference to Vite loader system
- Cannot import modules at runtime
- Must rely entirely on Vite plugins and virtual modules

**Critical**: This is why code must avoid runtime module imports and use plugins/virtual modules instead

#### 3. BuildPipeline

**When**: During `astro build` and prerendering
**Purpose**: Generate static HTML and handle prerendering
**Location**: `packages/astro/src/core/build/pipeline.ts`
**Characteristics**:

- Optimized output
- Static generation
- Asset processing
- Prerendering logic

#### 4. AppPipeline

**When**: Production runtime (serverless/SSR)
**Purpose**: Serve dynamic requests in production
**Location**: `packages/astro/src/core/app/pipeline.ts`
**Characteristics**:

- No build-time dependencies
- Optimized for cold starts
- Adapter integration
- Production error handling

#### 5. ContainerPipeline

**When**: Using the Container API
**Purpose**: Programmatic rendering outside of normal Astro contexts
**Location**: `packages/astro/src/container/pipeline.ts`
**Characteristics**:

- Standalone rendering
- Component interning cache
- Used for testing and programmatic access

### Base Pipeline

**Pipeline** (abstract base class): Static parts that don't change between requests

From `packages/astro/src/core/base-pipeline.ts`:

- Configuration
- Logger
- Manifest
- Runtime mode (development/production)
- Middleware
- Actions
- Internal caches

**All pipeline implementations extend this base class**

### RenderContext vs Pipeline

**Pipeline**: Constant per server/build session (static)

- Created once at process start
- Reused for every request
- Contains configuration and settings

**RenderContext**: Per-request data (dynamic)

- Created for each request
- Current URL
- Matched route
- Request locals
- i18n context
- Middleware execution

## Virtual Modules System

Virtual modules are a core pattern in Astro. They're "files" that don't exist on disk but are generated at build/dev time.

### Virtual Module Conventions

**Prefix**: `virtual:astro:*` for Astro-internal, `\0` prefix for Rollup-internal (Rollup convention)

**Pattern**:

1. Internal code imports `virtual:astro:something`
2. Vite plugin `resolveId` hook returns `\0virtual:astro:something`
3. Vite plugin `load` hook returns generated code

### Core Virtual Modules Registry

**File**: `packages/astro/src/virtual-modules/`

| Module                     | Purpose                                      | Source                |
| -------------------------- | -------------------------------------------- | --------------------- |
| `virtual:astro:routes`     | Route definitions                            | Generated from pages/ |
| `virtual:astro:manifest`   | Serialized manifest (single source of truth) | Build output          |
| `virtual:astro:pages`      | Page collections                             | Generated from pages/ |
| `virtual:astro:renderers`  | Framework renderers                          | Integration config    |
| `virtual:astro:middleware` | Middleware module                            | src/middleware.ts     |
| `virtual:astro:dev-css`    | Dev-mode CSS modules                         | Vite dev              |
| `virtual:astro:app`        | App pipeline                                 | Production runtime    |
| `virtual:image-service`    | Image service config                         | Config + integrations |

**Actions Virtual Modules**:

- `virtual:astro:actions/entrypoint` → Actions entry
- `virtual:astro:actions/options` → Actions configuration

**Adapter Virtual Modules**:

- `virtual:astro:adapter-config` → Adapter configuration
- `virtual:astro:adapter-entrypoint` → Adapter entry point

### Internal Page Virtual Modules

**Prefix**: `@astro-page:*` (legacy pattern, specific to pages)

**Note**: This is an older pattern used specifically for page modules. New virtual modules should use `virtual:astro:*` instead unless there's a specific reason to deviate.

**Example**: `@astro-page:src/pages/index.astro` → Virtual module for index page

**Standard pattern for new plugins**: Use `virtual:astro:*` prefix

### Virtual Module Implementation Pattern

**Current pattern** (see `packages/astro/src/core/build/plugins/plugin-ssr.ts`):

```typescript
const VIRTUAL_MODULE_ID = 'virtual:astro:my-module';
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;

// In Vite plugin
{
  name: '@astrojs/vite-plugin-my-module',
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
    handler() {
      return {
        code: `export default ${JSON.stringify(data)}`,
      };
    },
  },
}
```

**Pattern**: Use `filter/id/handler` structure for both `resolveId` and `load` hooks.

## Content Layer Architecture

The content layer handles content collections at build time and runtime.

### Key Components

**Location**: `packages/astro/src/content/`

| Component          | File                           | Purpose                         |
| ------------------ | ------------------------------ | ------------------------------- |
| Content Layer      | `content-layer.ts` (479 lines) | Main orchestration              |
| Data Store         | `data-store.ts`                | Read-only runtime store         |
| Mutable Data Store | `mutable-data-store.ts`        | Build-time mutable store        |
| Runtime API        | `runtime.ts`                   | `getCollection()`, `getEntry()` |
| Types Generator    | `types-generator.ts`           | TypeScript type generation      |
| Watcher            | `watcher.ts`                   | File system watching            |

### Content Layer Flow

```
Build Time:
┌─────────────┐    ┌──────────────┐    ┌────────────────┐
│   Loaders   │───▶│MutableStore  │───▶│.astro/data-    │
│(load data)  │    │(collect data)│    │store.json      │
└─────────────┘    └──────────────┘    └────────────────┘
                            │
                            ▼
                   ┌──────────────┐
                   │Types Generator│
                   └──────────────┘

Runtime:
┌────────────────┐    ┌──────────┐    ┌─────────────┐
│.astro/data-    │───▶│DataStore │───▶│Runtime API  │
│store.json      │    │(read-only)│    │(getCollection)│
└────────────────┘    └──────────┘    └─────────────┘
```

### Content Constants

**File**: `packages/astro/src/content/consts.ts`

```typescript
DATA_STORE_FILE = '.astro/data-store.json';
COLLECTIONS_MANIFEST_FILE = 'collections-manifest.json';
MODULES_IMPORTS_FILE = 'modules-imports.json';
ASSET_IMPORTS_FILE = 'asset-imports.json';
```

### Live Collections (Astro 5+)

**New pattern**: Fetch data at runtime rather than build time

**Configuration**: Separate from build-time collections

- Build-time: `src/content/config.ts`
- Runtime: `src/live.config.ts`

**Loader Protocol**: Loaders must implement standard interface

## Vite Plugin Architecture

**Location**: `packages/astro/src/vite-plugin-*/`

Vite plugins execute within Vite's context (similar to runtime/server).

### Build Plugins

**Location**: `packages/astro/src/core/build/plugins/`

**Documentation**: `packages/astro/src/core/build/plugins/README.md`

**Plugin Responsibilities**:

1. **plugin-middleware**: Emits `middleware.mjs` if present
2. **plugin-renderers**: Collects renderers → `renderers.mjs`
3. **plugin-pages**: Virtual modules for each page (static builds)
4. **plugin-ssr**: Creates SSR entry points
5. **plugin-manifest**: Creates `manifest.mjs` (single source of truth)

### Plugin Execution Order

Plugins work together in sequence:

1. Middleware plugin runs first
2. Renderers collected
3. Pages processed
4. SSR entries created
5. Manifest generated (final step)

## Package Structure

### Monorepo Organization

```
packages/
├── astro/                    # Core package
│   ├── src/
│   │   ├── core/            # Node.js build/dev
│   │   ├── runtime/         # Vite SSR + browser
│   │   ├── virtual-modules/ # Virtual module sources
│   │   ├── content/         # Content layer
│   │   ├── vite-plugin-*/   # Vite plugins
│   │   └── types/           # Centralized types
│   └── test/
│       ├── fixtures/        # Test fixtures
│       └── *.test.js        # Unit tests
├── integrations/
│   ├── react/
│   ├── vue/
│   ├── svelte/
│   └── ...
└── create-astro/            # CLI scaffolding tool

examples/                     # Example projects
├── blog/
├── minimal/
└── ...
```

### Node Modules Mapping

When you see errors in `node_modules/`, map back to source:

```
ERROR in node_modules/astro/dist/core/build/index.js
        ↓
FIX in packages/astro/src/core/build/index.ts

ERROR in node_modules/@astrojs/react/index.js
        ↓
FIX in packages/integrations/react/src/index.ts
```

**Rebuild required**: Edits to source files take effect after `pnpm run build`

## Critical Constraints

For detailed constraints including Node.js API restrictions, test isolation, virtual module conventions, and more, see [constraints.md](constraints.md).

**Key points:**

- Node.js APIs forbidden in `runtime/` folders
- Tests must use unique `outDir`
- Types centralized in `src/types/`
- Virtual modules use `virtual:astro:*` prefix

## Debugging

For comprehensive debugging strategies, see [debugging.md](debugging.md).

**Quick reference by context:**

- **Core (Node.js)**: Use `DEBUG=astro:*` or `node --inspect`
- **Runtime Server**: Check `DEBUG=astro:render,astro:server`
- **Runtime Client**: Use browser DevTools
- **Content Layer**: Inspect `.astro/data-store.json`

## Further Reading

- Core README: `packages/astro/src/core/README.md`
- Build Plugins: `packages/astro/src/core/build/plugins/README.md`
- Virtual Modules: `packages/astro/src/virtual-modules/README.md`
- CONTRIBUTING.md sections on code structure
