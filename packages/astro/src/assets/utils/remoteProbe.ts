import type { ImageMetadata } from '../types.js';
import { imageMetadata } from './metadata.js';

export async function inferRemoteSize(url: string): Promise<Omit<ImageMetadata, 'src' | 'fsPath'>> {
	// Start fetching the image
	const response = await fetch(url);
	if (!response.body || !response.ok) {
		throw new Error('Failed to fetch image');
	}

	const reader = response.body.getReader();

	let done: boolean | undefined, value: Uint8Array;
	let accumulatedChunks = new Uint8Array();

	// Process the stream chunk by chunk
	while (!done) {
		const readResult = await reader.read();
		done = readResult.done;

		if (done) break;

		if (readResult.value) {
			value = readResult.value;

			// Accumulate chunks
			let tmp = new Uint8Array(accumulatedChunks.length + value.length);
			tmp.set(accumulatedChunks, 0);
			tmp.set(value, accumulatedChunks.length);
			accumulatedChunks = tmp;

			try {
				// Attempt to determine the size with each new chunk
				const dimensions = await imageMetadata(accumulatedChunks, url);

				if (dimensions) {
					await reader.cancel(); // stop stream as we have size now

					return dimensions;
				}
			} catch (error) {
				// This catch block is specifically for `imageMetadata` errors
				// which might occur if the accumulated data isn't yet sufficient.
			}
		}
	}

	throw new Error('Failed to parse the size');
}
