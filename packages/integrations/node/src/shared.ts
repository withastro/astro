import path from 'node:path';
import url from 'node:url';
import fs from 'node:fs';
import { appendForwardSlash } from '@astrojs/internal-helpers/path';
import type { NodeAppHeadersJson, Options } from './types.js';

export const STATIC_HEADERS_FILE = '_headers.json';

/**
 * Marks the session base the adapter injects. The adapter stores it relative to the project root,
 * so the runtime resolves it against `rootDir`. Drivers configured by the user are left untouched
 * because their `base` is driver-specific, such as a key prefix for key-value stores.
 */
export const PORTABLE_SESSION_BASE_FLAG = '__astroPortableSessionBase';

/**
 * Resolves the adapter-injected session base against the runtime `rootDir`. Only a base marked with
 * `PORTABLE_SESSION_BASE_FLAG` is resolved; any other driver's `base` is left untouched.
 */
export function resolveSessionBase(
	sessionConfig: { driver: string; options?: Record<string, any> | undefined } | undefined,
	rootDir: URL,
): void {
	const options = sessionConfig?.options;
	const base = options?.base;
	if (!options?.[PORTABLE_SESSION_BASE_FLAG] || typeof base !== 'string' || path.isAbsolute(base)) {
		return;
	}
	options.base = url.fileURLToPath(new URL(base, rootDir));
	delete options[PORTABLE_SESSION_BASE_FLAG];
}

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
	// options.client is the relative path from the server directory to the client directory,
	// such as "../client". options.server is the server directory basename, used below.
	const rel = options.client;
	const serverFolder = options.server;
	let serverEntryFolderURL = path.dirname(import.meta.url);
	let previous = '';
	while (!serverEntryFolderURL.endsWith(serverFolder)) {
		// Guard against infinite loop
		if (serverEntryFolderURL === previous) {
			throw new Error(
				`[@astrojs/node] Could not find the server directory "${serverFolder}" ` +
					`by walking up from "${import.meta.url}". This can happen when the server ` +
					`entry point is bundled into a single file (e.g. with a bundler) so that ` +
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
