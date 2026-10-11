import vitePluginRenderersBase, {
	ASTRO_RENDERERS_MODULE_ID,
} from '@astrojs/vite-plugin-astro/internal/vite-plugin-renderers/index.js';
import type { ConfigEnv, Plugin as VitePlugin } from 'vite';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../core/constants.js';
import { hasNonPrerenderedRoute } from '../core/routing/helpers.js';
import type { ServerIslandsState } from '../core/server-islands/shared-state.js';
import type { AstroSettings, RoutesList } from '../types/astro.js';

export { ASTRO_RENDERERS_MODULE_ID };

interface PluginOptions {
	settings: AstroSettings;
	routesList: RoutesList;
	serverIslandsState: ServerIslandsState;
	command: ConfigEnv['command'];
}

export default function vitePluginRenderers(options: PluginOptions): VitePlugin {
	return vitePluginRenderersBase({
		renderers: options.settings.renderers,
		// The SSR build of a site whose pages are all prerendered never renders framework components.
		skipRenderers: (environment) =>
			options.command === 'build' &&
			environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr &&
			!options.serverIslandsState.hasIslands() &&
			!hasNonPrerenderedRoute(options.routesList.routes, {
				includeEndpoints: false,
				includeExternal: true,
			}),
	});
}
