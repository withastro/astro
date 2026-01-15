import type { RouteData } from '../../../types/public/index.js';
import type { Logger } from '../../logger/core.js';
import type { CreateRenderContext, RenderContext } from '../../render-context.js';
import { BaseApp, type DevMatch } from '../base.js';
import type { SSRManifest } from '../types.js';
import { NonRunnablePipeline } from './pipeline.js';
import { matchRoute } from '../../routing/dev.js';
import type { RunnablePipeline } from '../../../vite-plugin-app/pipeline.js';

/**
 *
 */
export class DevApp extends BaseApp<NonRunnablePipeline> {
	logger: Logger;
	currentRenderContext: RenderContext | undefined = undefined;
	resolvedPathname: string | undefined = undefined;
	constructor(manifest: SSRManifest, streaming = true, logger: Logger) {
		super(manifest, streaming, logger);
		this.logger = logger;
	}

	createPipeline(streaming: boolean, manifest: SSRManifest, logger: Logger): NonRunnablePipeline {
		return NonRunnablePipeline.create({
			logger,
			manifest,
			streaming,
		});
	}

	isDev(): boolean {
		return true;
	}

	match(request: Request): RouteData | undefined {
		return super.match(request, true);
	}

	async devMatch(pathname: string): Promise<DevMatch | undefined> {
		const matchedRoute = await matchRoute(
			pathname,
			this.manifestData,
			this.pipeline as unknown as RunnablePipeline,
			this.manifest,
		);
		if (!matchedRoute) return undefined;

		this.resolvedPathname = matchedRoute.resolvedPathname;
		return {
			routeData: matchedRoute.route,
			resolvedPathname: matchedRoute.resolvedPathname,
		};
	}

	async createRenderContext(payload: CreateRenderContext): Promise<RenderContext> {
		return super.createRenderContext({
			...payload,
			pathname: this.resolvedPathname ?? payload.pathname,
		});
	}
}
