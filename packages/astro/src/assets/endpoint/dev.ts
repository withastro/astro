// @ts-expect-error
import { root } from 'astro:config/server';
import { readFile } from 'node:fs/promises';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { isParentDirectory } from '@astrojs/internal-helpers/path';
import type { APIRoute } from '../../types/public/common.js';
import { handleImageRequest, loadRemoteImage } from './shared.js';

function replaceFileSystemReferences(src: string) {
	return os.platform().includes('win32') ? src.replace(/^\/@fs\//, '') : src.replace(/^\/@fs/, '');
}

async function loadLocalImage(src: string, url: URL) {
	// Vite uses /@fs/ to denote filesystem access
	if (src.startsWith('/@fs/')) {
		src = replaceFileSystemReferences(src);
		if (!isParentDirectory(fileURLToPath(root), src)) {
			return undefined;
		}
	}
	// Vite allows loading files directly from the filesystem
	// as long as they are inside the project root.
	if (isParentDirectory(fileURLToPath(root), src)) {
		try {
			return await readFile(src);
		} catch {
			return undefined;
		}
	} else {
		// Otherwise we'll assume it's a local URL and try to load it via fetch
		const sourceUrl = new URL(src, url.origin);
		// This is only allowed if this is the same origin
		if (sourceUrl.origin !== url.origin) {
			return undefined;
		}
		return loadRemoteImage(sourceUrl);
	}
}

/**
 * Endpoint used in dev and SSR to serve optimized images by the base image services
 */
export const GET: APIRoute = async ({ request }) => {
	if (!import.meta.env.DEV) {
		console.error('The dev image endpoint can only be used in dev mode.');
		return new Response('Invalid endpoint', { status: 500 });
	}
	try {
		return await handleImageRequest({ request, loadLocalImage });
	} catch (err: unknown) {
		console.error('Could not process image request:', err);
		return new Response(`Could not process image request: ${err}`, {
			status: 500,
		});
	}
};
