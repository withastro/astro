import { deterministicString } from './deterministic-string.js';
import { removeQueryString } from '@astrojs/internal-helpers/path';
import { shorthash } from '../../runtime/server/shorthash.js';
import { isESMImportedImage } from './imageKind.js';
const INVALID_CHAR_REGEX = /[\u0000-\u001F"#$%&*+,:;<=>?[\]^`{|}\u007F]/g;
function basename(filePath, ext) {
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
function dirname(filePath) {
	const lastSlash = filePath.lastIndexOf('/');
	if (lastSlash === -1) return '.';
	if (lastSlash === 0) return '/';
	return filePath.slice(0, lastSlash);
}
function extname(filePath) {
	const base = basename(filePath);
	const dotIndex = base.lastIndexOf('.');
	if (dotIndex <= 0) return '';
	return base.slice(dotIndex);
}
function propsToFilename(filePath, transform, hash) {
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
function hashTransform(transform, imageService, propertiesToHash) {
	const hashFields = propertiesToHash.reduce(
		(acc, prop) => {
			acc[prop] = transform[prop];
			return acc;
		},
		{ imageService },
	);
	return shorthash(deterministicString(hashFields));
}
export { hashTransform, propsToFilename };
