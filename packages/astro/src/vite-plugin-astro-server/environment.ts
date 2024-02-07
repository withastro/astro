import type { AstroConfig, AstroSettings, ComponentInstance, SSRLoadedRenderer, SSRManifest } from '../@types/astro.js';
import type { Logger } from '../core/logger/core.js';
import type { ModuleLoader } from '../core/module-loader/index.js';
import { Environment, loadRenderer } from '../core/render/index.js';
import { RouteCache } from '../core/render/route-cache.js';
import { viteID } from '../core/util.js';
import { isServerLikeOutput } from '../prerender/utils.js';
import { createResolve } from './resolve.js';
import { AggregateError, CSSError, MarkdownError } from '../core/errors/index.js';
import { enhanceViteSSRError } from '../core/errors/dev/index.js';

export class DevEnvironment extends Environment {
	// renderers are loaded on every request,
	// so it needs to be mutable here unlike in other environments
	override renderers = new Array<SSRLoadedRenderer>

	private constructor(
		readonly loader: ModuleLoader,
		readonly logger: Logger,
		readonly manifest: SSRManifest,
		readonly settings: AstroSettings,
		readonly config = settings.config,
	) {
		const mode = 'development'
		const resolve = createResolve(loader, settings.config.root);
		const serverLike = isServerLikeOutput(settings.config);
		const streaming = true;
		super(logger, manifest, mode, [], resolve, serverLike, streaming);
	}

	static create({ loader, logger, manifest, settings }: Pick<DevEnvironment, 'loader' | 'logger' | 'manifest' | 'settings'>) {
		return new DevEnvironment(loader, logger, manifest, settings)
	}

	async preload(filePath: URL) {
		const { loader } = this;

		// Important: This needs to happen first, in case a renderer provides polyfills.
		const renderers__ = this.settings.renderers.map((r) => loadRenderer(r, loader));
		const renderers_ = await Promise.all(renderers__);
		this.renderers = renderers_.filter((r): r is SSRLoadedRenderer => Boolean(r));

		try {
			// Load the module from the Vite SSR Runtime.
			return await loader.import(viteID(filePath)) as ComponentInstance;
		} catch (error) {
			// If the error came from Markdown or CSS, we already handled it and there's no need to enhance it
			if (MarkdownError.is(error) || CSSError.is(error) || AggregateError.is(error)) {
				throw error;
			}
	
			throw enhanceViteSSRError({ error, filePath, loader });
		}
	}

	clearRouteCache() {
		this.routeCache.clearAll();
	}
}