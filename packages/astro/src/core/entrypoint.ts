import { isAbsolute, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isRelativePath } from './path.js';

/**
 * Turns an entrypoint from the Astro config into a string that can be resolved as-is, either
 * by Vite, to bundle it, or by {@link importEntrypoint}, in Node.
 *
 * `URL` and relative entrypoints become absolute file paths, since both Vite and `import()`
 * can handle those, while any other string entrypoint, e.g. a package specifier, is left
 * untouched.
 */
export function normalizeEntrypoint(
	entrypoint: string | URL,
	/** The project root, which relative entrypoints are resolved against */
	root: URL,
): string {
	if (entrypoint instanceof URL) {
		return fileURLToPath(entrypoint);
	}

	// A relative specifier would otherwise be resolved against whichever module happens to
	// import it — astro core for `import()`, the importer passed to Vite's resolver — so it
	// is anchored to the project root instead, like every other path in the Astro config.
	if (isRelativePath(entrypoint)) {
		return resolve(fileURLToPath(root), entrypoint);
	}

	return entrypoint;
}

/** Imports an entrypoint normalized by {@link normalizeEntrypoint}, in Node. */
export function importEntrypoint<T = any>(entrypoint: string): Promise<T> {
	// `import()` only accepts absolute paths as file URLs on Windows. Package entrypoints
	// keep their specifier and resolve through the regular module resolution.
	const specifier = isAbsolute(entrypoint) ? pathToFileURL(entrypoint).href : entrypoint;
	return import(/* @vite-ignore */ specifier);
}
