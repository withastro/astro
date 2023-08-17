import { Pipeline } from '../core/pipeline.js';
import type { AstroConfig, AstroSettings, RouteData } from '../@types/astro';
import type { ModuleLoader } from '../core/module-loader';
import type { Environment } from '../core/render';
import { createEnvironment, loadRenderer } from '../core/render/index.js';
import { createResolve } from './resolve.js';
import { RouteCache } from '../core/render/route-cache.js';
import { isServerLikeOutput } from '../prerender/utils.js';
import type { RuntimeMode, SSRManifest, SSRLoadedRenderer } from '../@types/astro';
import type { LogOptions } from '../core/logger/core';
import { Logger } from '../core/logger/core.js';
import type { EndpointCallResult } from '../core/endpoint/index.js';
import mime from 'mime';
import { attachCookiesToResponse } from '../core/cookies/index.js';

export default class DevPipeline extends Pipeline {
	#settings: AstroSettings;
	#loader: ModuleLoader;
	#devLogger: Logger;
	#currentMatchedRoute: RouteData | undefined;

	constructor({
		manifest,
		logging,
		settings,
		loader,
	}: {
		manifest: SSRManifest;
		logging: LogOptions;
		settings: AstroSettings;
		loader: ModuleLoader;
	}) {
		const env = DevPipeline.createDevelopmentEnvironment(manifest, settings, logging, loader);
		super(env);
		this.#devLogger = new Logger(logging);
		this.#settings = settings;
		this.#loader = loader;
		this.setEndpointHandler(this.#handleEndpointResult);
	}

	setCurrentMatchedRoute(route: RouteData) {
		this.#currentMatchedRoute = route;
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

	async #handleEndpointResult(_: Request, result: EndpointCallResult): Promise<Response> {
		if (result.type === 'simple') {
			if (!this.#currentMatchedRoute) {
				throw new Error(
					'In development mode, you must set the current matched route before handling a endpoint.'
				);
			}
			let contentType = 'text/plain';
			// Dynamic routes don't include `route.pathname`, so synthesize a path for these (e.g. 'src/pages/[slug].svg')
			const filepath =
				this.#currentMatchedRoute.pathname ||
				this.#currentMatchedRoute.segments
					.map((segment) => segment.map((p) => p.content).join(''))
					.join('/');
			const computedMimeType = mime.getType(filepath);
			if (computedMimeType) {
				contentType = computedMimeType;
			}
			const response = new Response(
				result.encoding !== 'binary' ? Buffer.from(result.body, result.encoding) : result.body,
				{
					status: 200,
					headers: {
						'Content-Type': `${contentType};charset=utf-8`,
					},
				}
			);
			attachCookiesToResponse(response, result.cookies);
			return response;
		}
		return result.response;
	}
}
