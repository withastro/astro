// @ts-expect-error
import { safeModulePaths, viteFSConfig } from 'astro:assets';
import { readFile } from 'node:fs/promises';
import os from 'node:os';
import picomatch from 'picomatch';
import { type AnymatchFn, isFileLoadingAllowed, type ResolvedConfig } from 'vite';
import type { APIRoute } from '../../types/public/common.js';
import { handleImageRequest, loadRemoteImage } from './shared.js';

function replaceFileSystemReferences(src: string) {
	return os.platform().includes('win32') ? src.replace(/^\/@fs\//, '') : src.replace(/^\/@fs/, '');
}

async function loadLocalImage(src: string, url: URL) {
	let returnValue: Buffer | undefined;
	let fsPath: string | undefined;

	// Vite uses /@fs/ to denote filesystem access, but we need to convert that to a real path to load it
	if (src.startsWith('/@fs/')) {
		fsPath = replaceFileSystemReferences(src);
	}

	// Vite only uses the fs config, but the types ask for the full config
	// fsDenyGlob's implementation is internal from https://github.com/vitejs/vite/blob/e6156f71f0e21f4068941b63bcc17b0e9b0a7455/packages/vite/src/node/config.ts#L1931
	if (
		fsPath &&
		isFileLoadingAllowed(
			{
				fsDenyGlob: picomatch(
					// matchBase: true does not work as it's documented
					// https://github.com/micromatch/picomatch/issues/89
					// convert patterns without `/` on our side for now
					viteFSConfig.deny.map((pattern: string) =>
						pattern.includes('/') ? pattern : `**/${pattern}`,
					),
					{
						matchBase: false,
						nocase: true,
						dot: true,
					},
				),
				server: { fs: viteFSConfig },
				safeModulePaths,
			} as ResolvedConfig & { fsDenyGlob: AnymatchFn; safeModulePaths: Set<string> },
			fsPath,
		)
	) {
		try {
			returnValue = await readFile(fsPath);
		} catch {
			returnValue = undefined;
		}

		// If we couldn't load it directly, try loading it through Vite as a fallback, which will also respect Vite's fs rules
		if (!returnValue) {
			try {
				const res = await fetch(new URL(src, url));

				if (res.ok) {
					returnValue = Buffer.from(await res.arrayBuffer());
				}
			} catch {
				returnValue = undefined;
			}
		}
	} else {
		// Otherwise we'll assume it's a local URL and try to load it via fetch
		const sourceUrl = new URL(src, url.origin);
		// This is only allowed if this is the same origin
		if (sourceUrl.origin !== url.origin) {
			returnValue = undefined;
		}
		return loadRemoteImage(sourceUrl);
	}

	return returnValue;
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
