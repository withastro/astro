# Handler Pipeline & Feature Checks — Astro Reference

## Overview

When a project enables `experimental.advancedRouting` and provides a custom `src/app.ts`, the user composes Astro's request pipeline themselves. This means they can accidentally omit a handler for a feature they've configured (e.g. sessions, i18n, actions). To catch this, `BaseApp.#warnMissingFeatures()` runs a one-shot check after the first request and warns about any configured features the custom pipeline doesn't call.

## How it works

Each handler has a corresponding bitmask flag in `PipelineFeatures` (`packages/astro/src/core/base-pipeline.ts`):

```ts
export const PipelineFeatures = {
  redirects: 1 << 0,
  sessions: 1 << 1,
  actions: 1 << 2,
  middleware: 1 << 3,
  i18n: 1 << 4,
  cache: 1 << 5,
} as const;
```

When a handler runs, it sets its flag on `pipeline.usedFeatures` using a bitwise OR:

```ts
pipeline.usedFeatures |= PipelineFeatures.sessions;
```

After the first request completes, `#warnMissingFeatures()` in `BaseApp` (`packages/astro/src/core/app/base.ts`) compares the manifest config against the flags that were actually set. If a feature is configured in the manifest but its flag was never set, a warning is logged telling the user their `src/app.ts` is missing that handler.

## When to add a new check

Add a new feature check when **all** of the following are true:

1. **The feature has a manifest config** — there's a field on `SSRManifest` (e.g. `manifest.sessionConfig`, `manifest.i18n`, `manifest.actions`) that indicates the user configured it.
2. **The feature has a dedicated handler** — there's a handler function in `astro/fetch` (e.g. `sessions()`, `actions()`, `i18n()`) that the user must include in their custom pipeline.
3. **Omitting the handler silently breaks the feature** — if the user forgets to include the handler, the feature just doesn't work with no obvious error.

Features that are always included (like page rendering) or that fail loudly on their own don't need a check.

## How to add a new check

1. **Add a flag to `PipelineFeatures`** in `packages/astro/src/core/base-pipeline.ts`:

   ```ts
   export const PipelineFeatures = {
     // ... existing flags
     myFeature: 1 << 6,
   } as const;
   ```

2. **Set the flag in your handler** when it runs:

   ```ts
   pipeline.usedFeatures |= PipelineFeatures.myFeature;
   ```

3. **Add the manifest check** in `BaseApp.#warnMissingFeatures()` in `packages/astro/src/core/app/base.ts`:
   ```ts
   if (manifest.myFeatureConfig && !(used & PipelineFeatures.myFeature)) {
     missing.push('myFeature');
   }
   ```

That's it. The warning message is generated automatically from the feature name.
