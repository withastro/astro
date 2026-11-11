import { getAstroApi } from '@astrojs/vite-plugin-astro';
import type { AstroGlobalExtensions } from '@astrojs/vite-plugin-astro';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Plugin, ResolvedConfig } from 'vite';
import type { RouterConfig } from '../config.js';
import {
	type RouterPluginOptions,
	RouterPluginOptionsSchema,
	type ResolvedRouterPluginOptions,
} from '../options.js';
import { pipelineModulePlugin } from '../pipeline-module.js';
import { clientRouterInitPlugin } from '../transitions/client-router-init.js';
import {
	type TransitionsModuleIds,
	vitePluginTransitions,
} from '../transitions/vite-plugin-transitions.js';
import { RouterRegistry } from './registry.js';
import { standalonePlugins } from '../standalone.js';
import { vitePluginServerOutput } from './vite-plugin-server-output/index.js';
import type {
	InjectedRoute,
	PrerenderDoneContext,
	PrerenderPathRestoredContext,
	RouteData,
	RouteTransform,
	SSRManifestData,
	SSRManifestExtensions,
} from '../types.js';

/**
 * A fetch handler registered with `RouterPluginApi.addFetchHandler()`.
 */
export interface FetchHandlerDefinition {
	/**
	 * Module whose default export is a `FetchPipelineHandler`. Bare specifiers and relative paths
	 * are resolved by Vite in the server environment.
	 */
	entrypoint: string | URL;
	/**
	 * Position relative to user middleware:
	 * - `'pre'`: wraps user middleware and route dispatch.
	 * - `'post'`: runs after user middleware, right before route dispatch.
	 */
	order: 'pre' | 'post';
}

/**
 * Options of `RouterPluginApi.injectRoute()`.
 */
export interface InjectRouteOptions {
	/**
	 * Marks the route as framework-internal (an image or server island endpoint, for example). An
	 * internal route:
	 * - is rendered on demand: its `prerender` is ignored and always `false`;
	 * - does not take part in prerender detection: it never turns the build output into a server
	 *   output, and `astro:route:setup` does not run for it;
	 * - is added after the route table is resolved, ahead of every other route, with
	 *   `origin: 'internal'`;
	 * - exists in dev, and in builds whose output is `'server'`. Static builds drop it.
	 *
	 * @default false
	 */
	internal?: boolean;
}

/**
 * Passed to `RouterPluginApi.onBuildDone()` callbacks.
 */
export interface BuildDoneResult {
	/** Directory of the client build output, with a trailing slash. */
	dir: URL;
	/** The final route table. */
	routes: readonly RouteData[];
	/** Pathnames of the prerendered pages. */
	pages: readonly { pathname: string }[];
}

/** Options of `RouterPluginApi.addPageScript()`. */
export interface PageScriptOptions {
	/** Add the script only to pages the dev server renders. Defaults to `false`. */
	devOnly?: boolean;
}

/**
 * The API exposed by `router()` as `plugin.api.astroRouter`. Read it with `getRouterApi()`.
 *
 * Registration methods (`injectRoute`, `addMiddleware`, `addFetchHandler`, `extendManifest`,
 * `extendRenderContext`, `setManifestData`, `extendRouting`, `addClientRouterInit`,
 * `addPageScript`, `addPageExtension`, `transformRoutes`, and the `on*` callbacks) must be
 * called from a `configResolved` hook.
 */
export interface RouterPluginApi {
	/**
	 * Adds a route to the route table. Injected routes go through the same pipeline as routes
	 * created from files in `src/pages/`, unless `options.internal` is set (see
	 * `InjectRouteOptions`).
	 */
	injectRoute(route: InjectedRoute, options?: InjectRouteOptions): void;
	/**
	 * Adds a middleware module whose `onRequest` export runs with the user's middleware.
	 *
	 * @param entrypoint Module exporting `onRequest`. Resolved by Vite in the server environment.
	 * @param order `'pre'` runs before the user's middleware, `'post'` after.
	 */
	addMiddleware(entrypoint: string | URL, order: 'pre' | 'post'): void;
	/**
	 * Adds a step to the server request pipeline.
	 *
	 * @param name Unique handler name. Registering the same name twice throws. A custom
	 *   `src/fetch.ts` that does not run a registered handler triggers a warning naming it.
	 */
	addFetchHandler(name: string, handler: FetchHandlerDefinition): void;
	/**
	 * Adds a lazily-loaded entry to the server manifest, exposed as
	 * `manifest[key]: () => Promise<Module>`. `key` must be declared in `SSRManifestExtensions`.
	 *
	 * @param moduleId Module to load. Resolved by Vite in the server environment.
	 */
	extendManifest<K extends keyof SSRManifestExtensions>(key: K, moduleId: string): void;
	/**
	 * Adds a static entry to the server manifest, exposed as `manifest[key]`. `key` must be
	 * declared in `SSRManifestData` and must not be one of the manifest's built-in fields.
	 *
	 * @param value Serialized into the manifest as JSON: it must survive `JSON.stringify`. Pass a
	 *   function to compute it each time the manifest is serialized (once per build, and on each
	 *   load of the manifest module in dev).
	 */
	setManifestData<K extends keyof SSRManifestData>(
		key: K,
		value: SSRManifestData[K] | (() => SSRManifestData[K]),
	): void;
	/**
	 * Adds a module that adjusts route matching (the pathname to match, localized error pages).
	 *
	 * @param entrypoint Module whose default export is a `RoutingExtension`. Resolved by Vite in
	 *   the server environment and imported statically by the manifest.
	 */
	extendRouting(entrypoint: string | URL): void;
	/**
	 * Adds a lazily-created value to the `Astro` global and to the endpoint context, as
	 * `Astro[key]` and `context[key]`. `key` must be declared in `AstroGlobalExtensions`.
	 *
	 * @param entrypoint Module whose default export is a `RenderContextExtension`. Resolved by Vite
	 *   in the server environment.
	 */
	extendRenderContext<K extends keyof AstroGlobalExtensions>(
		key: K,
		entrypoint: string | URL,
	): void;
	/**
	 * Adds a module that `<ClientRouter />` runs in the browser once it has installed its
	 * navigation listeners (only on pages where client-side navigation is active).
	 *
	 * @param entrypoint Module whose default export is a function with no parameters. Resolved by
	 *   Vite in the client environment.
	 */
	addClientRouterInit(entrypoint: string | URL): void;
	/**
	 * Makes files in `src/pages/` with this extension (for example `'.md'`, with the dot) routable
	 * as pages. The module the file compiles to must default-export an Astro component. Adding an
	 * extension twice has no effect.
	 */
	addPageExtension(extension: string): void;
	/**
	 * Adds a `<script type="module">` for `entrypoint` to the `<head>` of every page, in
	 * registration order. In a build, each entrypoint is a client build input.
	 *
	 * @param entrypoint Module to load in the browser. Resolved by Vite in the client environment.
	 */
	addPageScript(entrypoint: string | URL, options?: PageScriptOptions): void;
	/**
	 * Calls `callback` with the route table whenever it is resolved: once at build start, and in
	 * dev after every change to the route table.
	 */
	onRoutesResolved(callback: (routes: readonly RouteData[]) => void | Promise<void>): void;
	/**
	 * Adds a step to the creation of the route table, which runs every time the table is created:
	 * after the file-based, injected and redirect routes are collected and their `prerender` option
	 * is read, and before the built-in internal routes (the dev 404 page, the image endpoint, the
	 * server islands route) are added and `onRoutesResolved` callbacks run. Transforms run in
	 * registration order.
	 */
	transformRoutes(transform: RouteTransform): void;
	/**
	 * Calls `callback` once after the production build has written all output.
	 */
	onBuildDone(callback: (result: BuildDoneResult) => void | Promise<void>): void;
	/**
	 * Calls `callback` once per production build after every static path was rendered and
	 * written, before the prerenderer is torn down. Also called when the build has no paths to
	 * prerender.
	 */
	onPrerenderDone(callback: (context: PrerenderDoneContext) => void | Promise<void>): void;
	/**
	 * Calls `callback` for each static path the incremental build cache skips, with the metadata
	 * the path recorded in the previous build, so a feature can replay what rendering it would
	 * have registered.
	 */
	onPrerenderPathRestored(callback: (context: PrerenderPathRestoredContext) => void): void;
	/**
	 * The current route table.
	 *
	 * @throws {Error} When read before the route table is resolved.
	 */
	readonly routes: readonly RouteData[];
	/**
	 * The resolved project configuration: `astro()`'s shared config, the resolved `router()` options
	 * (`output`, `build.format`, `build.assets`, …) and the directories that come from Vite.
	 *
	 * @throws {Error} When read before Vite resolved its config (read it in `configResolved` or later).
	 */
	readonly config: RouterConfig;
	/**
	 * Whether the project is deployed with a server: `serverOutput` is set (an adapter in the
	 * `astro` CLI), or a route of the project renders on demand. Features that need a server at
	 * runtime check it to fail early.
	 *
	 * @throws {Error} When called before the route table is resolved.
	 */
	hasServerOutput(): boolean;
}

const PLUGIN_NAME = '@astrojs/vite-plugin-router';

/**
 * The plugin that exposes `registry.api` as `api.astroRouter`, plus the plugins that turn
 * registrations into server modules. `router()` includes it; the `astro` CLI composes it directly.
 */
export function routerApiPlugins(
	registry: RouterRegistry,
	transitionsModuleIds?: Partial<TransitionsModuleIds>,
): Plugin[] {
	return [
		{
			name: PLUGIN_NAME,
			api: { astroRouter: registry.api },
			configResolved: {
				order: 'pre',
				handler(config) {
					registry.reset(config);
				},
			},
		},
		pipelineModulePlugin(registry),
		clientRouterInitPlugin(registry),
		vitePluginTransitions(transitionsModuleIds),
	];
}

/**
 * Serves and builds the pages in `src/pages/`. Requires `astro()` from
 * `@astrojs/vite-plugin-astro`, in any position of Vite's `plugins`.
 */
export default function router(options: RouterPluginOptions = {}): Plugin[] {
	const resolved = RouterPluginOptionsSchema.parse(options);
	const registry = new RouterRegistry((config) => resolveRouterConfig(resolved, config));
	return [
		...routerApiPlugins(registry),
		vitePluginServerOutput(() => options.serverOutput),
		...standalonePlugins(registry),
		{
			name: `${PLUGIN_NAME}:requires-astro`,
			configResolved(config) {
				getAstroApi(config);
			},
		},
	];
}

function dirUrl(path: string): URL {
	return pathToFileURL(path.endsWith('/') ? path : `${path}/`);
}

function resolveRouterConfig(
	options: ResolvedRouterPluginOptions,
	config: ResolvedConfig,
): RouterConfig {
	const outDir = dirUrl(resolve(config.root, config.build.outDir));
	return {
		...getAstroApi(config).config,
		...options,
		srcDir: dirUrl(resolve(config.root, options.srcDir)),
		build: {
			...options.build,
			client: new URL(options.build.client, outDir),
			server: new URL(options.build.server, outDir),
			assetsPrefix: undefined,
		},
		outDir,
		cacheDir: dirUrl(config.cacheDir),
		pageExtensions: [],
		serverHeaders: config.server.headers,
	};
}

/**
 * Returns the API of the `router()` plugin registered in `config`.
 *
 * @throws {Error} When `router()` is not in Vite's `plugins`.
 */
export function getRouterApi(config: ResolvedConfig): RouterPluginApi {
	const api = config.plugins.find((plugin) => plugin.name === PLUGIN_NAME)?.api?.astroRouter;
	if (!api) {
		throw new Error(`\`router()\` from ${PLUGIN_NAME} is missing from the Vite \`plugins\` array.`);
	}
	return api;
}
