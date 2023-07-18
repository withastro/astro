import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { ImageInputFormat, ImageMetadata } from '../types.js';
import imageSize from '../vendor/image-size/index.js';

export async function imageMetadata(
	src: URL | string,
	data?: Buffer
): Promise<ImageMetadata | undefined> {
	let file = data;
	if (!file) {
		try {
			file = await fs.readFile(src);
		} catch (e) {
			return undefined;
		}
	}

	const { width, height, type, orientation } = imageSize(file);
	const isPortrait = (orientation || 0) >= 5;

	if (!width || !height || !type) {
		return undefined;
	}

	return {
		src: fileURLToPath(src),
		width: isPortrait ? height : width,
		height: isPortrait ? width : height,
		format: type as ImageInputFormat,
		orientation,
	};
}
