import probe from 'probe-image-size';
import type { ImageInputFormat, ImageMetadata } from '../types.js';

export async function imageMetadata(data: Buffer): Promise<Omit<ImageMetadata, 'src'> | undefined> {
	const result = probe.sync(data);
	if (result === null) {
		throw new Error('Failed to probe image size.');
	}

	const { width, height, type, orientation } = result;
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
