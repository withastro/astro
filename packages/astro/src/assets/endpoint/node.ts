// @ts-expect-error
import { outDirRelative, serverDirName } from 'astro:assets';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isParentDirectory } from '@astrojs/internal-helpers/path';
import type { APIRoute } from '../../types/public/common.js';
import { handleImageRequest, type LocalImageLoadResult } from './shared.js';

async function loadLocalImage(src: string, url: URL): Promise<LocalImageLoadResult> {
	const outDirURL = resolveOutDir();
	// If the _image segment isn't at the start of the path, we have a base
	const idx = url.pathname.indexOf('/_image');
	if (idx > 0) {
		// Remove the base path
		src = src.slice(idx);
	}

	let fileUrl: URL;
	try {
		if (!URL.canParse('.' + src, outDirURL)) {
			return { kind: 'invalid-path' };
		}
		fileUrl = new URL('.' + src, outDirURL);
		if (
			fileUrl.protocol !== 'file:' ||
			!isParentDirectory(fileURLToPath(outDirURL), fileURLToPath(fileUrl))
		) {
			return { kind: 'invalid-path' };
		}
	} catch {
		return { kind: 'invalid-path' };
	}

	try {
		return { kind: 'loaded', buffer: await readFile(fileUrl) };
	} catch (error) {
		if (
			error instanceof Error &&
			'code' in error &&
			(error.code === 'ENOENT' || error.code === 'ENOTDIR' || error.code === 'EISDIR')
		) {
			return { kind: 'not-found' };
		}
		return { kind: 'failed' };
	}
}

/**
 * Endpoint used in dev and SSR to serve optimized images by the base image services
 */
export const GET: APIRoute = async ({ request, logger }) => {
	try {
		return await handleImageRequest({ request, loadLocalImage, logger });
	} catch (err: unknown) {
		logger.error(`Could not process image request: ${err}`);
		return new Response('Internal Server Error', {
			status: 500,
		});
	}
};

function resolveOutDir() {
	// Absolute `file://` URLs (output directories on different Windows drives) resolve
	// from any location, so use them directly.
	if (URL.canParse(outDirRelative)) {
		return new URL(outDirRelative);
	}

	let serverEntryFolderURL = path.dirname(import.meta.url);
	while (!serverEntryFolderURL.endsWith(serverDirName)) {
		serverEntryFolderURL = path.dirname(serverEntryFolderURL);
	}
	const serverEntryURL = serverEntryFolderURL + '/entry.mjs';
	const outDirURL = new URL(appendForwardSlash(outDirRelative), serverEntryURL);
	return outDirURL;
}

function appendForwardSlash(pth: string) {
	return pth.endsWith('/') ? pth : pth + '/';
}
