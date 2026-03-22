import type fsMod from 'node:fs';
import { extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import colors from 'piccolore';
import { normalizePath, type Plugin, type ViteDevServer } from 'vite';
import { serializeRouteData } from '../core/app/entrypoints/index.js';
import type { SerializedRouteInfo } from '../core/app/types.js';
import { warnMissingAdapter } from '../core/dev/adapter-validation.js';
import type { Logger } from '../core/logger/core.js';
import { createRoutesList } from '../core/routing/create-manifest.js';
import { getRoutePrerenderOption } from '../core/routing/prerender.js';
import { isEndpoint, isPage } from '../core/util.js';
import { rootRelativePath } from '../core/viteUtils.js';
import type { AstroSettings, RoutesList } from '../types/astro.js';
import { createDefaultAstroMetadata } from '../vite-plugin-astro/metadata.js';
import type { PluginMetadata } from '../vite-plugin-astro/types.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../core/constants.js';
import { isAstroServerEnvironment } from '../environments.js';
import { RESOLVED_MODULE_DEV_CSS_ALL } from '../vite-plugin-css/const.js';
import { PAGE_SCRIPT_ID } from '../vite-plugin-scripts/index.js';

type Payload = {
	settings: AstroSettings;
	logger: Logger;
	fsMod?: typeof fsMod;
	routesList: RoutesList;
	command: 'dev' | 'build';
};

export const ASTRO_ROUTES_MODULE_ID = 'virtual:astro:routes';
const ASTRO_ROUTES_MODULE_ID_RESOLVED = '\0' + ASTRO_ROUTES_MODULE_ID;

const KNOWN_FILE_EXTENSIONS = ['.astro', '.js', '.ts'];

/**
 * In dev mode, populate route scripts with integration-injected scripts from settings.
 * This ensures non-runnable environments (e.g. Cloudflare's workerd) can access
 * scripts injected via `injectScript()` during `astro:config:setup`.
 */
export function getDevRouteScripts(
	command: 'dev' | 'build',
	scripts: AstroSettings['scripts'],
): SerializedRouteInfo['scripts'] {
	if (command !== 'dev') return [];
	const result: SerializedRouteInfo['scripts'] = [];
	const hasPageScripts = scripts.some((s) => s.stage === 'page');
	if (hasPageScripts) {
		result.push({
			type: 'external',
			value: `/@id/${PAGE_SCRIPT_ID}`,
		});
	}
	for (const script of scripts) {
		if (script.stage === 'head-inline') {
			result.push({ stage: script.stage, children: script.content });
		}
	}
	return result;
}

export default async function astroPluginRoutes({
	settings,
	logger,
	fsMod,
	routesList: initialRoutesList,
	command,
}: Payload): Promise<Plugin> {
	logger.debug('update', 'Re-calculate routes');

	let serializedRouteInfo: SerializedRouteInfo[] = initialRoutesList.routes.map(
		(r): SerializedRouteInfo => {
			return {
				file: '',
				links: [],
				scripts: getDevRouteScripts(command, settings.scripts),
				styles: [],
				routeData: serializeRouteData(r, settings.config.trailingSlash),
			};
		},
	);

	const normalizedSrcDir = normalizePath(fileURLToPath(settings.config.srcDir));

	async function rebuildRoutes(path: string | null = null, server: ViteDevServer) {
		if (path != null && normalizePath(path).startsWith(normalizedSrcDir)) {
			logger.debug(
				'update',
				`Re-calculating routes for ${normalizePath(path).slice(normalizedSrcDir.length)}`,
			);
			const file = pathToFileURL(normalizePath(path));
			const newRoutesList = await createRoutesList(
				{
					settings,
					fsMod,
				},
				logger,
				{ dev: command === 'dev' },
			);

			// IMPORTANT: Mutate the shared routesList object so all plugins see the update.
			// Other plugins (pluginPage, pluginPages, astroDevCssPlugin) capture routesList
			// at creation time, so we must mutate the array in place rather than replacing it.
			initialRoutesList.routes.length = 0;
			initialRoutesList.routes.push(...newRoutesList.routes);

			serializedRouteInfo = initialRoutesList.routes.map((r): SerializedRouteInfo => {
				return {
					file: fileURLToPath(file),
					links: [],
					scripts: getDevRouteScripts(command, settings.scripts),
					styles: [],
					routeData: serializeRouteData(r, settings.config.trailingSlash),
				};
			});
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
		configureServer(server) {
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
				import { deserializeRouteInfo } from 'astro/app';
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

			const fileIsPage = isPage(fileURL, settings);
			const fileIsEndpoint = isEndpoint(fileURL, settings);
			if (!(fileIsPage || fileIsEndpoint)) return;
			const route = initialRoutesList.routes.find((r) => {
				const filePath = new URL(`./${r.component}`, settings.config.root);
				return normalizePath(fileURLToPath(filePath)) === filename;
			});

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
						rootRelativePath(settings.config.root, fileURL, true),
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

			const fileIsPage = isPage(fileURL, settings);
			const fileIsEndpoint = isEndpoint(fileURL, settings);
			if (!(fileIsPage || fileIsEndpoint)) return;

			const route = initialRoutesList.routes.find((r) => {
				const filePath = new URL(`./${r.component}`, settings.config.root);
				return normalizePath(fileURLToPath(filePath)) === filename;
			});

			if (!route) {
				return;
			}

			await getRoutePrerenderOption(await ctx.read(), route, settings, logger);
			warnMissingAdapter(logger, settings);
		},
	};
}
