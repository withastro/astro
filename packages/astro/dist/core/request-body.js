async function readBodyWithLimit(request, limit) {
	const contentLengthHeader = request.headers.get('content-length');
	if (contentLengthHeader) {
		const contentLength = Number.parseInt(contentLengthHeader, 10);
		if (Number.isFinite(contentLength) && contentLength > limit) {
			throw new BodySizeLimitError(limit);
		}
	}
	if (!request.body) return new Uint8Array();
	const reader = request.body.getReader();
	const chunks = [];
	let received = 0;
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		if (value) {
			received += value.byteLength;
			if (received > limit) {
				throw new BodySizeLimitError(limit);
			}
			chunks.push(value);
		}
	}
	const buffer = new Uint8Array(received);
	let offset = 0;
	for (const chunk of chunks) {
		buffer.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return buffer;
}
class BodySizeLimitError extends Error {
	limit;
	constructor(limit) {
		super(`Request body exceeds the configured limit of ${limit} bytes`);
		this.name = 'BodySizeLimitError';
		this.limit = limit;
	}
}
export { BodySizeLimitError, readBodyWithLimit };
