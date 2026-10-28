# `@astrojs/vite-plugin-astro` API

```js
// vite.config.js
import astro from '@astrojs/vite-plugin-astro';

export default { plugins: [astro({ site: 'https://example.com' })] };
```

`astro(options?: AstroPluginOptions): Plugin[]` compiles `.astro` files and registers what [`renderToString()` and `renderToResponse()` from `@astrojs/runtime`](#rendering) need to render them in a plain Vite project: renderers, client directives, and each component tree's stylesheets and island URLs. It has no pages, routing or CLI; that is `@astrojs/vite-plugin-pages`.

The `astro` CLI does not use `astro()`: it composes the individual plugins listed under [Internal modules](#internal-modules-astrojsvite-plugin-astrointernal) with its own settings.

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

## Rendering

```js
// src/render.js, loaded in a server environment (`ssrLoadModule`, an environment runner, or a server build entry)
import { renderToString } from '@astrojs/runtime';
import Page from './components/Page.astro';

export const render = (props) => renderToString(Page, { props });
```

The render API is exported from `@astrojs/runtime`, which the project adds as a dependency next to `@astrojs/vite-plugin-astro`. (`astro()` resolves every `@astrojs/runtime` import to its own copy of the runtime, so compiled components work without that dependency, and they and the render API share one copy.)

| Function                                | Returns             |
| --------------------------------------- | ------------------- |
| `renderToString(Component, options?)`   | `Promise<string>`   |
| `renderToResponse(Component, options?)` | `Promise<Response>` |

`RenderOptions`:

| Option    | Type                     | Default                 | Notes                                                                                                                                                                       |
| --------- | ------------------------ | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `props`   | `Record<string, any>`    | `{}`                    |                                                                                                                                                                             |
| `slots`   | `Record<string, string>` | `{}`                    | HTML per slot name (`default` for the default slot).                                                                                                                        |
| `request` | `Request`                | `GET http://localhost/` | Exposed as `Astro.request` and `Astro.url`.                                                                                                                                 |
| `partial` | `boolean`                | `false`                 | `false` renders a document: `<!DOCTYPE html>` is added and the tree's stylesheets are injected into `<head>` (or before the first element). `true` renders a bare fragment. |

The standalone `Astro` global has `props`, `self`, `slots`, `request`, `url`, `site` and `generator`. Request-level APIs (`cookies`, `params`, `redirect`, `locals`, actions, sessions, i18n) and server islands belong to `@astrojs/vite-plugin-pages` and are not available.

In server environments, `astro()` adds `import 'virtual:astro:render-setup';` to every compiled `.astro` module (`vite-plugin-render-setup`). That module registers the renderers, client directives and component assets of `astro()` with the runtime, which `renderToString()` and `renderToResponse()` render with. A component is imported before it is rendered, so the config is registered by the time a render runs. The registration is module state of the runtime: one per server environment, replaced each time the setup module runs again. Rendering before any component compiled by `astro()` has been loaded in the environment throws `RenderNotConfigured`. To render components compiled otherwise, use `createRenderer()` (see [`@astrojs/runtime`'s API.md](../runtime/API.md#rendering-without-vite)).

### Assets

The render API reads a component tree's assets from `virtual:astro:component-assets` (`vite-plugin-component-assets`):

- **Dev**: stylesheets are collected from the server environment's module graph and inlined as `<style>`. Islands, renderer client entrypoints and `<script>`s point at URLs the Vite dev server serves (root-relative, or `/@fs/` outside the root). Assets are collected again after any file change.
- **Build**: `astro()` turns on Vite's app builder (`builder: {}`). Every server environment with a build input is built first; its module graph decides the client build entries: one stylesheet entry per `.astro` component, plus every hydrated component, component script and renderer client entrypoint. The client build then emits them to its `outDir`, and their URLs are written into the server output. Stylesheets are linked (`<link rel="stylesheet">`), never inlined.

Configure the server build input on the environment, for example `environments.ssr.build.rolldownOptions.input`. `astro()` marks its plugins `sharedDuringBuild`, as the client build reads state collected by the server build.

Standalone settings that have no option yet: `scopedStyleStrategy` is `'attribute'`, the dev toolbar is off, and `build.format` is `'directory'`. Script and style inlining, `assetsPrefix`, CSP and view transitions (`<ClientRouter />`) are not supported standalone.

### Renderers

Pass renderers in `options.renderers`; there are no integrations in plugin mode. A renderer is plain data (`AstroRenderer`), with no Vite plugins: compiling the framework's files is the job of its own Vite plugin (for example `@vitejs/plugin-react`), added next to `astro()`. The order of `renderers` is the order in which they are tried.

| `AstroRenderer` field                          | What `astro()` does with it                                                                                                                                                                                                            |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`, `serverEntrypoint`, `clientEntrypoint` | Serves them in `virtual:astro:renderers`.                                                                                                                                                                                              |
| `options`                                      | Serves them in `virtual:astro:renderers`, serialized with `devalue` (plain data, `RegExp`, `Date`, `URL`, `Map`, `Set`). The runtime passes them to `check()` and `renderToStaticMarkup()` of the server entrypoint as `this.options`. |
| `optimizeDeps`                                 | `{ client?, server? }`, each `{ include?, exclude? }`: added to `optimizeDeps` of client environments, and of server environments that run the dependency optimizer (`optimizeDeps.noDiscovery: false`).                               |
| `dedupe`                                       | Added to `resolve.dedupe` of every environment.                                                                                                                                                                                        |
| `noExternal`                                   | Added to `resolve.noExternal` of every server environment (unless it is `true`).                                                                                                                                                       |
| `devHeadScript`                                | Dev only: an inline module script that must run before any component module (React's Fast Refresh preamble), with `__BASE__` replaced by Vite's `base`. The render API adds it to the `<head>` of documents (not with `partial`).      |

The dependency fields are applied in a `configEnvironment` hook with `order: 'post'`, so they see the `optimizeDeps.noDiscovery` that other plugins set.

`@vitejs/plugin-react` gives Vite's OXC plugin a JSX refresh filter that matches the ids of `.astro` scripts (`Foo.astro?astro&type=script&index=0&lang.ts`) and makes OXC parse them as JavaScript. When a framework plugin sets such a filter, `astro()` adds `.astro` ids to its exclude, so `<script lang="ts">` works with a bare `viteReact()`.

Compiled components import `@astrojs/runtime/compiler-runtime`. `astro()` resolves every `@astrojs/runtime` import from its own location and adds `@astrojs/runtime` and `@astrojs/vite-plugin-astro` to `resolve.noExternal` in server environments: compiled components, `virtual:astro:render-setup`, the render API and this package's re-exports of the runtime must share one copy of it, and a build bundles it.

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

Defined in `@astrojs/runtime`, exported from the package root and re-exported unchanged from `astro`:

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

The runtime lives in `@astrojs/runtime` (see [its API.md](../runtime/API.md#internal-modules-astrojsruntimeinternal)). The `runtime/**`, `jsx-runtime`, `core/{client-directive/default,render/slots,head-propagation,render-scope,csp,encryption,routing}`, `transitions` and `types/public` entries below, and `./compiler-runtime`, are compatibility re-exports of it: `internal/runtime/server/*` and `internal/runtime/client/*` are `@astrojs/runtime/internal/server/*` and `internal/client/*`, and the other paths are the same in both packages. Only the modules that `astro` and the packages built on this one import are re-exported; new code imports `@astrojs/runtime`. `core/errors/*` re-exports the runtime's errors and adds the helpers that need zod, Vite or YAML/TOML parsers (`errorMap`, `isAstroConfigZodError`, `trackAstroConfigZodError`, `formatYAMLParseError`, `formatTOMLError`, `isTOMLError`, `isYAMLParseError`). `core/client-directive/index.js` adds `buildClientDirectiveEntrypoint()`, which bundles with Rolldown.

| Module                                                                                         | Contents                                                                                                                                                                                                                                                                                                                     |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `runtime/server/index.js` (+ `runtime/server/**`)                                              | The render runtime: `renderComponent`, `renderPage`, `renderTemplate`, `renderSlot`, escape helpers, `createAstro`, server island rendering, `ISLAND_STYLES`, `astro-island.prebuilt.js` / `astro-island.prebuilt-dev.js` (CSP hashes). `renderEndpoint` stays in `astro` (`astro/runtime/server/index.js` re-exports both). |
| `runtime/client/{idle,load,media,only,visible}.prebuilt.js`                                    | Built-in client directive scripts.                                                                                                                                                                                                                                                                                           |
| `core/client-directive/index.js`                                                               | `getDefaultClientDirectives()`, `buildClientDirectiveEntrypoint()`.                                                                                                                                                                                                                                                          |
| `core/render/slots.js`                                                                         | `Slots` (the `Astro.slots` implementation).                                                                                                                                                                                                                                                                                  |
| `core/errors/index.js`, `errors.js`, `errors-data.js`, `userError.js`, `utils.js`              | `AstroError` and friends, `AstroErrorData` (all error definitions, including the `@docs` source for the website error reference).                                                                                                                                                                                            |
| `core/head-propagation/*.js`                                                                   | Head propagation; `boundary.js` exports `PROPAGATED_ASSET_FLAG` and `isPropagatedAssetBoundary`.                                                                                                                                                                                                                             |
| `core/render-scope/*.js`                                                                       | Prerender metadata collection; image records are generic (`RenderCollectors<TImage>`), `astro` specializes them with `SerializedStaticImage`.                                                                                                                                                                                |
| `core/csp/sources.js`                                                                          | CSP algorithms, kinds, `CspDirective`, `partitionByKind`. Zod schemas stay in `astro`.                                                                                                                                                                                                                                       |
| `core/encryption.js`                                                                           | Server island key and string encryption, `generateCspDigest`.                                                                                                                                                                                                                                                                |
| `core/routing/internal/route-errors.js`                                                        | `isRoute404`, `isRoute500`.                                                                                                                                                                                                                                                                                                  |
| `vite-plugin-astro/metadata.js`, `types.js`                                                    | `getAstroMetadata`, `createDefaultAstroMetadata`, `PluginMetadata` (the `meta.astro` Vite module info).                                                                                                                                                                                                                      |
| `vite-plugin-scripts/const.js`                                                                 | `BEFORE_HYDRATION_SCRIPT_ID`, `PAGE_SCRIPT_ID`, `PAGE_SSR_SCRIPT_ID`.                                                                                                                                                                                                                                                        |
| `vite-plugin-renderers/const.js`                                                               | `ASTRO_RENDERERS_MODULE_ID` (`virtual:astro:renderers`).                                                                                                                                                                                                                                                                     |
| `vite-plugin-head/const.js`                                                                    | `VIRTUAL_COMPONENT_METADATA` (`virtual:astro:component-metadata`).                                                                                                                                                                                                                                                           |
| `vite-plugin-css/const.js`                                                                     | Dev CSS virtual module ids.                                                                                                                                                                                                                                                                                                  |
| `transitions/*.js`, `types/public/view-transitions.js`                                         | View transition animations, events, swap functions and their types.                                                                                                                                                                                                                                                          |
| `core/compile/index.js`                                                                        | `compile()` (the `.astro` compiler wrapper), `CompileConfig`, `CompileProps` (including `internalURL` and `transitionsAnimationURL`, the ids compiled components import the runtime and transition CSS from).                                                                                                                |
| `core/vite-id.js`                                                                              | `normalizePath`, `viteID`, `wrapId`, `unwrapId`, `VALID_ID_PREFIX`, `CSS_LANGS_RE`.                                                                                                                                                                                                                                          |
| `vite-plugin-astro/index.js`                                                                   | The compile plugins (`AstroCompilePluginOptions`). `astro` passes `internalURL: 'astro/compiler-runtime'` so projects that depend only on `astro` resolve the runtime.                                                                                                                                                       |
| `vite-plugin-{scripts,head,html,hmr-reload,fileurl,load-fallback,config-alias,utils}/index.js` | The syntax-layer Vite plugins, each with narrow options instead of `AstroSettings`. `astroHeadBuildPlugin` stays in `astro`.                                                                                                                                                                                                 |
| `vite-plugin-renderers/index.js`                                                               | `virtual:astro:renderers` (`{ renderers, skipRenderers? }`). `astro` wraps it to skip renderers in builds that never render framework components.                                                                                                                                                                            |
| `vite-plugin-client-directives/index.js`                                                       | `virtual:astro:client-directives` (built-in plus custom directive scripts). Standalone only.                                                                                                                                                                                                                                 |
| `vite-plugin-component-assets/index.js`                                                        | `virtual:astro:component-assets` (see [Assets](#assets)). Standalone only.                                                                                                                                                                                                                                                   |
| `vite-plugin-render-setup/index.js`                                                            | `virtual:astro:render-setup` (registers the render config with the runtime; imported by every compiled component in server environments). Standalone only.                                                                                                                                                                   |
| `vite-plugin-css/collect.js`                                                                   | `ensureModulesLoaded`, `collectCSSWithOrder` (dev module graph walk for stylesheets, with an `isBoundary` option), `isBuildableCSSRequest`.                                                                                                                                                                                  |
| `runtime/compiler/index.js`                                                                    | The compiled-component runtime, also exported as `@astrojs/vite-plugin-astro/compiler-runtime`. `astro/compiler-runtime` re-exports `@astrojs/runtime/compiler-runtime`.                                                                                                                                                     |
