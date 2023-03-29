import { basename, extname } from 'path';
import { removeQueryString } from '../../core/path.js';
import { shorthash } from '../../runtime/server/shorthash.js';
import { isESMImportedImage } from '../internal.js';
import type { ImageTransform } from '../types.js';

export function propsToFilename(transform: ImageTransform, imageService: string) {
	if (!isESMImportedImage(transform.src)) {
		return transform.src;
	}

	let filename = removeQueryString(transform.src.src);
	const ext = extname(filename);
	filename = basename(filename, ext);
	// take everything from transform except alt, which is not used in the hash
	const { alt, ...rest } = transform;
	const hashFields = { ...rest, imageService };
	const outputExt = transform.format ? `.${transform.format}` : ext;
	return `/${filename}_${shorthash(JSON.stringify(hashFields))}${outputExt}`;
}
