import type { ImageInputFormat, ImageMetadata } from '../types.js';

/**
 * Extracts the original image query parameters (width, height, format) from the given `URLSearchParams` object
 * and returns them as an object. If any of the required parameters are missing or invalid, the function returns undefined.
 *
 * The `width` and `height` are parsed to integer values.
 *
 * @param {URLSearchParams} params - The `URLSearchParams` object containing the query parameters.
 * @return {Pick<ImageMetadata, 'width' | 'height' | 'format'> | undefined} An object with the original image parameters (width, height, format) or undefined if any parameter is missing.
 */
export function getOrigQueryParams(
	params: URLSearchParams,
): Pick<ImageMetadata, 'width' | 'height' | 'format'> | undefined {
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
