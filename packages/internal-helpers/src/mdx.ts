import { existsSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { slash } from './path.js';
import type { AstroMetadata } from './markdown.js';

// Helpers shared between `@astrojs/mdx`, the markdown processor packages and `astro`'s own island
// resolution. They live here so the processor packages can own MDX without depending on `astro`.

// Tag name we rewrite markdown-derived `<img>` elements to. Lowercase + hyphenated
// so MDX routes the tag through the `_components` map.
export const ASTRO_IMAGE_ELEMENT = 'astro-image';
// Module-level identifier bound to Astro's `Image` component (from `astro:assets`).
// Imported by every compiled MDX file that contains a rewritten image; used as the
// fallback when no `components.img` is provided.
export const ASTRO_IMAGE_IMPORT = '__AstroImage__';
// Boolean export set on MDX modules that contain rewritten images. Read by
// `vite-plugin-mdx-postprocess` to decide whether to wire up the image component.
export const USES_ASTRO_IMAGE_FLAG = '__usesAstroImage';

export function createDefaultAstroMetadata(): AstroMetadata {
	return {
		hydratedComponents: [],
		clientOnlyComponents: [],
		serverComponents: [],
		scripts: [],
		propagation: 'none',
		containsHead: false,
		pageOptions: {},
	};
}

const isWindows = typeof process !== 'undefined' && process.platform === 'win32';

/** Re-implementation of Vite's normalizePath that can be used without Vite. */
function normalizePath(id: string) {
	return path.posix.normalize(isWindows ? slash(id) : id);
}

function resolveJsToTs(filePath: string) {
	if (filePath.endsWith('.jsx') && !existsSync(filePath)) {
		const tryPath = filePath.slice(0, -4) + '.tsx';
		if (existsSync(tryPath)) {
			return tryPath;
		}
	}
	return filePath;
}

// Match Vite's default `resolve.extensions` order so that when multiple
// candidate files exist, we pick the same module Vite will load.
// https://vite.dev/config/shared-options.html#resolve-extensions
const VITE_DEFAULT_RESOLVE_EXTENSIONS = ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'];

/**
 * Resolve a path that doesn't name a file on disk (e.g. produced by an
 * extensionless import like `import { Counter } from './Counter'`) to the file
 * Vite would load, by probing Vite's default extension order and directory
 * `index` files. Returns the path unchanged when it already exists as a file
 * or when no candidate is found.
 */
function resolveExtensionlessPath(filePath: string): string {
	const stat = statSync(filePath, { throwIfNoEntry: false });
	if (stat?.isFile()) {
		return filePath;
	}
	for (const ext of VITE_DEFAULT_RESOLVE_EXTENSIONS) {
		const tryPath = filePath + ext;
		if (existsSync(tryPath)) {
			return tryPath;
		}
	}
	// Directory import: resolve to its `index` module, like Vite does.
	if (stat?.isDirectory()) {
		for (const ext of VITE_DEFAULT_RESOLVE_EXTENSIONS) {
			const tryPath = `${filePath}/index${ext}`;
			if (existsSync(tryPath)) {
				return tryPath;
			}
		}
	}
	return filePath;
}

/**
 * Resolve island component specifiers to stable paths for hydration metadata.
 *
 * Examples:
 * - `./components/Button.jsx` from `/app/src/pages/index.astro`
 *   -> `/app/src/pages/components/Button.tsx` (when `.tsx` exists)
 * - `../components/Counter` from `/app/src/pages/index.astro`
 *   -> `/app/src/components/Counter.tsx` (extensionless imports probe Vite's
 *   default extension order, then directory `index` files)
 * - `#components/react/Counter.tsx`
 *   -> `/app/src/components/react/Counter.tsx` via package `imports`
 */
export function resolvePath(specifier: string, importer: string) {
	if (specifier.startsWith('.')) {
		const absoluteSpecifier = path.resolve(path.dirname(importer), specifier);
		return resolveExtensionlessPath(resolveJsToTs(normalizePath(absoluteSpecifier)));
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
