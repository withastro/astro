/**
 * Frames prerender response metadata as length-prefixed JSON followed by the
 * raw body bytes. This private protocol transports arbitrary output without
 * base64 encoding or state shared between requests.
 */
import type { PrerenderRenderMetadata } from 'astro';
import type { PrerenderResponseMetadata } from '../prerender-types.js';

const METADATA_LENGTH_BYTES = 4;
const MAX_METADATA_LENGTH = 16 * 1024 * 1024;
export const PRERENDER_RESPONSE_CONTENT_TYPE = 'application/vnd.astro.prerender';

function parseResponseMetadata(bytes: Uint8Array): PrerenderResponseMetadata {
	const value: unknown = JSON.parse(new TextDecoder().decode(bytes));
	if (!value || typeof value !== 'object') {
		throw new Error('The framed prerender response metadata is invalid.');
	}
	const record = value as Record<string, unknown>;
	const validHeaders =
		Array.isArray(record.headers) &&
		record.headers.every(
			(header) =>
				Array.isArray(header) &&
				header.length === 2 &&
				header.every((item) => typeof item === 'string'),
		);
	const validStatus =
		typeof record.status === 'number' &&
		Number.isInteger(record.status) &&
		record.status >= 200 &&
		record.status <= 599;
	const nullBodyStatus = record.status === 204 || record.status === 205 || record.status === 304;
	const metadata = record.metadata as Record<string, unknown> | undefined;
	const validMetadata =
		metadata === undefined ||
		(metadata !== null &&
			typeof metadata === 'object' &&
			Array.isArray(metadata.contentEntryKeys) &&
			metadata.contentEntryKeys.every((key) => typeof key === 'string') &&
			Array.isArray(metadata.staticImages));
	if (
		!validStatus ||
		typeof record.statusText !== 'string' ||
		!validHeaders ||
		typeof record.hasBody !== 'boolean' ||
		(nullBodyStatus && record.hasBody) ||
		!validMetadata
	) {
		throw new Error('The framed prerender response metadata is invalid.');
	}
	return record as unknown as PrerenderResponseMetadata;
}

export function createFramedPrerenderResponse(
	response: Response,
	metadata: PrerenderRenderMetadata | undefined,
): Response {
	const responseMetadata: PrerenderResponseMetadata = {
		status: response.status,
		statusText: response.statusText,
		headers: [...response.headers.entries()],
		hasBody: response.body !== null,
		metadata,
	};
	const metadataBytes = new TextEncoder().encode(JSON.stringify(responseMetadata));
	if (metadataBytes.byteLength > MAX_METADATA_LENGTH) {
		throw new RangeError('Prerender response metadata is too large to encode.');
	}

	const lengthBytes = new Uint8Array(METADATA_LENGTH_BYTES);
	new DataView(lengthBytes.buffer).setUint32(0, metadataBytes.byteLength);
	const bodyReader = response.body?.getReader();
	let phase = 0;
	const framedBody = new ReadableStream<Uint8Array>({
		async pull(controller) {
			if (phase === 0) {
				phase = 1;
				controller.enqueue(lengthBytes);
				return;
			}
			if (phase === 1) {
				phase = 2;
				controller.enqueue(metadataBytes);
				if (!bodyReader) controller.close();
				return;
			}
			if (!bodyReader) {
				controller.close();
				return;
			}
			const { done, value } = await bodyReader.read();
			if (done) {
				controller.close();
			} else {
				controller.enqueue(value);
			}
		},
		cancel(reason) {
			return bodyReader?.cancel(reason);
		},
	});

	return new Response(framedBody, {
		headers: {
			'Cache-Control': 'no-store',
			'Content-Type': PRERENDER_RESPONSE_CONTENT_TYPE,
		},
	});
}

export async function readFramedPrerenderResponse(
	transportResponse: Response,
): Promise<{ response: Response; metadata: PrerenderRenderMetadata | undefined }> {
	if (!transportResponse.ok) {
		throw new Error(
			`The framed prerender request failed (${transportResponse.status}: ${transportResponse.statusText}).`,
		);
	}
	if (transportResponse.headers.get('Content-Type') !== PRERENDER_RESPONSE_CONTENT_TYPE) {
		throw new Error('The prerender response is not framed.');
	}
	if (!transportResponse.body) {
		throw new Error('The framed prerender response has no body.');
	}

	const reader = transportResponse.body.getReader();
	let chunk: Uint8Array | undefined;
	let chunkOffset = 0;
	const readExactly = async (length: number): Promise<Uint8Array> => {
		const bytes = new Uint8Array(length);
		let bytesRead = 0;
		while (bytesRead < length) {
			if (!chunk || chunkOffset === chunk.byteLength) {
				const next = await reader.read();
				if (next.done) throw new Error('The framed prerender response ended unexpectedly.');
				chunk = next.value;
				chunkOffset = 0;
			}
			const available = chunk.byteLength - chunkOffset;
			const count = Math.min(length - bytesRead, available);
			bytes.set(chunk.subarray(chunkOffset, chunkOffset + count), bytesRead);
			chunkOffset += count;
			bytesRead += count;
		}
		return bytes;
	};

	try {
		const lengthBytes = await readExactly(METADATA_LENGTH_BYTES);
		const metadataLength = new DataView(
			lengthBytes.buffer,
			lengthBytes.byteOffset,
			lengthBytes.byteLength,
		).getUint32(0);
		if (metadataLength === 0 || metadataLength > MAX_METADATA_LENGTH) {
			throw new Error('The framed prerender response metadata length is invalid.');
		}
		const metadataBytes = await readExactly(metadataLength);
		const responseMetadata = parseResponseMetadata(metadataBytes);

		let remainder =
			chunk && chunkOffset < chunk.byteLength ? chunk.subarray(chunkOffset) : undefined;
		let body: ReadableStream<Uint8Array> | null = null;
		if (responseMetadata.hasBody) {
			body = new ReadableStream<Uint8Array>({
				async pull(controller) {
					if (remainder) {
						controller.enqueue(remainder);
						remainder = undefined;
						return;
					}
					const { done, value } = await reader.read();
					if (done) {
						controller.close();
					} else {
						controller.enqueue(value);
					}
				},
				cancel(reason) {
					return reader.cancel(reason);
				},
			});
		} else {
			await reader.cancel();
		}

		return {
			response: new Response(body, {
				status: responseMetadata.status,
				statusText: responseMetadata.statusText,
				headers: responseMetadata.headers,
			}),
			metadata: responseMetadata.metadata,
		};
	} catch (error) {
		try {
			await reader.cancel(error);
		} catch {
			// Preserve the framing error when cancellation also fails.
		}
		throw error;
	}
}
