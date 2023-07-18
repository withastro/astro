import fs from 'node:fs';
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
	const meta = await imageMetadata(url);

	if (!meta) {
		return undefined;
	}

	// Build
	if (!watchMode) {
		const pathname = decodeURI(url.pathname);
		const filename = path.basename(pathname, path.extname(pathname) + `.${meta.format}`);

		const handle = fileEmitter({
			name: filename,
			source: await fs.promises.readFile(url),
			type: 'asset',
		});

		meta.src = `__ASTRO_ASSET_IMAGE__${handle}__`;
	} else {
		// Pass the original file information through query params so we don't have to load the file twice
		url.searchParams.append('origWidth', meta.width.toString());
		url.searchParams.append('origHeight', meta.height.toString());
		url.searchParams.append('origFormat', meta.format);

		meta.src = `/@fs` + prependForwardSlash(fileURLToNormalizedPath(url));
	}

	return meta;
}

function fileURLToNormalizedPath(filePath: URL): string {
	// Uses `slash` instead of Vite's `normalizePath` to avoid CJS bundling issues.
	return slash(fileURLToPath(filePath) + filePath.search).replace(/\\/g, '/');
}
