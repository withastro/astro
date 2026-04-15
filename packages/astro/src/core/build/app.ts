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
			const { createDefaultFetchHandler } = await import('../fetch/default-handler.js');
			this.setFetchHandler(createDefaultFetchHandler({
				pipeline: this.pipeline,
				manifest: this.manifest,
				logger: this.logger,
			}, { isDev: false, allowPrerenderedRoutes: true }));
			this._userAppCreated = true;
		}
		const response = await super.render(request, options);
		if (response.status >= 500) {
			// Only throw if this is an unhandled error. Detect errors via:
			// 1. X-Astro-Error header (set by renderErrorPage for caught errors)
			// 2. JSON error body (set by onError for uncaught errors)
			// Pages that intentionally return 500 won't have either marker.
			const headerError = response.headers.get('X-Astro-Error');
			if (headerError) {
				const err = new Error(headerError);
				const errorName = response.headers.get('X-Astro-Error-Name');
				if (errorName) err.name = errorName;
				throw err;
			}
			let jsonError: string | undefined;
			try {
				const body = await response.clone().json();
				if (body?.error) jsonError = body.error;
			} catch {
				// Not JSON — page intentionally returned 500
			}
			if (jsonError) {
				throw new Error(jsonError);
			}
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
