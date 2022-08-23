import fs from 'node:fs';
import path from 'node:path';
import { OUTPUT_DIR } from '../constants.js';
import type { TransformOptions } from '../loaders/index.js';
import { isRemoteImage } from './images.js';
import { shorthash } from './shorthash.js';

function removeQueryString(src: string) {
	const index = src.lastIndexOf('?');
	return index > 0 ? src.substring(0, index) : src;
}

function removeExtname(src: string) {
	const ext = path.extname(src);

	if (!ext) {
		return src;
	}

	const index = src.lastIndexOf(ext);
	return src.substring(0, index);
}

export function ensureDir(dir: string) {
	fs.mkdirSync(dir, { recursive: true });
}

export function propsToFilename({ src, width, height, format }: TransformOptions) {
	// strip off the querystring first, then remove the file extension
	let filename = removeQueryString(src);
	const ext = path.extname(filename);
	filename = removeExtname(filename);

	// for remote images, add a hash of the full URL to dedupe images with the same filename
	if (isRemoteImage(src)) {
		filename += `-${shorthash(src)}`;
	}

	if (width && height) {
		return `${filename}_${width}x${height}.${format}`;
	} else if (width) {
		return `${filename}_${width}w.${format}`;
	} else if (height) {
		return `${filename}_${height}h.${format}`;
	}

	return format ? src.replace(ext, format) : src;
}

export function filenameFormat(transform: TransformOptions) {
	return isRemoteImage(transform.src)
		? path.join(OUTPUT_DIR, path.basename(propsToFilename(transform)))
		: path.join(OUTPUT_DIR, path.dirname(transform.src), path.basename(propsToFilename(transform)));
}
