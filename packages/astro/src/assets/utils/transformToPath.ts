import { basename, extname } from 'node:path';
import { deterministicString } from 'deterministic-object-hash';
import { removeQueryString } from '../../core/path.js';
import { shorthash } from '../../runtime/server/shorthash.js';
import type { ImageTransform } from '../types.js';
import { isESMImportedImage } from './imageKind.js';

export function propsToFilename(transform: ImageTransform, hash: string) {
	let filename = removeQueryString(
		isESMImportedImage(transform.src) ? transform.src.src : transform.src
	);
	const ext = extname(filename);
	filename = decodeURIComponent(basename(filename, ext));

	let outputExt = transform.format ? `.${transform.format}` : ext;
	return `/${filename}_${hash}${outputExt}`;
}

export function hashTransform(
	transform: ImageTransform,
	imageService: string,
	propertiesToHash: string[]
) {
	// Extract the fields we want to hash
	const hashFields = propertiesToHash.reduce(
		(acc, prop) => {
			// It's possible for `transform[prop]` here to be undefined, or null, but that's fine because it's still consistent
			// between different transforms. (ex: every transform without a height will explicitly have a `height: undefined` property)
			acc[prop] = transform[prop];
			return acc;
		},
		{ imageService } as Record<string, unknown>
	);
	return shorthash(deterministicString(hashFields));
}
