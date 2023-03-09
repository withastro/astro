import { createRequire } from 'module';
import fs from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ImageMetadata, InputFormat } from '../types.js';
const require = createRequire(getModuleURL(import.meta.url));
const sizeOf = require('image-size');

export interface Metadata extends ImageMetadata {
	orientation?: number;
}

export async function imageMetadata(
	src: URL | string,
	data?: Buffer
): Promise<Metadata | undefined> {
	let file = data;
	if (!file) {
		try {
			file = await fs.readFile(src);
		} catch (e) {
			return undefined;
		}
	}

	const { width, height, type, orientation } = await sizeOf(file);
	const isPortrait = (orientation || 0) >= 5;

	if (!width || !height || !type) {
		return undefined;
	}

	return {
		src: fileURLToPath(src),
		width: isPortrait ? height : width,
		height: isPortrait ? width : height,
		format: type as InputFormat,
		orientation,
	};
}

/**
* On certain serverless hosts, our ESM bundle is transpiled to CJS before being run, which means
* import.meta.url is undefined, so we'll fall back to __dirname in those cases
* We should be able to remove this once https://github.com/netlify/zip-it-and-ship-it/issues/750 is fixed
*/
export function getModuleURL(url: string | undefined): string {
	if (!url) {
		return pathToFileURL(__dirname).toString();
	}

 return url
}
