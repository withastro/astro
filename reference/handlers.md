# Handler Pipeline & Feature Checks — Astro Reference

## Overview

Astro's request pipeline (`packages/astro/src/core/routing/handler.ts`) runs a few built-in steps (trailing slash, redirects, middleware, route dispatch) plus the fetch handlers and render context extensions registered with `api.astroRouter` from `@astrojs/vite-plugin-router`. Astro registers its own features (sessions, cache, i18n, actions) in `packages/astro/src/core/router-registrations.ts`. The contract is documented in `packages/vite-plugin-router/API.md`.

When a project provides a custom `src/fetch.ts`, the user composes the pipeline themselves and can omit a step their project needs. To catch this, `BaseApp.#warnMissingFeatures()` runs a one-shot check after the first request and warns about every step that did not run.

## How it works

Steps are tracked by name (`packages/astro/src/core/fetch/features.ts`):

- A step calls `markHandlerUsed(manifest, name)` when it runs. The name matches the `astro/fetch` function users call to run it (`sessions()` marks `'sessions'`).
- `handleRequest` (the batteries-included pipeline) calls `markAllHandlersUsed(manifest)`.

After the first request, `#warnMissingFeatures()` warns for:

- `redirects`, when the route table has redirect routes and the step did not run;
- `middleware`, when the manifest has middleware and the step did not run;
- every fetch handler registered with `api.astroRouter.addFetchHandler()` whose name was not marked.

## Adding a step for a feature

1. Register the step only when the feature is configured, so unconfigured projects get no warning:

   ```ts
   if (config.myFeature) {
     api.addFetchHandler('myFeature', {
       entrypoint: new URL('./fetch-handler.js', import.meta.url),
       order: 'pre',
     });
   }
   ```

2. Export a function from `astro/fetch` (`packages/astro/src/core/fetch/index.ts`) that runs the step for custom handlers, and call `markHandlerUsed(state.manifest, 'myFeature')` in it.

The warning message is generated from the handler name.
