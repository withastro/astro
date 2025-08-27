import type { Plugin as VitePlugin } from 'vite';
import type { SerializedRouteInfo } from '../core/app/types.js';
import { serializeRouteData } from '../core/routing/index.js';
import type { AstroSettings, RoutesList } from '../types/astro.js';
import { createSerializedManifest } from '../vite-plugin-astro-server/plugin.js';

const ASTRO_PLUGIN_DEV_MANIFEST = 'astro:serialized-manifest';
const ASTRO_PLUGIN_DEV_MANIFEST_ID = '\0' + ASTRO_PLUGIN_DEV_MANIFEST;

//
export default function astroDevSerializedManifest({
	settings,
	routesList,
}: {
	settings: AstroSettings;
	routesList: RoutesList;
}): VitePlugin {
	return {
		name: 'astro:serialized-manifest',
		enforce: 'pre',
		resolveId(id) {
			if (id === ASTRO_PLUGIN_DEV_MANIFEST) {
				return ASTRO_PLUGIN_DEV_MANIFEST_ID;
			}
		},

		async load(id) {
			if (id === ASTRO_PLUGIN_DEV_MANIFEST_ID) {
				const manifest = await createSerializedManifest(settings);
				manifest.routes = routesList.routes.map((route): SerializedRouteInfo => {
					return {
						file: '',
						links: [],
						scripts: [],
						styles: [],
						routeData: serializeRouteData(route, settings.config.trailingSlash),
					};
				});
				return { code: `const manifest = ${JSON.stringify(manifest)}\n; export { manifest }` };
			}
		},
	};
}
