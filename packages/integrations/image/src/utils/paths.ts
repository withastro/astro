import fs from 'fs';
import path from 'path';
import { OUTPUT_DIR } from '../constants.js';
import { isRemoteImage } from './images.js';
import { shorthash } from './shorthash.js';
import type { TransformOptions } from '../types.js';

export function ensureDir(dir: string) {
	fs.mkdirSync(dir, { recursive: true });
}

export function propsToFilename({ src, width, height, format }: TransformOptions) {
	const ext = path.extname(src);
	let filename = src.replace(ext, '');

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
		: path.join(
				OUTPUT_DIR,
				path.dirname(transform.src),
				path.basename(propsToFilename(transform))
			);
}
