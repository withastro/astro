import type { ImageMetadata } from '../types.js';
/**
 * Extracts image metadata such as dimensions, format, and orientation from the provided image data.
 *
 * @param {Uint8Array} data - The binary data of the image.
 * @param {string} [src] - The source path or URL of the image, used for error messages. Optional.
 * @return {Promise<Omit<ImageMetadata, 'src' | 'fsPath'>>} A promise that resolves with the extracted metadata, excluding `src` and `fsPath`.
 * @throws {AstroError} Throws an error if the image metadata cannot be extracted.
 */
export declare function imageMetadata(
	data: Uint8Array,
	src?: string,
): Promise<Omit<ImageMetadata, 'src' | 'fsPath'>>;
