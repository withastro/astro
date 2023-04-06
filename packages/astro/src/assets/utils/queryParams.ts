import type { ImageInputFormat, ImageMetadata } from '../types.js';

export function getOrigQueryParams(
	params: URLSearchParams
): Omit<ImageMetadata, 'src'> | undefined {
	const width = params.get('origWidth');
	const height = params.get('origHeight');
	const format = params.get('origFormat');

	if (!width || !height || !format) {
		return undefined;
	}

	return {
		width: parseInt(width),
		height: parseInt(height),
		format: format as ImageInputFormat,
	};
}
