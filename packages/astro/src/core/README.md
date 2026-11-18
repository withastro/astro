# `core/`

Code that executes directly on Node (not processed by vite). Contains the main Astro logic for the `build`, `dev`, `preview`, and `sync` commands, and also manages the lifecycle of the Vite server.

The `core/index.ts` module exports the CLI commands as functions and is the main entrypoint of the `astro` package.

```ts
import { dev, build, preview, sync } from 'astro';
```

[See CONTRIBUTING.md](../../../../CONTRIBUTING.md) for a code overview.

## Request handling: the functional core

Server-side request handling is a **purely functional core** keyed off the
`SSRManifest` — the one allowed ambient source of truth, exposed to bundled
code as the `virtual:astro:manifest` virtual module. There are no stateful
app/pipeline god objects: behavior lives in plain functions that read static
data from the manifest plus per-request state.

- **Owning modules** hold per-manifest derived/mutable state in WeakMaps and
  expose accessors: `routing/route-table.ts` (`getRouteTable`, `matchRoute`,
  `updateRouteTable`), `middleware/load.ts`, `../actions/load.ts`,
  `session/driver.ts`, `cache/provider.ts`, `render/route-cache.ts`,
  `routing/default.ts`, `logger/manifest-logger.ts`, `fetch/features.ts`,
  `manifest/ambient.ts`.
- **`environment/`** expresses what genuinely varies between rendering
  environments (production SSR, the two dev paths, build/prerender, the
  container) as a stateless `RenderEnvironment` record registered per manifest
  via `setEnvironment`; production is the unregistered default.
- **`fetch/`** owns the per-request `FetchState` (constructible from a bare
  `Request`, resolving the ambient manifest) and the handler functions
  (`handleRequest` and the middleware/pages/error stages) that drive a request
  through the chain.
- **Facades**: `App` (`core/app/`) and `NodeApp` (`core/app/node.ts`) survive
  as thin public compatibility shells — every method delegates to the
  functional core.
