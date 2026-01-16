import type { ImageMetadata, UnresolvedImageTransform } from '../types.js';

/**
 * Determines if the given source is an ECMAScript Module (ESM) imported image.
 *
 * @param {ImageMetadata | string} src - The source to check. It can be an `ImageMetadata` object or a string.
 * @return {boolean} Returns `true` if the source is an `ImageMetadata` object, otherwise `false`.
 */
export function isESMImportedImage(src: ImageMetadata | string): src is ImageMetadata {
	return typeof src === 'object' || (typeof src === 'function' && 'src' in src);
}

/**
 * Determines if the provided source is a remote image URL in the form of a string.
 *
 * @param {ImageMetadata | string} src - The source to check, which can either be an `ImageMetadata` object or a string.
 * @return {boolean} Returns `true` if the source is a string, otherwise `false`.
 */
export function isRemoteImage(src: ImageMetadata | string): src is string {
	return typeof src === 'string';
}

/**
 * Resolves the source of an image transformation by handling asynchronous or synchronous inputs.
 *
 * @param {UnresolvedImageTransform['src']} src - The source of the image transformation.
 * @return {Promise<string | ImageMetadata>} A promise that resolves to the image source. It returns either the default export of the resolved source or the resolved source itself if the default export doesn't exist.
 */
export async function resolveSrc(
	src: UnresolvedImageTransform['src'],
): Promise<string | ImageMetadata> {
	if (typeof src === 'object' && 'then' in src) {
		const resource = await src;
		return resource.default ?? resource;
	}
	return src;
}
