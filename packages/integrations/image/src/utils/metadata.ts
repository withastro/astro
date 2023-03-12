import sizeOf from 'image-size';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { InputFormat } from '../loaders/index.js';
import type { ImageMetadata } from '../vite-plugin-astro-image.js';

export interface Metadata extends ImageMetadata {
	orientation?: number;
}

export async function metadata(src: URL | string, data?: Buffer): Promise<Metadata | undefined> {
	const file = data || (await fs.readFile(src));

	const { width, height, type, orientation } = await sizeOf(file);
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
