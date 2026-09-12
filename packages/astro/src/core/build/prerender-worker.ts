import fs from 'node:fs';
import { parentPort, workerData } from 'node:worker_threads';
import { addStaticImageFactory } from '../../assets/build/add-static-image.js';
import { getStaticImageList } from '../../assets/build/generate.js';
import type { AstroSettings } from '../../types/astro.js';
import type { GetStaticPathsItem } from '../../types/public/common.js';
import type { RouteData } from '../../types/public/internal.js';
import { PAGE_SCRIPT_ID } from '../../vite-plugin-scripts/index.js';
import type { AstroLoggerMessage } from '../logger/core.js';
import { deserializeRouteData, serializeRouteData } from '../app/manifest.js';
import { renderForPrerender } from '../app/prerender.js';
import { createRequest } from '../request.js';
import { collectPrerenderMetadata } from '../render-scope/collect.js';
import { ensureAsyncRenderScope } from '../render-scope/node-scope.js';
import type { BuildApp } from './app.js';
import type { BuildInternals } from './internal.js';
import { StaticPaths } from '../../runtime/prerender/static-paths.js';
import type { StaticBuildOptions } from './types.js';
import type {
	ParallelPrerenderWorkerData,
	PrerenderWorkerRequest,
	SerializedWorkerError,
} from './parallel-prerenderer.js';

const port = parentPort!;
const data = workerData as ParallelPrerenderWorkerData;
const WORKER_WRITE_THRESHOLD = 256 * 1024;

function isPortable(value: unknown, seen = new WeakSet<object>()): boolean {
	if (value === null || typeof value !== 'object') {
		return !['function', 'symbol'].includes(typeof value);
	}
	if (seen.has(value)) return true;
	seen.add(value);
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
			if (!isPortable(key, seen) || !isPortable(entry, seen)) return false;
		}
		return true;
	}
	if (value instanceof Set) {
		for (const entry of value) {
			if (!isPortable(entry, seen)) return false;
		}
		return true;
	}
	if (Array.isArray(value)) return value.every((entry) => isPortable(entry, seen));
	const prototype = Object.getPrototypeOf(value);
	if (prototype !== Object.prototype && prototype !== null) return false;
	for (const key of Object.keys(value)) {
		if (!isPortable(Reflect.get(value, key), seen)) return false;
	}
	return true;
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
	const entry = await import(data.entryUrl);
	const app = entry.app as BuildApp;
	let logs: AstroLoggerMessage[] = [];
	const destination = {
		write(message: AstroLoggerMessage) {
			logs.push(message);
		},
	};
	const internals = {
		pagesByKeys: new Map(data.pagesByKeys),
		entrySpecifierToBundleMap: new Map(
			data.pageScript ? [[PAGE_SCRIPT_ID, data.pageScript]] : undefined,
		),
	} as BuildInternals;
	const settings = {
		scripts: data.scripts,
		config: {
			base: data.image.base,
			build: {
				assets: data.image.assets,
				assetsPrefix: data.image.assetsPrefix,
			},
			image: { service: { entrypoint: data.image.serviceEntrypoint } },
		},
		adapter: data.image.assetQueryParams
			? { client: { assetQueryParams: new URLSearchParams(data.image.assetQueryParams) } }
			: undefined,
	} as AstroSettings;
	const options = {
		settings,
		logger: { options: { destination } },
	} as StaticBuildOptions;
	globalThis.astroAsset ??= { referencedImages: new Set() };
	globalThis.astroAsset.addStaticImage = addStaticImageFactory(settings);
	app.setInternals(internals);
	app.setOptions(options);
	const routes = new Map<number, RouteData>();

	port.on('message', async (message: PrerenderWorkerRequest) => {
		if (message.type === 'discover') {
			logs = [];
			try {
				const paths = await new StaticPaths(app).getAll(data.discoveryConcurrency);
				const routeIds = new WeakMap<RouteData, number>();
				const discoveredRoutes: Array<{ id: number; data: string }> = [];
				const portableStaticPaths = new Map<RouteData, Set<GetStaticPathsItem>>();
				const discoveredPaths = paths.map(({ pathname, route, cacheKey }) => {
					let routeId = routeIds.get(route);
					if (routeId === undefined) {
						routeId = discoveredRoutes.length + 1;
						routeIds.set(route, routeId);
						routes.set(routeId, route);
						discoveredRoutes.push({
							id: routeId,
							data: JSON.stringify(serializeRouteData(route, app.manifest.trailingSlash)),
						});
					}
					const staticPath = app.routeCache.get(route)?.staticPaths.keyed.get(pathname);
					const portable = staticPath !== undefined && isPortable(staticPath);
					if (portable) {
						let routeStaticPaths = portableStaticPaths.get(route);
						if (!routeStaticPaths) {
							routeStaticPaths = new Set();
							portableStaticPaths.set(route, routeStaticPaths);
						}
						routeStaticPaths.add(staticPath);
					}
					return {
						pathname,
						routeId,
						cacheKey,
						staticPath: portable ? staticPath : undefined,
						localStaticPath: !route.pathname && !portable,
					};
				});
				port.postMessage({
					type: 'paths',
					id: message.id,
					paths: discoveredPaths,
					routes: discoveredRoutes,
					logs,
				});
				for (const [route, staticPaths] of portableStaticPaths) {
					app.deleteStaticPaths(route, staticPaths);
				}
			} catch (error) {
				port.postMessage({
					type: 'render-error',
					id: message.id,
					error: serializeError(error),
					logs,
				});
			}
			return;
		}
		if (message.type === 'collect-images') {
			port.postMessage({ type: 'images', id: message.id, images: getStaticImageList() });
			return;
		}
		if (message.type !== 'render') return;

		logs = [];
		try {
			if (message.routeData !== undefined) {
				routes.set(message.routeId, deserializeRouteData(JSON.parse(message.routeData)));
			}
			const routeData = routes.get(message.routeId)!;
			const request = createRequest({
				url: message.url,
				headers: {},
				logger: app.logger,
				isPrerendered: true,
				routePattern: routeData.component,
			});
			let staticPathSet = false;
			let previousStaticPath: GetStaticPathsItem | undefined;
			try {
				if (message.staticPath) {
					previousStaticPath = await app.setStaticPath(routeData, message.staticPath);
					staticPathSet = true;
				}
				let response: Response;
				let metadata;
				let body: ArrayBuffer | null = null;
				let written = false;
				if (message.outFile) {
					const render = async () => {
						const rendered = await app.render(request, { routeData });
						if (rendered.body !== null && !(rendered.status >= 300 && rendered.status < 400)) {
							body = await rendered.arrayBuffer();
							if (body.byteLength >= WORKER_WRITE_THRESHOLD) {
								const outFile = new URL(message.outFile!);
								await fs.promises.mkdir(new URL('./', outFile), { recursive: true });
								await fs.promises.writeFile(outFile, new Uint8Array(body));
								body = null;
								written = true;
							}
						}
						return rendered;
					};
					if (message.collectMetadata) {
						ensureAsyncRenderScope();
						const collected = await collectPrerenderMetadata(render, app.logger);
						response = collected.value;
						metadata = collected.metadata;
					} else {
						response = await render();
					}
				} else {
					if (message.collectMetadata) ensureAsyncRenderScope();
					const rendered = await renderForPrerender(app, request, {
						routeData,
						collectMetadata: message.collectMetadata,
					});
					response = rendered.response;
					metadata = rendered.metadata;
					body =
						response.body === null || (response.status >= 300 && response.status < 400)
							? null
							: await response.arrayBuffer();
				}
				if (staticPathSet) {
					app.deleteStaticPath(routeData, message.staticPath!, previousStaticPath);
					staticPathSet = false;
				}
				port.postMessage(
					{
						type: 'result',
						id: message.id,
						response: {
							body,
							written,
							status: response.status,
							statusText: response.statusText,
							headers: [...response.headers],
						},
						metadata,
						logs,
					},
					body ? [body] : [],
				);
			} finally {
				if (staticPathSet) {
					app.deleteStaticPath(routeData, message.staticPath!, previousStaticPath);
				}
			}
		} catch (error) {
			port.postMessage({
				type: 'render-error',
				id: message.id,
				error: serializeError(error),
				logs,
			});
		}
	});

	port.postMessage({ type: 'ready' });
}

start().catch((error) => {
	port.postMessage({ type: 'startup-error', error: serializeError(error) });
});
