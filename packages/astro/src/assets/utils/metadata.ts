import probe from 'probe-image-size';
import { AstroError, AstroErrorData } from '../../core/errors/index.js';
import type { ImageInputFormat, ImageMetadata } from '../types.js';

export async function imageMetadata(
	data: Buffer,
	src?: string
): Promise<Omit<ImageMetadata, 'src'>> {
	const result = probe.sync(data);

	if (result === null) {
		throw new AstroError({
			...AstroErrorData.NoImageMetadata,
			message: AstroErrorData.NoImageMetadata.message(src),
		});
	}

	const { width, height, type, orientation } = result;
	const isPortrait = (orientation || 0) >= 5;

	return {
		width: isPortrait ? height : width,
		height: isPortrait ? width : height,
		format: type as ImageInputFormat,
		orientation,
	};
}
