# @astrojs/vite-plugin-astro

## 0.1.3

### Patch Changes

- [#18713](https://github.com/withastro/astro/pull/18713) [`59052e7`](https://github.com/withastro/astro/commit/59052e72668578a341a2c412769ead56d570fbe5) Thanks [@delucis](https://github.com/delucis)! - Unpins `@astrojs/*` dependencies to allow versions matching the `^` range to be installed

## 0.1.2

### Patch Changes

- Updated dependencies [[`e9916e1`](https://github.com/withastro/astro/commit/e9916e1bff5f3e740d533a6f504630bd6c528ddf)]:
  - @astrojs/runtime@0.1.1

## 0.1.1

### Patch Changes

- Updated dependencies [[`57137ed`](https://github.com/withastro/astro/commit/57137ed304b8f4220c8ae03606039bd521f1e005)]:
  - @astrojs/internal-helpers@0.13.2

## 0.1.0

### Minor Changes

- [#18610](https://github.com/withastro/astro/pull/18610) [`5083c65`](https://github.com/withastro/astro/commit/5083c6540cfe47fb9658ce71f424a3a03448ffaf) Thanks [@matthewp](https://github.com/matthewp)! - Initial release

- [#18611](https://github.com/withastro/astro/pull/18611) [`f98e8a8`](https://github.com/withastro/astro/commit/f98e8a8a90d25d0423763c61badc005c92c282d9) Thanks [@matthewp](https://github.com/matthewp)! - Adds standalone rendering: `astro()` compiles `.astro` files in a plain Vite project, and `renderToString()` / `renderToResponse()` from `@astrojs/runtime` render a component tree with its stylesheets, scripts and framework islands in dev and in builds

- [#18611](https://github.com/withastro/astro/pull/18611) [`f98e8a8`](https://github.com/withastro/astro/commit/f98e8a8a90d25d0423763c61badc005c92c282d9) Thanks [@matthewp](https://github.com/matthewp)! - Adds declarative renderer fields: an `AstroRenderer` can carry `options` (passed to its server entrypoint as `this.options`), `optimizeDeps`, `dedupe`, `noExternal` (a list, or a function of the project root for lists found by crawling dependencies), a dev-only `devHeadScript` and an `appEntrypoint` that its entrypoints import, which `astro()` applies, so a renderer is plain data next to the framework's own Vite plugin

### Patch Changes

- Updated dependencies [[`c904827`](https://github.com/withastro/astro/commit/c904827015f4a71e890ac51919adada9c219a3e9), [`5083c65`](https://github.com/withastro/astro/commit/5083c6540cfe47fb9658ce71f424a3a03448ffaf), [`1999c84`](https://github.com/withastro/astro/commit/1999c842f8c9e2cd577207550359941f6a2e5691), [`f98e8a8`](https://github.com/withastro/astro/commit/f98e8a8a90d25d0423763c61badc005c92c282d9), [`f98e8a8`](https://github.com/withastro/astro/commit/f98e8a8a90d25d0423763c61badc005c92c282d9)]:
  - @astrojs/runtime@0.1.0
