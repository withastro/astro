# `@astrojs/vite-plugin-router` API

```js
// vite.config.js
import astro from '@astrojs/vite-plugin-astro';
import router from '@astrojs/vite-plugin-router';

export default { plugins: [router({ output: 'server' }), astro()] }; // order does not matter
```

`router(options?: RouterPluginOptions): Plugin[]` validates `options` with `RouterPluginOptionsSchema` (throws on invalid input), exposes `api.astroRouter`, serves the pipeline module, the client router modules (see [Client router](#client-router)) and applies `serverOutput`. In its `configResolved` hook it calls `getAstroApi(config)`, which throws an error naming the missing plugin when `astro()` is absent.

**Status.** `router()` routes `src/pages/`, serves it with `vite` (HMR, endpoints, middleware, redirects, rewrites, 404/500 pages, server islands, `getStaticPaths()`) and builds it with `vite build` (see [Production build](#production-build)). `astro` runs on the same registry, request runtime, route table and build; what it owns itself is listed in [The `astro` CLI](#the-astro-cli).

## Options

| Option                               | Type                                                        | Default                       |
| ------------------------------------ | ----------------------------------------------------------- | ----------------------------- |
| `srcDir`                             | `string`, relative to Vite's `root`                         | `'./src'`                     |
| `output`                             | `'static' \| 'server'`                                      | `'static'`                    |
| `build.format`                       | `'file' \| 'directory' \| 'preserve'`                       | `'directory'`                 |
| `build.client` / `build.server`      | `string`, relative to Vite's `build.outDir`                 | `'./client/'` / `'./server/'` |
| `build.assets`                       | `string`                                                    | `'_astro'`                    |
| `build.serverEntry`                  | `string`                                                    | `'entry.mjs'`                 |
| `build.redirects`                    | `boolean`                                                   | `true`                        |
| `build.inlineStylesheets`            | `'always' \| 'auto' \| 'never'`                             | `'auto'`                      |
| `build.concurrency`                  | `number` (≥ 1)                                              | `1`                           |
| `redirects`                          | `Record<string, RedirectConfig>`                            | `{}`                          |
| `security.checkOrigin`               | `boolean`                                                   | `true`                        |
| `security.allowedDomains`            | `{ hostname?, protocol?, port? }[]`                         | `[]`                          |
| `security.serverIslandBodySizeLimit` | `number` (bytes)                                            | `1048576`                     |
| `serverOutput.entrypoint`            | `string \| URL`: the `index` input of the `ssr` environment | —                             |
| `serverOutput.internalFetchHeaders`  | `Record<string, string> \| () => Record<string, string>`    | —                             |

`serverOutput` is how whatever deploys the server output (a platform Vite plugin, or an `astro` adapter mapped by the CLI) sets the server entry and the headers client code adds to its internal `fetch()` calls (`virtual:astro:adapter-config/client`).

Not options, by design: `root`, `base`, `publicDir` and the dev server settings (`server.host`, `server.port`, `server.headers`, …) come from Vite; `site`, `trailingSlash` and `compressHTML` come from `api.astro.config`. `security.csp` and `security.actionBodySizeLimit` are in the `astro` schema (CSP's zod schemas live in `astro`; the body limit belongs to actions).

Schemas: `RouterPluginOptionsSchema`, `RouterBuildOptionsSchema`, `RouterSecurityOptionsSchema` (zod v4). The `astro` config schema (`core/config/schemas/{base,relative}.ts`) builds `build.*`, `redirects` and the three `security` fields above from their `.shape`. `output` keeps its own `astro` schema because it still accepts and rejects the removed `'hybrid'`. Defaults: `ROUTER_PLUGIN_DEFAULTS` from the import-free `@astrojs/vite-plugin-router/defaults` entry, spread into `ASTRO_CONFIG_DEFAULTS`.

## `api.astroRouter`

Read it with `getRouterApi(config: ResolvedConfig): RouterPluginApi`, which throws if `router()` is not in `plugins`. Call registration methods from your plugin's `configResolved` hook (default order). Registrations are dropped and re-collected every time Vite resolves the config (a build resolves it more than once); registering after the server modules were generated throws.

| Member                                         | Contract                                                                                                                                                                                                                                                                                                                                                                |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `injectRoute(route: InjectedRoute, options?)`  | Adds a route. It goes through `createRoutesList` exactly like integration-injected routes (`origin: 'external'`): same pattern parsing, priority, prerender default. `{ internal: true }` makes it an [internal route](#internal-routes).                                                                                                                               |
| `addMiddleware(entrypoint, order)`             | `entrypoint: string \| URL` exporting `onRequest`. `'pre'` runs before the user's `src/middleware`, `'post'` after. Composed into `virtual:astro:middleware`.                                                                                                                                                                                                           |
| `addFetchHandler(name, { entrypoint, order })` | Pipeline step; the module default-exports a `FetchPipelineHandler`. Duplicate `name` throws. See [Request pipeline](#request-pipeline).                                                                                                                                                                                                                                 |
| `extendManifest(key, moduleId)`                | The server manifest gets `key: () => import(moduleId)`. `key` must be declared in `SSRManifestExtensions`; duplicate keys throw.                                                                                                                                                                                                                                        |
| `extendRenderContext(key, entrypoint)`         | The module default-exports a `RenderContextExtension`; its provider value appears as `Astro[key]` and `context[key]`. `key` must be declared in `AstroGlobalExtensions` (declare it in `APIContextExtensions`, which `AstroGlobalExtensions` extends). Duplicate keys throw.                                                                                            |
| `setManifestData(key, value)`                  | Static manifest entry `manifest[key]`, serialized as JSON. `key` must be declared in `SSRManifestData` and must not collide with a built-in manifest field. Pass a function to compute the value each time the manifest is serialized (once per build; each load of the manifest module in dev). Duplicate keys throw. See [Manifest data](#manifest-data).             |
| `extendRouting(entrypoint)`                    | The module default-exports a `RoutingExtension`. See [Routing extensions](#routing-extensions).                                                                                                                                                                                                                                                                         |
| `addClientRouterInit(entrypoint)`              | Adds a browser module to `<ClientRouter />`. See [Client router](#client-router).                                                                                                                                                                                                                                                                                       |
| `addPageScript(entrypoint, { devOnly? })`      | Adds a browser module to the `<head>` of every page. See [Page scripts](#page-scripts).                                                                                                                                                                                                                                                                                 |
| `addPageExtension(extension)`                  | Makes files in `src/pages/` with `extension` (with the dot, e.g. `'.md'`) routable as pages; the module they compile to must default-export an Astro component. Repeats are ignored. `router()` routes only `.astro` files and endpoints itself; in the CLI the extension joins `settings.pageExtensions`, like an integration's `addPageExtension()`.                  |
| `onRoutesResolved(cb)`                         | `cb(routes: readonly RouteData[])` once when the dev server starts or the build starts, and in dev after each route-table change.                                                                                                                                                                                                                                       |
| `transformRoutes(fn)`                          | `fn(routes: RouteData[], context: RouteTransformContext)` each time the route table is created; edit `routes` in place or return a replacement. See [Route table transforms](#route-table-transforms).                                                                                                                                                                  |
| `onPrerenderDone(cb)`                          | `cb({ prerenderer, metadata, builder, outputDirectories })` once per production build after every static path was rendered and written, before the prerenderer is torn down; `prerenderer` is `undefined` when there was nothing to prerender. See [Build hooks](#build-hooks).                                                                                         |
| `onPrerenderPathRestored(cb)`                  | `cb({ pathname, route, metadata })` synchronously for each static path the incremental build cache skips. See [Build hooks](#build-hooks).                                                                                                                                                                                                                              |
| `onBuildDone(cb)`                              | `cb({ dir, routes, pages })` once after the production build wrote its output (after `astro:build:done` in the CLI). `dir` is the client output directory.                                                                                                                                                                                                              |
| `routes`                                       | `readonly RouteData[]`; throws before the route table is resolved.                                                                                                                                                                                                                                                                                                      |
| `config`                                       | `RouterConfig`: `astro()`'s shared config, the resolved `router()` options (`output`, `build.format`, `build.assets`, `serverOutput`, …) and the output, cache and dev server settings from Vite. Read it in `configResolved` (default order) or later; it throws before. The `astro` CLI passes a resolver built from its settings to `new RouterRegistry()`.          |
| `hasServerOutput()`                            | `true` when the project is deployed with a server: `config.serverOutput` is set (an adapter in the CLI) or a `project` route renders on demand. Injected and internal routes do not count, so a feature whose own endpoint is on demand can check it to fail early (as actions does with `ActionsWithoutServerOutputError`). Throws before the route table is resolved. |

Registrations take module entrypoints, not functions: the runtime code runs in the server environment, not in the Vite plugin process. Entrypoints (`string` specifiers or `file:` URLs) are resolved by Vite in that environment.

A runtime module that caches per-manifest state clears it in dev by subscribing to its own HMR event: the plugin sends it with `server.environments.ssr.hot.send(event)` and the module listens with `import.meta.hot?.on(event, ...)` (actions recreates its manifest memo on `astro:actions-updated`).

An injected route that is not `internal` and renders on demand (`prerender: false`) turns a static build into a server build, like an on-demand page. Register it in `configResolved`: the route table is created after every `configResolved` hook.

### Internal routes

`injectRoute(route, { internal: true })` is for framework endpoints that exist only to serve on-demand requests (the image endpoint of `@astrojs/vite-plugin-assets`, for example). An internal route:

- is rendered on demand: `route.prerender` is ignored and always `false`;
- does not take part in prerender detection, so it never turns a static build into a server build, and `astro:route:setup` does not run for it;
- is added after the route table is resolved, ahead of every other route, with `origin: 'internal'`;
- exists in dev and in builds whose output is `'server'`; static builds drop it.

`astro:routes:resolved` and `onRoutesResolved` receive it.

### Request pipeline

`handleRequest` (`astro/fetch`'s `astro()`, and every `App.render()`) runs, per request:

1. Built-in: reject over-encoded paths, trailing-slash redirect, 404 when no route matches.
2. Every render context extension, in registration order (awaited if asynchronous).
3. Built-in: redirect routes answer here.
4. `'pre'` fetch handlers, in registration order, outermost first.
5. Built-in: middleware (registered `'pre'` middleware, `src/middleware`, registered `'post'` middleware).
6. `'post'` fetch handlers, in registration order.
7. Built-in: route dispatch (page, endpoint, fallback).
8. Built-in: finalize providers, reroute empty 404/500 responses to the error pages.

Error pages are rendered with every render context extension applied, and without the fetch handlers.

A custom `src/fetch.ts` composes the pipeline itself. After its first request, `App` warns once for each registered fetch handler (by `name`) and each built-in step (`redirects`, `middleware`) the project needs but the handler did not run. A step is "run" when it calls `markHandlerUsed(manifest, name)` (`core/fetch/features.ts`); `handleRequest` marks every step. Name your handler after the `astro/fetch`-style function users call to run it.

### Runtime module contracts

```ts
type FetchPipelineHandler = (
  state: RequestState,
  next: (state: RequestState) => Promise<Response>,
) => Promise<Response>;

type RenderContextExtension<T = any> = (
  state: RequestState,
) => ContextProvider<T> | undefined | Promise<ContextProvider<T> | undefined>;

interface ContextProvider<T> {
  create: () => T; // lazy: first access of Astro[key] / context[key], once per request
  finalize?: (value: T) => Promise<void> | void; // after the response, only if created
}
```

- A handler may return without calling `next` to short-circuit.
- An extension returning `undefined` leaves the key unset: `Astro[key]` reads `undefined`.
- Extensions are applied before any fetch handler runs, so handlers can read provided values with `state.resolve(key)`. Where the pipeline did not apply them (a custom `src/fetch.ts`), reading `Astro[key]` reads `undefined` for registered keys.
- `RequestState` is this package's `FetchState` (`core/fetch/fetch-state.ts`). Members a feature may use: `request`, `url`, `pathname`, `routeData`, `params`, `locals`, `cookies`, `manifest`, `logger`, `status`, `statusText`, `skipMiddleware`, `getAPIContext()`, `getActionAPIContext()`, `provide()`, `resolve()`.

The server runtime loads the registrations through `manifest.pipeline` (`virtual:astro:pipeline`, a `PipelineModule` of `fetchHandlers` and `renderContextExtensions`). A hand-built manifest without `pipeline` runs only the built-in steps.

### Worked example: a feature package

A `greeting` feature that adds `Astro.greeting`, a `Greeting` response header, and loads its configuration from a manifest module. (The `astro` test fixture `test/fixtures/router-api` is this example, end to end.)

```ts
// my-feature/src/plugin.ts
import { getRouterApi } from '@astrojs/vite-plugin-router';
import type { Plugin } from 'vite';

const CONFIG_ID = 'virtual:my-feature/config';

export default function greeting(options: { salutation: string }): Plugin {
  return {
    name: 'my-feature',
    configResolved(config) {
      const api = getRouterApi(config);
      api.extendManifest('greetingConfig', CONFIG_ID);
      api.extendRenderContext('greeting', new URL('./runtime/context.js', import.meta.url));
      api.addFetchHandler('greeting', {
        entrypoint: new URL('./runtime/handler.js', import.meta.url),
        order: 'pre',
      });
    },
    resolveId(id) {
      if (id === CONFIG_ID) return '\0' + CONFIG_ID;
    },
    load(id) {
      if (id === '\0' + CONFIG_ID) return `export default ${JSON.stringify(options)};`;
    },
  };
}
```

```ts
// my-feature/src/types.ts: declare every key before registering it
declare module '@astrojs/vite-plugin-router' {
  interface SSRManifestExtensions {
    greetingConfig: { default: { salutation: string } };
  }
  interface APIContextExtensions<
    Props extends Record<string, any>,
    Params extends Record<string, string | undefined>,
  > {
    greeting: string;
  }
}
```

```ts
// my-feature/src/runtime/context.ts
import type { RenderContextExtension } from '@astrojs/vite-plugin-router';

const greeting: RenderContextExtension<string> = async (state) => {
  const { default: config } = await state.manifest.greetingConfig!();
  return { create: () => `${config.salutation}, ${state.pathname}` };
};
export default greeting;
```

```ts
// my-feature/src/runtime/handler.ts
import type { FetchPipelineHandler } from '@astrojs/vite-plugin-router';

const handler: FetchPipelineHandler = async (state, next) => {
  const response = await next(state);
  response.headers.set('Greeting', state.resolve<string>('greeting') ?? '');
  return response;
};
export default handler;
```

### How `astro` registers its features

`packages/astro/src/core/router-registrations.ts` registers Astro's own features exactly like the example:

| Feature                  | Registrations                                                                                                                                                                                                                                                              |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| sessions                 | `setManifestData('sessionConfig')`, `extendRenderContext('session')` (always; warns on access when no storage is configured), `extendManifest('sessionDriver')`, `addFetchHandler('sessions', pre)` when a driver is set                                                   |
| cache                    | `setManifestData('cacheConfig')`, `extendRenderContext('cache')` (always; disabled/no-op caches), and with a provider `extendManifest('cacheProvider')` + `addFetchHandler('cache', pre)`                                                                                  |
| i18n                     | `setManifestData('i18n')` (always; `undefined` without i18n), `extendRouting()` (domain routing, `/<locale>/404` pages), `extendRenderContext('currentLocale' \| 'preferredLocale' \| 'preferredLocaleList')`, `addFetchHandler('i18n', pre)` unless routing is `'manual'` |
| actions                  | `setManifestData('actionBodySizeLimit')`, `extendRenderContext('getActionResult' \| 'callAction')`, `extendManifest('actions')`, `addFetchHandler('actions', post)`                                                                                                        |
| assets                   | `setManifestData('image')`, `onPrerenderDone()` (collects the recorded images and `prerenderer.collectStaticImages()`, builds the build image service, generates the optimized images), `onPrerenderPathRestored()` (replays `staticImages`/`referencedImages`)            |
| prefetch                 | `addClientRouterInit()` with the prefetch init module unless `prefetch` is `false`                                                                                                                                                                                         |
| integration middleware   | `addMiddleware(entrypoint, 'pre' \| 'post')` for each `addMiddleware()` call of an integration                                                                                                                                                                             |
| integration page scripts | `addPageScript('astro:scripts/page.js')` when an integration called `injectScript('page', …)`                                                                                                                                                                              |

Registration order fixes the nesting: sessions, cache, i18n, user middleware, actions. A failed action sets the page status through `state.status`/`state.statusText`. The `getActionResult` extension also provides an `actionResult` value (`state.provide('actionResult', …)`) that `FetchState` copies to `SSRResult.actionResult`, where renderers (`@astrojs/react`'s form state) read it.

## Manifest data

`setManifestData()` puts static configuration in the server manifest without a lazy module. Declare the key first:

```ts
declare module '@astrojs/vite-plugin-router' {
  interface SSRManifestData {
    greetingWord: string;
  }
}
```

`SSRManifestDataFields` maps the interface to optional manifest fields (`astro`'s `SSRManifest` includes them), so runtime code reads `state.manifest.greetingWord` and handles `undefined` (hand-built manifests, or the feature not registered). The entries are part of the serialized manifest, including the one `astro:build:ssr` receives.

Built-in fields a feature may read instead of registering its own: `manifest.runtimeMode` (`'development'` in the dev server, `'production'` in builds and in the built server), `serverLike`, `base`, `trailingSlash`, `buildFormat`.

## Route table transforms

`transformRoutes(fn)` adds a step to route table creation (`createRoutesList`), for features whose routes depend on the rest of the table (`astro`'s i18n fallback routes). Each transform runs every time the table is created (at startup, at build start, and in dev after each change under `srcDir`), in registration order:

- after the file-based, injected (`injectRoute()` and integrations) and redirect routes are collected, sorted by priority, and their `prerender` option is read, so routes a transform derives from them can copy `prerender`;
- before the internal routes (the dev `404` page, the image endpoint, the server islands route) are added, the `astro:routes:resolved` integration hook runs and `onRoutesResolved` callbacks run.

`fn` receives the mutable route array and a `RouteTransformContext` (`base` and `trailingSlash`, to build `RouteData.pattern` with `getPattern` from `_internal/core/routing/pattern.js`, `root`, `srcDir`). It may change the array in place or return a new one, and may throw to reject the table (the error surfaces where the table is created: dev startup, a dev route change, or the build). It runs in the Vite plugin process, so it is a function rather than an entrypoint.

The CLI builds a first route table before Vite resolves its config, without registrations; when transforms (or `injectRoute()` routes) are registered, the table is rebuilt in `configResolved`, so `astro:routes:resolved` runs once more with the final table.

## Routing extensions

`extendRouting(entrypoint)` adds a module whose default export is a `RoutingExtension`. The manifest module imports it statically (`manifest.routing`), because route matching is synchronous. Every member is optional and synchronous; each receives the server manifest as `manifest`:

- `resolvePathname({ manifest, request, url, pathname, logger })`: the pathname to match routes against instead of the URL's (after `base` is removed), or `undefined`. Used for every request (dev and production), by `App.match()` (with `pathname: undefined`), and as `FetchState.pathname`.
- `getErrorRoute({ manifest, pathname, status })`: the error page route for a pathname (`/es/404`), or `undefined` for `/404`/`/500`. Ignored when the route does not exist.
- `isErrorRoute({ manifest, route, status })`: whether `route` renders with status `404`/`500` besides `/404` and `/500`.

With several extensions, the first non-`undefined` `resolvePathname`/`getErrorRoute` result wins, and a route is an error page when any `isErrorRoute` returns `true`. `astro`'s i18n registers `core/i18n/routing-extension.ts`.

## Production build

With `router()`, `vite build` uses Vite's app builder (`router()` sets `builder.sharedConfigBuild: true`, so every environment shares one set of plugin instances). Its `buildApp` hook builds three environments in order, then writes the prerendered paths:

1. `prerender`: the routes rendered at build time, imported from Node to render them.
2. `ssr`: only when a route renders on demand (a page or endpoint with `prerender = false`, or a non-internal injected one).
3. `client`: hydrated components, page scripts and `public/`.

| Output                          | Static build   | With an on-demand route                                        |
| ------------------------------- | -------------- | -------------------------------------------------------------- |
| Prerendered pages, client files | `build.outDir` | `build.client`                                                 |
| Server entry                    | —              | `build.server` + `build.serverEntry` (`dist/server/entry.mjs`) |

The server entry is `serverOutput.entrypoint` when set. Otherwise it default-exports the server app of `@astrojs/vite-plugin-router/app`, `{ fetch, match }` (see [Composing with another server](#composing-with-another-server)); prerendered files are served by whatever serves `build.client`. `onPrerenderDone` and `onBuildDone` run as in the CLI. Custom client directives of `astro()` are not in the manifest, and `build.rolldownOptions.output` file names are replaced by the build's own.

### Composing with another server

`@astrojs/vite-plugin-router/app` is the server app of the project, bound to its manifest, route table, middleware and fetch handlers. It is the production app in a build and the dev app (`virtual:astro:app`) when Vite serves:

| Export                                       | Behavior                                                                                                                                                                                                          |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fetch(request: Request): Promise<Response>` | Renders `request` with the routes `match()` accepts. A request no route matches gets the 404 page.                                                                                                                |
| `match(request: Request): boolean`           | `true` when `request` matches a page, endpoint or redirect, using the route table, `base` and the routing extensions. It renders nothing, and fetch handlers that answer paths without a route are not consulted. |
| default                                      | `{ fetch, match }`                                                                                                                                                                                                |

In a build, prerendered routes are not matched: they are files in `build.client`, so the host serves its static files before it calls the server entry. When Vite serves, they match and render, and the route table follows the pages added and removed. To put Astro's routes next to another server in one Vite project, set `serverOutput.entrypoint` to a module that imports the app and hands requests over:

```ts
// src/server.ts, with router({ serverOutput: { entrypoint: 'src/server.ts' } })
import astro from '@astrojs/vite-plugin-router/app';
import other from './other-server.js';

export default {
  fetch(request: Request) {
    if (astro.match(request)) return astro.fetch(request);
    return other.fetch(request);
  },
};
```

The module is part of the `ssr` build, so it can import virtual modules. In `vite dev`, `router()` serves the routes itself when the `ssr` environment is runnable; a plugin that runs the entry in another runtime (`@cloudflare/vite-plugin` in workerd) gets the dev app.

The `astro` CLI runs the same build (`core/build/static-build.ts`) with a `BuildHost` built from its settings: integration hooks, adapter features, CSP, content assets and the incremental build cache.

## Build hooks

- `onPrerenderDone(({ prerenderer, metadata, builder, outputDirectories }) => …)`: runs once per production build at the end of static generation, after every path was written and before `prerenderer.teardown()`, so callbacks can read from the prerenderer (its runtime is still up). `prerenderer` is a `Prerenderer` (in the CLI an `AstroPrerenderer`: the adapter's, or the default one), `undefined` when the build prerenders nothing. `metadata` lists the `PrerenderPathMetadata` recorded while prerendering: by each rendered path, by `getStaticPaths()` and outside of any render (paths restored from the incremental cache go to `onPrerenderPathRestored()`). `builder` is the build's `ViteBuilder`, for features that build an extra environment, and `outputDirectories` the client, server and prerender directories Vite resolved. Errors propagate and fail the build; the prerenderer is torn down either way. `astro`'s image generation runs here.
- `onPrerenderPathRestored(({ pathname, route, metadata }) => …)`: runs for each path the incremental build cache skips, with the `PrerenderPathMetadata` the path recorded in the previous build (`Partial`). Replay what rendering the path would have registered. `astro` declares `staticImages` and `referencedImages`; the incremental cache records them from the prerenderer's `PrerenderRenderMetadata`.

## Page scripts

`addPageScript(entrypoint: string | URL, options?: { devOnly?: boolean })` adds a `<script type="module">` for `entrypoint` to the `<head>` of every page, in registration order. Entrypoints are resolved by Vite in the client environment.

- **Dev**: every registration is rendered as `<script type="module" src="/@id/<specifier>">` (`getDevPageScriptSrc()`; a `file:` URL becomes its absolute path). In a runnable server environment only on pages (not endpoints); in a non-runnable one (Cloudflare's workerd) through the route's `scripts` in the dev manifest.
- **Build**: registrations without `devOnly` are client build inputs; every page links the built chunks. `devOnly: true` scripts are never built.

`vite-plugin-app/environment.ts`, `vite-plugin-routes`, `core/build/{static-build,environment}.ts` and `core/build/plugins/plugin-manifest.ts` render them from `RouterRegistry.getPageScripts(command)`. Integration `injectScript('page', …)` scripts reach the page through this API: `astro` registers the `astro:scripts/page.js` module that bundles them. `head-inline` scripts are not page scripts and stay in `astro`.

## Client router

`<ClientRouter />` (`@astrojs/vite-plugin-router/components/ClientRouter.astro`) and the client router it drives (`navigate`, `supportsViewTransitions`, `transitionEnabledOnThisPage`) live here: client-side navigation is routing, and the router adds `serverOutput.internalFetchHeaders` (`virtual:astro:adapter-config/client`) to its page fetches. The animations, swap functions and transition events it uses come from `@astrojs/runtime`. `router()` serves:

- `astro:transitions`: the transitions API (`fade`, `slide`, …) and `ClientRouter`.
- `astro:transitions/client`: the router, the transition events, `swapFunctions` and the types.
- `virtual:astro:client-router-init`: the default export is the array of functions registered with `addClientRouterInit()`.

`addClientRouterInit(entrypoint: string | URL)` adds a module whose default export is a function with no parameters. `<ClientRouter />` imports `virtual:astro:client-router-init` and calls every function once, in registration order, after it has installed its link and form listeners, on pages where client-side navigation is active (the browser supports view transitions, or `fallback` is not `'none'`). Entrypoints are resolved by Vite in the client environment. A feature uses it to hook into client-side navigation without `router()` depending on it. `astro` registers `astro/dist/prefetch/client-router-init.js` (`init({ prefetchAll: true })`) unless `prefetch` is `false`.

`routerApiPlugins(registry, transitionsModuleIds?)` takes the specifiers `astro:transitions` and `astro:transitions/client` re-export from. They are resolved from the project root, so the defaults (this package's and `@astrojs/runtime`'s ids) need those packages to be resolvable there. The `astro` CLI passes its `astro/virtual-modules/transitions*.js` re-exports and `astro/components/ClientRouter.astro` (a wrapper that renders this package's component), because projects that depend only on `astro` cannot resolve this package under strict pnpm.

## Type seams

- `SSRManifestData`: `{ [manifestKey]: JSON value }`, see [Manifest data](#manifest-data).
- `PrerenderPathMetadata`: per-path incremental build data, see [Build hooks](#build-hooks).
- `SSRManifestExtensions`: `{ [manifestKey]: ModuleNamespaceType }`. `SSRManifestExtensionFields` maps it to the optional manifest loaders; `astro`'s `SSRManifest` is its base fields `& SSRManifestExtensionFields & SSRManifestDataFields`.
- `APIContextExtensions<Props, Params>`: feature members of `APIContext`. `APIContext` (here) extends it, and this package merges `AstroGlobalExtensions extends APIContext` plus `response` into `@astrojs/vite-plugin-astro`, so a key declared once appears on both `context` and `Astro`.
- `Prerenderer<TImage>`, `PrerenderResult<TImage>`, `PrerenderRenderMetadata<TImage>`, `StaticPathsResult<TImage>`, `StaticPathsMetadata<TImage>`, `PathWithRoute`: the prerenderer contract. `TImage` is the type of the optimized-image transforms a page resolved; `astro`'s `AstroPrerenderer` is `Prerenderer<SerializedStaticImage>` plus `collectStaticImages()`.

`astro` declares `actions`, `sessionDriver` and `cacheProvider` in `SSRManifestExtensions`, and `session`, `cache`, `currentLocale`, `preferredLocale`, `preferredLocaleList`, `getActionResult`, `callAction` in `APIContextExtensions` (`core/app/types.ts`, `types/public/context.ts`).

## Exports

`@astrojs/vite-plugin-router/app`: `fetch`, `match` and the default `{ fetch, match }` of [Composing with another server](#composing-with-another-server); import it only from server code that Vite processes with `router()`.

Root (and re-exported unchanged from `astro`): `RouteData`, `RoutePart`, `RouteType`, `RedirectConfig`, `ValidRedirectStatus`, `InjectedRoute`, `APIContext`, `APIContextExtensions`, `AstroRuntimeLogger`, `RewritePayload`. Also: the options and schemas above, `getRouterApi`, `RouterPluginApi`, `InjectRouteOptions`, `FetchHandlerDefinition`, `PageScriptOptions`, `RouteTransform`, `RouteTransformContext`, `BuildDoneResult`, `ServerOutputOptions`, the runtime contracts (`FetchPipelineHandler`, `RenderContextExtension`, `ContextProvider`, `RegisteredFetchHandler`, `RegisteredRenderContextExtension`, `PipelineModule`, `RequestState`) and the seams.

`components/ClientRouter.astro` is exported as `@astrojs/vite-plugin-router/components/*`.

## Internal modules (`@astrojs/vite-plugin-router/_internal/*`)

`./_internal/*` maps to `./dist/internal/*`: the modules under `src/internal/`, which other packages of the Astro monorepo import (`astro` and its tests). It has no stability guarantee. Import with the `.js` path of the source file under `src/internal/`. Among them: `registry.js` (`RouterRegistry`, `getRouterRegistry`, `getDevPageScriptSrc`), `plugin.js` (`routerApiPlugins`), `environments.js`, `vite-plugin-server-output/`, and the modules that came from `astro/src`, under the paths they had there (`core/app/`, `core/build/`, `core/cookies/`, `core/fetch/`, `core/middleware/`, `core/render/`, `core/routing/`, `vite-plugin-astro-server/`, `vite-plugin-app/`, `transitions/router.js`, …).

## The `astro` CLI

- CLI orchestration: `core/build/index.ts` (`AstroBuilder`) and `core/dev/{dev,container,restart,update-check}.ts`.
- Settings adapters, which map `AstroSettings` and integrations onto what this package takes: `core/router-config.ts` (`RouterConfig`), `core/router-registrations.ts`, `core/routing/create-manifest.ts` (integration routes, the image endpoint, i18n), `manifest/serialized.ts` (manifest host fields), `core/build/host.ts` (`BuildHost`), `core/build/plugins/plugin-ssr.ts` (legacy adapter entry), `core/build/plugins/plugin-incremental.ts` and `core/build/{config-hash,lockfile,incremental-metadata.ts}`, `prerender/utils.ts` (output directories from settings).
- Astro features registered through the API: i18n, actions, sessions, cache, CSP (`core/csp`), the dev toolbar, prefetch, content and assets.
- `vite-plugin-environment`: dependency handling for the `astro` package and its integrations (`dedupe`/`noExternal` of `astro`, the dev toolbar's `optimizeDeps`, `vitefu`'s framework package crawl) and the compiler-based `.astro` dependency scan.
