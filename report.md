# Issue #17682 - Astro.site not available in container/component tests

## Bug Summary

`Astro.site` is always `undefined` when using the Container API (component testing), even when `site` is set via `astroConfig.site` in `AstroContainer.create()`.

## Reproduction

**Reproduced: YES**

### Steps

1. Created a test using the Container API with `astroConfig: { site: 'https://example.com' }`
2. Rendered a component that reads `Astro.site`
3. Result: `Astro.site` is `undefined` (renders "SITE_UNDEFINED")

### Test output

```
Render result: <div>SITE_UNDEFINED</div>
AssertionError: Expected Astro.site to be "https://example.com" but got: <div>SITE_UNDEFINED</div>
```

### Reproduction test (ran in `packages/astro/test/units/render/`):

```ts
const container = await experimental_AstroContainer.create({
  astroConfig: { site: 'https://example.com' },
});
const response = await container.renderToString(SitePage);
// response contains "SITE_UNDEFINED" instead of "https://example.com"
```

## Root Cause Analysis

The `astroConfig` option passed to `AstroContainer.create()` is **completely ignored**. The chain of responsibility:

1. **`AstroContainer.create()`** (`packages/astro/src/container/index.ts`) — destructures only `streaming`, `manifest`, `renderers`, and `resolve` from options. `astroConfig` is never read.

2. **`createManifest()`** (internal function in same file) — builds an `SSRManifest` object but **never sets a `site` property**. The field is simply absent.

3. **`Pipeline` constructor** (`packages/astro/src/core/base-pipeline.ts`) — reads `manifest.site`, which is `undefined`, so `this.site = undefined`.

4. **`Astro.site`** at render time — populated from `Pipeline.site`, which is `undefined`.

Additionally, the `AstroContainerManifest` type doesn't include `'site'` in its `Pick<SSRManifest, ...>` keys.

### Fix would require:

1. Read `astroConfig.site` in `AstroContainer.create()`
2. Pass it to `createManifest()` and set `site` on the manifest object
3. Add `'site'` to the `AstroContainerManifest` Pick type
4. Add tests

## Environment

- Astro: v7.2.x (workspace HEAD)
- Node: v24.15.0
- OS: Linux (x64)

---

## Diagnosis

**Confidence: high**

### Root Cause

`Astro.site` is always `undefined` when using the Container API because the `astroConfig` option passed to `AstroContainer.create()` is accepted in the type signature but **never read or applied**.

### Detailed Code Path

The value flows through these layers, and the gap is at step 1–2:

1. **`AstroContainer.create()`** (`packages/astro/src/container/index.ts`, ~line 340)

   ```ts
   const { streaming = false, manifest, renderers = [], resolve } = containerOptions;
   ```

   `astroConfig` is destructured away — it's never extracted from `containerOptions`.

2. **`createManifest()`** (same file, ~line 133)
   The function builds an `SSRManifest` object but never sets `site`. The returned object has no `site` property.

3. **`AstroContainerManifest` type** (same file, ~line 254)
   This `Pick<SSRManifest, ...>` type lists many fields but omits `'site'`. Even if someone wanted to pass `site` via the manifest option, the type wouldn't allow it.

4. **`Pipeline` constructor** (`packages/astro/src/core/base-pipeline.ts`, line 145)

   ```ts
   site = manifest.site ? new URL(manifest.site) : undefined,
   ```

   Since `manifest.site` is `undefined`, `this.site` becomes `undefined`.

5. **`FetchState`** (`packages/astro/src/core/fetch/fetch-state.ts`, line 555)

   ```ts
   site: pipeline.site,
   ```

   Passes `undefined` to the Astro global object.

6. **`Astro.site`** — user code reads `undefined`.

### SSRManifest type reference

`SSRManifest.site` is typed as `site?: string` in `packages/astro/src/core/app/types.ts`, line 66.

### Files to Change

1. **`packages/astro/src/container/index.ts`**:
   - In `AstroContainerManifest` type: add `'site'` to the `Pick` keys
   - In `createManifest()`: accept and set `site` from the manifest parameter, or from `astroConfig.site`
   - In `AstroContainer.create()`: read `astroConfig?.site` and pass it through to `createManifest()`

### Suggested Fix Approach

The simplest fix:

1. Add `'site'` to the `AstroContainerManifest` Pick type.
2. In `createManifest()`, set `site: manifest?.site ?? undefined` on the returned object.
3. In `AstroContainer.create()`, read `containerOptions.astroConfig?.site` and pass it as part of the manifest parameter to `createManifest()`:

   ```ts
   const { streaming = false, manifest, renderers = [], resolve, astroConfig } = containerOptions;
   // When creating the container constructor args, merge astroConfig.site into the manifest:
   return new experimental_AstroContainer({
     streaming,
     manifest: { ...manifest, site: astroConfig?.site ?? manifest?.site },
     renderers,
     resolve,
   });
   ```

4. Add a test in `packages/astro/test/units/render/container.test.ts` that verifies `Astro.site` is populated when `astroConfig.site` is passed to the container.

### Not a Regression

This has never worked — the `astroConfig` option has been accepted in the type but ignored since the Container API was introduced. The issue reporter correctly notes that `import.meta.env.SITE` works (that's handled by Vite's define plugin, separate from the runtime pipeline), while `Astro.site` does not (it depends on the manifest/pipeline chain).

---

## Verification

### Reporter's Claim

- **Current behavior**: `Astro.site` is `undefined` in container/component tests, even when `site` is set in `astroConfig`.
- **Expected behavior**: `Astro.site` should reflect the `site` value configured via `astroConfig` in `AstroContainer.create()`.

### Verdict: **bug**

### Confidence: **high**

### Evidence

1. **The `astroConfig` option was designed to be used but never wired up.** It was introduced in PR #11051 (commit `12a1bccc818`, 2024-05-22 by Emanuele Stoppa) as part of the original Container API. The type signature accepts `astroConfig` with JSDoc showing `trailingSlash` as an example. But `AstroContainer.create()` destructures only `{ streaming, manifest, renderers, resolve }` and never reads `astroConfig`. There are no comments explaining why it's ignored, no TODO, no FIXME — it's simply missing from the implementation.

2. **No intent signals in the code.** There are no comments, conditionals, or design rationale explaining why `site` should be excluded from the container manifest. The `createManifest()` function sets many other config values (e.g., `trailingSlash`, `compressHTML`, `base`, `buildFormat`) but just doesn't include `site`. This is an omission, not a deliberate exclusion.

3. **The `SSRManifest` type supports `site`.** `SSRManifest.site` is defined as `site?: string` in `packages/astro/src/core/app/types.ts:66`. The pipeline correctly reads it and populates `Astro.site` when present. The only gap is that the container's `createManifest()` never sets it.

4. **An existing fix branch confirms this is a bug.** Commit `722aa0ec98` on branch `remotes/origin/container-astro-config-site` is titled "Respect the astroConfig option in AstroContainer.create()" and explicitly describes this as a fix: "The create() method accepted a documented astroConfig option but never read it, always validating hardcoded container defaults instead."

5. **No prior issues or PRs mark this as intentional.** There's no evidence this behavior was discussed, debated, or deliberately chosen.

### Conclusion

This is a straightforward implementation oversight. The `astroConfig.site` option is documented, typed, and accepted — but the implementation never reads it, so `Astro.site` is always `undefined` in container rendering. The developer was not aware of this gap; it was introduced when the Container API was first implemented and never caught.

---

## Fix

### Status: **Fixed and verified**

### What was changed

**`packages/astro/src/container/index.ts`** — 4 surgical changes:

1. Added `site?: string` parameter to `createManifest()`.
2. Set `site: site ?? manifest?.site` in the manifest object returned by `createManifest()`.
3. Added `'site'` to the `AstroContainerManifest` Pick type so it can flow through the manifest parameter.
4. In `AstroContainer.create()`, extracted `astroConfig` from `containerOptions` and passed `site: astroConfig?.site ?? manifest?.site` to the constructor, which forwards it to `createManifest()`.

### Unit tests added

**`packages/astro/test/units/render/container.test.ts`** — 2 new test cases:

1. `'Astro.site reflects astroConfig.site'` — Verifies that passing `astroConfig: { site: 'https://example.com' }` to `AstroContainer.create()` makes `Astro.site` available in the rendered component.
2. `'Astro.site is undefined when astroConfig.site is not set'` — Verifies the default behavior: `Astro.site` is `undefined` when no site is configured.

All 8 container tests pass (6 existing + 2 new).

### Changeset

`.changeset/social-paws-throw.md` — patch bump for `astro`.

### Verification

- Build: passes with 0 errors, 0 warnings, 0 hints
- Tests: all 8 container unit tests pass
- Format: no formatting issues
