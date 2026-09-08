import { Worker } from 'node:worker_threads';
import type { AssetsGlobalStaticImagesList } from '../../assets/types.js';
import type { AstroSettings } from '../../types/astro.js';
import type { GetStaticPathsItem } from '../../types/public/common.js';
import { PAGE_SCRIPT_ID } from '../../vite-plugin-scripts/index.js';
import type {
	AstroPrerenderer,
	PathWithRoute,
	PrerenderRenderMetadata,
	PrerenderResult,
} from '../../types/public/integrations.js';
import { deserializeRouteData, serializeRouteData } from '../app/manifest.js';
import type { AstroLoggerMessage } from '../logger/core.js';
import { removeBase } from '../path.js';
import { getParams } from '../render/params-and-props.js';
import { stringifyParams } from '../routing/params.js';
import type { BuildInternals } from './internal.js';
import { assignRouteWorkers } from './parallel-prerender-affinity.js';
import type { StaticBuildOptions } from './types.js';

export interface ParallelPrerenderWorkerData {
	entryUrl: string;
	discoveryConcurrency: number;
	pagesByKeys: Array<[string, { styles: unknown[] }]>;
	pageScript?: string;
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
	outFile?: string;
	routeId: number;
	routeData?: string;
	collectMetadata: boolean;
	staticPath?: GetStaticPathsItem;
}

interface DiscoverWorkerRequest {
	type: 'discover';
	id: number;
}

interface CollectImagesWorkerRequest {
	type: 'collect-images';
	id: number;
}

export type PrerenderWorkerRequest =
	| RenderWorkerRequest
	| DiscoverWorkerRequest
	| CollectImagesWorkerRequest;

interface SerializedResponse {
	body: ArrayBuffer | null;
	written: boolean;
	status: number;
	statusText: string;
	headers: [string, string][];
}

interface DiscoveredRoute {
	id: number;
	data: string;
}

interface DiscoveredPath {
	pathname: string;
	routeId: number;
	cacheKey?: string;
	staticPath?: GetStaticPathsItem;
	localStaticPath: boolean;
}

type WorkerMessage =
	| { type: 'ready' }
	| { type: 'startup-error'; error: SerializedWorkerError }
	| {
			type: 'paths';
			id: number;
			paths: DiscoveredPath[];
			routes: DiscoveredRoute[];
			logs: AstroLoggerMessage[];
	  }
	| {
			type: 'result';
			id: number;
			response: SerializedResponse;
			metadata?: PrerenderRenderMetadata;
			logs: AstroLoggerMessage[];
	  }
	| {
			type: 'render-error';
			id: number;
			error: SerializedWorkerError;
			logs: AstroLoggerMessage[];
	  }
	| { type: 'images'; id: number; images: AssetsGlobalStaticImagesList };

interface RenderJob {
	request: Omit<RenderWorkerRequest, 'id'>;
	eligibleWorkers?: Set<number>;
	localOnly: boolean;
	queuedAt: number;
	resolve: (result: PrerenderResult) => void;
	reject: (error: Error) => void;
}

interface WorkerState {
	index: number;
	worker: Worker;
	idle: boolean;
	failed: boolean;
	routes: Set<number>;
}

interface InFlightRequest {
	worker: WorkerState;
	resolve: (value: any) => void;
	reject: (error: Error) => void;
}

interface ParallelPrerendererOptions {
	internals: BuildInternals;
	options: StaticBuildOptions;
	prerenderOutputDir: URL;
}

export interface ParallelPrerenderer extends AstroPrerenderer {
	renderToFile: (
		request: Request,
		options: {
			routeData: RouteData;
			pathname: string;
			outFile: URL;
			collectMetadata: boolean;
		},
	) => Promise<PrerenderResult>;
}

interface CompletedResponse {
	body?: ArrayBuffer;
	written: boolean;
}

const AFFINITY_FALLBACK_MS = 100;
const completedResponses = new WeakMap<Response, CompletedResponse>();

export function takeCompletedResponse(response: Response): CompletedResponse | undefined {
	const completed = completedResponses.get(response);
	completedResponses.delete(response);
	return completed;
}

export function isParallelPrerenderer(
	prerenderer: AstroPrerenderer,
): prerenderer is ParallelPrerenderer {
	return typeof Reflect.get(prerenderer, 'renderToFile') === 'function';
}

function deserializeError(serialized: SerializedWorkerError): Error {
	const error = new Error(serialized.message);
	Object.assign(error, serialized);
	return error;
}

function isDataCloneError(error: unknown): boolean {
	return (
		typeof error === 'object' && error !== null && Reflect.get(error, 'name') === 'DataCloneError'
	);
}

class PrerenderWorkerPool {
	#workers: WorkerState[] = [];
	#queue: RenderJob[] = [];
	#inFlight = new Map<number, InFlightRequest>();
	#nextId = 1;
	#nextRouteId = 1;
	#routeIds = new Map<string, number>();
	#routeWorkers = new Map<string, Set<number>>();
	#staticPaths = new Map<string, GetStaticPathsItem>();
	#localStaticPaths = new Set<string>();
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

	async getStaticPaths(): Promise<PathWithRoute[]> {
		const state = this.#workers[0];
		const result = await new Promise<Extract<WorkerMessage, { type: 'paths' }>>(
			(resolve, reject) => {
				const id = this.#nextId++;
				state.idle = false;
				this.#inFlight.set(id, { worker: state, resolve, reject });
				state.worker.postMessage({ type: 'discover', id } satisfies DiscoverWorkerRequest);
			},
		);
		const routes = new Map<number, RouteData>();
		for (const serialized of result.routes) {
			const route = deserializeRouteData(JSON.parse(serialized.data));
			routes.set(serialized.id, route);
			this.#routeIds.set(serialized.data, serialized.id);
			this.#nextRouteId = Math.max(this.#nextRouteId, serialized.id + 1);
			state.routes.add(serialized.id);
		}
		const paths = result.paths.map((path) => {
			const key = `${path.routeId}:${path.pathname}`;
			if (path.staticPath) this.#staticPaths.set(key, path.staticPath);
			if (path.localStaticPath) this.#localStaticPaths.add(key);
			return {
				pathname: path.pathname,
				route: routes.get(path.routeId)!,
				cacheKey: path.cacheKey,
			};
		});
		return paths;
	}

	setRoutes(paths: PathWithRoute[], routeUniqueBytes: Map<string, number>) {
		this.#routeWorkers = assignRouteWorkers(paths, routeUniqueBytes, this.workerCount);
	}

	render(
		request: Request,
		routeData: string,
		component: string,
		pathname: string,
		collectMetadata: boolean,
		outFile?: URL,
	): Promise<PrerenderResult> {
		let routeId = this.#routeIds.get(routeData);
		if (routeId === undefined) {
			routeId = this.#nextRouteId++;
			this.#routeIds.set(routeData, routeId);
		}
		const staticPathKey = `${routeId}:${pathname}`;
		const staticPath = this.#staticPaths.get(staticPathKey);
		const localOnly = this.#localStaticPaths.has(staticPathKey);
		this.#staticPaths.delete(staticPathKey);
		this.#localStaticPaths.delete(staticPathKey);
		return new Promise((resolve, reject) => {
			this.#queue.push({
				request: {
					type: 'render',
					url: request.url,
					outFile: outFile?.href,
					routeId,
					routeData,
					collectMetadata,
					staticPath,
				},
				eligibleWorkers: localOnly ? new Set([0]) : this.#routeWorkers.get(component),
				localOnly,
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
		const state: WorkerState = { index, worker, idle: false, failed: false, routes: new Set() };
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
		if (message.type === 'ready' || message.type === 'startup-error') return;
		const request = this.#inFlight.get(message.id);
		if (!request) return;
		this.#inFlight.delete(message.id);
		state.idle = true;
		if (message.type === 'render-error') {
			for (const log of message.logs) this.destination.write(log);
			request.reject(deserializeError(message.error));
		} else if (message.type === 'images') {
			request.resolve(message.images);
		} else if (message.type === 'paths') {
			for (const log of message.logs) this.destination.write(log);
			request.resolve(message);
		} else {
			for (const log of message.logs) this.destination.write(log);
			const { body, written, ...init } = message.response;
			const response = new Response(null, init);
			completedResponses.set(response, { body: body ?? undefined, written });
			request.resolve({ response, metadata: message.metadata });
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
					(job) => !job.localOnly && performance.now() - job.queuedAt >= AFFINITY_FALLBACK_MS,
				);
			}
			if (jobIndex === -1) continue;

			const [job] = this.#queue.splice(jobIndex, 1);
			const id = this.#nextId++;
			const message: RenderWorkerRequest = { ...job.request, id };
			if (state.routes.has(message.routeId)) delete message.routeData;
			try {
				state.worker.postMessage(message);
			} catch (error) {
				if (message.staticPath === undefined || !isDataCloneError(error)) {
					job.reject(error instanceof Error ? error : new Error(String(error)));
					continue;
				}
				const messageWithoutStaticPath = { ...message };
				delete messageWithoutStaticPath.staticPath;
				try {
					state.worker.postMessage(messageWithoutStaticPath);
				} catch (fallbackError) {
					job.reject(
						fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError)),
					);
					continue;
				}
			}
			state.routes.add(message.routeId);
			state.idle = false;
			this.#inFlight.set(id, { worker: state, resolve: job.resolve, reject: job.reject });
		}

		const fallbackJobs = this.#queue.filter((job) => !job.localOnly);
		if (fallbackJobs.length > 0 && this.#workers.some((worker) => worker.idle && !worker.failed)) {
			const wait = Math.max(
				0,
				Math.min(
					...fallbackJobs.map((job) => AFFINITY_FALLBACK_MS - (performance.now() - job.queuedAt)),
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
	internals,
	options,
	prerenderOutputDir,
}: ParallelPrerendererOptions): ParallelPrerenderer {
	let pool: PrerenderWorkerPool | undefined;
	let hasStaticImages = false;
	const serializedRoutes = new WeakMap<object, string>();
	return {
		name: 'astro:parallel',
		async setup() {
			const entryFileName = internals.prerenderEntryFileName!;
			const workerCount = Math.max(1, Math.floor(options.settings.config.build.concurrency));
			pool = new PrerenderWorkerPool(
				workerCount,
				{
					entryUrl: new URL(entryFileName, prerenderOutputDir).toString(),
					discoveryConcurrency: workerCount,
					pagesByKeys: [...internals.pagesByKeys].map(([key, page]) => [
						key,
						{ styles: page.styles },
					]),
					pageScript: internals.entrySpecifierToBundleMap.get(PAGE_SCRIPT_ID),
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
			const paths = await pool!.getStaticPaths();
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
			let serializedRoute = serializedRoutes.get(routeData);
			if (serializedRoute === undefined) {
				serializedRoute = JSON.stringify(
					serializeRouteData(routeData, options.settings.config.trailingSlash),
				);
				serializedRoutes.set(routeData, serializedRoute);
			}
			return pool!.render(
				request,
				serializedRoute,
				routeData.component,
				pathname,
				collectMetadata ?? false,
			);
		},
		async renderToFile(request, { routeData, pathname, outFile, collectMetadata }) {
			let serializedRoute = serializedRoutes.get(routeData);
			if (serializedRoute === undefined) {
				serializedRoute = JSON.stringify(
					serializeRouteData(routeData, options.settings.config.trailingSlash),
				);
				serializedRoutes.set(routeData, serializedRoute);
			}
			return pool!.render(
				request,
				serializedRoute,
				routeData.component,
				pathname,
				collectMetadata,
				outFile,
			);
		},
		async collectStaticImages() {
			const images = await pool!.collectStaticImages();
			hasStaticImages = images.size > 0;
			return images;
		},
		async teardown() {
			await pool?.close();
			if (hasStaticImages && !globalThis.astroAsset?.imageService) {
				const fileName = internals.prerenderImageServiceFileName!;
				globalThis.astroAsset ??= { referencedImages: new Set() };
				globalThis.astroAsset.imageService = (
					await import(new URL(fileName, prerenderOutputDir).href)
				).default;
			}
		},
	};
}
