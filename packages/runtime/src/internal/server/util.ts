export function isPromise<T = any>(value: any): value is Promise<T> {
	return typeof value === 'object' && value !== null && typeof value.then === 'function';
}

export async function* streamAsyncIterator(stream: ReadableStream) {
	const reader = stream.getReader();

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) return;
			yield value;
		}
	} finally {
		reader.releaseLock();
	}
}

/**
 * `value instanceof Response` without touching the global: the first read of `Response` loads undici (70-110 ms per
 * thread on a build box), which a string render never otherwise needs.
 */
export function isResponse(value: unknown): value is Response {
	return (
		typeof value === 'object' && value !== null && (value as any)[Symbol.toStringTag] === 'Response'
	);
}
