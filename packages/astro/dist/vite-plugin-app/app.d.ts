import type http from 'node:http';
import { BaseApp } from '../core/app/entrypoints/index.js';
import type { ErrorHandler } from '../core/errors/handler.js';
import type { AstroLogger } from '../core/logger/core.js';
import type { ModuleLoader } from '../core/module-loader/index.js';
import type { AstroSettings, RoutesList } from '../types/astro.js';
import type { RouteData, SSRManifest } from '../types/public/index.js';
import type { DevServerController } from '../vite-plugin-astro-server/controller.js';
import { RunnablePipeline } from './pipeline.js';
import type { DevMatch, LogRequestPayload } from '../core/app/base.js';
export declare class AstroServerApp extends BaseApp<RunnablePipeline> {
	#private;
	settings: AstroSettings;
	loader: ModuleLoader;
	manifestData: RoutesList;
	constructor(
		manifest: SSRManifest,
		streaming: boolean | undefined,
		logger: AstroLogger,
		manifestData: RoutesList,
		loader: ModuleLoader,
		settings: AstroSettings,
		getDebugInfo: () => Promise<string>,
	);
	isDev(): boolean;
	/**
	 * Updates the routes list when files change during development.
	 * Called via HMR when new pages are added/removed.
	 */
	updateRoutes(newRoutesList: RoutesList): void;
	/**
	 * Clears the route cache so that getStaticPaths() is re-evaluated.
	 * Called via HMR when content collection data changes.
	 */
	clearRouteCache(): void;
	/**
	 * Clears the cached middleware so it is re-resolved on the next request.
	 * Called via HMR when middleware files change.
	 */
	clearMiddleware(): void;
	devMatch(pathname: string): Promise<DevMatch | undefined>;
	static create(
		manifest: SSRManifest,
		routesList: RoutesList,
		logger: AstroLogger,
		loader: ModuleLoader,
		settings: AstroSettings,
		getDebugInfo: () => Promise<string>,
	): Promise<AstroServerApp>;
	createPipeline(
		_streaming: boolean,
		manifest: SSRManifest,
		settings: AstroSettings,
		logger: AstroLogger,
		loader: ModuleLoader,
		manifestData: RoutesList,
		getDebugInfo: () => Promise<string>,
	): RunnablePipeline;
	/**
	 * Handle a request.
	 * @returns The return value indicates whether or not the request was handled
	 * by this handler. If the result is not `true`, then the request has not
	 * been handled yet and other handlers can be run.
	 */
	handleRequest({
		controller,
		incomingRequest,
		incomingResponse,
		isHttps,
		prerenderOnly,
	}: HandleRequest): Promise<boolean>;
	match(request: Request, _allowPrerenderedRoutes: boolean): RouteData | undefined;
	protected createErrorHandler(): ErrorHandler;
	logRequest({ pathname, method, statusCode, isRewrite, reqTime }: LogRequestPayload): void;
}
type HandleRequest = {
	controller: DevServerController;
	incomingRequest: http.IncomingMessage;
	incomingResponse: http.ServerResponse;
	isHttps: boolean;
	/** When true, only handle prerendered routes. Returns false for SSR routes. */
	prerenderOnly?: boolean;
};
export {};
