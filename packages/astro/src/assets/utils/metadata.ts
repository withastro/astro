import type { ImageInputFormat, ImageMetadata } from '../types.js';
import imageSize from '../vendor/image-size/index.js';

export async function imageMetadata(data: Buffer): Promise<Omit<ImageMetadata, 'src'> | undefined> {
	const { width, height, type, orientation } = imageSize(data);
	const isPortrait = (orientation || 0) >= 5;

	if (!width || !height || !type) {
		return undefined;
	}

	return {
		width: isPortrait ? height : width,
		height: isPortrait ? width : height,
		format: type as ImageInputFormat,
		orientation,
	};
}
