import { BaseApp, type RenderErrorOptions } from '../app/entrypoints/index.js';
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

	async renderError(request: Request, options: RenderErrorOptions): Promise<Response> {
		if (options.status === 500) {
			if (options.response) {
				return options.response;
			}
			throw options.error;
		} else {
			return super.renderError(request, {
				...options,
				prerenderedErrorPageFetch: undefined,
			});
		}
	}

	getQueueStats(): PoolStatsReport | undefined {
		if (this.pipeline.nodePool) {
			return this.pipeline.nodePool.getStats();
		}
	}

	logRequest(_options: LogRequestPayload) {}
}
