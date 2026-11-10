import { extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import colors from 'piccolore';
import { normalizePath, type Plugin, type ViteDevServer } from 'vite';
import { createDefaultAstroMetadata } from '@astrojs/vite-plugin-astro/_internal/vite-plugin-astro/metadata.js';
import type { PluginMetadata } from '@astrojs/vite-plugin-astro/_internal/vite-plugin-astro/types.js';
import { RESOLVED_MODULE_DEV_CSS_ALL } from '@astrojs/vite-plugin-astro/_internal/vite-plugin-css/const.js';
import type { SerializedRouteInfo } from '../core/app/types.js';
import { serializeRouteData } from '../core/app/manifest.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../core/constants.js';
import type { AstroLogger } from '../core/logger/core.js';
import { getRoutePrerenderOption } from '../core/routing/prerender.js';
import { rootRelativePath } from '../core/viteUtils.js';
import { isAstroServerEnvironment } from '../environments.js';
import { getDevPageScriptSrc, type RouterRegistry } from '../registry.js';
import type { RoutesList } from '../../routing.js';
import type { InjectedRoute, RouteData, RouteTransform } from '../../types.js';

/** The registrations of `api.astroRouter` that take part in route table creation. */
export interface RouteRegistrations {
	injectedRoutes: readonly InjectedRoute[];
	internalRoutes: readonly InjectedRoute[];
	routeTransforms: readonly RouteTransform[];
	pageExtensions: readonly string[];
}

export interface RoutesPluginOptions {
	routerRegistry: RouterRegistry;
	logger: AstroLogger;
	/** Defaults to Vite's command. */
	command?: 'dev' | 'build';
	/** The route table, shared with the plugins that read it and updated in place. */
	routesList: RoutesList;
	/**
	 * Whether the host filled `routesList` before Vite started. It is then recreated in
	 * `configResolved` only when `api.astroRouter` registrations change it; otherwise it is created
	 * there.
	 */
	hostRoutes?: boolean;
	/** Creates the route table. Also called in dev when a file under `srcDir` is added or removed. */
	createRoutes: (registrations: RouteRegistrations) => Promise<RoutesList>;
	/** Whether `file` is a page or an endpoint in the route table. */
	isRouteFile: (file: URL) => boolean;
	/** Runs after a route's `prerender` export was read again in dev; it can change `route.prerender`. */
	onRouteSetup?: (route: RouteData) => void | Promise<void>;
	/** Inline scripts added to every route in dev, after the page scripts. */
	headInlineScripts?: () => readonly string[];
}

export const ASTRO_ROUTES_MODULE_ID = 'virtual:astro:routes';
const ASTRO_ROUTES_MODULE_ID_RESOLVED = '\0' + ASTRO_ROUTES_MODULE_ID;
// Imported by absolute path: projects that depend only on `astro` cannot resolve this package.
const APP_MANIFEST_MODULE = normalizePath(
	fileURLToPath(new URL('../core/app/manifest.js', import.meta.url)),
);

const KNOWN_FILE_EXTENSIONS = ['.astro', '.js', '.ts'];

/**
 * In dev mode, populate route scripts with the page scripts registered with
 * `api.astroRouter.addPageScript()` and the inline head scripts.
 * This ensures non-runnable environments (e.g. Cloudflare's workerd) can access
 * them through the route's `scripts`.
 *
 * @param pageScripts Module specifiers of the page scripts.
 * @param headInlineScripts Contents of the inline scripts.
 */
export function getDevRouteScripts(
	command: 'dev' | 'build',
	pageScripts: readonly string[],
	headInlineScripts: readonly string[],
): SerializedRouteInfo['scripts'] {
	if (command !== 'dev') return [];
	const result: SerializedRouteInfo['scripts'] = pageScripts.map((specifier) => ({
		type: 'external',
		value: getDevPageScriptSrc(specifier),
	}));
	for (const content of headInlineScripts) {
		result.push({ stage: 'head-inline', children: content });
	}
	return result;
}

export default function astroPluginRoutes({
	logger,
	routesList: initialRoutesList,
	hostRoutes = false,
	command: commandOption,
	routerRegistry,
	createRoutes,
	isRouteFile,
	onRouteSetup,
	headInlineScripts = () => [],
}: RoutesPluginOptions): Plugin {
	let command = commandOption ?? 'dev';
	const getConfig = () => routerRegistry.config;
	const createWith = () =>
		createRoutes({
			injectedRoutes: routerRegistry.injectedRoutes,
			internalRoutes: routerRegistry.internalRoutes,
			routeTransforms: routerRegistry.routeTransforms,
			pageExtensions: routerRegistry.pageExtensions,
		});
	const routeScripts = () =>
		getDevRouteScripts(command, routerRegistry.getPageScripts('dev'), headInlineScripts());
	// Serialized in `configResolved`, once the page scripts are registered.
	let serializedRouteInfo: SerializedRouteInfo[] = [];

	function findRouteByFilename(filename: string) {
		return initialRoutesList.routes.find(
			(route) =>
				normalizePath(fileURLToPath(new URL(`./${route.component}`, getConfig().root))) ===
				filename,
		);
	}

	// Only built in `build` environments, where the route list is fixed for the whole run
	let routeByFilename: Map<string, RoutesList['routes'][number]> | null = null;
	function getRouteByFilename(): Map<string, RoutesList['routes'][number]> {
		if (routeByFilename === null) {
			routeByFilename = new Map();
			for (const route of initialRoutesList.routes) {
				const filename = normalizePath(
					fileURLToPath(new URL(`./${route.component}`, getConfig().root)),
				);
				// Several routes can share a component, and the first one owns the filename
				if (!routeByFilename.has(filename)) {
					routeByFilename.set(filename, route);
				}
			}
		}
		return routeByFilename;
	}

	function serializeRoutes(file: string) {
		serializedRouteInfo = initialRoutesList.routes.map((r): SerializedRouteInfo => {
			return {
				file,
				links: [],
				scripts: routeScripts(),
				styles: [],
				routeData: serializeRouteData(r, getConfig().trailingSlash),
			};
		});
	}

	let registrationsApplied = false;

	// Routes from `api.astroRouter.injectRoute()`, transforms from `transformRoutes()` and extensions
	// from `addPageExtension()` are registered in `configResolved`, after the host built the initial
	// route table, so the table is rebuilt once they are known. A build resolves the config again with the same plugins, and so the same
	// registrations: rebuilding then would replace the `RouteData` objects the build already holds.
	async function addRegisteredRoutes() {
		if (registrationsApplied) return;
		registrationsApplied = true;
		if (
			hostRoutes &&
			routerRegistry.injectedRoutes.length === 0 &&
			routerRegistry.internalRoutes.length === 0 &&
			routerRegistry.routeTransforms.length === 0 &&
			routerRegistry.pageExtensions.length === 0
		) {
			return;
		}
		const newRoutesList = await createWith();
		initialRoutesList.routes.length = 0;
		initialRoutesList.routes.push(...newRoutesList.routes);
		routeByFilename = null;
	}

	let routesResolved = false;

	async function rebuildRoutes(path: string | null = null, server: ViteDevServer) {
		const normalizedSrcDir = normalizePath(fileURLToPath(getConfig().srcDir));
		if (path != null && normalizePath(path).startsWith(normalizedSrcDir)) {
			logger.debug(
				'update',
				`Re-calculating routes for ${normalizePath(path).slice(normalizedSrcDir.length)}`,
			);
			const file = pathToFileURL(normalizePath(path));
			const newRoutesList = await createWith();

			// IMPORTANT: Mutate the shared routesList object so all plugins see the update.
			// Other plugins (pluginPage, pluginPages, astroDevCssPlugin) capture routesList
			// at creation time, so we must mutate the array in place rather than replacing it.
			initialRoutesList.routes.length = 0;
			initialRoutesList.routes.push(...newRoutesList.routes);

			serializeRoutes(fileURLToPath(file));
			await routerRegistry.setRoutes(initialRoutesList.routes);
			const environmentsToInvalidate = [];
			for (const name of [
				ASTRO_VITE_ENVIRONMENT_NAMES.ssr,
				ASTRO_VITE_ENVIRONMENT_NAMES.prerender,
			] as const) {
				const environment = server.environments[name];
				if (environment) {
					environmentsToInvalidate.push(environment);
				}
			}

			for (const environment of environmentsToInvalidate) {
				const virtualMod = environment.moduleGraph.getModuleById(ASTRO_ROUTES_MODULE_ID_RESOLVED);
				if (!virtualMod) continue;

				environment.moduleGraph.invalidateModule(virtualMod);

				const cssMod = environment.moduleGraph.getModuleById(RESOLVED_MODULE_DEV_CSS_ALL);
				if (cssMod) {
					environment.moduleGraph.invalidateModule(cssMod);
				}

				// Signal that routes have changed so running apps can update
				// NOTE: Consider adding debouncing here if rapid file changes cause performance issues
				environment.hot.send('astro:routes-updated', {});
			}
		}
	}
	return {
		name: 'astro:routes',
		config(_, env) {
			command = commandOption ?? (env.command === 'serve' ? 'dev' : 'build');
		},
		configResolved: {
			order: 'post',
			async handler() {
				routesResolved = false;
				await addRegisteredRoutes();
				// Route scripts include the page scripts, which are registered in `configResolved`.
				serializeRoutes('');
			},
		},
		async buildStart() {
			if (routesResolved) return;
			routesResolved = true;
			await routerRegistry.setRoutes(initialRoutesList.routes);
		},
		async configureServer(server) {
			routesResolved = true;
			await routerRegistry.setRoutes(initialRoutesList.routes);
			server.watcher.on('add', (path) => rebuildRoutes(path, server));
			server.watcher.on('unlink', (path) => rebuildRoutes(path, server));
			server.watcher.on('change', (path) => rebuildRoutes(path, server));
		},

		applyToEnvironment(environment) {
			return (
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.astro ||
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr ||
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.prerender
			);
		},

		resolveId: {
			filter: {
				id: new RegExp(`^${ASTRO_ROUTES_MODULE_ID}$`),
			},
			handler() {
				return ASTRO_ROUTES_MODULE_ID_RESOLVED;
			},
		},

		load: {
			filter: {
				id: new RegExp(`^${ASTRO_ROUTES_MODULE_ID_RESOLVED}$`),
			},
			handler() {
				const environmentName = this.environment.name;
				const filteredRoutes = serializedRouteInfo.filter((routeInfo) => {
					if (command === 'build') {
						// In prerender, filter to only the routes that need prerendering.
						if (environmentName === ASTRO_VITE_ENVIRONMENT_NAMES.prerender) {
							return routeInfo.routeData.prerender;
						}
						// In SSR, we keep the non prerendered routes
						if (environmentName === ASTRO_VITE_ENVIRONMENT_NAMES.ssr) {
							return !routeInfo.routeData.prerender;
						}
					}
					return true;
				});

				const code = `
				import { deserializeRouteInfo } from ${JSON.stringify(APP_MANIFEST_MODULE)};
				const serializedData = ${JSON.stringify(filteredRoutes)};
				const routes = serializedData.map(deserializeRouteInfo);
				export { routes };
				`;

				return { code };
			},
		},

		async transform(this, code, id) {
			if (!isAstroServerEnvironment(this.environment)) return;

			const filename = normalizePath(id);
			let fileURL: URL;
			try {
				fileURL = new URL(`file://${filename}`);
			} catch {
				// If we can't construct a valid URL, exit early
				return;
			}

			if (!isRouteFile(fileURL)) return;
			const route =
				this.environment.mode === 'build'
					? getRouteByFilename().get(filename)
					: findRouteByFilename(filename);

			if (!route) {
				return;
			}

			// `getStaticPaths` warning is just a string check, should be good enough for most cases
			if (
				!route.prerender &&
				code.includes('getStaticPaths') &&
				// this should only be valid for `.astro`, `.js` and `.ts` files
				KNOWN_FILE_EXTENSIONS.includes(extname(filename))
			) {
				logger.warn(
					'router',
					`getStaticPaths() ignored in dynamic page ${colors.bold(
						rootRelativePath(getConfig().root, fileURL, true),
					)}. Add \`export const prerender = true;\` to prerender the page as static HTML during the build process.`,
				);
			}

			const { meta = {} } = this.getModuleInfo(id) ?? {};
			return {
				code,
				map: null,
				meta: {
					...meta,
					astro: {
						...(meta.astro ?? createDefaultAstroMetadata()),
						pageOptions: {
							prerender: route.prerender,
						},
					} satisfies PluginMetadata['astro'],
				},
			};
		},

		// Handle hot updates to update the prerender option
		async handleHotUpdate(ctx) {
			const filename = normalizePath(ctx.file);
			let fileURL: URL;
			try {
				fileURL = new URL(`file://${filename}`);
			} catch {
				// If we can't construct a valid URL, exit early
				return;
			}

			if (!isRouteFile(fileURL)) return;

			const route = findRouteByFilename(filename);

			if (!route) {
				return;
			}

			await getRoutePrerenderOption(await ctx.read(), route, onRouteSetup);
		},
	};
}
