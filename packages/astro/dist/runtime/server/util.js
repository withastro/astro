function isPromise(value) {
	return (
		!!value && typeof value === 'object' && 'then' in value && typeof value.then === 'function'
	);
}
async function* streamAsyncIterator(stream) {
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
export { isPromise, streamAsyncIterator };
