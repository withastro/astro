import sizeOf from 'image-size';
import fs from 'node:fs/promises';
import { InputFormat } from '../loaders/index.js';
import { ImageMetadata } from '../vite-plugin-astro-image.js';

export async function metadata(src: string): Promise<ImageMetadata | undefined> {
	const file = await fs.readFile(src);

	const { width, height, type, orientation } = await sizeOf(file);
	const isPortrait = (orientation || 0) >= 5;

	if (!width || !height || !type) {
		return undefined;
	}

	return {
		src,
		width: isPortrait ? height : width,
		height: isPortrait ? width : height,
		format: type as InputFormat,
	};
}
