import { basename, dirname, extname } from 'node:path';
import { deterministicString } from 'deterministic-object-hash';
import { removeQueryString } from '../../core/path.js';
import { shorthash } from '../../runtime/server/shorthash.js';
import type { ImageTransform } from '../types.js';
import { isESMImportedImage } from './imageKind.js';

// Taken from https://github.com/rollup/rollup/blob/a8647dac0fe46c86183be8596ef7de25bc5b4e4b/src/utils/sanitizeFileName.ts
// eslint-disable-next-line no-control-regex
const INVALID_CHAR_REGEX = /[\u0000-\u001F"#$%&*+,:;<=>?[\]^`{|}\u007F]/g;

/**
 * Converts a file path and transformation properties of the transformation image service, into a formatted filename.
 *
 * The formatted filename follows this structure:
 *
 * `<prefixDirname>/<baseFilename>_<hash><outputExtension>`
 *
 * - `prefixDirname`: If the image is an ESM imported image, this is the directory name of the original file path; otherwise, it will be an empty string.
 * - `baseFilename`: The base name of the file or a hashed short name if the file is a `data:` URI.
 * - `hash`: A unique hash string generated to distinguish the transformed file.
 * - `outputExtension`: The desired output file extension derived from the `transform.format` or the original file extension.
 *
 * ## Example
 * - Input: `filePath = '/images/photo.jpg'`, `transform = { format: 'png', src: '/images/photo.jpg' }`, `hash = 'abcd1234'`.
 * - Output: `/images/photo_abcd1234.png`
 *
 * @param {string} filePath - The original file path or data URI of the source image.
 * @param {ImageTransform} transform - An object representing the transformation properties, including format and source.
 * @param {string} hash - A unique hash used to differentiate the transformed file.
 * @return {string} The generated filename based on the provided input, transformations, and hash.
 */

export function propsToFilename(filePath: string, transform: ImageTransform, hash: string): string {
	let filename = decodeURIComponent(removeQueryString(filePath));
	const ext = extname(filename);
	if (filePath.startsWith('data:')) {
		filename = shorthash(filePath);
	} else {
		filename = basename(filename, ext).replace(INVALID_CHAR_REGEX, '_');
	}
	const prefixDirname = isESMImportedImage(transform.src) ? dirname(filePath) : '';

	let outputExt = transform.format ? `.${transform.format}` : ext;
	return `${prefixDirname}/${filename}_${hash}${outputExt}`;
}

/**
 * Transforms the provided `transform` object into a hash string based on selected properties
 * and the specified `imageService`.
 *
 * @param {ImageTransform} transform - The transform object containing various image transformation properties.
 * @param {string} imageService - The name of the image service related to the transform.
 * @param {string[]} propertiesToHash - An array of property names from the `transform` object that should be used to generate the hash.
 * @return {string} A hashed string created from the specified properties of the `transform` object and the image service.
 */
export function hashTransform(
	transform: ImageTransform,
	imageService: string,
	propertiesToHash: string[],
): string {
	// Extract the fields we want to hash
	const hashFields = propertiesToHash.reduce(
		(acc, prop) => {
			// It's possible for `transform[prop]` here to be undefined, or null, but that's fine because it's still consistent
			// between different transforms. (ex: every transform without a height will explicitly have a `height: undefined` property)
			acc[prop] = transform[prop];
			return acc;
		},
		{ imageService } as Record<string, unknown>,
	);
	return shorthash(deterministicString(hashFields));
}
