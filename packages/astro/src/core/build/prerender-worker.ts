import { parentPort } from 'node:worker_threads';
import { createRequest } from '../request.js';
import { StaticPaths } from '../../runtime/prerender/static-paths.js';
import { Logger } from '../logger/core.js';
import { consoleLogDestination } from '../logger/console.js';
import type { BuildApp } from './app.js';
import type { BuildRenderOptions } from './types.js';
import type { RouteData } from '../../types/public/internal.js';
import type { AstroSettings } from '../../types/astro.js';
import { getRouteCacheKey, hydrateRouteCache, serializeRouteCache } from '../render/route-cache.js';
import { collectSerializedAssets, resetSerializedAssets } from './prerender-assets.js';
import type {
	PrerenderWorkerIncomingMessage,
	PrerenderWorkerOutgoingMessage,
	PrerenderWorkerInitMessage,
	PrerenderWorkerGetStaticPathsMessage,
	PrerenderWorkerRenderMessage,
} from './prerender-worker-messages.js';
import assert from 'node:assert/strict';

assert.ok(parentPort, 'Prerender worker must be started with a parent port.');

let app: BuildApp | undefined;
let options: BuildRenderOptions | undefined;
let routeMap: Map<string, RouteData> | undefined;

async function initialize(message: PrerenderWorkerInitMessage) {
	const prerenderEntry = await import(message.prerenderEntryUrl);
	const workerLogger = new Logger({
		dest: consoleLogDestination,
		level: message.options.logLevel,
	});
	options = {
		settings: message.options.settings as AstroSettings,
		routesList: message.options.routesList,
		runtimeMode: message.options.runtimeMode,
		origin: message.options.origin,
		pageNames: [],
		logger: workerLogger,
	};

	app = prerenderEntry.app as BuildApp;
	app.setInternals(message.internals);
	app.setOptions(options);

	const routes = app.pipeline.getRoutes();
	routeMap = new Map(routes.map((route) => [getRouteCacheKey(route), route]));

	if (message.routeCache) {
		hydrateRouteCache(app.pipeline.routeCache, message.routeCache);
		app.pipeline.routeCache.seal();
	}
}

function serializeError(error: unknown) {
	if (error instanceof Error) {
		return {
			message: error.message,
			name: error.name,
			stack: error.stack,
		};
	}
	return { message: String(error) };
}

async function handleGetStaticPaths(_message: PrerenderWorkerGetStaticPathsMessage) {
	assert.ok(app, 'Prerender worker not initialized.');
	const staticPaths = new StaticPaths(app);
	const paths = await staticPaths.getAll();
	const routeCache = serializeRouteCache(app.pipeline.routeCache);
	app.pipeline.routeCache.seal();

	return {
		paths: paths.map((path) => ({
			pathname: path.pathname,
			routeKey: getRouteCacheKey(path.route),
		})),
		routeCache,
	};
}

async function handleRender(message: PrerenderWorkerRenderMessage) {
	assert.ok(app && options && routeMap, 'Prerender worker not initialized.');
	const route = routeMap.get(message.routeKey);
	assert.ok(route, `Unknown route key: ${message.routeKey}`);

	const request = createRequest({
		url: message.url,
		headers: new Headers(),
		logger: options.logger,
		isPrerendered: true,
		routePattern: route.component,
	});

	const response = await app.render(request, { routeData: route });
	const body = response.body ? new Uint8Array(await response.arrayBuffer()) : null;
	const headers = Array.from(response.headers.entries());

	const assets = collectSerializedAssets();
	resetSerializedAssets();

	return {
		status: response.status,
		headers,
		body,
		assets,
	};
}

parentPort.on('message', async (rawMessage: PrerenderWorkerIncomingMessage) => {
	try {
		assert.ok(parentPort);
		switch (rawMessage.type) {
			case 'init': {
				await initialize(rawMessage);
				const response: PrerenderWorkerOutgoingMessage = {
					type: 'initResult',
					id: rawMessage.id,
				};
				parentPort.postMessage(response);
				break;
			}
			case 'getStaticPaths': {
				const result = await handleGetStaticPaths(rawMessage);
				const response: PrerenderWorkerOutgoingMessage = {
					type: 'staticPaths',
					id: rawMessage.id,
					paths: result.paths,
					routeCache: result.routeCache,
				};
				parentPort.postMessage(response);
				break;
			}
			case 'render': {
				const result = await handleRender(rawMessage);
				const response: PrerenderWorkerOutgoingMessage = {
					type: 'renderResult',
					id: rawMessage.id,
					status: result.status,
					headers: result.headers,
					body: result.body,
					assets: result.assets,
				};
				parentPort.postMessage(response);
				break;
			}
			default: {
				const message = rawMessage as unknown;
				const messageType =
					typeof message === 'object' && message != null && 'type' in message
						? message.type
						: message?.toString();
				throw new Error(`Unknown message type: ${messageType}`);
			}
		}
	} catch (error) {
		const response: PrerenderWorkerOutgoingMessage = {
			type: 'error',
			id: rawMessage.id,
			error: serializeError(error),
		};
		assert.ok(parentPort);
		parentPort.postMessage(response);
	}
});
