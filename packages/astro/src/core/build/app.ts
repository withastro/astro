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
		// build pipeline needs to render them. Also re-throw 500 errors so
		// the build fails on broken pages.
		if (!this._userAppCreated) {
			const { createAstroApp } = await import('../app/hono-app.js');
			this.setUserApp(createAstroApp({
				pipeline: this.pipeline,
				manifest: this.manifest,
				manifestData: this.manifestData,
				logger: this.logger,
			}, { isDev: true }));
			this._userAppCreated = true;
		}
		const response = await super.render(request, options);
		if (response.status >= 500) {
			let message = `Build error for ${request.url}: status ${response.status}`;
			try {
				const body = await response.json();
				if (body?.error) message = body.error;
			} catch {}
			throw new Error(message);
		}
		return response;
	}
	private _userAppCreated = false;

	getQueueStats(): PoolStatsReport | undefined {
		if (this.pipeline.nodePool) {
			return this.pipeline.nodePool.getStats();
		}
	}

	logRequest(_options: LogRequestPayload) {}
}
