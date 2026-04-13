import { BaseApp } from '../app/entrypoints/index.js';
import type { SSRManifest } from '../app/types.js';
import type { BuildInternals } from './internal.js';
import { BuildPipeline } from './pipeline.js';
import type { StaticBuildOptions } from './types.js';
import type { CreateRenderContext, RenderContext } from '../render-context.js';
import type { LogRequestPayload } from '../app/base.js';
import type { PoolStatsReport } from '../../runtime/server/render/queue/pool.js';

export class BuildApp extends BaseApp<BuildPipeline> {
	createPipeline(_streaming: boolean, manifest: SSRManifest, ..._args: any[]): BuildPipeline {
		return BuildPipeline.create({
			manifest,
		});
	}

	async createRenderContext(payload: CreateRenderContext): Promise<RenderContext> {
		return await super.createRenderContext({
			...payload,
		});
	}

	isDev(): boolean {
		return true;
	}

	public setInternals(internals: BuildInternals) {
		this.pipeline.setInternals(internals);
	}

	public setOptions(options: StaticBuildOptions) {
		this.pipeline.setOptions(options);
		this.logger = options.logger;
	}

	public getOptions() {
		return this.pipeline.getOptions();
	}

	public getSettings() {
		return this.pipeline.getSettings();
	}

	async render(request: Request, options: any = {}): Promise<Response> {
		// During build, force prerendered routes to be matchable since the
		// build pipeline needs to render them. Keep isDev: false so onError
		// returns JSON 500s and prepareForRender renders error pages normally.
		if (!this._userAppCreated) {
			const { createAstroApp } = await import('../app/hono-app.js');
			this.setUserApp(createAstroApp({
				pipeline: this.pipeline,
				manifest: this.manifest,
				manifestData: this.manifestData,
				logger: this.logger,
			}, { isDev: false, allowPrerenderedRoutes: true }));
			this._userAppCreated = true;
		}
		return super.render(request, options);
	}
	private _userAppCreated = false;

	getQueueStats(): PoolStatsReport | undefined {
		if (this.pipeline.nodePool) {
			return this.pipeline.nodePool.getStats();
		}
	}

	logRequest(_options: LogRequestPayload) {}
}
