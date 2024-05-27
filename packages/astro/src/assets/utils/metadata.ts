import { AstroError, AstroErrorData } from '../../core/errors/index.js';
import { type ImageInputFormat, type ImageMetadata, image_metadata } from '../types.js';
import { lookup as probe } from '../utils/vendor/image-size/lookup.js';

export async function imageMetadata(
	data: Uint8Array,
	src?: string
): Promise<Omit<ImageMetadata, 'src' | 'fsPath' | typeof image_metadata>> {
	try {
		const result = probe(data);
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
	} catch (e) {
		throw new AstroError({
			...AstroErrorData.NoImageMetadata,
			message: AstroErrorData.NoImageMetadata.message(src),
		});
	}
}
