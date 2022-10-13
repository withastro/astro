import type { ViteDevServer } from 'vite';
import type { AstroSettings, RuntimeMode } from '../../../@types/astro';
import type { LogOptions } from '../../logger/core.js';
import type { Environment } from '../index';
import { createEnvironment } from '../index.js';
import { RouteCache } from '../route-cache.js';
import { createResolve } from './resolve.js';

export type DevelopmentEnvironment = Environment & {
	settings: AstroSettings;
	viteServer: ViteDevServer;
};

export function createDevelopmentEnvironment(
	settings: AstroSettings,
	logging: LogOptions,
	viteServer: ViteDevServer
): DevelopmentEnvironment {
	const mode: RuntimeMode = 'development';
	let env = createEnvironment({
		adapterName: settings.adapter?.name,
		logging,
		markdown: {
			...settings.config.markdown,
			isAstroFlavoredMd: settings.config.legacy.astroFlavoredMarkdown,
		},
		mode,
		// This will be overridden in the dev server
		renderers: [],
		resolve: createResolve(viteServer),
		routeCache: new RouteCache(logging, mode),
		site: settings.config.site,
		ssr: settings.config.output === 'server',
		streaming: true,
	});

	return {
		...env,
		viteServer,
		settings,
	};
}
