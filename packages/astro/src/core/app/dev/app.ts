import type { RouteData } from '../../../types/public/index.js';
import type { Logger } from '../../logger/core.js';
import type { CreateRenderContext, RenderContext } from '../../render-context.js';
import { BaseApp } from '../base.js';
import type { SSRManifest } from '../types.js';
import { NonRunnablePipeline } from './pipeline.js';

/**
 *
 */
export class DevApp extends BaseApp<NonRunnablePipeline> {
	logger: Logger;
	currentRenderContext: RenderContext | undefined = undefined;
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

	match(request: Request): RouteData | undefined {
		return super.match(request, true);
	}

	async createRenderContext(payload: CreateRenderContext): Promise<RenderContext> {
		this.currentRenderContext = await super.createRenderContext(payload);
		return this.currentRenderContext;
	}
}
