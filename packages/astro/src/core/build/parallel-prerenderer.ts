import { Worker } from 'node:worker_threads';
import type { AssetsGlobalStaticImagesList } from '../../assets/types.js';
import type { AstroSettings } from '../../types/astro.js';
import type { GetStaticPathsItem } from '../../types/public/common.js';
import type {
	AstroPrerenderer,
	PathWithRoute,
	PrerenderRenderMetadata,
	PrerenderResult,
} from '../../types/public/integrations.js';
import type { SerializedRouteData } from '../../types/astro.js';
import { serializeRouteData } from '../app/manifest.js';
import type { AstroLoggerMessage } from '../logger/core.js';
import { removeBase } from '../path.js';
import { getParams } from '../render/params-and-props.js';
import { stringifyParams } from '../routing/params.js';
import type { DefaultPrerenderer } from './default-prerenderer.js';
import type { BuildInternals } from './internal.js';
import { assignRouteWorkers } from './parallel-prerender-affinity.js';
import type { StaticBuildOptions } from './types.js';

export interface ParallelPrerenderWorkerData {
	entryUrl: string;
	pagesByKeys: Array<[string, { styles: unknown[] }]>;
	entrySpecifierToBundleMap: Array<[string, string]>;
	scripts: AstroSettings['scripts'];
	image: {
		base: string;
		assets: string;
		assetsPrefix: AstroSettings['config']['build']['assetsPrefix'];
		serviceEntrypoint: string;
		assetQueryParams?: [string, string][];
	};
}

export interface SerializedWorkerError {
	message: string;
	name?: string;
	stack?: string;
	type?: string;
	title?: string;
	hint?: string;
	frame?: string;
	loc?: unknown;
	id?: string;
}

interface RenderWorkerRequest {
	type: 'render';
	id: number;
	url: string;
	method: string;
	headers: [string, string][];
	routeData: string;
	collectMetadata: boolean;
	staticPath?: GetStaticPathsItem;
}

interface CollectImagesWorkerRequest {
	type: 'collect-images';
	id: number;
}

export type PrerenderWorkerRequest = RenderWorkerRequest | CollectImagesWorkerRequest;

interface SerializedResponse {
	body: ArrayBuffer | null;
	status: number;
	statusText: string;
	headers: [string, string][];
}

type WorkerMessage =
	| { type: 'ready' }
	| { type: 'log'; message: AstroLoggerMessage }
	| { type: 'startup-error'; error: SerializedWorkerError }
	| {
			type: 'result';
			id: number;
			response: SerializedResponse;
			metadata?: PrerenderRenderMetadata;
	  }
	| { type: 'render-error'; id: number; error: SerializedWorkerError }
	| { type: 'images'; id: number; images: AssetsGlobalStaticImagesList };

interface RenderJob {
	request: Omit<RenderWorkerRequest, 'id'>;
	eligibleWorkers?: Set<number>;
	queuedAt: number;
	resolve: (result: PrerenderResult) => void;
	reject: (error: Error) => void;
}

interface WorkerState {
	index: number;
	worker: Worker;
	idle: boolean;
	failed: boolean;
}

interface InFlightRequest {
	worker: WorkerState;
	resolve: (value: any) => void;
	reject: (error: Error) => void;
}

interface ParallelPrerendererOptions {
	defaultPrerenderer: DefaultPrerenderer;
	internals: BuildInternals;
	options: StaticBuildOptions;
	prerenderOutputDir: URL;
}

const AFFINITY_FALLBACK_MS = 500;

function deserializeError(serialized: SerializedWorkerError): Error {
	const error = new Error(serialized.message);
	Object.assign(error, serialized);
	return error;
}

class PrerenderWorkerPool {
	#workers: WorkerState[] = [];
	#queue: RenderJob[] = [];
	#inFlight = new Map<number, InFlightRequest>();
	#nextId = 1;
	#routeWorkers = new Map<string, Set<number>>();
	#fallbackTimer: ReturnType<typeof setTimeout> | undefined;
	#closing = false;
	private readonly workerCount: number;
	private readonly workerData: ParallelPrerenderWorkerData;
	private readonly destination: StaticBuildOptions['logger']['options']['destination'];

	constructor(
		workerCount: number,
		workerData: ParallelPrerenderWorkerData,
		destination: StaticBuildOptions['logger']['options']['destination'],
	) {
		this.workerCount = workerCount;
		this.workerData = workerData;
		this.destination = destination;
	}

	async start() {
		try {
			await Promise.all(
				Array.from({ length: this.workerCount }, (_, index) => this.#startWorker(index)),
			);
		} catch (error) {
			await this.close();
			throw error;
		}
	}

	setRoutes(paths: PathWithRoute[], routeUniqueBytes: Map<string, number>) {
		this.#routeWorkers = assignRouteWorkers(paths, routeUniqueBytes, this.workerCount);
	}

	render(
		request: Request,
		routeData: SerializedRouteData,
		collectMetadata: boolean,
		staticPath?: GetStaticPathsItem,
	): Promise<PrerenderResult> {
		return new Promise((resolve, reject) => {
			this.#queue.push({
				request: {
					type: 'render',
					url: request.url,
					method: request.method,
					headers: [...request.headers],
					routeData: JSON.stringify(routeData),
					collectMetadata,
					staticPath,
				},
				eligibleWorkers: this.#routeWorkers.get(routeData.component),
				queuedAt: performance.now(),
				resolve,
				reject,
			});
			this.#pump();
		});
	}

	async collectStaticImages(): Promise<AssetsGlobalStaticImagesList> {
		const lists = await Promise.all(
			this.#workers.filter((state) => !state.failed).map((state) => this.#collectImages(state)),
		);
		const merged: AssetsGlobalStaticImagesList = new Map();
		for (const list of lists) {
			for (const [path, entry] of list) {
				const existing = merged.get(path);
				if (!existing) {
					merged.set(path, entry);
					continue;
				}
				for (const [hash, transform] of entry.transforms) {
					if (!existing.transforms.has(hash)) existing.transforms.set(hash, transform);
				}
			}
		}
		return merged;
	}

	async close() {
		this.#closing = true;
		if (this.#fallbackTimer) clearTimeout(this.#fallbackTimer);
		const error = new Error('The parallel prerender worker pool was closed');
		for (const job of this.#queue.splice(0)) job.reject(error);
		for (const request of this.#inFlight.values()) request.reject(error);
		this.#inFlight.clear();
		await Promise.all(this.#workers.map(({ worker }) => worker.terminate()));
		this.#workers = [];
	}

	async #startWorker(index: number) {
		const worker = new Worker(new URL('./prerender-worker.js', import.meta.url), {
			workerData: this.workerData,
		});
		const state: WorkerState = { index, worker, idle: false, failed: false };
		this.#workers.push(state);

		await new Promise<void>((resolve, reject) => {
			let starting = true;
			worker.on('message', (message: WorkerMessage) => {
				if (message.type === 'ready') {
					starting = false;
					state.idle = true;
					resolve();
					this.#pump();
					return;
				}
				if (message.type === 'startup-error') {
					starting = false;
					state.failed = true;
					reject(deserializeError(message.error));
					return;
				}
				this.#handleMessage(state, message);
			});
			worker.on('error', (error) => {
				if (starting) {
					starting = false;
					reject(error);
				}
				this.#failWorker(state, error);
			});
			worker.on('exit', (code) => {
				if (starting) {
					starting = false;
					reject(new Error(`Parallel prerender worker exited during setup with code ${code}`));
				}
				if (!this.#closing) {
					this.#failWorker(
						state,
						new Error(`Parallel prerender worker exited unexpectedly with code ${code}`),
					);
				}
			});
		});
	}

	#handleMessage(state: WorkerState, message: WorkerMessage) {
		if (message.type === 'log') {
			this.destination.write(message.message);
			return;
		}
		if (message.type === 'ready' || message.type === 'startup-error') return;
		const request = this.#inFlight.get(message.id);
		if (!request) return;
		this.#inFlight.delete(message.id);
		state.idle = true;
		if (message.type === 'render-error') {
			request.reject(deserializeError(message.error));
		} else if (message.type === 'images') {
			request.resolve(message.images);
		} else {
			const { body, ...init } = message.response;
			request.resolve({
				response: new Response(body === null ? null : new Uint8Array(body), init),
				metadata: message.metadata,
			});
		}
		this.#pump();
	}

	#failWorker(state: WorkerState, error: Error) {
		if (state.failed) return;
		state.failed = true;
		state.idle = false;
		for (const [id, request] of this.#inFlight) {
			if (request.worker !== state) continue;
			this.#inFlight.delete(id);
			request.reject(error);
		}
		if (this.#workers.every((worker) => worker.failed)) {
			for (const job of this.#queue.splice(0)) job.reject(error);
		}
		this.#pump();
	}

	#pump() {
		if (this.#closing || this.#queue.length === 0) return;
		if (this.#fallbackTimer) {
			clearTimeout(this.#fallbackTimer);
			this.#fallbackTimer = undefined;
		}

		for (const state of this.#workers) {
			if (!state.idle || state.failed) continue;
			let jobIndex = this.#queue.findIndex(
				(job) => !job.eligibleWorkers || job.eligibleWorkers.has(state.index),
			);
			if (jobIndex === -1) {
				jobIndex = this.#queue.findIndex(
					(job) => performance.now() - job.queuedAt >= AFFINITY_FALLBACK_MS,
				);
			}
			if (jobIndex === -1) continue;

			const [job] = this.#queue.splice(jobIndex, 1);
			const id = this.#nextId++;
			state.idle = false;
			this.#inFlight.set(id, { worker: state, resolve: job.resolve, reject: job.reject });
			state.worker.postMessage({ ...job.request, id });
		}

		if (this.#queue.length > 0 && this.#workers.some((worker) => worker.idle && !worker.failed)) {
			const wait = Math.max(
				0,
				Math.min(
					...this.#queue.map((job) => AFFINITY_FALLBACK_MS - (performance.now() - job.queuedAt)),
				),
			);
			this.#fallbackTimer = setTimeout(() => this.#pump(), wait);
		}
	}

	#collectImages(state: WorkerState): Promise<AssetsGlobalStaticImagesList> {
		return new Promise((resolve, reject) => {
			const id = this.#nextId++;
			state.idle = false;
			this.#inFlight.set(id, { worker: state, resolve, reject });
			state.worker.postMessage({ type: 'collect-images', id } satisfies CollectImagesWorkerRequest);
		});
	}
}

export function createParallelPrerenderer({
	defaultPrerenderer,
	internals,
	options,
	prerenderOutputDir,
}: ParallelPrerendererOptions): AstroPrerenderer {
	let pool: PrerenderWorkerPool | undefined;
	const staticPaths = new Map<string, GetStaticPathsItem>();
	return {
		name: 'astro:parallel',
		async setup() {
			await defaultPrerenderer.setup?.();
			const entryFileName = internals.prerenderEntryFileName!;
			const workerCount = Math.max(1, Math.floor(options.settings.config.build.concurrency));
			pool = new PrerenderWorkerPool(
				workerCount,
				{
					entryUrl: new URL(entryFileName, prerenderOutputDir).toString(),
					pagesByKeys: [...internals.pagesByKeys].map(([key, page]) => [
						key,
						{ styles: page.styles },
					]),
					entrySpecifierToBundleMap: [...internals.entrySpecifierToBundleMap],
					scripts: options.settings.scripts,
					image: {
						base: options.settings.config.base,
						assets: options.settings.config.build.assets,
						assetsPrefix: options.settings.config.build.assetsPrefix,
						serviceEntrypoint: options.settings.config.image.service.entrypoint,
						assetQueryParams: options.settings.adapter?.client?.assetQueryParams
							? [...options.settings.adapter.client.assetQueryParams]
							: undefined,
					},
				},
				options.logger.options.destination,
			);
			await pool.start();
		},
		async getStaticPaths() {
			const paths = await defaultPrerenderer.getStaticPaths();
			for (const { pathname, route } of paths) {
				const item = defaultPrerenderer.app?.routeCache.get(route)?.staticPaths.keyed.get(pathname);
				if (!item) continue;
				try {
					staticPaths.set(`${route.component}:${pathname}`, structuredClone(item));
				} catch {
					// Props containing functions cannot cross isolates, so the worker evaluates getStaticPaths itself.
				}
			}
			pool!.setRoutes(paths, internals.prerenderRouteUniqueBytes ?? new Map());
			return paths;
		},

		async render(request, { routeData, collectMetadata }) {
			const pathname = stringifyParams(
				getParams(
					routeData,
					removeBase(new URL(request.url).pathname, options.settings.config.base),
				),
				routeData,
				options.settings.config.trailingSlash,
			);
			return pool!.render(
				request,
				serializeRouteData(routeData, options.settings.config.trailingSlash),
				collectMetadata ?? false,
				staticPaths.get(`${routeData.component}:${pathname}`),
			);
		},
		async collectStaticImages() {
			const images = await pool!.collectStaticImages();
			if (images.size > 0 && !globalThis.astroAsset?.imageService) {
				globalThis.astroAsset ??= { referencedImages: new Set() };
				globalThis.astroAsset.imageService = await defaultPrerenderer.loadImageService!();
			}
			return images;
		},
		async teardown() {
			await pool?.close();
			await defaultPrerenderer.teardown?.();
		},
	};
}
