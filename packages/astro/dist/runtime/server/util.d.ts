export declare function isPromise<T = any>(value: any): value is Promise<T>;
export declare function streamAsyncIterator(
	stream: ReadableStream,
): AsyncGenerator<any, void, unknown>;
