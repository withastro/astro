import type { LoggerLevel } from '../logger/core.js';
import type { BuildInternals } from './internal.js';
import type { SerializedRouteCache } from '../render/route-cache.js';
import type { SerializedAssetsPayload } from './prerender-assets.js';
import type { AstroSettings, RoutesList } from '../../types/astro.js';
import type { RuntimeMode } from '../../types/public/config.js';

export type WorkerSettings = Pick<AstroSettings, 'scripts'>;

export interface WorkerBuildOptions {
	settings: WorkerSettings;
	routesList: RoutesList;
	runtimeMode: RuntimeMode;
	origin: string;
	logLevel: LoggerLevel;
}

export interface PrerenderWorkerInitMessage {
	type: 'init';
	id: number;
	prerenderEntryUrl: string;
	internals: BuildInternals;
	options: WorkerBuildOptions;
	routeCache?: SerializedRouteCache;
}

export interface PrerenderWorkerInitResult {
	type: 'initResult';
	id: number;
}

export interface PrerenderWorkerGetStaticPathsMessage {
	type: 'getStaticPaths';
	id: number;
}

export interface PrerenderWorkerStaticPathsResult {
	type: 'staticPaths';
	id: number;
	paths: Array<{ pathname: string; routeKey: string }>;
	routeCache: SerializedRouteCache;
}

export interface PrerenderWorkerRenderMessage {
	type: 'render';
	id: number;
	url: string;
	routeKey: string;
}

export interface PrerenderWorkerRenderResult {
	type: 'renderResult';
	id: number;
	status: number;
	headers: Array<[string, string]>;
	body: Uint8Array | null;
	assets: SerializedAssetsPayload;
}

export interface SerializedError {
	message: string;
	name?: string;
	stack?: string;
}

export interface PrerenderWorkerError {
	type: 'error';
	id: number;
	error: SerializedError;
}

export type PrerenderWorkerIncomingMessage =
	| PrerenderWorkerInitMessage
	| PrerenderWorkerGetStaticPathsMessage
	| PrerenderWorkerRenderMessage;

export type PrerenderWorkerOutgoingMessage =
	| PrerenderWorkerInitResult
	| PrerenderWorkerStaticPathsResult
	| PrerenderWorkerRenderResult
	| PrerenderWorkerError;
