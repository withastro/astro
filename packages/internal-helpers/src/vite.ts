import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { commonAncestorPath } from 'common-ancestor-path';
import { removeLeadingForwardSlashWindows, slash } from './path.js';

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

/**
 * Detect `?url`, `?raw`, and `?direct`, in which case we usually want to skip
 * transforming any code with this queries as Vite will handle it directly.
 */
export const specialQueriesRE = /(?:\?|&)(?:url|raw|direct)(?:&|$)/;

/**
 * Convert file URL to ID for environment.moduleGraph.idToModuleMap.get(:viteID)
 * Format:
 *   Linux/Mac:  /Users/astro/code/my-project/src/pages/index.astro
 *   Windows:    C:/Users/astro/code/my-project/src/pages/index.astro
 */
export function viteID(filePath: URL): string {
	return slash(fileURLToPath(filePath) + filePath.search);
}

function resolveJsToTs(filePath: string) {
	if (filePath.endsWith('.jsx') && !fs.existsSync(filePath)) {
		const tryPath = filePath.slice(0, -4) + '.tsx';
		if (fs.existsSync(tryPath)) {
			return tryPath;
		}
	}
	return filePath;
}

/**
 * Normalizes different file names like:
 *
 * - /@fs/home/user/project/src/pages/index.astro
 * - /src/pages/index.astro
 * - ./src/pages/index.astro
 *
 * as absolute file paths with forward slashes.
 */
export function normalizeFilename(filename: string, root: string) {
	// `new URL(..., base)` needs a valid URL base, and relative resolution only
	// keeps the final path segment when the base ends with a slash.
	const rootUrl = pathToFileURL(root.endsWith('/') || root.endsWith(path.sep) ? root : root + '/');
	if (filename.startsWith('/@fs')) {
		filename = filename.slice('/@fs'.length);
	} else if (filename.startsWith('.')) {
		// Handle relative paths (e.g. ./src/components/Foo.astro) by resolving against root.
		// This can occur on certain environments (e.g. Windows + newer Node.js) when a component
		// is imported via a TypeScript path alias and Vite produces a relative virtual module ID.
		const url = new URL(filename, rootUrl);
		filename = viteID(url);
	} else if (filename.startsWith('/') && !isPathInRoot(filename, root)) {
		const url = new URL('.' + filename, rootUrl);
		filename = viteID(url);
	}
	return removeLeadingForwardSlashWindows(filename);
}

/**
 * Check whether `filename` lives under `rootPath`. Falls back to a case-insensitive
 * comparison so that paths whose case differs from `rootPath` (e.g. a `d:\dev\foo`
 * cwd versus a `D:\dev\foo` filesystem on Windows, or any case-insensitive macOS
 * volume) are still recognized as project-internal absolute paths.
 */
function isPathInRoot(filename: string, rootPath: string) {
	if (commonAncestorPath(filename, rootPath)) {
		return true;
	}
	return commonAncestorPath(filename.toLowerCase(), rootPath.toLowerCase()) !== '';
}
