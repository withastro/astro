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
		const response = await super.render(request, options);
		if (response.status >= 500) {
			// Don't treat legitimate error pages (e.g. /500) as build failures —
			// they intentionally return 500 status.
			const url = new URL(request.url);
			const pathname = url.pathname.replace(/\/+$/, '');
			if (pathname === '/500' || pathname === '/404') {
				return response;
			}
			// Extract the original error message from the 500 response.
			// Sources (in priority order): X-Astro-Error header (set by
			// renderErrorPage), JSON body (from onError), or HTML title.
			let message = `Build error for ${request.url}: status ${response.status}`;
			const headerError = response.headers.get('X-Astro-Error');
			if (headerError) {
				message = headerError;
			} else {
				try {
					const text = await response.clone().text();
					try {
						const body = JSON.parse(text);
						if (body?.error) message = body.error;
					} catch {
						const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
						if (titleMatch?.[1]) message = titleMatch[1];
					}
				} catch {}
			}
			const err = new Error(message);
			const errorName = response.headers.get('X-Astro-Error-Name');
			if (errorName) err.name = errorName;
			throw err;
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
