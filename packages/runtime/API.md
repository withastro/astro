# `@astrojs/runtime` API

The code that compiled `.astro` components run: the render runtime, the client directive scripts, the JSX runtime, `AstroError` and the error data, and the base render types. `@astrojs/vite-plugin-astro` compiles components against it, and `astro` renders pages with it.

Nothing in this package imports Vite, the Astro compiler, Rolldown or zod, so it loads in any JavaScript runtime. The view transition modules (`internal/transitions/*`) are browser code that reads `import.meta.env.DEV`, and must be bundled by Vite.

## Entry points

| Export                              | Contents                                                                                                                                                                                                |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@astrojs/runtime`                  | `renderToString()` and `renderToResponse()` (see [Rendering components compiled by `astro()`](#rendering-components-compiled-by-astro)), `createRenderer()` and its types, and every type of `./types`. |
| `@astrojs/runtime/render`           | `createRenderer()` (see [Rendering without Vite](#rendering-without-vite)).                                                                                                                             |
| `@astrojs/runtime/server`           | The render runtime: `renderComponent`, `renderPage`, `renderTemplate`, `renderSlot`, escape helpers, `createAstro`, server island rendering. `astro/runtime/server` re-exports it.                      |
| `@astrojs/runtime/compiler-runtime` | What compiled components import (`internalURL` of the compiler). `astro/compiler-runtime` and `@astrojs/vite-plugin-astro/compiler-runtime` re-export it.                                               |
| `@astrojs/runtime/jsx-runtime`      | The JSX runtime. `astro/jsx-runtime` re-exports it.                                                                                                                                                     |
| `@astrojs/runtime/client/*`         | The built-in client directive scripts, as strings: `{idle,load,media,only,visible}.prebuilt.js`.                                                                                                        |
| `@astrojs/runtime/types`            | The base render types (see [Types](#types)).                                                                                                                                                            |
| `@astrojs/runtime/internal/*`       | Every module under `src/`, by the `.js` path of its source file. For `@astrojs/vite-plugin-astro`, `@astrojs/vite-plugin-pages` and `astro` only: no stability guarantee.                               |

## Rendering components compiled by `astro()`

```js
import { renderToString, renderToResponse } from '@astrojs/runtime';

const html = await renderToString(Page, { props, slots, request });
```

`renderToString(Component, options?)` and `renderToResponse(Component, options?)` render with the config that `astro()` from `@astrojs/vite-plugin-astro` registers: every component it compiles for a server environment imports `virtual:astro:render-setup`, which passes its renderers, client directives and component assets to `setRenderConfig()` (`internal/render-setup.js`, not public). `RenderOptions` (`props`, `slots`, `request`, `partial`) and the assets are documented in [`@astrojs/vite-plugin-astro`'s API.md](../vite-plugin-astro/API.md#rendering).

The config is module state: one per copy of the runtime, so one per Vite server environment, and each registration replaces the previous one. When nothing has been registered (no component compiled by `astro()` has been loaded), both functions reject with `AstroError` `RenderNotConfigured`. This package does not import any virtual module.

## Rendering without Vite

`createRenderer()` renders components compiled ahead of time, without virtual modules: the config `astro()` registers is passed as options.

```js
import { createRenderer } from '@astrojs/runtime';

const { renderToString } = createRenderer({
  renderers,
  resolve: async (specifier) => urls[specifier],
});
const html = await renderToString(Page, { props });
```

| `createRenderer(options?)` | Default                 | Notes                                                                                                                                                        |
| -------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `renderers`                | `[]`                    | `SSRLoadedRenderer[]`.                                                                                                                                       |
| `clientDirectives`         | the built-in directives | Directive scripts by name.                                                                                                                                   |
| `resolve`                  | throws                  | Client URL of an island, renderer client entrypoint or script specifier, when `componentAssets` does not resolve it.                                         |
| `componentAssets`          | no assets               | `(moduleId) => Promise<ComponentAssets>`: the stylesheets, client URLs and head metadata of a component tree (what `virtual:astro:component-assets` serves). |
| `site`                     | `undefined`             | `Astro.site`.                                                                                                                                                |
| `compressHTML`             | `'jsx'`                 |                                                                                                                                                              |
| `base`                     | `'/'`                   |                                                                                                                                                              |
| `headScripts`              | `[]`                    | Inline module scripts added to the `<head>` of documents (not with `partial`). `astro()` passes the `devHeadScript` of its renderers in dev.                 |

It returns `{ renderToString(Component, options?), renderToResponse(Component, options?) }` with the signatures above. The runtime calls `check()` and `renderToStaticMarkup()` of a renderer with `this` set to `{ result, options }`, where `options` is the renderer's `options`. `test/render.test.ts` compiles a component with `@astrojs/compiler-rs` and renders it in plain Node.

## Types

Exported from `@astrojs/runtime/types` and the package root, and re-exported unchanged from `@astrojs/vite-plugin-astro` and `astro`:

- Renderers: `AstroRenderer`, `SSRLoadedRenderer`, `SSRLoadedRendererValue`, `NamedSSRLoadedRendererValue`, `AsyncRendererComponentFn`, `AstroComponentMetadata`
- Directives: `ClientDirective`, `ClientDirectiveConfig`, `AstroClientDirectives`, `ClientVisibleOptions`
- Rendering: `AstroComponentFactory`, `AstroFactoryReturnValue`, `SSRElement`, `SSRMetadata`, `SSRComponentMetadata`, `PropagationHint`
- Seams: `SSRResult`, `SSRResultExtensions`, `AstroGlobal`, `AstroGlobalExtensions`
- Runtime inputs: `StylesheetAsset`, `RenderRouteInfo` (the `route`/`component` fields `renderPage` reads; `RouteData` satisfies it)

The [type seam](../vite-plugin-astro/API.md#type-seam) is documented with `@astrojs/vite-plugin-astro`. Augmenting `@astrojs/vite-plugin-astro` or `astro` merges into these interfaces: TypeScript follows the re-exports.

## Internal modules (`@astrojs/runtime/internal/*`)

| Module                                                                            | Contents                                                                                                                                                                            |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `server/**`                                                                       | The render runtime (`server/index.js` is `./server`), `ISLAND_STYLES`, `astro-island.prebuilt.js` / `astro-island.prebuilt-dev.js` (CSP hashes). `renderEndpoint` stays in `astro`. |
| `client/{idle,load,media,only,visible}.prebuilt.js`                               | Built-in client directive scripts.                                                                                                                                                  |
| `compiler/index.js`                                                               | `./compiler-runtime`.                                                                                                                                                               |
| `core/client-directive/default.js`                                                | `getDefaultClientDirectives()`.                                                                                                                                                     |
| `core/render/slots.js`                                                            | `Slots` (the `Astro.slots` implementation).                                                                                                                                         |
| `core/errors/index.js`, `errors.js`, `errors-data.js`, `userError.js`, `utils.js` | `AstroError` and friends, `AstroErrorData` (all error definitions, including the `@docs` source for the website error reference), `createSafeError`, `positionAt`.                  |
| `core/head-propagation/*.js`                                                      | Head propagation; `boundary.js` exports `PROPAGATED_ASSET_FLAG` and `isPropagatedAssetBoundary`.                                                                                    |
| `core/render-scope/*.js`                                                          | Prerender metadata collection; image records are generic (`RenderCollectors<TImage>`).                                                                                              |
| `core/csp/sources.js`                                                             | CSP algorithms, kinds, `CspDirective`, `partitionByKind`.                                                                                                                           |
| `core/encryption.js`                                                              | Server island key and string encryption, `generateCspDigest`.                                                                                                                       |
| `core/routing/internal/route-errors.js`                                           | `isRoute404`, `isRoute500`.                                                                                                                                                         |
| `render-setup.js`                                                                 | `setRenderConfig()` (called by `virtual:astro:render-setup`), `renderToString()`, `renderToResponse()`.                                                                             |
| `transitions/*.js`, `types/public/view-transitions.js`                            | View transition animations, events, swap functions and their types.                                                                                                                 |

The errors helpers that need zod, Vite or a YAML/TOML parser (`errorMap`, `isAstroConfigZodError`, `trackAstroConfigZodError`, `formatYAMLParseError`, `formatTOMLError`, `isTOMLError`, `isYAMLParseError`) live in `@astrojs/vite-plugin-astro/internal/core/errors/*`, which re-exports everything above.

## Versioning

`@astrojs/runtime` and `@astrojs/vite-plugin-astro` are a `linked` changeset group: released together, they get the same version. Components compiled by a version of the plugin import the runtime of the same version.
