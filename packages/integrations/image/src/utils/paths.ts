import { OutputFormat, TransformOptions } from "../loaders/index.js";
import { shorthash } from "./shorthash.js";

export function isRemoteImage(src: string) {
	return /^http(s?):\/\//.test(src);
}

function removeQueryString(src: string) {
	const index = src.lastIndexOf('?');
	return index > 0 ? src.substring(0, index) : src;
}

function extname(src: string, format?: OutputFormat) {
	const index = src.lastIndexOf('.');

	if (index <= 0) {
		return undefined;
	}

	return src.substring(index);
}

function removeExtname(src: string) {
	const index = src.lastIndexOf('.');

	if (index <= 0) {
		return src;
	}

	return src.substring(0, index);
}

function basename(src: string) {
	return src.replace(/^.*[\\\/]/, '');
}

export function propsToFilename(transform: TransformOptions) {
	// strip off the querystring first, then remove the file extension
	let filename = removeQueryString(transform.src);
	filename = basename(filename);
	filename = removeExtname(filename);

	const ext = transform.format || extname(transform.src);

	return `/${filename}_${shorthash(JSON.stringify(transform))}.${ext}`;
}
