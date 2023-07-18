import { basename, extname } from 'node:path';
import { removeQueryString } from '../../core/path.js';
import { shorthash } from '../../runtime/server/shorthash.js';
import { isESMImportedImage } from '../internal.js';
import type { ImageTransform } from '../types.js';

export function propsToFilename(transform: ImageTransform, hash: string) {
	if (!isESMImportedImage(transform.src)) {
		return transform.src;
	}

	let filename = removeQueryString(transform.src.src);
	const ext = extname(filename);
	filename = basename(filename, ext);
	const outputExt = transform.format ? `.${transform.format}` : ext;
	return `/${filename}_${hash}${outputExt}`;
}

export function hashTransform(transform: ImageTransform, imageService: string) {
	// take everything from transform except alt, which is not used in the hash
	const { alt, ...rest } = transform;
	const hashFields = { ...rest, imageService };
	return shorthash(JSON.stringify(hashFields));
}
