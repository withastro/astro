import { BaseApp } from '../app/entrypoints/index.js';
import type { SSRManifest } from '../app/types.js';
import type { BuildInternals } from './internal.js';
import { BuildPipeline } from './pipeline.js';
import type { StaticBuildOptions } from './types.js';
import type { LogRequestPayload } from '../app/base.js';
import type { ErrorHandler } from '../errors/handler.js';
import type { PoolStatsReport } from '../../runtime/server/render/queue/pool.js';
export declare class BuildApp extends BaseApp<BuildPipeline> {
	createPipeline(_streaming: boolean, manifest: SSRManifest, ..._args: any[]): BuildPipeline;
	isDev(): boolean;
	setInternals(internals: BuildInternals): void;
	setOptions(options: StaticBuildOptions): void;
	getOptions(): StaticBuildOptions;
	getSettings(): import('../../types/astro.js').AstroSettings;
	protected createErrorHandler(): ErrorHandler;
	getQueueStats(): PoolStatsReport | undefined;
	logRequest(_options: LogRequestPayload): void;
}
