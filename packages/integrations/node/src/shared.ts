import path from 'node:path';
import url from 'node:url';
import fs from 'node:fs';
import { appendForwardSlash } from '@astrojs/internal-helpers/path';
import type { NodeAppHeadersJson, Options } from './types.js';

export const STATIC_HEADERS_FILE = '_headers.json';

/**
 * Resolves the client directory path at runtime.
 *
 * At build time, we know the relative path between server and client directories.
 * At runtime, we need to find the actual location based on where the server entry is running.
 *
 * ## Error
 *
 * It throws an error if it can't find the directory while walking the parent directories.
 */
export function resolveClientDir(options: Options) {
	// options.client and options.server are either:
	// - folder names like "client"/"server" (when portableOutput is enabled)
	// - absolute file:// URLs (default mode)
	// Detect the format and extract what we need: a relative offset and a folder name.
	const isFileUrl = URL.canParse(options.server);
	const rel = isFileUrl
		? path.relative(
				url.fileURLToPath(new URL(options.server)),
				url.fileURLToPath(new URL(options.client)),
			)
		: path.relative(options.server, options.client);
	const serverFolder = isFileUrl
		? path.basename(url.fileURLToPath(new URL(options.server)))
		: options.server;
	let serverEntryFolderURL = path.dirname(import.meta.url);
	let previous = '';
	while (!serverEntryFolderURL.endsWith(serverFolder)) {
		// Guard against infinite loop
		if (serverEntryFolderURL === previous) {
			throw new Error(
				`[@astrojs/node] Could not find the server directory "${serverFolder}" ` +
					`by walking up from "${import.meta.url}". This can happen when the server ` +
					`entry point is bundled into a single file (e.g. with esbuild) so that ` +
					`import.meta.url no longer contains the original "${serverFolder}" path segment. ` +
					`When bundling the server entry, make sure the output path contains a ` +
					`"${serverFolder}" directory segment, or avoid bundling the server entry entirely.`,
			);
		}
		previous = serverEntryFolderURL;
		serverEntryFolderURL = path.dirname(serverEntryFolderURL);
	}

	// Resolve the client directory by applying the relative path to the runtime server location
	const serverEntryURL = serverEntryFolderURL + '/entry.mjs';
	const clientURL = new URL(appendForwardSlash(rel), serverEntryURL);
	return url.fileURLToPath(clientURL);
}

export function readHeadersJson(outDir: string | URL): NodeAppHeadersJson | undefined {
	let headersMap: NodeAppHeadersJson | undefined = undefined;

	const headersUrl = new URL(STATIC_HEADERS_FILE, outDir);
	if (fs.existsSync(headersUrl)) {
		const content = fs.readFileSync(headersUrl, 'utf-8');
		try {
			headersMap = JSON.parse(content) as NodeAppHeadersJson;
		} catch (e: any) {
			console.error('[@astrojs/node] Error parsing _headers.json: ' + e.message);
			console.error('[@astrojs/node] Please make sure your _headers.json is valid JSON.');
		}
	}
	return headersMap;
}
