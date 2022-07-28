import fs from 'node:fs/promises';
import type { OutputFormat, TransformOptions } from '../loaders/index.js';

export function isOutputFormat(value: string): value is OutputFormat {
	return ['avif', 'jpeg', 'png', 'webp'].includes(value);
}

export function isAspectRatioString(value: string): value is `${number}:${number}` {
	return /^\d*:\d*$/.test(value);
}

export function isRemoteImage(src: string) {
	return /^http(s?):\/\//.test(src);
}

export async function loadLocalImage(src: string) {
	try {
		return await fs.readFile(src);
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
	return isRemoteImage(src) ? await loadRemoteImage(src) : await loadLocalImage(src);
}

export function parseAspectRatio(aspectRatio: TransformOptions['aspectRatio']) {
	if (!aspectRatio) {
		return undefined;
	}

	// parse aspect ratio strings, if required (ex: "16:9")
	if (typeof aspectRatio === 'number') {
		return aspectRatio;
	} else {
		const [width, height] = aspectRatio.split(':');
		return parseInt(width) / parseInt(height);
	}
}
