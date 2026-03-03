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
 */
export function resolveClientDir(options: Options) {
	// options.client and options.server are file:// URLs set at build time
	// e.g., "file:///project/dist/client/" and "file:///project/dist/server/"
	const clientURLRaw = new URL(options.client);
	const serverURLRaw = new URL(options.server);

	// Calculate relative path from server to client (e.g., "../client")
	// This relative path is stable regardless of where the build output is deployed
	const rel = path.relative(url.fileURLToPath(serverURLRaw), url.fileURLToPath(clientURLRaw));

	// Find the server entry folder by walking up from this file's location
	// We need to find the actual runtime location, not the build-time paths
	const serverFolder = path.basename(options.server);
	let serverEntryFolderURL = path.dirname(import.meta.url);
	while (!serverEntryFolderURL.endsWith(serverFolder)) {
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
