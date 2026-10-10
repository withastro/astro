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
- Seams: `SSRResult`, `SSRResultExtensions`, `AstroGlobal`, `AstroGlobalExtensions`, `RenderRuntimeTypes`

Users augmenting `AstroClientDirectives` through `declare module 'astro'` keep working: TypeScript follows the re-export.

## Type seam

`SSRResult` and `AstroGlobal` declare only component-language members. Everything else is added by declaration merging.

| Type                               | Declares                                                                                                                                                                                                      | Extension interface                    |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `SSRResult`                        | `cancelled`, `base`, `userAssetsBase`, `styles`, `scripts`, `links`, `componentMetadata`, `inlinedScripts`, `createAstro`, `resolve`, `renderers`, `clientDirectives`, `compressHTML`, `partial`, `_metadata` | `SSRResultExtensions`                  |
| `AstroGlobal<Props, Self, Params>` | `props`, `self`, `slots`                                                                                                                                                                                      | `AstroGlobalExtensions<Props, Params>` |

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
- `SSRResultExtensions` adds `params`, `request`, `response`, `actionResult`, `pathname`, `cookies`, `getServerIslandNameMap`, `trailingSlash`, `key`, all CSP fields, `speculationRulesContent`, `internalFetchHeaders` (`types/public/internal.ts`).

`RenderRuntimeTypes` is a registry for render-runtime classes still implemented in `astro`. Unregistered keys resolve to `unknown`. `astro` registers (`types/public/internal.ts`):

| Key                  | Type                                                 | Used by                    |
| -------------------- | ---------------------------------------------------- | -------------------------- |
| `factoryReturnValue` | `RenderTemplateResult \| HeadAndContent \| ThinHead` | `AstroFactoryReturnValue`  |
| `headPropagator`     | `AstroComponentInstance \| ServerIslandComponent`    | `SSRMetadata.propagators`  |
| `slots`              | `Slots`                                              | `SSRMetadata.slotsByAstro` |

When those classes move into this package, reference them directly and delete the registry entries.
