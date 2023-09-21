import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { prependForwardSlash, slash } from '../../core/path.js';
import type { ImageMetadata } from '../types.js';
import { imageMetadata } from './metadata.js';

export async function emitESMImage(
	id: string | undefined,
	watchMode: boolean,
	fileEmitter: any
): Promise<ImageMetadata | undefined> {
	if (!id) {
		return undefined;
	}

	const url = pathToFileURL(id);
	let fileData: Buffer;
	try {
		fileData = await fs.readFile(url);
	} catch (err) {
		return undefined;
	}

	const fileMetadata = await imageMetadata(fileData, id);

	const emittedImage: ImageMetadata = {
		src: '',
		...fileMetadata,
	};

	// Build
	if (!watchMode) {
		const pathname = decodeURI(url.pathname);
		const filename = path.basename(pathname, path.extname(pathname) + `.${fileMetadata.format}`);

		const handle = fileEmitter({
			name: filename,
			source: await fs.readFile(url),
			type: 'asset',
		});

		emittedImage.src = `__ASTRO_ASSET_IMAGE__${handle}__`;
	} else {
		// Pass the original file information through query params so we don't have to load the file twice
		url.searchParams.append('origWidth', fileMetadata.width.toString());
		url.searchParams.append('origHeight', fileMetadata.height.toString());
		url.searchParams.append('origFormat', fileMetadata.format);

		emittedImage.src = `/@fs` + prependForwardSlash(fileURLToNormalizedPath(url));
	}

	return emittedImage;
}

function fileURLToNormalizedPath(filePath: URL): string {
	// Uses `slash` instead of Vite's `normalizePath` to avoid CJS bundling issues.
	return slash(fileURLToPath(filePath) + filePath.search).replace(/\\/g, '/');
}
