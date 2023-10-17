import { deterministicString } from 'deterministic-object-hash';
import { basename, extname } from 'node:path';
import { removeQueryString } from '../../core/path.js';
import { shorthash } from '../../runtime/server/shorthash.js';
import { isESMImportedImage } from '../internal.js';
import type { ImageTransform } from '../types.js';

export function propsToFilename(transform: ImageTransform, hash: string) {
	let filename = removeQueryString(
		isESMImportedImage(transform.src) ? transform.src.src : transform.src
	);
	const ext = extname(filename);
	filename = basename(filename, ext);

	let outputExt = transform.format ? `.${transform.format}` : ext;
	return `/${filename}_${hash}${outputExt}`;
}

export function hashTransform(transform: ImageTransform, imageService: string) {
	// Extract the fields we want to hash
	const { alt, class: className, style, widths, densities, ...rest } = transform;
	const hashFields = { ...rest, imageService };
	return shorthash(deterministicString(hashFields));
}
