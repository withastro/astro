import type { AstroSettings, RuntimeMode, SSRManifest } from '../@types/astro.js';
import type { LogOptions } from '../core/logger/core.js';
import type { ModuleLoader } from '../core/module-loader';
import type { Environment } from '../core/render';
import { createEnvironment } from '../core/render/index.js';
import { RouteCache } from '../core/render/route-cache.js';
import { isServerLikeOutput } from '../prerender/utils.js';
import { createResolve } from './resolve.js';

export function createDevelopmentEnvironment(
	manifest: SSRManifest,
	settings: AstroSettings,
	logging: LogOptions,
	loader: ModuleLoader
): Environment {
	const mode: RuntimeMode = 'development';
	return createEnvironment({
		adapterName: manifest.adapterName,
		logging,
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
}
