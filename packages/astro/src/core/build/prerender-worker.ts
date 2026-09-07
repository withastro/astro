import { parentPort, workerData } from 'node:worker_threads';
import { addStaticImageFactory } from '../../assets/build/add-static-image.js';
import { getStaticImageList } from '../../assets/build/generate.js';
import type { AstroSettings } from '../../types/astro.js';
import type { GetStaticPathsItem } from '../../types/public/common.js';
import type { RouteData } from '../../types/public/internal.js';
import { PAGE_SCRIPT_ID } from '../../vite-plugin-scripts/index.js';
import type { AstroLoggerMessage } from '../logger/core.js';
import { deserializeRouteData } from '../app/manifest.js';
import { renderForPrerender } from '../app/prerender.js';
import { createRequest } from '../request.js';
import { ensureAsyncRenderScope } from '../render-scope/node-scope.js';
import type { BuildApp } from './app.js';
import type { BuildInternals } from './internal.js';
import type { StaticBuildOptions } from './types.js';
import type {
	ParallelPrerenderWorkerData,
	PrerenderWorkerRequest,
	SerializedWorkerError,
} from './parallel-prerenderer.js';

const port = parentPort!;
const data = workerData as ParallelPrerenderWorkerData;

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
				if (message.collectMetadata) ensureAsyncRenderScope();
				const { response, metadata } = await renderForPrerender(app, request, {
					routeData,
					collectMetadata: message.collectMetadata,
				});
				const body =
					response.body === null || (response.status >= 300 && response.status < 400)
						? null
						: await response.arrayBuffer();
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
