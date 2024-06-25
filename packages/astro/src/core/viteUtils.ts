import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizePath } from 'vite';
import { prependForwardSlash } from '../core/path.js';
import type { ModuleLoader } from './module-loader/index.js';
import { VALID_ID_PREFIX, resolveJsToTs, unwrapId, viteID } from './util.js';

/**
 * Resolve the hydration paths so that it can be imported in the client
 */
export function resolvePath(specifier: string, importer: string) {
	if (specifier.startsWith('.')) {
		const absoluteSpecifier = path.resolve(path.dirname(importer), specifier);
		return resolveJsToTs(normalizePath(absoluteSpecifier));
	} else {
		return specifier;
	}
}

export function rootRelativePath(
	root: URL,
	idOrUrl: URL | string,
	shouldPrependForwardSlash = true
) {
	let id: string;
	if (typeof idOrUrl !== 'string') {
		id = unwrapId(viteID(idOrUrl));
	} else {
		id = idOrUrl;
	}
	const normalizedRoot = normalizePath(fileURLToPath(root));
	if (id.startsWith(normalizedRoot)) {
		id = id.slice(normalizedRoot.length);
	}
	return shouldPrependForwardSlash ? prependForwardSlash(id) : id;
}

/**
 * Simulate Vite's resolve and import analysis so we can import the id as an URL
 * through a script tag or a dynamic import as-is.
 */
// NOTE: `/@id/` should only be used when the id is fully resolved
export async function resolveIdToUrl(loader: ModuleLoader, id: string, root?: URL) {
	let resultId = await loader.resolveId(id, undefined);
	// Try resolve jsx to tsx
	if (!resultId && id.endsWith('.jsx')) {
		resultId = await loader.resolveId(id.slice(0, -4), undefined);
	}
	if (!resultId) {
		return VALID_ID_PREFIX + id;
	}
	if (path.isAbsolute(resultId)) {
		const normalizedRoot = root && normalizePath(fileURLToPath(root));
		// Convert to root-relative path if path is inside root
		if (normalizedRoot && resultId.startsWith(normalizedRoot)) {
			return resultId.slice(normalizedRoot.length - 1);
		} else {
			return '/@fs' + prependForwardSlash(resultId);
		}
	}
	return VALID_ID_PREFIX + resultId;
}
