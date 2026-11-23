export function isDevelopment() {
	try {
		return process.env.NODE_ENV === 'development';
	} catch (error) {
		if (typeof process === 'undefined') return false;
		throw error;
	}
}

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
