import type { AstroSettings, RuntimeMode, SSRManifest } from '../../../@types/astro';
import { isServerLikeOutput } from '../../../prerender/utils.js';
import type { LogOptions } from '../../logger/core.js';
import type { ModuleLoader } from '../../module-loader/index';
import type { Environment } from '../index';
import { createEnvironment } from '../index.js';
import { RouteCache } from '../route-cache.js';
import { createResolve } from './resolve.js';

export type DevelopmentEnvironment = Environment & {
	loader: ModuleLoader;
	settings: AstroSettings;
};

export function createDevelopmentEnvironment(
	manifest: SSRManifest,
	settings: AstroSettings,
	logging: LogOptions,
	loader: ModuleLoader
): DevelopmentEnvironment {
	const mode: RuntimeMode = 'development';
	let env = createEnvironment({
		adapterName: manifest.adapterName,
		logging,
		markdown: manifest.markdown,
		mode,
		// This will be overridden in the dev server
		renderers: [],
		clientDirectives: manifest.clientDirectives,
		compressHTML: manifest.compressHTML,
		resolve: createResolve(loader, settings.config.root),
		routeCache: new RouteCache(logging, mode),
		site: manifest.site,
		ssr: isServerLikeOutput(settings.config),
		streaming: true,
	});

	return {
		...env,
		loader,
		settings,
	};
}
