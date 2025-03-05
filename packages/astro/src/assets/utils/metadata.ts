import { AstroError, AstroErrorData } from '../../core/errors/index.js';
import type { ImageInputFormat, ImageMetadata } from '../types.js';
import { lookup as probe } from '../utils/vendor/image-size/lookup.js';

/**
 * Extracts image metadata such as dimensions, format, and orientation from the provided image data.
 *
 * @param {Uint8Array} data - The binary data of the image.
 * @param {string} [src] - The source path or URL of the image, used for error messages. Optional.
 * @return {Promise<Omit<ImageMetadata, 'src' | 'fsPath'>>} A promise that resolves with the extracted metadata, excluding `src` and `fsPath`.
 * @throws {AstroError} Throws an error if the image metadata cannot be extracted.
 */
export async function imageMetadata(
	data: Uint8Array,
	src?: string,
): Promise<Omit<ImageMetadata, 'src' | 'fsPath'>> {
	let result;
	try {
		result = probe(data);
	} catch {
		throw new AstroError({
			...AstroErrorData.NoImageMetadata,
			message: AstroErrorData.NoImageMetadata.message(src),
		});
	}
	if (!result.height || !result.width || !result.type) {
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
