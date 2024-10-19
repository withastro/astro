import { parentPort, Worker } from 'worker_threads';

function uuid() {
	return Array.from({ length: 16 }, () => Math.floor(Math.random() * 256).toString(16)).join('');
}

interface Job<I> {
	msg: I;
	resolve: (result: any) => void;
	reject: (reason: any) => void;
}

export default class WorkerPool<I, O> {
	public numWorkers: number;
	public jobQueue: TransformStream<Job<I>, Job<I>>;
	public workerQueue: TransformStream<Worker, Worker>;
	public done: Promise<void>;

	constructor(numWorkers: number, workerFile: string) {
		this.numWorkers = numWorkers;
		this.jobQueue = new TransformStream();
		this.workerQueue = new TransformStream();

		const writer = this.workerQueue.writable.getWriter();
		for (let i = 0; i < numWorkers; i++) {
			writer.write(new Worker(workerFile));
		}
		writer.releaseLock();

		this.done = this._readLoop();
	}

	async _readLoop() {
		const reader = this.jobQueue.readable.getReader();
		while (true) {
			const { value, done } = await reader.read();
			if (done) {
				await this._terminateAll();
				return;
			}

			if (!value) {
				throw new Error('Reader did not return any value');
			}

			const { msg, resolve, reject } = value;
			const worker = await this._nextWorker();
			this.jobPromise(worker, msg)
				.then((result) => resolve(result))
				.catch((reason) => reject(reason))
				.finally(() => {
					// Return the worker to the pool
					const writer = this.workerQueue.writable.getWriter();
					writer.write(worker);
					writer.releaseLock();
				});
		}
	}

	async _nextWorker() {
		const reader = this.workerQueue.readable.getReader();
		const { value } = await reader.read();
		reader.releaseLock();
		if (!value) {
			throw new Error('No worker left');
		}

		return value;
	}

	async _terminateAll() {
		for (let n = 0; n < this.numWorkers; n++) {
			const worker = await this._nextWorker();
			worker.terminate();
		}
		this.workerQueue.writable.close();
	}

	async join() {
		this.jobQueue.writable.getWriter().close();
		await this.done;
	}

	dispatchJob(msg: I): Promise<O> {
		return new Promise((resolve, reject) => {
			const writer = this.jobQueue.writable.getWriter();
			writer.write({ msg, resolve, reject });
			writer.releaseLock();
		});
	}

	private jobPromise(worker: Worker, msg: I) {
		return new Promise((resolve, reject) => {
			const id = uuid();
			worker.postMessage({ msg, id });
			worker.on('message', function f({ error, result, id: rid }) {
				if (rid !== id) {
					return;
				}
				if (error) {
					reject(error);
					return;
				}
				worker.off('message', f);
				resolve(result);
			});
		});
	}

	static useThisThreadAsWorker<I, O>(cb: (msg: I) => O) {
		parentPort!.on('message', async (data) => {
			const { msg, id } = data;
			try {
				const result = await cb(msg);
				parentPort!.postMessage({ result, id });
			} catch (e: any) {
				parentPort!.postMessage({ error: e.message, id });
			}
		});
	}
}
