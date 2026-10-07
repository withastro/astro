import os from 'node:os';
import { Worker } from 'node:worker_threads';
import type { SerializedStaticImage } from '../../assets/types.js';
import type { AstroSettings } from '../../types/astro.js';
import type { GetStaticPathsItem } from '../../types/public/common.js';
import type { RouteData } from '../../types/public/internal.js';
import { PAGE_SCRIPT_ID } from '../../vite-plugin-scripts/index.js';
import type {
	AstroPrerenderer,
	PathWithRoute,
	PrerenderRenderMetadata,
	PrerenderResult,
	StaticPathsMetadata,
	StaticPathsResult,
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
	staticPath?: GetStaticPathsItem;
}

interface DiscoverWorkerRequest {
	type: 'discover';
	id: number;
}

export type PrerenderWorkerRequest = RenderWorkerRequest | DiscoverWorkerRequest;

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

/**
 * Images a worker resolved outside of a render or path discovery, e.g. while evaluating a
 * page module before rendering it. Drained into the next message the worker sends.
 */
export interface WorkerBuildMetadata {
	buildMetadata?: StaticPathsMetadata;
}

export type WorkerMessage = WorkerBuildMetadata &
	(
		| { type: 'ready' }
		| { type: 'logs'; logs: AstroLoggerMessage[] }
		| { type: 'startup-error'; error: SerializedWorkerError }
		| {
				type: 'paths';
				id: number;
				paths: DiscoveredPath[];
				routes: DiscoveredRoute[];
				metadata?: StaticPathsMetadata;
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
	);

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
	ready: boolean;
	/** Number of requests currently being processed by this worker. */
	active: number;
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
		},
	) => Promise<PrerenderResult>;
	/**
	 * Stops the workers once every page is rendered, so their memory is released before
	 * images are generated. Returns the images workers resolved outside of a render.
	 */
	finish: () => Promise<StaticPathsMetadata>;
}

interface CompletedResponse {
	body?: ArrayBuffer;
	written: boolean;
}

const AFFINITY_FALLBACK_MS = 100;

/**
 * Resolves the number of worker threads for `experimental.parallelPrerender`.
 * Defaults to one per available CPU core, leaving one for the main thread.
 */
export function resolveParallelPrerenderWorkers(
	parallelPrerender: AstroSettings['config']['experimental']['parallelPrerender'],
): number {
	if (typeof parallelPrerender === 'object' && parallelPrerender.workers !== undefined) {
		return Math.max(1, Math.floor(parallelPrerender.workers));
	}
	return Math.max(1, os.availableParallelism() - 1);
}
const completedResponses = new WeakMap<Response, CompletedResponse>();

export function takeCompletedResponse(response: Response): CompletedResponse | undefined {
	const completed = completedResponses.get(response);
	completedResponses.delete(response);
	return completed;
}

export function isParallelPrerenderer(
	prerenderer: AstroPrerenderer,
): prerenderer is ParallelPrerenderer {
	return (
		typeof Reflect.get(prerenderer, 'renderToFile') === 'function' &&
		typeof Reflect.get(prerenderer, 'finish') === 'function'
	);
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
	#buildImages: SerializedStaticImage[] = [];
	#buildReferencedImages = new Set<string>();
	private readonly workerCount: number;
	private readonly workerConcurrency: number;
	private readonly workerData: ParallelPrerenderWorkerData;
	private readonly destination: StaticBuildOptions['logger']['options']['destination'];

	constructor(
		workerCount: number,
		workerConcurrency: number,
		workerData: ParallelPrerenderWorkerData,
		destination: StaticBuildOptions['logger']['options']['destination'],
	) {
		this.workerCount = workerCount;
		this.workerConcurrency = workerConcurrency;
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

	async getStaticPaths(): Promise<StaticPathsResult> {
		const state = this.#workers[0];
		const result = await new Promise<Extract<WorkerMessage, { type: 'paths' }>>(
			(resolve, reject) => {
				const id = this.#nextId++;
				state.active++;
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
		return { paths, metadata: result.metadata };
	}

	setRoutes(paths: PathWithRoute[], routeUniqueBytes: Map<string, number>) {
		this.#routeWorkers = assignRouteWorkers(paths, routeUniqueBytes, this.workerCount);
	}

	render(
		request: Request,
		routeData: string,
		component: string,
		pathname: string,
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

	/** Images reported by workers outside of a render, see {@link WorkerBuildMetadata}. */
	get buildMetadata(): StaticPathsMetadata {
		return {
			staticImages: this.#buildImages,
			referencedImages: [...this.#buildReferencedImages],
		};
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
		const state: WorkerState = {
			index,
			worker,
			ready: false,
			active: 0,
			failed: false,
			routes: new Set(),
		};
		this.#workers.push(state);

		await new Promise<void>((resolve, reject) => {
			let starting = true;
			worker.on('message', (message: WorkerMessage) => {
				this.#addBuildMetadata(message.buildMetadata);
				if (message.type === 'ready') {
					starting = false;
					state.ready = true;
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

	#addBuildMetadata(metadata: StaticPathsMetadata | undefined) {
		if (!metadata) return;
		if (metadata.staticImages) {
			for (const image of metadata.staticImages) this.#buildImages.push(image);
		}
		if (metadata.referencedImages) {
			for (const fsPath of metadata.referencedImages) this.#buildReferencedImages.add(fsPath);
		}
	}

	#handleMessage(state: WorkerState, message: WorkerMessage) {
		if (message.type === 'ready' || message.type === 'startup-error') return;
		if (message.type === 'logs') {
			for (const log of message.logs) this.destination.write(log);
			return;
		}
		const request = this.#inFlight.get(message.id);
		if (!request) return;
		this.#inFlight.delete(message.id);
		state.active--;
		if (message.type === 'render-error') {
			for (const log of message.logs) this.destination.write(log);
			request.reject(deserializeError(message.error));
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

		// Fill free slots round-robin so work spreads across workers before any
		// single worker is saturated up to `workerConcurrency`.
		let assigned = true;
		while (assigned && this.#queue.length > 0) {
			assigned = false;
			for (const state of this.#workers) {
				if (!this.#hasCapacity(state)) continue;
				if (this.#assignJob(state)) assigned = true;
			}
		}

		const fallbackJobs = this.#queue.filter((job) => !job.localOnly);
		if (fallbackJobs.length > 0 && this.#workers.some((worker) => this.#hasCapacity(worker))) {
			const wait = Math.max(
				0,
				Math.min(
					...fallbackJobs.map((job) => AFFINITY_FALLBACK_MS - (performance.now() - job.queuedAt)),
				),
			);
			this.#fallbackTimer = setTimeout(() => this.#pump(), wait);
		}
	}

	#hasCapacity(state: WorkerState): boolean {
		return state.ready && !state.failed && state.active < this.workerConcurrency;
	}

	/** Sends the next job this worker may take. Returns whether a job was consumed. */
	#assignJob(state: WorkerState): boolean {
		let jobIndex = this.#queue.findIndex(
			(job) => !job.eligibleWorkers || job.eligibleWorkers.has(state.index),
		);
		if (jobIndex === -1) {
			jobIndex = this.#queue.findIndex(
				(job) => !job.localOnly && performance.now() - job.queuedAt >= AFFINITY_FALLBACK_MS,
			);
		}
		if (jobIndex === -1) return false;

		const [job] = this.#queue.splice(jobIndex, 1);
		const id = this.#nextId++;
		const message: RenderWorkerRequest = { ...job.request, id };
		if (state.routes.has(message.routeId)) delete message.routeData;
		try {
			state.worker.postMessage(message);
		} catch (error) {
			if (message.staticPath === undefined || !isDataCloneError(error)) {
				job.reject(error instanceof Error ? error : new Error(String(error)));
				return true;
			}
			const messageWithoutStaticPath = { ...message };
			delete messageWithoutStaticPath.staticPath;
			try {
				state.worker.postMessage(messageWithoutStaticPath);
			} catch (fallbackError) {
				job.reject(
					fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError)),
				);
				return true;
			}
		}
		state.routes.add(message.routeId);
		state.active++;
		this.#inFlight.set(id, { worker: state, resolve: job.resolve, reject: job.reject });
		return true;
	}
}

export function createParallelPrerenderer({
	internals,
	options,
	prerenderOutputDir,
}: ParallelPrerendererOptions): ParallelPrerenderer {
	let pool: PrerenderWorkerPool | undefined;
	const serializedRoutes = new WeakMap<object, string>();
	const serializeRoute = (routeData: RouteData) => {
		let serializedRoute = serializedRoutes.get(routeData);
		if (serializedRoute === undefined) {
			serializedRoute = JSON.stringify(
				serializeRouteData(routeData, options.settings.config.trailingSlash),
			);
			serializedRoutes.set(routeData, serializedRoute);
		}
		return serializedRoute;
	};
	return {
		name: 'astro:parallel',
		async setup() {
			const entryFileName = internals.prerenderEntryFileName!;
			const { config } = options.settings;
			const workerCount = resolveParallelPrerenderWorkers(config.experimental.parallelPrerender);
			const workerConcurrency = Math.max(1, Math.floor(config.build.concurrency));
			pool = new PrerenderWorkerPool(
				workerCount,
				workerConcurrency,
				{
					entryUrl: new URL(entryFileName, prerenderOutputDir).toString(),
					discoveryConcurrency: workerConcurrency,
					pagesByKeys: [...internals.pagesByKeys].map(([key, page]) => [
						key,
						{ styles: page.styles },
					]),
					pageScript: internals.entrySpecifierToBundleMap.get(PAGE_SCRIPT_ID),
					scripts: options.settings.scripts,
				},
				options.logger.options.destination,
			);
			await pool.start();
		},
		async getStaticPaths() {
			const result = await pool!.getStaticPaths();
			pool!.setRoutes(result.paths, internals.prerenderRouteUniqueBytes ?? new Map());
			return result;
		},

		async render(request, { routeData }) {
			const pathname = stringifyParams(
				getParams(
					routeData,
					removeBase(new URL(request.url).pathname, options.settings.config.base),
				),
				routeData,
				options.settings.config.trailingSlash,
			);
			return pool!.render(request, serializeRoute(routeData), routeData.component, pathname);
		},
		async renderToFile(request, { routeData, pathname, outFile }) {
			return pool!.render(
				request,
				serializeRoute(routeData),
				routeData.component,
				pathname,
				outFile,
			);
		},
		async finish() {
			if (!pool) return { staticImages: [], referencedImages: [] };
			await pool.close();
			return pool.buildMetadata;
		},
		async teardown() {
			await pool?.close();
		},
	};
}
