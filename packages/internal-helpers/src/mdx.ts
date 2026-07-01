import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { slash } from './path.js';
import type { AstroMetadata } from './markdown.js';

// MDX helpers shared between `@astrojs/mdx` and the markdown processor packages
// (`@astrojs/markdown-remark`, `@astrojs/markdown-satteri`). They live here so the
// processor packages can own their MDX pipelines without depending on `astro`.

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

export function resolveJsToTs(filePath: string) {
	if (filePath.endsWith('.jsx') && !existsSync(filePath)) {
		const tryPath = filePath.slice(0, -4) + '.tsx';
		if (existsSync(tryPath)) {
			return tryPath;
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
