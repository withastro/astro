import type fsMod from 'node:fs';
import { extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bold } from 'kleur/colors';
import type { Plugin } from 'vite';
import { serializeRouteData } from '../core/app/index.js';
import type { SerializedRouteInfo } from '../core/app/types.js';
import { warnMissingAdapter } from '../core/dev/adapter-validation.js';
import type { Logger } from '../core/logger/core.js';
import { createRoutesList } from '../core/routing/index.js';
import { getRoutePrerenderOption } from '../core/routing/manifest/prerender.js';
import { isEndpoint, isPage } from '../core/util.js';
import { normalizePath, rootRelativePath } from '../core/viteUtils.js';
import type { AstroSettings } from '../types/astro.js';
import { createDefaultAstroMetadata } from '../vite-plugin-astro/metadata.js';
import type { PluginMetadata } from '../vite-plugin-astro/types.js';

type Payload = {
	settings: AstroSettings;
	logger: Logger;
	fsMod?: typeof fsMod;
};

const ASTRO_ROUTES_MODULE_ID = 'astro:routes';
const ASTRO_ROUTES_MODULE_ID_RESOLVED = '\0' + ASTRO_ROUTES_MODULE_ID;

const KNOWN_FILE_EXTENSIONS = ['.astro', '.js', '.ts'];

export default async function astroPluginRoutes({
	settings,
	logger,
	fsMod,
}: Payload): Promise<Plugin> {
	logger.debug('update', 'Re-calculate routes');
	let routeList = await createRoutesList(
		{
			settings,
			fsMod,
		},
		logger,
		// TODO: the caller should handle this
		{ dev: true },
	);

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

	async function rebuildRoutes(path: string | null = null) {
		if (path != null) {
			routeList = await createRoutesList(
				{
					settings,
					fsMod,
				},
				logger,
				// TODO: the caller should handle this
				{ dev: true },
			);

			serializedRouteInfo = routeList.routes.map((r): SerializedRouteInfo => {
				return {
					file: '',
					links: [],
					scripts: [],
					styles: [],
					routeData: serializeRouteData(r, settings.config.trailingSlash),
				};
			});
		}
	}
	return {
		name: 'astro:routes',
		configureServer(server) {
			server.watcher.on('add', rebuildRoutes.bind(null, null));
			server.watcher.on('unlink', rebuildRoutes.bind(null, null));
			server.watcher.on('change', rebuildRoutes);
		},

		applyToEnvironment(environment) {
			return environment.name === 'ssr';
		},

		load(id) {
			if (id === ASTRO_ROUTES_MODULE_ID_RESOLVED) {
				const code = `
				import { deserializeRouteInfo } from 'astro/app';
				const serializedData = ${JSON.stringify(serializedRouteInfo)};
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
					`getStaticPaths() ignored in dynamic page ${bold(
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
