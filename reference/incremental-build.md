# Incremental Build — Astro Reference

## Why this exists

`astro build` has historically behaved like a cold build on every invocation. The only meaningful cross-build reuse was limited to narrow caches such as image optimization and the content-layer store. That meant repeated static builds still paid for:

- route discovery
- bundling
- prerender generation for every path
- rewriting the entire output directory

This work introduces an **experimental incremental build pipeline** for **static output** behind `experimental.incrementalBuild`.

The design goal is conservative reuse:

- **reuse work when Astro can prove it is safe**
- **fall back to fresh work when it cannot**

Correctness is prioritized over speed. The feature is intentionally narrower than “full incremental bundling for every Astro build mode”.

---

## Current scope

### Supported today

- `output: 'static'`
- selective reuse of unchanged prerendered outputs
- exact no-op rebuild reuse for safe static-only builds
- recovery when persisted outputs are missing
- invalidation on code, config, asset, public-file, and tracked metadata changes

### Not supported yet

- SSR/hybrid incremental reuse
- reuse of prior prerender/server/client bundles across content-only changes
- exact no-op skip-bundling reuse for builds that must rerun dynamic path discovery

---

## User-facing switch

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  experimental: {
    incrementalBuild: true,
  },
});
```

Use `astro build --force` to clear persisted incremental state and force a fresh build.

---

## High-level behavior

When `experimental.incrementalBuild` is enabled for a static build, Astro persists build metadata to:

- `cacheDir/incremental-build-state.json`

On the next build, Astro loads that state and chooses one of these paths:

| Path                 | When it happens                                         | Result                                                                    |
| -------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------- |
| Full rebuild         | Fingerprint or safety checks fail                       | Normal build behavior                                                     |
| Selective generation | Bundling is needed, but prior page outputs remain valid | Reuse unchanged paths, render only invalidated ones, delete stale outputs |
| Full static reuse    | Build is an exact safe no-op                            | Restore previous outputs and skip bundling entirely                       |

---

## What Astro persists

The incremental state records:

- a schema version
- build fingerprint metadata
- artifact roots (`outDir`, client dir, server dir, cache dir)
- build summary data
- tracked input digests
- content-layer data store digest
- public directory digest
- per-page dependency and output metadata

### Per-page metadata

For each page, Astro persists:

- page key and route
- component and module specifier
- route type and prerender flag
- dependency sets:
  - modules
  - hydrated components
  - client-only components
  - scripts
  - whether the page used the content/data store
- emitted asset references:
  - styles
  - scripts
- generated pathnames and output files

This gives Astro enough information to compare the previous and current build shapes and decide which outputs are still reusable.

---

## Fingerprint and invalidation model

The persisted fingerprint now covers:

- Astro version
- build mode and runtime mode
- build output mode
- adapter and prerenderer identity
- integration names
- renderer names
- Astro config digest
- Vite config digest
- integration build-hook shape digest
- project metadata digest
- Astro build implementation digest

### Project metadata digest

To make reuse friendlier to CI/CD and local project changes, Astro also fingerprints common metadata files in the project root:

- `package.json`
- `pnpm-lock.yaml`
- `package-lock.json`
- `yarn.lock`
- `bun.lock`
- `bun.lockb`
- `.env`
- `.env.local`
- `.env.<mode>`
- `.env.<mode>.local`

### Astro build implementation digest

Local work on Astro itself can change build behavior without changing the published package version. To avoid unsound reuse in that situation, the incremental state fingerprints key Astro build implementation files and invalidates prior state when they change.

---

## Selective prerender reuse

The selective path is the main feature today.

Astro now preserves the previous `outDir` when incremental reuse is active and plans generation at the pathname level:

1. build the current page snapshot
2. compare it against the previous snapshot
3. reuse outputs for unchanged paths
4. rerender invalidated or newly added paths
5. delete stale outputs for removed paths

### What invalidates a page/path

Examples:

- a tracked source module digest changed
- a page dependency set changed
- a page’s emitted CSS/JS asset references changed
- a generated pathname disappeared or a new pathname appeared
- the old output file is missing

### Asset-aware HTML invalidation

Reusing HTML is only safe if the emitted asset URLs it references are still correct. Astro now persists per-page asset references and rerenders a page instead of reusing its HTML when those asset fingerprints change.

This protects the common case where the HTML itself is unchanged but the emitted CSS or JS filename changed.

---

## Exact no-op full static reuse

Astro also has a stricter fast path for exact no-op rebuilds. When all safety checks pass, Astro restores the previous static output and skips bundling entirely.

This path is intentionally narrow.

### Requirements

- static output
- previous incremental state exists and matches the current fingerprint
- tracked input digests match
- content/data store digest matches
- public directory digest matches
- persisted outputs and assets still exist
- no blocked build hooks are present
- no dynamic prerendered routes are present

### Build hooks that block full no-op reuse

Astro will not take the skip-bundling path when an integration registers any of:

- `astro:build:setup`
- `astro:build:ssr`
- `astro:build:generated`

Those hooks are part of the normal build pipeline and skipping them would make a no-op reuse unsound.

### Why dynamic prerendered routes are blocked

Dynamic `getStaticPaths()` projects need fresh path generation to prove the path set is still correct. The selective incremental path handles that safely by rerunning the build pipeline and diffing path snapshots. The exact skip-bundling fast path does not, so Astro now refuses that path when dynamic prerendered routes are present.

That is a deliberate correctness tradeoff.

---

## Artifact safety and integrity rules

The incremental state stores file URLs for generated outputs. Reuse is now guarded by stronger containment checks:

- persisted outputs must still exist
- persisted assets must still exist
- reused files must remain inside the known artifact roots
- asset-path traversal outside artifact roots is rejected
- public directory traversal ignores symlinks

Unreadable tracked files and unreadable public/data-store inputs are treated as invalidating signals rather than silently appearing unchanged.

---

## Main code changes

### `packages/astro/src/core/build/build-state.ts`

Core incremental state module. This file now owns:

- state schema and persistence
- fingerprint creation and invalidation
- tracked input, public dir, and data store digests
- per-page snapshot creation
- selective generation planning
- full static reuse eligibility checks
- artifact restoration and safety checks

### `packages/astro/src/core/build/index.ts`

Build orchestration now:

- loads previous incremental state
- attempts the exact no-op fast path before Vite bundling
- logs why full static reuse was skipped when Astro stays on the selective path
- writes updated incremental state at the end of the build

### `packages/astro/src/core/build/generate.ts`

Generation now supports:

- reusing unchanged prerendered paths
- rerendering only invalidated/new paths
- deleting stale outputs
- preserving the correct `astro:build:generated` behavior for normal incremental builds

### `packages/astro/src/core/build/static-build.ts`

The static build flow is incremental-aware and no longer assumes `outDir` is always disposable when reuse is active.

### `packages/astro/src/cli/build/index.ts`

`astro build --force` now clears incremental build state in addition to the existing content-layer cache reset behavior.

### `packages/astro/src/types/public/config.ts`

User-facing config documentation now explains:

- the static-only scope
- the exact no-op reuse path
- the conservative fallback behavior
- CI caching guidance

---

## Test coverage

### Integration coverage

`packages/astro/test/incremental-build.test.js` covers:

- unchanged static output reuse
- single-page rerender
- data-driven route-family invalidation
- asset fingerprint churn
- exact no-op full static reuse on a static-only fixture
- conservative fallback for dynamic-route projects
- missing persisted output recovery
- public-asset-only changes
- stale output cleanup for removed dynamic paths

### State coverage

`packages/astro/test/incremental-build-state.test.js` verifies that:

- static builds persist incremental state
- `--force` recreates the state file
- new fingerprint fields are serialized

### Unit coverage

`packages/astro/test/units/build/build-state.test.js` covers:

- fingerprint invalidation reasons
- page/path generation planning
- missing output and missing asset behavior
- public directory invalidation
- hook-based full-reuse blockers
- dynamic-route full-reuse blocker

---

## External benchmark results

The large external sample project at:

- `D:\GitHub\incremental-astro`

contains 356 static pages and was used as a more realistic benchmark and demo app.

### Observed results

After landing the exact no-op static reuse path, repeated no-op builds measured approximately:

| Command            | Average wall-clock | Astro-reported build time |
| ------------------ | ------------------ | ------------------------- |
| `pnpm build`       | `1517ms`           | `53ms`                    |
| `pnpm build:force` | `2864ms`           | `1.434s`                  |

These numbers are from the local benchmark app and are mainly useful as directional evidence:

- the selective/static reuse design produces real wins
- the exact no-op path can remove almost all Astro build time on safe rebuilds

---

## CI / GitHub Actions guidance

The feature is compatible with CI, but **incremental reuse across CI runs requires the cache to persist both state and outputs**.

For GitHub Actions, the important rule is:

- cache `cacheDir`
- cache the matching build output directory
- scope the cache key to branch/lockfile/build inputs as appropriate

If only `cacheDir` is restored without the prior outputs, Astro will correctly fall back instead of reusing missing artifacts.

`astro build --force` remains the escape hatch for:

- suspicious cache state
- intentionally fresh verification jobs
- workflows that do not want cross-run reuse

---

## Known limitations

Current limitations are intentional:

1. Static builds only. SSR/hybrid reuse is still future work.
2. Dynamic prerendered routes cannot use the exact skip-bundling fast path.
3. Bundles are still rebuilt for selective incremental runs; broader artifact reuse is not finished yet.
4. Content/data invalidation is still conservative at the route-family level in some cases.
5. The feature is experimental and may evolve as more real-world repos exercise it.

---

## Next logical steps

The strongest next improvements are:

1. reuse prerender/server/client build artifacts across content-only rebuilds when bundle-affecting inputs are unchanged
2. narrow route-family invalidation for content/data changes where Astro can prove a smaller affected set
3. extend the model to SSR/hybrid builds once the static pipeline is stable
4. improve user-facing observability so build logs explain reuse decisions more clearly

---

## Summary

This implementation does not attempt to make Astro “incremental everywhere” in one step. It establishes a conservative static incremental foundation that is:

- measurable
- testable
- correctness-first
- useful today

That makes it a practical base for broader bundle reuse and future SSR/hybrid work instead of a one-off optimization.
