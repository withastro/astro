import fs from 'fs/promises';
import sizeOf from 'image-size';
import { ImageMetadata, InputFormat } from './types';

export async function metadata(src: string): Promise<ImageMetadata | undefined> {
	const file = await fs.readFile(src);

	const { width, height, type } = await sizeOf(file);

	if (!width || !height || !type) {
		return undefined;
	}

	return {
		src,
		width,
		height,
		format: type as InputFormat,
	};
}
