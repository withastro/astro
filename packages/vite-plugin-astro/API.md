# `@astrojs/vite-plugin-astro` API

```js
// vite.config.js
import astro from '@astrojs/vite-plugin-astro';

export default { plugins: [astro({ site: 'https://example.com' })] };
```

`astro(options?: AstroPluginOptions): Plugin[]`. The plugin currently only validates options and exposes `api.astro`; it does not compile or render yet.

## Options

| Option             | Type                              | Default      | Notes                                 |
| ------------------ | --------------------------------- | ------------ | ------------------------------------- |
| `root`             | `string`                          | Vite `root`  | Resolved against Vite's `root`.       |
| `srcDir`           | `string`                          | `'./src'`    | Resolved against `root`.              |
| `publicDir`        | `string`                          | `'./public'` | Resolved against `root`.              |
| `site`             | `string` (absolute URL)           | —            |                                       |
| `compressHTML`     | `boolean \| 'jsx'`                | `'jsx'`      |                                       |
| `trailingSlash`    | `'always' \| 'never' \| 'ignore'` | `'ignore'`   |                                       |
| `renderers`        | `AstroRenderer[]`                 | `[]`         | Replaces integration `addRenderer()`. |
| `clientDirectives` | `ClientDirectiveConfig[]`         | `[]`         | Replaces `addClientDirective()`.      |

There is no `base` option: the base is Vite's resolved `base`. The `astro` CLI maps its `base` onto Vite's.

Validation: `AstroPluginOptionsSchema` (zod v4). The `astro` config schema (`packages/astro/src/core/config/schemas/{base,relative}.ts`) builds `srcDir`, `publicDir`, `site`, `compressHTML` and `trailingSlash` from `AstroPluginOptionsSchema.shape`. Defaults live in `ASTRO_PLUGIN_DEFAULTS`, exported from the import-free `@astrojs/vite-plugin-astro/defaults` entry, and are spread into `ASTRO_CONFIG_DEFAULTS`.

## `api.astro`

Read it with `getAstroApi(config: ResolvedConfig): AstroPluginApi`, which throws if `astro()` is not in `plugins`. Plugin order does not matter.

```ts
interface AstroPluginApi {
  readonly config: ResolvedSharedConfig; // throws if read before resolution
  readonly renderers: readonly AstroRenderer[];
  readonly clientDirectives: readonly ClientDirectiveConfig[];
}

interface ResolvedSharedConfig {
  root: URL; // absolute, trailing slash
  srcDir: URL; // absolute, trailing slash
  publicDir: URL; // absolute, trailing slash
  base: string; // Vite's resolved base
  site: string | undefined;
  compressHTML: boolean | 'jsx';
  trailingSlash: 'always' | 'never' | 'ignore';
}
```

`config` is resolved in `astro()`'s `configResolved` hook with `order: 'pre'`. Read it from your own `configResolved` (default order) or later:

```ts
import { getAstroApi } from '@astrojs/vite-plugin-astro';

const feature = {
  name: 'my-feature',
  configResolved(config) {
    const { srcDir, base } = getAstroApi(config).config;
  },
};
```

The plugin is located by name (`@astrojs/vite-plugin-astro`). Never pass `AstroSettings` across a package boundary; read from `api.astro`.

## Types

Exported from the package root and re-exported unchanged from `astro`:

- Renderers: `AstroRenderer`, `SSRLoadedRenderer`, `SSRLoadedRendererValue`, `NamedSSRLoadedRendererValue`, `AsyncRendererComponentFn`, `AstroComponentMetadata`
- Directives: `ClientDirective`, `ClientDirectiveConfig`, `AstroClientDirectives`, `ClientVisibleOptions`
- Rendering: `AstroComponentFactory`, `AstroFactoryReturnValue`, `SSRElement`, `SSRMetadata`, `SSRComponentMetadata`, `PropagationHint`
- Seams: `SSRResult`, `SSRResultExtensions`, `AstroGlobal`, `AstroGlobalExtensions`
- Runtime inputs: `StylesheetAsset`, `RenderRouteInfo` (the `route`/`component` fields `renderPage` reads; `RouteData` satisfies it)

Users augmenting `AstroClientDirectives` through `declare module 'astro'` keep working: TypeScript follows the re-export.

## Type seam

`SSRResult` and `AstroGlobal` declare only component-language members. Everything else is added by declaration merging.

| Type                               | Declares                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Extension interface                    |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `SSRResult`                        | `cancelled`, `base`, `userAssetsBase`, `styles`, `scripts`, `links`, `componentMetadata`, `inlinedScripts`, `createAstro`, `resolve`, `renderers`, `clientDirectives`, `compressHTML`, `partial`, `_metadata`, and the request-level values the render runtime reads: `pathname`, `response`, `getServerIslandNameMap`, `trailingSlash`, `key`, `cspDestination`, `shouldInjectCspMetaTags`, `cspAlgorithm`, `directives`, `scriptDirective`, `styleDirective`, `speculationRulesContent`, `internalFetchHeaders` | `SSRResultExtensions`                  |
| `AstroGlobal<Props, Self, Params>` | `props`, `self`, `slots`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `AstroGlobalExtensions<Props, Params>` |

```ts
declare module '@astrojs/vite-plugin-astro' {
  // Repeat both type parameters with the same names and constraints.
  interface AstroGlobalExtensions<
    Props extends Record<string, any>,
    Params extends Record<string, string | undefined>,
  > {
    currentLocale: string | undefined;
  }
  interface SSRResultExtensions {
    cookies: AstroCookies | undefined;
  }
}
```

What `astro` merges in today:

- `AstroGlobalExtensions` extends `APIContext<Props, Params>` and adds `response` (`types/public/context.ts`). `APIContext` still lives in `astro`; moving it (and its own seam) to `vite-plugin-pages` is pages-layer work.
- `SSRResultExtensions` adds `params`, `request`, `actionResult`, `cookies` and the deprecated CSP fields (`scriptHashes`, `scriptResources`, `styleHashes`, `styleResources`, `isStrictDynamic`) (`types/public/internal.ts`).

## Internal modules (`@astrojs/vite-plugin-astro/internal/*`)

`./internal/*` maps to `./dist/*`. It is for `astro` and `@astrojs/vite-plugin-pages` only: no stability guarantee. Import with the `.js` path of the source file under `src/`.

| Module                                                                            | Contents                                                                                                                                                                                                                                                                                                                     |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `runtime/server/index.js` (+ `runtime/server/**`)                                 | The render runtime: `renderComponent`, `renderPage`, `renderTemplate`, `renderSlot`, escape helpers, `createAstro`, server island rendering, `ISLAND_STYLES`, `astro-island.prebuilt.js` / `astro-island.prebuilt-dev.js` (CSP hashes). `renderEndpoint` stays in `astro` (`astro/runtime/server/index.js` re-exports both). |
| `runtime/client/{idle,load,media,only,visible}.prebuilt.js`                       | Built-in client directive scripts.                                                                                                                                                                                                                                                                                           |
| `core/client-directive/index.js`                                                  | `getDefaultClientDirectives()`, `buildClientDirectiveEntrypoint()`.                                                                                                                                                                                                                                                          |
| `core/render/slots.js`                                                            | `Slots` (the `Astro.slots` implementation).                                                                                                                                                                                                                                                                                  |
| `core/errors/index.js`, `errors.js`, `errors-data.js`, `userError.js`, `utils.js` | `AstroError` and friends, `AstroErrorData` (all error definitions, including the `@docs` source for the website error reference).                                                                                                                                                                                            |
| `core/head-propagation/*.js`                                                      | Head propagation; `boundary.js` exports `PROPAGATED_ASSET_FLAG` and `isPropagatedAssetBoundary`.                                                                                                                                                                                                                             |
| `core/render-scope/*.js`                                                          | Prerender metadata collection; image records are generic (`RenderCollectors<TImage>`), `astro` specializes them with `SerializedStaticImage`.                                                                                                                                                                                |
| `core/csp/sources.js`                                                             | CSP algorithms, kinds, `CspDirective`, `partitionByKind`. Zod schemas stay in `astro`.                                                                                                                                                                                                                                       |
| `core/encryption.js`                                                              | Server island key and string encryption, `generateCspDigest`.                                                                                                                                                                                                                                                                |
| `core/routing/internal/route-errors.js`                                           | `isRoute404`, `isRoute500`.                                                                                                                                                                                                                                                                                                  |
| `vite-plugin-astro/metadata.js`, `types.js`                                       | `getAstroMetadata`, `createDefaultAstroMetadata`, `PluginMetadata` (the `meta.astro` Vite module info).                                                                                                                                                                                                                      |
| `vite-plugin-scripts/const.js`                                                    | `BEFORE_HYDRATION_SCRIPT_ID`, `PAGE_SCRIPT_ID`, `PAGE_SSR_SCRIPT_ID`.                                                                                                                                                                                                                                                        |
| `vite-plugin-renderers/const.js`                                                  | `ASTRO_RENDERERS_MODULE_ID` (`virtual:astro:renderers`).                                                                                                                                                                                                                                                                     |
| `vite-plugin-head/const.js`                                                       | `VIRTUAL_COMPONENT_METADATA` (`virtual:astro:component-metadata`).                                                                                                                                                                                                                                                           |
| `vite-plugin-css/const.js`                                                        | Dev CSS virtual module ids.                                                                                                                                                                                                                                                                                                  |
| `transitions/*.js`, `types/public/view-transitions.js`                            | View transition animations, events, swap functions and their types.                                                                                                                                                                                                                                                          |
