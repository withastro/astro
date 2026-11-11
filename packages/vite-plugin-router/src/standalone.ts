import { fileURLToPath } from 'node:url';
import { type AstroRenderer, getAstroApi } from '@astrojs/vite-plugin-astro';
import type { Plugin } from 'vite';
import { createRoutesList } from './internal/core/routing/create-manifest.js';
import { AstroLogger } from './internal/core/logger/core.js';
import consoleLogger from './internal/core/logger/impls/console.js';
import { vitePluginFetchable } from './internal/core/fetch/vite-plugin.js';
import {
	vitePluginMiddleware,
	MIDDLEWARE_MODULE_ID,
} from './internal/core/middleware/vite-plugin.js';
import { ServerIslandsState } from './internal/core/server-islands/shared-state.js';
import {
	SERVER_ISLAND_MANIFEST,
	vitePluginServerIslands,
} from './internal/core/server-islands/vite-plugin-server-islands.js';
import { serializedManifestPlugin } from './internal/manifest/serialized.js';
import type { RouterPluginCli } from './internal/cli.js';
import type { RouterRegistry } from './internal/registry.js';
import type { RoutesList } from './routing.js';
import { standaloneBuildPlugins } from './standalone-build.js';
import type { RouteData } from './types.js';
import { vitePluginServerApp } from './internal/vite-plugin-app/server-app.js';
import { vitePluginApp } from './internal/vite-plugin-app/virtual-app.js';
import createVitePluginAstroServer from './internal/vite-plugin-astro-server/plugin.js';
import { astroDevCssPlugin } from './internal/vite-plugin-css/index.js';
import { vitePluginAstroServerClient } from './internal/vite-plugin-overlay/index.js';
import { pluginPage, pluginPages } from './internal/vite-plugin-pages/index.js';
import astroPluginRoutes from './internal/vite-plugin-routes/index.js';
import vitePluginStaticPaths from './internal/vite-plugin-static-paths/index.js';

const PACKAGE_NAME = '@astrojs/vite-plugin-router';

/**
 * The plugins `router()` adds besides the API plugins: route table, page and manifest modules,
 * middleware, server islands, the dev server and the production build.
 *
 * With `cli` (the `astro` CLI), the plugins use the CLI's route table and host data in place of
 * the defaults of a plain Vite project, the dev server plugins are added only for
 * `command: 'dev'`, and the production build plugins are left out: `astro build` drives the build.
 */
export function standalonePlugins(registry: RouterRegistry, cli?: RouterPluginCli): Plugin[] {
	const logger = cli?.logger ?? new AstroLogger({ destination: consoleLogger(), level: 'info' });
	const routesList: RoutesList = cli?.routesList ?? { routes: [] };
	let buildOutput: 'static' | 'server' = 'static';
	let dev = true;
	// Filled from `astro()` once Vite resolved its config.
	const renderers: AstroRenderer[] = [];

	function routeOf(file: URL): RouteData | undefined {
		const path = fileURLToPath(file).split('?')[0];
		return routesList.routes.find(
			(route) => fileURLToPath(new URL(route.component, registry.config.root)) === path,
		);
	}

	const devServer = createVitePluginAstroServer({
		logger,
		isPage: cli?.isPage ?? ((file) => routeOf(file)?.type === 'page'),
		renderers: cli?.renderers ?? renderers,
		headElements: cli?.headElements,
		prepare: cli?.prepareDevServer,
	});

	const viteProjectPlugin: Plugin = {
		name: `${PACKAGE_NAME}:standalone`,
		config(_, env) {
			dev = env.command === 'serve';
			// The dev server renders every route; Vite's SPA fallback would rewrite them to `/index.html`.
			return { appType: 'custom' };
		},
		configResolved(config) {
			renderers.length = 0;
			renderers.push(...getAstroApi(config).renderers);
		},
		configEnvironment(name, environmentOptions) {
			const consumer = environmentOptions.consumer ?? (name === 'client' ? 'client' : 'server');
			if (consumer !== 'server') return;
			// The runtime imports virtual modules, so Vite must process the package rather than
			// externalize it.
			return { resolve: { noExternal: [PACKAGE_NAME] } };
		},
	};

	return [
		...(cli ? [] : [viteProjectPlugin]),
		serializedManifestPlugin({
			command: cli?.command,
			sync: cli?.sync ?? false,
			routerRegistry: registry,
			hostFields:
				cli?.manifestHostFields ??
				(async () => ({
					serverLike: buildOutput === 'server',
					middlewareMode: 'classic',
					adapterName: '',
					clientDirectives: [],
					userAssetsBase: undefined,
					csp: undefined,
					devToolbar: {
						enabled: false,
						latestAstroVersion: undefined,
						debugInfoOutput: '',
						placement: undefined,
					},
					logLevel: 'info',
				})),
			modules: {
				middleware: MIDDLEWARE_MODULE_ID,
				serverIslandMappings: SERVER_ISLAND_MANIFEST,
				logger: cli?.loggerModuleId,
			},
		}),
		vitePluginStaticPaths(),
		astroPluginRoutes({
			routerRegistry: registry,
			logger,
			command: cli?.command,
			routesList,
			hostRoutes: cli !== undefined,
			createRoutes:
				cli?.createRoutes ??
				(async (registrations) => {
					const created = await createRoutesList(
						{
							config: registry.config,
							...registrations,
							serverIslands: registry.config.output === 'server',
						},
						logger,
						{ dev },
					);
					buildOutput = created.buildOutput;
					return created;
				}),
			isRouteFile: cli?.isRouteFile ?? ((file) => routeOf(file) !== undefined),
			onRouteSetup: cli?.onRouteSetup,
			headInlineScripts: cli?.headInlineScripts,
		}),
		pluginPage({ routesList }),
		pluginPages({ routesList }),
		vitePluginApp(),
		vitePluginServerApp(),
		vitePluginFetchable({ routerRegistry: registry, fetchFile: cli?.fetchFile }),
		// The dev server plugins slow `astro build` down: its file watcher triggers them often.
		...(cli?.command === 'build'
			? []
			: [
					cli ? devServer : { ...devServer, apply: 'serve' as const },
					vitePluginAstroServerClient(),
				]),
		...astroDevCssPlugin({
			routesList,
			command: cli?.command,
			cssContentCache: cli?.cssContentCache,
		}),
		vitePluginMiddleware({ routerRegistry: registry, validate: cli?.validateMiddleware }),
		vitePluginServerIslands({
			serverIslandsState: cli?.serverIslandsState ?? new ServerIslandsState(),
			canRenderOnDemand: cli?.canRenderOnDemand ?? (() => registry.config.output === 'server'),
		}),
		...(cli
			? []
			: standaloneBuildPlugins({
					registry,
					logger,
					routesList,
					getBuildOutput: () => buildOutput,
					getServerOutput: () => registry.config.serverOutput,
				})),
	];
}
