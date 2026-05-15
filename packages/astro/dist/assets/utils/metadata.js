import { AstroError, AstroErrorData } from '../../core/errors/index.js';
import { lookup as probe } from '../utils/vendor/image-size/lookup.js';
async function imageMetadata(data, src) {
	let result;
	try {
		result = probe(data);
	} catch {
		throw new AstroError({
			...AstroErrorData.NoImageMetadata,
			message: AstroErrorData.NoImageMetadata.message(src),
		});
	}
	if (result.height == null || result.width == null || !result.type) {
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
		format: type,
		orientation,
	};
}
export { imageMetadata };
