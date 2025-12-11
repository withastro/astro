import type fsMod from 'node:fs';
import { extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import colors from 'piccolore';
import { normalizePath, type Plugin, type ViteDevServer } from 'vite';
import { serializeRouteData } from '../core/app/index.js';
import type { SerializedRouteInfo } from '../core/app/types.js';
import { warnMissingAdapter } from '../core/dev/adapter-validation.js';
import type { Logger } from '../core/logger/core.js';
import { createRoutesList } from '../core/routing/index.js';
import { getRoutePrerenderOption } from '../core/routing/manifest/prerender.js';
import { isEndpoint, isPage } from '../core/util.js';
import { rootRelativePath } from '../core/viteUtils.js';
import type { AstroSettings, RoutesList } from '../types/astro.js';
import { createDefaultAstroMetadata } from '../vite-plugin-astro/metadata.js';
import type { PluginMetadata } from '../vite-plugin-astro/types.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../core/constants.js';

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

export default async function astroPluginRoutes({
	settings,
	logger,
	fsMod,
	routesList: initialRoutesList,
	command,
}: Payload): Promise<Plugin> {
	logger.debug('update', 'Re-calculate routes');
	let routeList = initialRoutesList;

	let serializedRouteInfo: SerializedRouteInfo[] = routeList.routes.map(
		(r): SerializedRouteInfo => {
			return {
				file: '',
				links: [],
				scripts: [],
				styles: [],
				routeData: serializeRouteData(r, settings.config.trailingSlash),
			};
		},
	);

	async function rebuildRoutes(path: string | null = null, server: ViteDevServer) {
		if (path != null && path.startsWith(settings.config.srcDir.pathname)) {
			logger.debug(
				'update',
				`Re-calculating routes for ${path.slice(settings.config.srcDir.pathname.length)}`,
			);
			const file = pathToFileURL(normalizePath(path));
			routeList = await createRoutesList(
				{
					settings,
					fsMod,
				},
				logger,
				{ dev: command === 'dev' },
			);

			serializedRouteInfo = routeList.routes.map((r): SerializedRouteInfo => {
				return {
					file: fileURLToPath(file),
					links: [],
					scripts: [],
					styles: [],
					routeData: serializeRouteData(r, settings.config.trailingSlash),
				};
			});
			let environment = server.environments[ASTRO_VITE_ENVIRONMENT_NAMES.ssr];
			const virtualMod = environment.moduleGraph.getModuleById(ASTRO_ROUTES_MODULE_ID_RESOLVED);
			if (!virtualMod) return;

			environment.moduleGraph.invalidateModule(virtualMod);
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

		load(id) {
			if (id === ASTRO_ROUTES_MODULE_ID_RESOLVED) {
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

				return {
					code,
				};
			}
		},

		resolveId(id) {
			if (id === ASTRO_ROUTES_MODULE_ID) {
				return ASTRO_ROUTES_MODULE_ID_RESOLVED;
			}
		},

		async transform(this, code, id, options) {
			if (!options?.ssr) return;

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
			const route = routeList.routes.find((r) => {
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

			const route = routeList.routes.find((r) => {
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
