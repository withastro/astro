import type {
	AstroConfig,
	AstroSettings,
	RuntimeMode,
	SSRLoadedRenderer,
	SSRManifest,
} from '../@types/astro';
import type { Logger } from '../core/logger/core';
import type { ModuleLoader } from '../core/module-loader';
import { Pipeline } from '../core/pipeline.js';
import type { Environment } from '../core/render';
import { createEnvironment, loadRenderer } from '../core/render/index.js';
import { RouteCache } from '../core/render/route-cache.js';
import { isServerLikeOutput } from '../prerender/utils.js';
import { createResolve } from './resolve.js';

export default class DevPipeline extends Pipeline {
	#settings: AstroSettings;
	#loader: ModuleLoader;
	#devLogger: Logger;

	constructor({
		manifest,
		logger,
		settings,
		loader,
	}: {
		manifest: SSRManifest;
		logger: Logger;
		settings: AstroSettings;
		loader: ModuleLoader;
	}) {
		const env = DevPipeline.createDevelopmentEnvironment(manifest, settings, logger, loader);
		super(env);
		this.#devLogger = logger;
		this.#settings = settings;
		this.#loader = loader;
		this.setEndpointHandler(this.#handleEndpointResult);
	}

	clearRouteCache() {
		this.env.routeCache.clearAll();
	}

	getSettings(): Readonly<AstroSettings> {
		return this.#settings;
	}

	getConfig(): Readonly<AstroConfig> {
		return this.#settings.config;
	}

	getModuleLoader(): Readonly<ModuleLoader> {
		return this.#loader;
	}

	get logger(): Readonly<Logger> {
		return this.#devLogger;
	}

	async loadRenderers() {
		const renderers = await Promise.all(
			this.#settings.renderers.map((r) => loadRenderer(r, this.#loader))
		);
		this.env.renderers = renderers.filter(Boolean) as SSRLoadedRenderer[];
	}

	static createDevelopmentEnvironment(
		manifest: SSRManifest,
		settings: AstroSettings,
		logger: Logger,
		loader: ModuleLoader
	): Environment {
		const mode: RuntimeMode = 'development';
		return createEnvironment({
			adapterName: manifest.adapterName,
			logger,
			mode,
			// This will be overridden in the dev server
			renderers: [],
			clientDirectives: manifest.clientDirectives,
			compressHTML: manifest.compressHTML,
			resolve: createResolve(loader, settings.config.root),
			routeCache: new RouteCache(logger, mode),
			site: manifest.site,
			ssr: isServerLikeOutput(settings.config),
			streaming: true,
		});
	}

	async #handleEndpointResult(_: Request, response: Response): Promise<Response> {
		return response;
	}
}
