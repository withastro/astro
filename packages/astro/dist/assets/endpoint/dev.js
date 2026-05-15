import { fsDenyGlob, safeModulePaths, viteFSConfig } from 'astro:assets';
import { readFile } from 'node:fs/promises';
import os from 'node:os';
import { isFileLoadingAllowed } from 'vite';
import { handleImageRequest, loadRemoteImage } from './shared.js';
function replaceFileSystemReferences(src) {
	return os.platform().includes('win32') ? src.replace(/^\/@fs\//, '') : src.replace(/^\/@fs/, '');
}
async function loadLocalImage(src, url) {
	let returnValue;
	let fsPath;
	if (src.startsWith('/@fs/')) {
		fsPath = replaceFileSystemReferences(src);
	}
	if (
		fsPath &&
		isFileLoadingAllowed(
			{
				fsDenyGlob,
				server: { fs: viteFSConfig },
				safeModulePaths,
			},
			fsPath,
		)
	) {
		try {
			returnValue = await readFile(fsPath);
		} catch {
			returnValue = void 0;
		}
		if (!returnValue) {
			try {
				const res = await fetch(new URL(src, url));
				if (res.ok) {
					returnValue = Buffer.from(await res.arrayBuffer());
				}
			} catch {
				returnValue = void 0;
			}
		}
	} else {
		const sourceUrl = new URL(src, url.origin);
		if (sourceUrl.origin !== url.origin) {
			return void 0;
		}
		return loadRemoteImage(sourceUrl);
	}
	return returnValue;
}
const GET = async ({ request }) => {
	if (!import.meta.env.DEV) {
		console.error('The dev image endpoint can only be used in dev mode.');
		return new Response('Invalid endpoint', { status: 500 });
	}
	try {
		return await handleImageRequest({ request, loadLocalImage });
	} catch (err) {
		console.error('Could not process image request:', err);
		return new Response(`Could not process image request: ${err}`, {
			status: 500,
		});
	}
};
export { GET };
