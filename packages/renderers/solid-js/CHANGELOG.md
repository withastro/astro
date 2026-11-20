# @astrojs/solid-js-renderer

## 0.2.0

### Minor Changes

- [#17891](https://github.com/withastro/astro/pull/17891) [`6fb274e`](https://github.com/withastro/astro/commit/6fb274ee5026f00df2b140a5acb3d1aacfab68af) Thanks [@ryansolid](https://github.com/ryansolid)! - Adds support for Solid 2.0 (requires `solid-js@^2.0.0` and `@solidjs/web@^2.0.0`)
  
  This major version supports Solid 2.0 only; use `@astrojs/solid-js@7` (and `@astrojs/solid-js-renderer@0.1`) for Solid 1.x projects. The Solid 2.0 renderer lives in `@astrojs/solid-js-renderer`, which the integration re-exports.
  
  Highlights:
  
  - Compiles through `@solidjs/vite-plugin` (replacing `vite-plugin-solid`), with an optional `compiler` option to select the native or Babel backend.
  - Islands render through Solid 2.0's first-class async model (`renderToStream`), with no Suspense wrapper: async islands settle fully on the server, and error boundaries (`Errored`) contain both sync and async errors.
  - Threads an asset manifest into server renders so `lazy()` boundary modules inside islands resolve their module URLs, hydrate through serialized asset maps, and have their CSS inlined into the island markup (deduped per page) — in dev via the plugin's live resolver, in production via the client build manifest.
  - Component detection (`check()`) now probe-renders through the stream renderer with per-component caching, rejects foreign framework vnodes explicitly, and no longer breaks on Proxy-based components.
  - Removes the `solid-devtools` integration option (the Solid 2.0 devtools story is not settled yet).

### Patch Changes

- Updated dependencies [[`db5e3ec`](https://github.com/withastro/astro/commit/db5e3ec560df8bf81fb5a13f01bd7ca23f302107)]:
  - @astrojs/runtime@0.1.3

## 0.1.2

### Patch Changes

- [#18713](https://github.com/withastro/astro/pull/18713) [`59052e7`](https://github.com/withastro/astro/commit/59052e72668578a341a2c412769ead56d570fbe5) Thanks [@delucis](https://github.com/delucis)! - Unpins `@astrojs/*` dependencies to allow versions matching the `^` range to be installed

## 0.1.1

### Patch Changes

- Updated dependencies [[`e9916e1`](https://github.com/withastro/astro/commit/e9916e1bff5f3e740d533a6f504630bd6c528ddf)]:
  - @astrojs/runtime@0.1.1

## 0.1.0

### Minor Changes

- [#18612](https://github.com/withastro/astro/pull/18612) [`ff1cf65`](https://github.com/withastro/astro/commit/ff1cf65c7a9d7f7603d371e08bda8dbc4cf106bf) Thanks [@matthewp](https://github.com/matthewp)! - Initial release

### Patch Changes

- Updated dependencies [[`c904827`](https://github.com/withastro/astro/commit/c904827015f4a71e890ac51919adada9c219a3e9), [`5083c65`](https://github.com/withastro/astro/commit/5083c6540cfe47fb9658ce71f424a3a03448ffaf), [`1999c84`](https://github.com/withastro/astro/commit/1999c842f8c9e2cd577207550359941f6a2e5691), [`f98e8a8`](https://github.com/withastro/astro/commit/f98e8a8a90d25d0423763c61badc005c92c282d9), [`f98e8a8`](https://github.com/withastro/astro/commit/f98e8a8a90d25d0423763c61badc005c92c282d9)]:
  - @astrojs/runtime@0.1.0
