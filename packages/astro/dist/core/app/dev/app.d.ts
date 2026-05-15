import type { RouteData } from '../../../types/public/index.js';
import type { ErrorHandler } from '../../errors/handler.js';
import type { AstroLogger } from '../../logger/core.js';
import { BaseApp, type DevMatch, type LogRequestPayload } from '../base.js';
import type { SSRManifest } from '../types.js';
import { NonRunnablePipeline } from './pipeline.js';
import type { RoutesList } from '../../../types/astro.js';
export declare class DevApp extends BaseApp<NonRunnablePipeline> {
	constructor(manifest: SSRManifest, streaming: boolean | undefined, logger: AstroLogger);
	createPipeline(
		streaming: boolean,
		manifest: SSRManifest,
		logger: AstroLogger,
	): NonRunnablePipeline;
	isDev(): boolean;
	/**
	 * Clears the cached middleware so it is re-resolved on the next request.
	 * Called via HMR when middleware files change.
	 */
	clearMiddleware(): void;
	/**
	 * Updates the routes list when files change during development.
	 * Called via HMR when new pages are added/removed.
	 */
	updateRoutes(newRoutesList: RoutesList): void;
	match(request: Request): RouteData | undefined;
	devMatch(pathname: string): Promise<DevMatch | undefined>;
	protected createErrorHandler(): ErrorHandler;
	logRequest({ pathname, method, statusCode, isRewrite, reqTime }: LogRequestPayload): void;
}
