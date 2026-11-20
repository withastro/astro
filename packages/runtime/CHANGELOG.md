# @astrojs/runtime

## 0.1.3

### Patch Changes

- [#18776](https://github.com/withastro/astro/pull/18776) [`db5e3ec`](https://github.com/withastro/astro/commit/db5e3ec560df8bf81fb5a13f01bd7ca23f302107) Thanks [@astro-factory](https://github.com/apps/astro-factory)! - Fixes an unclear `Cannot find package 'esbuild'` build failure when `vite.build.cssMinify` or `vite.build.minify` is set to `'esbuild'`. Astro now reports that `esbuild` must be installed in your project to use these options.

## 0.1.2

### Patch Changes

- [#18733](https://github.com/withastro/astro/pull/18733) [`c6ab3c5`](https://github.com/withastro/astro/commit/c6ab3c583a98dc2033cfa41085546f88979cbf7f) Thanks [@Marve10s](https://github.com/Marve10s)! - Fixes hydration of framework components receiving sparse array props by serializing holes as undefined

## 0.1.1

### Patch Changes

- [#18629](https://github.com/withastro/astro/pull/18629) [`e9916e1`](https://github.com/withastro/astro/commit/e9916e1bff5f3e740d533a6f504630bd6c528ddf) Thanks [@decrek](https://github.com/decrek)! - Fixes spreading an object onto an element with scoped styles changing that object. When the same object was spread on every render, for example a constant imported from another module, its `class` grew with every request.

## 0.1.0

### Minor Changes

- [#18610](https://github.com/withastro/astro/pull/18610) [`5083c65`](https://github.com/withastro/astro/commit/5083c6540cfe47fb9658ce71f424a3a03448ffaf) Thanks [@matthewp](https://github.com/matthewp)! - Initial release

- [#18611](https://github.com/withastro/astro/pull/18611) [`f98e8a8`](https://github.com/withastro/astro/commit/f98e8a8a90d25d0423763c61badc005c92c282d9) Thanks [@matthewp](https://github.com/matthewp)! - Adds standalone rendering: `astro()` compiles `.astro` files in a plain Vite project, and `renderToString()` / `renderToResponse()` from `@astrojs/runtime` render a component tree with its stylesheets, scripts and framework islands in dev and in builds

- [#18611](https://github.com/withastro/astro/pull/18611) [`f98e8a8`](https://github.com/withastro/astro/commit/f98e8a8a90d25d0423763c61badc005c92c282d9) Thanks [@matthewp](https://github.com/matthewp)! - Adds declarative renderer fields: an `AstroRenderer` can carry `options` (passed to its server entrypoint as `this.options`), `optimizeDeps`, `dedupe`, `noExternal` (a list, or a function of the project root for lists found by crawling dependencies), a dev-only `devHeadScript` and an `appEntrypoint` that its entrypoints import, which `astro()` applies, so a renderer is plain data next to the framework's own Vite plugin

### Patch Changes

- [#18630](https://github.com/withastro/astro/pull/18630) [`c904827`](https://github.com/withastro/astro/commit/c904827015f4a71e890ac51919adada9c219a3e9) Thanks [@astro-factory](https://github.com/apps/astro-factory)! - Fixes bundled scripts and hydrated islands being blocked when `security.csp.scriptDirective.strictDynamic` is enabled. Astro now adds the hash of every bundled script to `script-src` and renders an import map with their `integrity` in the `<head>`.

- [#18688](https://github.com/withastro/astro/pull/18688) [`1999c84`](https://github.com/withastro/astro/commit/1999c842f8c9e2cd577207550359941f6a2e5691) Thanks [@astro-factory](https://github.com/apps/astro-factory)! - Fixes errors thrown after a page has started streaming bypassing the configured `logger`. They are now reported once through it, as one `error` record, in both production and `astro dev`
