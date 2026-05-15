import path from 'node:path';
import url from 'node:url';
import fs from 'node:fs';
import { appendForwardSlash } from '@astrojs/internal-helpers/path';
const STATIC_HEADERS_FILE = '_headers.json';
function resolveClientDir(options) {
	const clientURLRaw = new URL(options.client);
	const serverURLRaw = new URL(options.server);
	const rel = path.relative(url.fileURLToPath(serverURLRaw), url.fileURLToPath(clientURLRaw));
	const serverFolder = path.basename(options.server);
	let serverEntryFolderURL = path.dirname(import.meta.url);
	let previous = '';
	while (!serverEntryFolderURL.endsWith(serverFolder)) {
		if (serverEntryFolderURL === previous) {
			throw new Error(
				`[@astrojs/node] Could not find the server directory "${serverFolder}" by walking up from "${import.meta.url}". This can happen when the server entry point is bundled into a single file (e.g. with esbuild) so that import.meta.url no longer contains the original "${serverFolder}" path segment. When bundling the server entry, make sure the output path contains a "${serverFolder}" directory segment, or avoid bundling the server entry entirely.`,
			);
		}
		previous = serverEntryFolderURL;
		serverEntryFolderURL = path.dirname(serverEntryFolderURL);
	}
	const serverEntryURL = serverEntryFolderURL + '/entry.mjs';
	const clientURL = new URL(appendForwardSlash(rel), serverEntryURL);
	return url.fileURLToPath(clientURL);
}
function readHeadersJson(outDir) {
	let headersMap = void 0;
	const headersUrl = new URL(STATIC_HEADERS_FILE, outDir);
	if (fs.existsSync(headersUrl)) {
		const content = fs.readFileSync(headersUrl, 'utf-8');
		try {
			headersMap = JSON.parse(content);
		} catch (e) {
			console.error('[@astrojs/node] Error parsing _headers.json: ' + e.message);
			console.error('[@astrojs/node] Please make sure your _headers.json is valid JSON.');
		}
	}
	return headersMap;
}
export { STATIC_HEADERS_FILE, readHeadersJson, resolveClientDir };
