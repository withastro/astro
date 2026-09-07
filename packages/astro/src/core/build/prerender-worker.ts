import { parentPort, workerData } from 'node:worker_threads';
import { addStaticImageFactory } from '../../assets/build/add-static-image.js';
import { getStaticImageList } from '../../assets/build/generate.js';
import type { AstroSettings } from '../../types/astro.js';
import type { AstroLoggerMessage } from '../logger/core.js';
import { deserializeRouteData } from '../app/manifest.js';
import { renderForPrerender } from '../app/prerender.js';
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
	const destination = {
		write(message: AstroLoggerMessage) {
			port.postMessage({ type: 'log', message });
		},
	};
	const internals = {
		pagesByKeys: new Map(data.pagesByKeys),
		entrySpecifierToBundleMap: new Map(data.entrySpecifierToBundleMap),
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

	port.on('message', async (message: PrerenderWorkerRequest) => {
		if (message.type === 'collect-images') {
			port.postMessage({ type: 'images', id: message.id, images: getStaticImageList() });
			return;
		}
		if (message.type !== 'render') return;

		try {
			const routeData = deserializeRouteData(JSON.parse(message.routeData));
			const request = new Request(message.url, {
				method: message.method,
				headers: message.headers,
			});
			if (message.staticPath) await app.setStaticPath(routeData, message.staticPath);
			if (message.collectMetadata) ensureAsyncRenderScope();
			const { response, metadata } = await renderForPrerender(app, request, {
				routeData,
				collectMetadata: message.collectMetadata,
			});
			const body = response.body === null ? null : await response.arrayBuffer();
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
				},
				body ? [body] : [],
			);
		} catch (error) {
			port.postMessage({ type: 'render-error', id: message.id, error: serializeError(error) });
		}
	});

	port.postMessage({ type: 'ready' });
}

start().catch((error) => {
	port.postMessage({ type: 'startup-error', error: serializeError(error) });
});
