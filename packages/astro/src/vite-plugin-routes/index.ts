import type fsMod from 'node:fs';
import type { Plugin } from 'vite';
import { serializeRouteData } from '../core/app/index.js';
import type { SerializedRouteInfo } from '../core/app/types.js';
import type { Logger } from '../core/logger/core.js';
import { createRoutesList } from '../core/routing/index.js';
import type { AstroSettings } from '../types/astro.js';

type Payload = {
	settings: AstroSettings;
	logger: Logger;
	fsMod?: typeof fsMod;
};

const ASTRO_ROUTES_MODULE_ID = 'astro:routes';
const ASTRO_ROUTES_MODULE_ID_RESOLVED = '\0' + ASTRO_ROUTES_MODULE_ID;

export default async function astroPluginRoutes({
	settings,
	logger,
	fsMod,
}: Payload): Promise<Plugin> {
	const routeList = await createRoutesList(
		{
			settings,
			fsMod,
		},
		logger,
		// TODO: the caller should handle this
		{ dev: true },
	);

	const serializedRouteInfo: SerializedRouteInfo[] = routeList.routes.map(
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

	return {
		name: 'astro:routes',
		enforce: 'pre',
		configureServer(server) {
			server.watcher.on('all', (_event, relativeEntry) => {
				const entry = new URL(relativeEntry, settings.config.root);
				if (entry.pathname.startsWith(settings.config.srcDir.pathname)) {
					server.restart();
				}
			});
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
	};
}
