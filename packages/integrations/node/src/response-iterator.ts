/**
 * Original sources:
 *  - https://github.com/kmalakoff/response-iterator/blob/master/src/index.ts
 *  - https://github.com/apollographql/apollo-client/blob/main/src/utilities/common/responseIterator.ts
 */

import type { ReadableStreamDefaultReadResult } from 'node:stream/web';
import { Readable as NodeReadableStream } from 'stream';
import type { Response as NodeResponse } from 'undici';

interface NodeStreamIterator<T> {
	next(): Promise<IteratorResult<T, boolean | undefined>>;
	[Symbol.asyncIterator]?(): AsyncIterator<T>;
}

interface PromiseIterator<T> {
	next(): Promise<IteratorResult<T, ArrayBuffer | undefined>>;
	[Symbol.asyncIterator]?(): AsyncIterator<T>;
}

interface ReaderIterator<T> {
	next(): Promise<ReadableStreamDefaultReadResult<T>>;
	[Symbol.asyncIterator]?(): AsyncIterator<T>;
}

const canUseSymbol = typeof Symbol === 'function' && typeof Symbol.for === 'function';

const canUseAsyncIteratorSymbol = canUseSymbol && Symbol.asyncIterator;

function isBuffer(value: any): value is Buffer {
	return (
		value?.constructor != null &&
		typeof value.constructor.isBuffer === 'function' &&
		value.constructor.isBuffer(value)
	);
}

function isNodeResponse(value: any): value is NodeResponse {
	return !!(value as NodeResponse).body;
}

function isReadableStream(value: any): value is ReadableStream<any> {
	return !!(value as ReadableStream<any>).getReader;
}

function isAsyncIterableIterator(value: any): value is AsyncIterableIterator<any> {
	return !!(
		canUseAsyncIteratorSymbol && (value as AsyncIterableIterator<any>)[Symbol.asyncIterator]
	);
}

function isStreamableBlob(value: any): value is Blob {
	return !!(value as Blob).stream;
}

function isBlob(value: any): value is Blob {
	return !!(value as Blob).arrayBuffer;
}

function isNodeReadableStream(value: any): value is NodeReadableStream {
	return !!(value as NodeReadableStream).pipe;
}

function readerIterator<T>(reader: ReadableStreamDefaultReader<T>): AsyncIterableIterator<T> {
	const iterator: ReaderIterator<T> = {
		//@ts-expect-error
		next() {
			return reader.read();
		},
	};

	if (canUseAsyncIteratorSymbol) {
		iterator[Symbol.asyncIterator] = function (): AsyncIterator<T> {
			//@ts-expect-error
			return this;
		};
	}

	return iterator as AsyncIterableIterator<T>;
}

function promiseIterator<T = ArrayBuffer>(promise: Promise<ArrayBuffer>): AsyncIterableIterator<T> {
	let resolved = false;

	const iterator: PromiseIterator<T> = {
		next(): Promise<IteratorResult<T, ArrayBuffer | undefined>> {
			if (resolved)
				return Promise.resolve({
					value: undefined,
					done: true,
				});
			resolved = true;
			return new Promise(function (resolve, reject) {
				promise
					.then(function (value) {
						resolve({ value: value as unknown as T, done: false });
					})
					.catch(reject);
			});
		},
	};

	if (canUseAsyncIteratorSymbol) {
		iterator[Symbol.asyncIterator] = function (): AsyncIterator<T> {
			return this;
		};
	}

	return iterator as AsyncIterableIterator<T>;
}

function nodeStreamIterator<T>(stream: NodeReadableStream): AsyncIterableIterator<T> {
	let cleanup: (() => void) | null = null;
	let error: Error | null = null;
	let done = false;
	const data: unknown[] = [];

	const waiting: [
		(
			value:
				| IteratorResult<T, boolean | undefined>
				| PromiseLike<IteratorResult<T, boolean | undefined>>
		) => void,
		(reason?: any) => void
	][] = [];

	function onData(chunk: any) {
		if (error) return;
		if (waiting.length) {
			const shiftedArr = waiting.shift();
			if (Array.isArray(shiftedArr) && shiftedArr[0]) {
				return shiftedArr[0]({ value: chunk, done: false });
			}
		}
		data.push(chunk);
	}
	function onError(err: Error) {
		error = err;
		const all = waiting.slice();
		all.forEach(function (pair) {
			pair[1](err);
		});
		!cleanup || cleanup();
	}
	function onEnd() {
		done = true;
		const all = waiting.slice();
		all.forEach(function (pair) {
			pair[0]({ value: undefined, done: true });
		});
		!cleanup || cleanup();
	}

	cleanup = function () {
		cleanup = null;
		stream.removeListener('data', onData);
		stream.removeListener('error', onError);
		stream.removeListener('end', onEnd);
		stream.removeListener('finish', onEnd);
		stream.removeListener('close', onEnd);
	};
	stream.on('data', onData);
	stream.on('error', onError);
	stream.on('end', onEnd);
	stream.on('finish', onEnd);
	stream.on('close', onEnd);

	function getNext(): Promise<IteratorResult<T, boolean | undefined>> {
		return new Promise(function (resolve, reject) {
			if (error) return reject(error);
			if (data.length) return resolve({ value: data.shift() as T, done: false });
			if (done) return resolve({ value: undefined, done: true });
			waiting.push([resolve, reject]);
		});
	}

	const iterator: NodeStreamIterator<T> = {
		next(): Promise<IteratorResult<T, boolean | undefined>> {
			return getNext();
		},
	};

	if (canUseAsyncIteratorSymbol) {
		iterator[Symbol.asyncIterator] = function (): AsyncIterator<T> {
			return this;
		};
	}

	return iterator as AsyncIterableIterator<T>;
}

function asyncIterator<T>(source: AsyncIterableIterator<T>): AsyncIterableIterator<T> {
	const iterator = source[Symbol.asyncIterator]();
	return {
		next(): Promise<IteratorResult<T, boolean>> {
			return iterator.next();
		},
		[Symbol.asyncIterator](): AsyncIterableIterator<T> {
			return this;
		},
	};
}

export function responseIterator<T>(
	response: Response | NodeResponse | Buffer
): AsyncIterableIterator<T> {
	let body: unknown = response;

	if (isNodeResponse(response)) body = response.body;

	if (isBuffer(body)) body = NodeReadableStream.from(body);

	if (isAsyncIterableIterator(body)) return asyncIterator<T>(body);

	if (isReadableStream(body)) return readerIterator<T>(body.getReader());

	// this errors without casting to ReadableStream<T>
	// because Blob.stream() returns a NodeJS ReadableStream
	if (isStreamableBlob(body)) {
		return readerIterator<T>((body.stream() as unknown as ReadableStream<T>).getReader());
	}

	if (isBlob(body)) return promiseIterator<T>(body.arrayBuffer());

	if (isNodeReadableStream(body)) return nodeStreamIterator<T>(body);

	throw new Error('Unknown body type for responseIterator. Please pass a streamable response.');
}
