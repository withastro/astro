// @ts-expect-error
import { outDir, serverDir } from 'astro:assets';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isParentDirectory } from '@astrojs/internal-helpers/path';
import type { APIRoute } from '../../types/public/common.js';
import { handleImageRequest } from './shared.js';

async function loadLocalImage(src: string, url: URL) {
	const outDirURL = resolveOutDir();
	// If the _image segment isn't at the start of the path, we have a base
	const idx = url.pathname.indexOf('/_image');
	if (idx > 0) {
		// Remove the base path
		src = src.slice(idx);
	}
	if (!URL.canParse('.' + src, outDirURL)) {
		return undefined;
	}
	const fileUrl = new URL('.' + src, outDirURL);
	if (fileUrl.protocol !== 'file:') {
		return undefined;
	}
	if (!isParentDirectory(fileURLToPath(outDirURL), fileURLToPath(fileUrl))) {
		return undefined;
	}

	try {
		return await readFile(fileUrl);
	} catch {
		return undefined;
	}
}

/**
 * Endpoint used in dev and SSR to serve optimized images by the base image services
 */
export const GET: APIRoute = async ({ request }) => {
	try {
		return await handleImageRequest({ request, loadLocalImage });
	} catch (err: unknown) {
		console.error('Could not process image request:', err);
		return new Response('Internal Server Error', {
			status: 500,
		});
	}
};

function resolveOutDir() {
	const serverDirPath = fileURLToPath(serverDir);
	const rel = path.relative(serverDirPath, fileURLToPath(outDir));

	const serverFolder = path.basename(serverDirPath);
	let serverEntryFolderURL = path.dirname(import.meta.url);
	while (!serverEntryFolderURL.endsWith(serverFolder)) {
		serverEntryFolderURL = path.dirname(serverEntryFolderURL);
	}
	const serverEntryURL = serverEntryFolderURL + '/entry.mjs';
	const outDirURL = new URL(appendForwardSlash(rel), serverEntryURL);
	return outDirURL;
}

function appendForwardSlash(pth: string) {
	return pth.endsWith('/') ? pth : pth + '/';
}
