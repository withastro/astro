import { deterministicString } from './deterministic-string.js';
import { removeQueryString } from '@astrojs/internal-helpers/path';
import { shorthash } from '../../runtime/server/shorthash.js';
import type { ImageTransform } from '../types.js';
import { isESMImportedImage } from './imageKind.js';

// Taken from https://github.com/rollup/rollup/blob/a8647dac0fe46c86183be8596ef7de25bc5b4e4b/src/utils/sanitizeFileName.ts
// eslint-disable-next-line no-control-regex
const INVALID_CHAR_REGEX = /[\u0000-\u001F"#$%&*+,:;<=>?[\]^`{|}\u007F]/g;

/** Pure-string replacement for `path.posix.basename` (no node: import). */
function basename(filePath: string, ext?: string): string {
	let end = filePath.length;
	while (end > 0 && filePath[end - 1] === '/') end--;
	const stripped = filePath.slice(0, end);

	const lastSlash = stripped.lastIndexOf('/');
	const base = lastSlash === -1 ? stripped : stripped.slice(lastSlash + 1);

	if (ext && base.endsWith(ext)) {
		return base.slice(0, base.length - ext.length);
	}
	return base;
}

/** Pure-string replacement for `path.posix.dirname` (no node: import). */
function dirname(filePath: string): string {
	const lastSlash = filePath.lastIndexOf('/');
	if (lastSlash === -1) return '.';
	if (lastSlash === 0) return '/';
	return filePath.slice(0, lastSlash);
}

/** Pure-string replacement for `path.posix.extname` (no node: import). */
function extname(filePath: string): string {
	const base = basename(filePath);
	const dotIndex = base.lastIndexOf('.');
	if (dotIndex <= 0) return '';
	return base.slice(dotIndex);
}

/**
 * Converts a file path and transformation properties into a formatted filename.
 *
 * `<prefixDirname>/<baseFilename>_<hash><outputExtension>`
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

/** Hashes the subset of transform properties that affect the output image. */
export function hashTransform(
	transform: ImageTransform,
	imageService: string,
	propertiesToHash: string[],
): string {
	const hashFields = propertiesToHash.reduce(
		(acc, prop) => {
			acc[prop] = transform[prop];
			return acc;
		},
		{ imageService } as Record<string, unknown>,
	);
	return shorthash(deterministicString(hashFields));
}
