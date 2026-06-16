import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	normalizePath,
	VALID_ID_PREFIX,
} from '@astrojs/internal-helpers/vite';
import { prependForwardSlash } from './path.js';
import type { ModuleLoader } from './module-loader/index.js';

export {
	cleanUrl,
	CSS_LANGS_RE,
	hasSpecialQueries,
	normalizePath,
	normalizeFilename,
	resolvePath,
	rootRelativePath,
	specialQueriesRE,
	VALID_ID_PREFIX,
	viteID,
	unwrapId,
} from '@astrojs/internal-helpers/vite';

/**
 * Simulate Vite's resolve and import analysis so we can import the id as an URL
 * through a script tag or a dynamic import as-is.
 */
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
		if (normalizedRoot && resultId.startsWith(normalizedRoot)) {
			return resultId.slice(normalizedRoot.length - 1);
		} else {
			return '/@fs' + prependForwardSlash(resultId);
		}
	}
	return VALID_ID_PREFIX + resultId;
}
