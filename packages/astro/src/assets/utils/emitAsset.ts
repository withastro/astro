import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import slash from 'slash';
import type { AstroSettings, AstroConfig } from '../../@types/astro';
import { imageMetadata } from './metadata.js';

export async function emitESMImage(
	id: string,
	watchMode: boolean,
	fileEmitter: any,
	settings: Pick<AstroSettings, 'config'>
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

/**
 * Utilities inlined from `packages/astro/src/core/util.ts`
 * Avoids ESM / CJS bundling failures when accessed from integrations
 * due to Vite dependencies in core.
 */

function rootRelativePath(config: Pick<AstroConfig, 'root'>, url: URL) {
	const basePath = fileURLToNormalizedPath(url);
	const rootPath = fileURLToNormalizedPath(config.root);
	return prependForwardSlash(basePath.slice(rootPath.length));
}

function prependForwardSlash(filePath: string) {
	return filePath[0] === '/' ? filePath : '/' + filePath;
}

function fileURLToNormalizedPath(filePath: URL): string {
	// Uses `slash` package instead of Vite's `normalizePath`
	// to avoid CJS bundling issues.
	return slash(fileURLToPath(filePath) + filePath.search).replace(/\\/g, '/');
}

export function emoji(char: string, fallback: string) {
	return process.platform !== 'win32' ? char : fallback;
}
