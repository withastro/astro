import { fileURLToPath } from 'node:url';
import type { AstroPluginOptions } from '@astrojs/vite-plugin-astro';
import type { AstroPluginCli } from '@astrojs/vite-plugin-astro/internal/cli.js';
import type { AstroSettings, RoutesList } from '../types/astro.js';
import { getDevCssModuleIdForInvalidatedModule } from '../vite-plugin-css/util.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from './constants.js';
import type { AstroLogger } from './logger/core.js';
import { hasNonPrerenderedRoute } from './routing/helpers.js';
import type { ServerIslandsState } from './server-islands/shared-state.js';

/** The `astro()` options of an Astro project. */
export function toAstroOptions(settings: AstroSettings): AstroPluginOptions {
	const { config } = settings;
	return {
		root: fileURLToPath(config.root),
		srcDir: fileURLToPath(config.srcDir),
		publicDir: fileURLToPath(config.publicDir),
		site: config.site,
		compressHTML: config.compressHTML,
		trailingSlash: config.trailingSlash,
		renderers: settings.renderers,
	};
}

/** What the `astro` CLI passes to `astro()` besides its options. */
export function toAstroCli(
	settings: AstroSettings,
	{
		logger,
		command,
		routesList,
		serverIslandsState,
	}: {
		logger: AstroLogger;
		command: 'dev' | 'build';
		routesList: RoutesList;
		serverIslandsState: ServerIslandsState;
	},
): AstroPluginCli {
	return {
		compileConfig: settings.config,
		logger,
		toolbarEnabled: () => settings.preferences.get('devToolbar.enabled'),
		// User projects depend on `astro`, not on the package, and adapters pre-bundle these ids.
		internalURL: 'astro/compiler-runtime',
		transitionsAnimationURL: 'astro/components/viewtransitions.css',
		// The SSR build of a site whose pages are all prerendered never renders framework components.
		skipRenderers: (environment) =>
			command === 'build' &&
			environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr &&
			!serverIslandsState.hasIslands() &&
			!hasNonPrerenderedRoute(routesList.routes, {
				includeEndpoints: false,
				includeExternal: true,
			}),
		headEnvironments: [ASTRO_VITE_ENVIRONMENT_NAMES.ssr, ASTRO_VITE_ENVIRONMENT_NAMES.prerender],
		getDevCssModuleId: getDevCssModuleIdForInvalidatedModule,
		scripts: settings.scripts,
	};
}
