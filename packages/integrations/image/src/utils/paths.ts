import type { TransformOptions } from '../loaders/index.js';
import { shorthash } from './shorthash.js';

export function isRemoteImage(src: string) {
	return /^(https?:)?\/\//.test(src);
}

function removeQueryString(src: string) {
	const index = src.lastIndexOf('?');
	return index > 0 ? src.substring(0, index) : src;
}

export function extname(src: string) {
	const base = basename(src);
	const index = base.lastIndexOf('.');

	if (index <= 0) {
		return '';
	}

	return base.substring(index);
}

function removeExtname(src: string) {
	const index = src.lastIndexOf('.');

	if (index <= 0) {
		return src;
	}

	return src.substring(0, index);
}

function basename(src: string) {
	return removeQueryString(src.replace(/^.*[\\\/]/, ''));
}

export function propsToFilename(transform: TransformOptions) {
	// strip off the querystring first, then remove the file extension
	let filename = removeQueryString(transform.src);
	filename = basename(filename);
	const ext = extname(filename);
	filename = removeExtname(filename);

	const outputExt = transform.format ? `.${transform.format}` : ext;

	return `/${filename}_${shorthash(JSON.stringify(transform))}${outputExt}`;
}

export function appendForwardSlash(path: string) {
	return path.endsWith('/') ? path : path + '/';
}

export function prependForwardSlash(path: string) {
	return path[0] === '/' ? path : '/' + path;
}

export function removeTrailingForwardSlash(path: string) {
	return path.endsWith('/') ? path.slice(0, path.length - 1) : path;
}

export function removeLeadingForwardSlash(path: string) {
	return path.startsWith('/') ? path.substring(1) : path;
}

export function trimSlashes(path: string) {
	return path.replace(/^\/|\/$/g, '');
}

function isString(path: unknown): path is string {
	return typeof path === 'string' || path instanceof String;
}

export function joinPaths(...paths: (string | undefined)[]) {
	return paths.filter(isString).map(trimSlashes).join('/');
}
