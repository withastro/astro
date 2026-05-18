import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { prependForwardSlash, slash } from '../core/path.js';
import type { ModuleLoader } from './module-loader/index.js';
import { resolveJsToTs, unwrapId, VALID_ID_PREFIX, viteID } from './util.js';

const isWindows = typeof process !== 'undefined' && process.platform === 'win32';

/**
 * Re-implementation of Vite's normalizePath that can be used without Vite
 */
export function normalizePath(id: string) {
	return path.posix.normalize(isWindows ? slash(id) : id);
}

/**
 * Resolve island component specifiers to stable paths for hydration metadata.
 *
 * Examples:
 * - `./components/Button.jsx` from `/app/src/pages/index.astro`
 *   -> `/app/src/pages/components/Button.tsx` (when `.tsx` exists)
 * - `#components/react/Counter.tsx`
 *   -> `/app/src/components/react/Counter.tsx` via package `imports`
 */
export function resolvePath(specifier: string, importer: string) {
	if (specifier.startsWith('.')) {
		const absoluteSpecifier = path.resolve(path.dirname(importer), specifier);
		return resolveJsToTs(normalizePath(absoluteSpecifier));
	} else if (specifier.startsWith('#')) {
		// Support Node subpath imports (package.json#imports), so this resolves
		// before we hand off to non-runnable dev pipelines.
		//
		// Without this, unresolved values like `/@id/#components/...` can leak
		// into client hydration URLs.
		try {
			// Primary path: CJS-style resolver rooted at the importer.
			const resolved = createRequire(pathToFileURL(importer)).resolve(specifier);
			return resolveJsToTs(normalizePath(resolved));
		} catch {
			try {
				// Fallback: ESM resolver in case environments differ.
				const importerURL = pathToFileURL(importer).toString();
				const resolved = import.meta.resolve(specifier, importerURL);
				const resolvedUrl = new URL(resolved);
				if (resolvedUrl.protocol === 'file:') {
					return resolveJsToTs(normalizePath(fileURLToPath(resolvedUrl)));
				}
			} catch {
				// fall through
			}
		}
		// Keep original behavior for unresolved specifiers (e.g. package ids).
		return specifier;
	} else {
		return specifier;
	}
}

export function rootRelativePath(
	root: URL,
	idOrUrl: URL | string,
	shouldPrependForwardSlash = true,
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

// https://github.com/vitejs/vite/blob/2f9428d1ffd988e30cb253d5bb84844fb1654e86/packages/vite/src/node/constants.ts#L108
// Used by isCSSRequest() under the hood
export const CSS_LANGS_RE = /\.(css|less|sass|scss|styl|stylus|pcss|postcss|sss)(?:$|\?)/;
