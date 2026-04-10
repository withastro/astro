# Incremental Build — Astro Reference

## Why this matters

`astro build` has historically behaved like a cold build on every invocation. The only meaningful cross-build reuse was limited to narrower caches such as image optimization and the content-layer store. That meant repeated static builds still paid for:

- route discovery
- bundling
- prerender generation for every path
- rewriting the output directory

This work introduces an **experimental incremental build pipeline** for **static output** behind `experimental.incrementalBuild`.

The design goal is conservative reuse:

- **reuse work when Astro can prove it is safe**
- **fall back to fresh work when it cannot**

Correctness is intentionally prioritized over speed. This is not “incremental everywhere” yet — it is a static/prerender-first foundation that is meant to be safe, measurable, and extensible.

The current scope is intentionally narrower than the long-term goal:

- Supported today: static output, selective prerender reuse, exact no-op reuse for safe static-only builds, recovery from missing persisted outputs, and conservative invalidation for code/config/asset/public/tracked metadata changes
- Not supported yet: SSR/hybrid incremental reuse, reuse of prior client/server bundles across content-only changes, and exact no-op skip-bundling reuse for projects that still need fresh dynamic path generation

---

## How incremental build works

### The user-facing switch

Enable the feature with:

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  experimental: {
    incrementalBuild: true,
  },
});
```

Use `astro build --force` to clear persisted incremental state and force a fresh build.

### The persisted state

When `experimental.incrementalBuild` is enabled for a static build, Astro writes build metadata to keyed state files in `cacheDir`:

- `cacheDir/incremental-build-state.<key>.json`

The key is derived from the stable build consumer identity (project root, mode, output kind, and output directories) so multiple builds can share one `cacheDir` without constantly overwriting each other's state, while ordinary config changes still reuse the same state file and surface normal invalidation reasons.

That state records:

- a schema version
- build fingerprint metadata
- artifact roots (`outDir`, client dir, server dir, cache dir)
- build summary data
- file-backed dependency digests
- logical data dependency digests
- public directory digest
- per-page dependency and output metadata

### What Astro persists per page

For each page, Astro stores:

- page key and route
- component and module specifier
- route type and prerender flag
- dependency-key sets:
  - modules
  - hydrated components
  - client-only components
  - scripts
  - data dependencies
- emitted asset references:
  - styles
  - scripts
- generated pathnames and output files

These dependency sets now use **namespaced logical keys** rather than assuming every tracked identifier is a file path. Today most of those keys are still file-backed (for example `file:/src/pages/index.astro`), and the first built-in data key is the content-layer store (`data:content-store`). That keeps the current static-first implementation conservative while leaving room for future non-file identities such as CMS records, tags, or HTTP resources.

This is the core data model: Astro compares the current snapshot against the previous one and uses that comparison to decide which outputs are still reusable.

### The two reuse paths

Astro can take one of three high-level paths on a repeated build:

| Path                 | When it happens                                                    | Result                                                                    |
| -------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| Full rebuild         | Fingerprint or safety checks fail                                  | Normal build behavior                                                     |
| Selective generation | Bundling is still needed, but some prior page outputs remain valid | Reuse unchanged paths, render only invalidated ones, delete stale outputs |
| Full static reuse    | The build is an exact safe no-op                                   | Restore previous outputs and skip bundling entirely                       |

#### Selective generation

The selective path is the main feature today.

When incremental reuse is active, Astro preserves the previous `outDir` and plans generation at the pathname level:

1. Build the current page snapshot
2. Compare it against the previous snapshot
3. Reuse outputs for unchanged paths
4. Rerender invalidated or newly added paths
5. Delete stale outputs for removed paths

This allows a repeated static build to avoid rewriting unaffected HTML outputs while still keeping the final output correct.

#### Full static reuse

Astro also has a stricter exact no-op fast path. When all safety checks pass, Astro restores the previous static output and skips bundling entirely.

This path is intentionally narrow. It only runs when Astro can prove that skipping the normal bundling and generation pipeline is still correct.

---

## How fingerprinting works

The persisted fingerprint currently covers:

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

The key idea: **state reuse is only allowed when both the project inputs and Astro’s own build behavior still look equivalent**.

### Project metadata digest

To make reuse friendlier to CI/CD, dependency churn, and local environment changes, Astro fingerprints common metadata files in the project root:

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

If any of those change, the prior incremental state is invalidated.

### Astro build implementation digest

Local work on Astro itself can change build behavior without changing the published package version. To avoid unsound reuse in that situation, the incremental state also fingerprints key Astro build implementation files and invalidates prior state when they change.

That matters in this monorepo because “same package version” does not necessarily mean “same build behavior” during local development.

---

## What invalidates reuse

### What invalidates selective reuse

Examples of changes that force Astro to rerender a page or pathname:

- a tracked file-backed dependency digest changed
- a tracked data dependency digest changed
- a page dependency set changed
- a page’s emitted CSS/JS asset references changed
- a generated pathname disappeared
- a new pathname appeared
- the old output file is missing

### Asset-aware HTML invalidation

Reusing HTML is only safe if the emitted asset URLs it references are still correct. Astro now persists per-page asset references and rerenders a page instead of reusing its HTML when those asset fingerprints change.

This protects the common case where the HTML itself is unchanged but the emitted CSS or JS filename changed.

### What blocks full static reuse

The exact no-op skip-bundling path requires all of the following:

- static output
- previous incremental state exists and matches the current fingerprint
- tracked dependency digests match
- tracked data dependency digests match
- public directory digest matches
- persisted outputs and assets still exist
- no blocked build hooks are present
- no dynamic prerendered routes are present

If any of those checks fail, Astro falls back to the normal build path or the selective incremental path.

---

## Build hooks and dynamic routes

### Build hooks that block full static reuse

Astro will not take the exact no-op skip-bundling path when an integration registers any of:

- `astro:build:setup`
- `astro:build:ssr`
- `astro:build:generated`

Those hooks are part of the normal build pipeline. Skipping them would make a no-op reuse unsound, so Astro refuses the fast path instead.

### Why dynamic prerendered routes are blocked

Dynamic `getStaticPaths()` projects need fresh path generation to prove the path set is still correct. The selective incremental path handles that safely by rerunning the build pipeline and diffing path snapshots. The exact skip-bundling fast path does not, so Astro now refuses that path when dynamic prerendered routes are present.

That is a deliberate correctness tradeoff, not an accidental limitation.

---

## Artifact safety and integrity rules

The incremental state stores file URLs for generated outputs. Reuse is guarded by stricter containment and existence checks:

- persisted outputs must still exist
- persisted assets must still exist
- reused files must remain inside the known artifact roots
- asset-path traversal outside artifact roots is rejected
- public directory traversal ignores symlinks

Unreadable tracked files and unreadable public/data-store inputs are treated as invalidating signals rather than silently appearing unchanged.

Synthetic route-like identifiers that do not resolve to real files are no longer persisted as file-backed dependency digests. That keeps the invalidation surface closer to actual reusable artifacts instead of producing noisy `"missing"` sentinels for non-file identities.

This is especially important for cache portability and CI, where a reused state file may outlive the exact local filesystem layout it came from.

---

## How Astro wires it up

### `packages/astro/src/core/build/build-state.ts`

This is the core incremental state module. It owns:

- state schema and persistence
- fingerprint creation and invalidation
- file-backed dependency, logical data, public dir, and artifact digests
- per-page snapshot creation
- selective generation planning
- full static reuse eligibility checks
- artifact restoration and safety checks

### `packages/astro/src/core/build/index.ts`

This is the main build orchestrator. It now:

- loads previous incremental state
- attempts the exact no-op fast path before Vite bundling
- logs why full static reuse was skipped when Astro stays on the selective path
- writes updated incremental state at the end of the build

### `packages/astro/src/core/build/generate.ts`

This is where selective prerender reuse happens. It now:

- reuses unchanged prerendered paths
- rerenders only invalidated/new paths
- deletes stale outputs
- preserves the correct `astro:build:generated` behavior for normal incremental builds

### `packages/astro/src/core/build/static-build.ts`

The static build flow is now incremental-aware and no longer assumes `outDir` is always disposable when reuse is active.

### `packages/astro/src/cli/build/index.ts`

`astro build --force` now clears incremental build state in addition to the existing content-layer cache reset behavior.

### `packages/astro/src/types/public/config.ts`

The public config docs now explain:

- the static-only scope
- the exact no-op reuse path
- the conservative fallback behavior
- CI caching guidance

---

## Debugging playbook

### Step 1: Confirm the feature is actually active

Make sure:

- `experimental.incrementalBuild` is enabled
- the build is using `output: 'static'`
- an `incremental-build-state.<key>.json` file is being written into `cacheDir`

If the feature flag is off, or the build is not static, Astro will behave like a normal cold build.

### Step 2: Check why full static reuse did not happen

When Astro stays off the exact no-op path, it logs a reason at build time. Typical reasons include:

- fingerprint changes
- blocked build hooks
- dynamic prerendered routes
- missing persisted outputs/assets
- public directory changes

If you are expecting the skip-bundling path, start by checking that log line first.

### Step 3: Check whether selective reuse is still working

Even when full static reuse is blocked, selective incremental generation may still be working correctly. Look for:

- reused static path counts
- rendered static path counts
- stale output cleanup on removed paths

The exact no-op path is only one optimization. Selective reuse is the main path for many repeated builds.

### Step 4: Check persisted artifacts

If `cacheDir` is restored but `outDir` is missing or incomplete, Astro will correctly fall back instead of reusing missing artifacts.

That is expected behavior, especially in CI systems where state and outputs are not cached together.

### Step 5: Check metadata and hook changes

If reuse unexpectedly invalidates, inspect:

- Vite config changes
- integration hook changes
- lockfile or environment file changes
- local Astro source changes

These are now part of the invalidation surface by design.

### Step 6: Use `--force` when you want a clean comparison

`astro build --force` is the escape hatch for:

- suspicious cache state
- intentionally fresh verification runs
- performance comparisons against a cold build

---

## Validation in this implementation

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

## Benchmark impact

### External benchmark app

The larger external sample app at:

- `D:\GitHub\incremental-astro`

contains 356 static pages and was used as a more realistic benchmark and demo app.

### Observed results

After landing the exact no-op static reuse path, repeated no-op builds on that app measured approximately:

| Command            | Average wall-clock | Astro-reported build time |
| ------------------ | ------------------ | ------------------------- |
| `pnpm build`       | `1517ms`           | `53ms`                    |
| `pnpm build:force` | `2864ms`           | `1.434s`                  |

These numbers are local directional evidence rather than a formal benchmark suite, but they show the main point clearly:

- the selective/static reuse design produces real wins
- the exact no-op path can remove almost all Astro build time on safe rebuilds

---

## CI / GitHub Actions guidance

The feature is compatible with CI, but **incremental reuse across CI runs requires the cache to persist both state and outputs**.

For GitHub Actions, the important rule is:

- cache `cacheDir`
- cache the matching build output directory
- scope the cache key to branch, lockfile, and build inputs as appropriate

If only `cacheDir` is restored without the prior outputs, Astro will correctly fall back instead of reusing missing artifacts.

`astro build --force` remains the escape hatch for workflows that intentionally do not want cross-run reuse.

---

## Key files

| File                                                  | Role                                                                                                                                                      |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/astro/src/core/build/build-state.ts`        | Persists incremental state, computes fingerprints, snapshots per-page dependencies/outputs, plans selective reuse, and validates exact no-op reuse safety |
| `packages/astro/src/core/build/index.ts`              | Loads prior state, attempts the exact no-op fast path, logs fallback reasons, and writes updated state                                                    |
| `packages/astro/src/core/build/generate.ts`           | Reuses unchanged prerendered paths, rerenders invalidated/new paths, deletes stale outputs, and preserves normal generated-hook behavior                  |
| `packages/astro/src/core/build/static-build.ts`       | Makes the static build pipeline incremental-aware and preserves `outDir` when reuse is active                                                             |
| `packages/astro/src/cli/build/index.ts`               | Extends `astro build --force` to clear incremental build state                                                                                            |
| `packages/astro/src/types/public/config.ts`           | Documents `experimental.incrementalBuild` and its current scope/constraints                                                                               |
| `packages/astro/test/incremental-build.test.js`       | End-to-end coverage for reuse behavior, fallback behavior, and stale output handling                                                                      |
| `packages/astro/test/incremental-build-state.test.js` | Verifies state persistence and `--force` behavior                                                                                                         |
| `packages/astro/test/units/build/build-state.test.js` | Unit coverage for invalidation, planner decisions, and exact no-op blockers                                                                               |

---

## Known limitations

Current limitations are intentional:

1. Static builds only. SSR/hybrid reuse is still future work.
2. Dynamic prerendered routes cannot use the exact skip-bundling fast path.
3. Bundles are still rebuilt for selective incremental runs; broader artifact reuse is not finished yet.
4. Content/data invalidation is still conservative at the route-family level in some cases, and the only built-in logical data key today is `data:content-store`.
5. The feature is experimental and may evolve as more real-world repos exercise it.

---

## Potential next steps

These are the strongest follow-up directions from here:

### Reuse build artifacts across content-only rebuilds

The biggest missing piece is broader reuse of prerender/server/client build artifacts when bundle-affecting inputs are unchanged. That is the next meaningful step beyond selective HTML reuse.

### Narrow route-family invalidation

Content/data invalidation is still conservative in some cases. There is room to reuse more when Astro can prove a smaller affected set than an entire route family.

### Extend logical data dependencies

The new dependency-key model is intentionally broader than file paths, but today it only ships built-in support for file-backed keys plus `data:content-store`. The next external-data step is to let build-time data sources participate with their own stable keys and validators, rather than teaching core incremental logic to guess about arbitrary `fetch()` calls.

### Evaluate a manual `astro build --filter` primitive

A native `--filter` may still be useful as a manual orchestration primitive for CMS webhooks or custom pipelines, but it should stay separate from the correctness story for native incremental reuse. If Astro explores it, it should likely reuse the planner machinery without redefining the invalidation model.

### Extend the model to SSR/hybrid builds

The current implementation is deliberately static-first. Once the static pipeline is stable, the same conservative architecture can be extended to SSR/hybrid work.

### Improve observability

The current logs are useful, but they can still become more explicit about _why_ Astro reused work, _why_ it fell back, and _which_ inputs caused invalidation.
