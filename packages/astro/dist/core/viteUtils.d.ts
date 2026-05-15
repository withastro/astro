import type { ModuleLoader } from './module-loader/index.js';
/**
 * Re-implementation of Vite's normalizePath that can be used without Vite
 */
export declare function normalizePath(id: string): string;
/**
 * Resolve island component specifiers to stable paths for hydration metadata.
 *
 * Examples:
 * - `./components/Button.jsx` from `/app/src/pages/index.astro`
 *   -> `/app/src/pages/components/Button.tsx` (when `.tsx` exists)
 * - `#components/react/Counter.tsx`
 *   -> `/app/src/components/react/Counter.tsx` via package `imports`
 */
export declare function resolvePath(specifier: string, importer: string): string;
export declare function rootRelativePath(
	root: URL,
	idOrUrl: URL | string,
	shouldPrependForwardSlash?: boolean,
): string;
/**
 * Simulate Vite's resolve and import analysis so we can import the id as an URL
 * through a script tag or a dynamic import as-is.
 */
export declare function resolveIdToUrl(
	loader: ModuleLoader,
	id: string,
	root?: URL,
): Promise<string>;
export declare const CSS_LANGS_RE: RegExp;
