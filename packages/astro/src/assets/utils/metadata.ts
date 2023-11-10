import probe from 'probe-image-size';
import { AstroError, AstroErrorData } from '../../core/errors/index.js';
import type { ImageInputFormat, ImageMetadata } from '../types.js';

export async function imageMetadata(
	data: Uint8Array,
	src?: string
): Promise<Omit<ImageMetadata, 'src' | 'fsPath'>> {
	// @ts-expect-error probe-image-size types are wrong, it does accept Uint8Array. From the README: "Sync version can eat arrays, typed arrays and buffers."
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
