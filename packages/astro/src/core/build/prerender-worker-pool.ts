import assert from 'node:assert/strict';
import { Worker } from 'node:worker_threads';
import type {
	PrerenderWorkerInitMessage,
	PrerenderWorkerGetStaticPathsMessage,
	PrerenderWorkerRenderMessage,
	PrerenderWorkerOutgoingMessage,
	PrerenderWorkerStaticPathsResult,
	PrerenderWorkerRenderResult,
	WorkerBuildOptions,
	SerializedError,
} from './prerender-worker-messages.js';
import type { BuildInternals } from './internal.js';
import type { SerializedRouteCache } from '../render/route-cache.js';

interface WorkerTaskResult<T> {
	resolve: (value: T) => void;
	reject: (error: Error) => void;
}

interface WorkerSlot {
	worker: Worker;
	busy: boolean;
}

export interface WorkerInitPayload {
	prerenderEntryUrl: string;
	internals: BuildInternals;
	options: WorkerBuildOptions;
	routeCache?: SerializedRouteCache;
}

export class PrerenderWorkerPool {
	private workers: WorkerSlot[] = [];
	private pending = new Map<number, WorkerTaskResult<any>>();
	private queue: Array<{
		message: PrerenderWorkerRenderMessage;
		resolve: (value: PrerenderWorkerRenderResult) => void;
		reject: (error: Error) => void;
	}> = [];
	private nextId = 1;

	constructor(size: number) {
		for (let i = 0; i < size; i++) {
			const worker = new Worker(new URL('./prerender-worker.js', import.meta.url));
			const slot: WorkerSlot = { worker, busy: false };
			worker.on('message', (message: PrerenderWorkerOutgoingMessage) => {
				this.handleWorkerMessage(slot, message);
			});
			worker.on('error', (error) => {
				this.rejectAll(error);
			});
			worker.on('exit', (code) => {
				if (code !== 0) {
					this.rejectAll(new Error(`Prerender worker exited with code ${code}`));
				}
			});
			this.workers.push(slot);
		}
	}

	async initWorker(index: number, payload: WorkerInitPayload) {
		const worker = this.workers[index];
		assert.ok(worker, `Invalid worker index ${index}`);
		const message: PrerenderWorkerInitMessage = {
			type: 'init',
			id: this.nextId++,
			prerenderEntryUrl: payload.prerenderEntryUrl,
			internals: payload.internals,
			options: payload.options,
			routeCache: payload.routeCache,
		};
		await this.runMessage(worker, message);
	}

	async initRemainingWorkers(payload: WorkerInitPayload) {
		const initPromises = this.workers.map((_, index) => {
			if (index === 0) return Promise.resolve();
			return this.initWorker(index, payload);
		});
		await Promise.all(initPromises);
	}

	async getStaticPaths(): Promise<PrerenderWorkerStaticPathsResult> {
		const worker = this.workers[0];
		assert.ok(worker, 'No worker available for getStaticPaths.');
		const message: PrerenderWorkerGetStaticPathsMessage = {
			type: 'getStaticPaths',
			id: this.nextId++,
		};
		return await this.runMessage(worker, message);
	}

	async render(message: Omit<PrerenderWorkerRenderMessage, 'type' | 'id'>) {
		return await new Promise<PrerenderWorkerRenderResult>((resolve, reject) => {
			const workerMessage: PrerenderWorkerRenderMessage = {
				type: 'render',
				id: this.nextId++,
				url: message.url,
				routeKey: message.routeKey,
			};
			const workerSlot = this.workers.find((slot) => !slot.busy);
			if (workerSlot) {
				workerSlot.busy = true;
				this.runMessage<PrerenderWorkerRenderResult>(workerSlot, workerMessage)
					.then(resolve)
					.catch(reject);
				return;
			}
			this.queue.push({ message: workerMessage, resolve, reject });
		});
	}

	async close() {
		await Promise.all(this.workers.map((slot) => slot.worker.terminate()));
		this.workers = [];
	}

	private async runMessage<T>(
		workerSlot: WorkerSlot,
		message:
			| PrerenderWorkerInitMessage
			| PrerenderWorkerGetStaticPathsMessage
			| PrerenderWorkerRenderMessage,
	): Promise<T> {
		return await new Promise<T>((resolve, reject) => {
			this.pending.set(message.id, { resolve, reject });
			workerSlot.worker.postMessage(message);
		});
	}

	private handleWorkerMessage(workerSlot: WorkerSlot, message: PrerenderWorkerOutgoingMessage) {
		const pending = this.pending.get(message.id);
		if (!pending) {
			return;
		}
		this.pending.delete(message.id);

		switch (message.type) {
			case 'initResult':
				pending.resolve(message);
				break;
			case 'staticPaths':
				pending.resolve(message);
				break;
			case 'renderResult':
				pending.resolve(message);
				break;
			case 'error':
				pending.reject(this.toError(message.error));
				break;
			default:
				pending.reject(new Error(`Unknown worker message type: ${(message as any).type}`));
		}

		if (workerSlot.busy && message.type !== 'staticPaths' && message.type !== 'initResult') {
			workerSlot.busy = false;
			this.flushQueue();
		}
	}

	private flushQueue() {
		if (!this.queue.length) return;
		const slot = this.workers.find((workerSlot) => !workerSlot.busy);
		if (!slot) return;
		const next = this.queue.shift();
		if (!next) return;
		slot.busy = true;
		this.runMessage<PrerenderWorkerRenderResult>(slot, next.message)
			.then(next.resolve)
			.catch(next.reject);
	}

	private rejectAll(error: Error) {
		for (const pending of this.pending.values()) {
			pending.reject(error);
		}
		this.pending.clear();
	}

	private toError(error: SerializedError): Error {
		const err = new Error(error.message);
		if (error.name) err.name = error.name;
		if (error.stack) err.stack = error.stack;
		return err;
	}
}
