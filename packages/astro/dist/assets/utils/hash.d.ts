import type { ImageTransform } from '../types.js';
/**
 * Converts a file path and transformation properties into a formatted filename.
 *
 * `<prefixDirname>/<baseFilename>_<hash><outputExtension>`
 */
export declare function propsToFilename(
	filePath: string,
	transform: ImageTransform,
	hash: string,
): string;
/** Hashes the subset of transform properties that affect the output image. */
export declare function hashTransform(
	transform: ImageTransform,
	imageService: string,
	propertiesToHash: string[],
): string;
