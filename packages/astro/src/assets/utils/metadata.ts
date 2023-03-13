import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { ImageMetadata, InputFormat } from '../types.js';

export interface Metadata extends ImageMetadata {
	orientation?: number;
}

let sizeOf: typeof import('image-size').default | undefined;
export async function imageMetadata(
	src: URL | string,
	data?: Buffer
): Promise<Metadata | undefined> {
	if (!sizeOf) {
		sizeOf = await import('image-size').then((mod) => mod.default);
	}
	let file = data;
	if (!file) {
		try {
			file = await fs.readFile(src);
		} catch (e) {
			return undefined;
		}
	}

	const { width, height, type, orientation } = await sizeOf!(file);
	const isPortrait = (orientation || 0) >= 5;

	if (!width || !height || !type) {
		return undefined;
	}

	return {
		src: fileURLToPath(src),
		width: isPortrait ? height : width,
		height: isPortrait ? width : height,
		format: type as InputFormat,
		orientation,
	};
}
