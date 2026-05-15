import { outDir, serverDir } from 'astro:assets';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isParentDirectory } from '@astrojs/internal-helpers/path';
import { handleImageRequest } from './shared.js';
async function loadLocalImage(src, url) {
	const outDirURL = resolveOutDir();
	const idx = url.pathname.indexOf('/_image');
	if (idx > 0) {
		src = src.slice(idx);
	}
	if (!URL.canParse('.' + src, outDirURL)) {
		return void 0;
	}
	const fileUrl = new URL('.' + src, outDirURL);
	if (fileUrl.protocol !== 'file:') {
		return void 0;
	}
	if (!isParentDirectory(fileURLToPath(outDirURL), fileURLToPath(fileUrl))) {
		return void 0;
	}
	try {
		return await readFile(fileUrl);
	} catch {
		return void 0;
	}
}
const GET = async ({ request }) => {
	try {
		return await handleImageRequest({ request, loadLocalImage });
	} catch (err) {
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
function appendForwardSlash(pth) {
	return pth.endsWith('/') ? pth : pth + '/';
}
export { GET };
