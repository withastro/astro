import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { AstroSettings } from '../../@types/astro';
import { rootRelativePath } from '../../core/util.js';
import { imageMetadata } from './metadata.js';

export async function emitESMImage(
	id: string,
	watchMode: boolean,
	fileEmitter: any,
	settings: AstroSettings
) {
	const url = pathToFileURL(id);
	const meta = await imageMetadata(url);

	if (!meta) {
		return;
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

		meta.src = rootRelativePath(settings.config, url);
	}

	return meta;
}
