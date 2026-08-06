/**
 * Shared utility for reading request bodies with a size limit.
 * Used by both Actions and Server Islands to enforce `security.actionBodySizeLimit`
 * and `security.serverIslandBodySizeLimit` respectively.
 */

/**
 * Read the request body as a `Uint8Array`, enforcing a maximum size limit.
 * Checks the `Content-Length` header for early rejection, then streams the body
 * and tracks bytes received.
 *
 * @throws {BodySizeLimitError} if the body exceeds the configured limit
 */
export async function readBodyWithLimit(request: Request, limit: number): Promise<Uint8Array> {
	const contentLengthHeader = request.headers.get('content-length');
	if (contentLengthHeader) {
		const contentLength = Number.parseInt(contentLengthHeader, 10);
		if (Number.isFinite(contentLength) && contentLength > limit) {
			throw new BodySizeLimitError(limit);
		}
	}

	if (!request.body) return new Uint8Array();
	const reader = request.body.getReader();
	const chunks: Uint8Array[] = [];
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

export class BodySizeLimitError extends Error {
	limit: number;
	constructor(limit: number) {
		super(`Request body exceeds the configured limit of ${limit} bytes`);
		this.name = 'BodySizeLimitError';
		this.limit = limit;
	}
}
