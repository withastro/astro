import fs from 'fs';
import path from 'path';
import type { ImageProps } from './types.js';

export function ensureDir(dir: string) {
	fs.mkdirSync(dir, { recursive: true });
}

export function isRemoteImage(src: string) {
	return /^http(s?):\/\//.test(src);
}

export async function loadLocalImage(src: string) {
	try {
		return await fs.promises.readFile(src);
	} catch {
		return undefined;
	}
}

export async function loadRemoteImage(src: string) {
	try {
		const res = await fetch(src);

		if (!res.ok) {
			return undefined;
		}

		return Buffer.from(await res.arrayBuffer());
	} catch {
		return undefined;
	}
}

export async function loadImage(src: string) {
	return isRemoteImage(src)
		? await loadRemoteImage(src)
		: await loadLocalImage(src);
}

export function propsToFilename({ src, width, height, format }: ImageProps) {
	const ext = path.extname(src);
	let filename = src.replace(ext, '');

	if (width && height) {
		return `${filename}_${width}x${height}.${format}`;
	} else if (width) {
		return `${filename}_${width}w.${format}`;
	} else if (height) {
		return `${filename}_${height}h.${format}`;
	}

	return format ? src.replace(ext, format) : src;
}
