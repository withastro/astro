import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { AstroSettings } from '../types/astro.js';
import type { AstroConfig } from '../types/public/config.js';
import { hasSpecialQueries } from '../vite-plugin-utils/index.js';
import { SUPPORTED_MARKDOWN_FILE_EXTENSIONS } from './constants.js';
import { removeQueryString, slash } from './path.js';

/** Check if a file is a markdown file based on its extension */
export function isMarkdownFile(fileId: string, option?: { suffix?: string }): boolean {
	if (hasSpecialQueries(fileId)) {
		return false;
	}
	const id = removeQueryString(fileId);
	const _suffix = option?.suffix ?? '';
	for (let markdownFileExtension of SUPPORTED_MARKDOWN_FILE_EXTENSIONS) {
		if (id.endsWith(`${markdownFileExtension}${_suffix}`)) return true;
	}
	return false;
}

/** is a specifier an npm package? */
export function parseNpmName(
	spec: string,
): { scope?: string; name: string; subpath?: string } | undefined {
	// not an npm package
	if (!spec || spec[0] === '.' || spec[0] === '/') return undefined;

	let scope: string | undefined;
	let name = '';

	let parts = spec.split('/');
	if (parts[0][0] === '@') {
		scope = parts[0];
		name = parts.shift() + '/';
	}
	name += parts.shift();

	let subpath = parts.length ? `./${parts.join('/')}` : undefined;

	return {
		scope,
		name,
		subpath,
	};
}

/**
 * Convert file URL to ID for environment.moduleGraph.idToModuleMap.get(:viteID)
 * Format:
 *   Linux/Mac:  /Users/astro/code/my-project/src/pages/index.astro
 *   Windows:    C:/Users/astro/code/my-project/src/pages/index.astro
 */
export function viteID(filePath: URL): string {
	return slash(fileURLToPath(filePath) + filePath.search);
}

export const VALID_ID_PREFIX = `/@id/`;
const NULL_BYTE_PLACEHOLDER = `__x00__`;
const NULL_BYTE_REGEX = /^\0/;

// Strip valid id prefix and replace null byte placeholder. Both are prepended to resolved ids
// as they are not valid browser import specifiers (by the Vite's importAnalysis plugin)
export function unwrapId(id: string): string {
	return id.startsWith(VALID_ID_PREFIX)
		? id.slice(VALID_ID_PREFIX.length).replace(NULL_BYTE_PLACEHOLDER, '\0')
		: id;
}

// Reverses `unwrapId` function
export function wrapId(id: string): string {
	return id.replace(NULL_BYTE_REGEX, `${VALID_ID_PREFIX}${NULL_BYTE_PLACEHOLDER}`);
}

export function resolvePages(config: AstroConfig) {
	return new URL('./pages', config.srcDir);
}

function isInPagesDir(file: URL, config: AstroConfig): boolean {
	const pagesDir = resolvePages(config);
	return file.toString().startsWith(pagesDir.toString());
}

function isInjectedRoute(file: URL, settings: AstroSettings) {
	let fileURL = file.toString();
	for (const route of settings.resolvedInjectedRoutes) {
		if (
			route.resolvedEntryPoint &&
			removeQueryString(fileURL) === removeQueryString(route.resolvedEntryPoint.toString())
		)
			return true;
	}
	return false;
}

function isPublicRoute(file: URL, config: AstroConfig): boolean {
	const rootDir = config.root.toString();
	const pagesDir = resolvePages(config).toString();
	const fileDir = file.toString();

	// Normalize the file directory path by removing the pagesDir prefix if it exists,
	// otherwise remove the rootDir prefix.
	const normalizedDir = fileDir.startsWith(pagesDir)
		? fileDir.slice(pagesDir.length)
		: fileDir.slice(rootDir.length);

	const parts = normalizedDir.replace(pagesDir.toString(), '').split('/').slice(1);

	for (const part of parts) {
		if (part.startsWith('_')) return false;
	}

	return true;
}

function endsWithPageExt(file: URL, settings: AstroSettings): boolean {
	for (const ext of settings.pageExtensions) {
		if (file.toString().endsWith(ext)) return true;
	}
	return false;
}

export function isPage(file: URL, settings: AstroSettings): boolean {
	if (!isInPagesDir(file, settings.config) && !isInjectedRoute(file, settings)) return false;
	if (!isPublicRoute(file, settings.config)) return false;
	return endsWithPageExt(file, settings);
}

export function isEndpoint(file: URL, settings: AstroSettings): boolean {
	if (!isInPagesDir(file, settings.config) && !isInjectedRoute(file, settings)) return false;
	if (!isPublicRoute(file, settings.config)) return false;
	return !endsWithPageExt(file, settings) && !file.toString().includes('?astro');
}

export function resolveJsToTs(filePath: string) {
	if (filePath.endsWith('.jsx') && !fs.existsSync(filePath)) {
		const tryPath = filePath.slice(0, -4) + '.tsx';
		if (fs.existsSync(tryPath)) {
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
export function resolveExtensionlessPath(filePath: string): string {
	const stat = fs.statSync(filePath, { throwIfNoEntry: false });
	if (stat?.isFile()) {
		return filePath;
	}
	for (const ext of VITE_DEFAULT_RESOLVE_EXTENSIONS) {
		const tryPath = filePath + ext;
		if (fs.existsSync(tryPath)) {
			return tryPath;
		}
	}
	// Directory import: resolve to its `index` module, like Vite does.
	if (stat?.isDirectory()) {
		for (const ext of VITE_DEFAULT_RESOLVE_EXTENSIONS) {
			const tryPath = `${filePath}/index${ext}`;
			if (fs.existsSync(tryPath)) {
				return tryPath;
			}
		}
	}
	return filePath;
}

/**
 * Set a default NODE_ENV so Vite doesn't set an incorrect default when loading the Astro config
 */
export function ensureProcessNodeEnv(defaultNodeEnv: string) {
	if (!process.env.NODE_ENV) {
		process.env.NODE_ENV = defaultNodeEnv;
	}
}
