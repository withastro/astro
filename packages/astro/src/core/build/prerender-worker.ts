import { AsyncLocalStorage } from 'node:async_hooks';
import type { SerializedStaticImage } from '../../assets/types.js';
import { parentPort, workerData } from 'node:worker_threads';
import type { RouteData } from '../../types/public/internal.js';
import { PAGE_SCRIPT_ID } from '../../vite-plugin-scripts/index.js';
import type { AstroLoggerMessage } from '../logger/core.js';
import { deserializeRouteData, serializeRouteData } from '../app/manifest.js';
import { renderForPrerender } from '../app/prerender.js';
import { createRequest } from '../request.js';
import { ensureAsyncRenderScope } from '../render-scope/node-scope.js';
import type { RenderCollectors } from '../render-scope/scope.js';
import type { BuildApp } from './app.js';
import { StaticPaths } from '../../runtime/prerender/static-paths.js';
import type {
	DiscoveredPath,
	ParallelPrerenderWorkerData,
	PrerenderWorkerRequest,
	SerializedWorkerError,
	WorkerMessage,
} from './parallel-prerenderer.js';

const port = parentPort!;
const data = workerData as ParallelPrerenderWorkerData;

const renderScope = ensureAsyncRenderScope();
const workerCollectors = {
	staticImages: [] as SerializedStaticImage[],
	referencedImages: new Set<string>(),
} satisfies RenderCollectors;

function postMessage(message: WorkerMessage, transfer: ArrayBuffer[] = []) {
	const { staticImages, referencedImages } = workerCollectors;
	if (staticImages.length > 0 || referencedImages.size > 0) {
		message.buildMetadata = { staticImages, referencedImages: [...referencedImages] };
		workerCollectors.staticImages = [];
		workerCollectors.referencedImages = new Set();
	}
	port.postMessage(message, transfer);
}

/** Structured cloning silently drops symbol keys, non-enumerable properties and prototypes. */
function isCloneable(value: unknown, seen = new WeakSet<object>()): boolean {
	if (typeof value === 'function' || typeof value === 'symbol') return false;
	if (value === null || typeof value !== 'object') return true;
	if (seen.has(value)) return true;
	seen.add(value);
	for (const key of Reflect.ownKeys(value)) {
		if (typeof key === 'symbol') return false;
		if (Array.isArray(value) && key === 'length') continue;
		if (!Object.prototype.propertyIsEnumerable.call(value, key)) return false;
	}
	if (
		value instanceof Date ||
		value instanceof RegExp ||
		value instanceof ArrayBuffer ||
		ArrayBuffer.isView(value)
	) {
		return true;
	}
	if (value instanceof Map) {
		for (const [key, entry] of value) {
			if (!isCloneable(key, seen) || !isCloneable(entry, seen)) return false;
		}
		return true;
	}
	if (value instanceof Set) {
		for (const entry of value) {
			if (!isCloneable(entry, seen)) return false;
		}
		return true;
	}
	const prototype = Object.getPrototypeOf(value);
	if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null) return false;
	return Object.values(value).every((entry) => isCloneable(entry, seen));
}

function serializeError(error: unknown): SerializedWorkerError {
	if (!(error instanceof Error)) return { message: String(error) };
	const record = error as Error & Record<string, unknown>;
	return {
		message: error.message,
		name: error.name,
		stack: error.stack,
		type: typeof record.type === 'string' ? record.type : undefined,
		title: typeof record.title === 'string' ? record.title : undefined,
		hint: typeof record.hint === 'string' ? record.hint : undefined,
		frame: typeof record.frame === 'string' ? record.frame : undefined,
		loc: record.loc,
		id: typeof record.id === 'string' ? record.id : undefined,
	};
}

async function start() {
	const { app } = (await import(data.entryUrl)) as { app: BuildApp };
	const logStore = new AsyncLocalStorage<AstroLoggerMessage[]>();
	app.setInternals({
		pagesByKeys: new Map(data.pagesByKeys),
		entrySpecifierToBundleMap: new Map(
			data.pageScript ? [[PAGE_SCRIPT_ID, data.pageScript]] : undefined,
		),
	});
	app.setOptions({
		settings: { scripts: data.scripts },
		logger: {
			options: {
				destination: {
					write(message) {
						const logs = logStore.getStore();
						if (logs) logs.push(message);
						else postMessage({ type: 'logs', logs: [message] });
					},
				},
			},
		},
	});
	const routes = new Map<number, RouteData>();

	async function discover(id: number, logs: AstroLoggerMessage[]) {
		const { paths, metadata } = await new StaticPaths(app).getAllWithMetadata();
		const routeIds = new Map<RouteData, number>();
		const discoveredRoutes: Array<{ id: number; data: string }> = [];
		const discoveredPaths = paths.map(({ pathname, route, cacheKey }): DiscoveredPath => {
			let routeId = routeIds.get(route);
			if (routeId === undefined) {
				routeId = routeIds.size + 1;
				routeIds.set(route, routeId);
				routes.set(routeId, route);
				discoveredRoutes.push({
					id: routeId,
					data: JSON.stringify(serializeRouteData(route, app.manifest.trailingSlash)),
				});
			}
			const staticPath = app.routeCache.get(route)?.staticPaths.keyed.get(pathname);
			return {
				pathname,
				routeId,
				cacheKey,
				staticPath: staticPath && isCloneable(staticPath) ? staticPath : undefined,
			};
		});
		postMessage({
			type: 'paths',
			id,
			paths: discoveredPaths,
			routes: discoveredRoutes,
			metadata,
			logs,
		});
	}

	async function render(
		{
			id,
			url,
			routeId,
			routeData,
			staticPath,
		}: Extract<PrerenderWorkerRequest, { type: 'render' }>,
		logs: AstroLoggerMessage[],
	) {
		if (routeData !== undefined) routes.set(routeId, deserializeRouteData(JSON.parse(routeData)));
		const route = routes.get(routeId)!;
		if (staticPath) await app.addStaticPath(route, staticPath);
		const request = createRequest({
			url,
			headers: {},
			logger: app.logger,
			isPrerendered: true,
			routePattern: route.component,
		});
		const { response, metadata } = await renderForPrerender(app, request, { routeData: route });
		const body = response.body === null ? null : await response.arrayBuffer();
		postMessage(
			{
				type: 'result',
				id,
				response: {
					body,
					status: response.status,
					statusText: response.statusText,
					headers: [...response.headers],
				},
				metadata,
				logs,
			},
			body ? [body] : [],
		);
	}

	async function handle(message: PrerenderWorkerRequest, logs: AstroLoggerMessage[]) {
		try {
			if (message.type === 'discover') await discover(message.id, logs);
			else await render(message, logs);
		} catch (error) {
			postMessage({ type: 'error', id: message.id, error: serializeError(error), logs });
		}
	}

	port.on('message', (message: PrerenderWorkerRequest) => {
		const logs: AstroLoggerMessage[] = [];
		void renderScope.run(workerCollectors, () => logStore.run(logs, () => handle(message, logs)));
	});
	postMessage({ type: 'ready' });
}

renderScope.run(workerCollectors, start).catch((error) => {
	postMessage({ type: 'startup-error', error: serializeError(error) });
});
