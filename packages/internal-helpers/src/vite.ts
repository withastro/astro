import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { commonAncestorPath } from 'common-ancestor-path';
import { prependForwardSlash, removeLeadingForwardSlashWindows, slash } from './path.js';

const isWindows = typeof process !== 'undefined' && process.platform === 'win32';

export function normalizePath(id: string) {
	return path.posix.normalize(isWindows ? slash(id) : id);
}

export function resolvePath(specifier: string, importer: string) {
	if (specifier.startsWith('.')) {
		const absoluteSpecifier = path.resolve(path.dirname(importer), specifier);
		return resolveJsToTs(normalizePath(absoluteSpecifier));
	} else if (specifier.startsWith('#')) {
		try {
			const resolved = createRequire(pathToFileURL(importer)).resolve(specifier);
			return resolveJsToTs(normalizePath(resolved));
		} catch {
			try {
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

// https://github.com/vitejs/vite/blob/2f9428d1ffd988e30cb253d5bb84844fb1654e86/packages/vite/src/node/constants.ts#L108
export const CSS_LANGS_RE = /\.(css|less|sass|scss|styl|stylus|pcss|postcss|sss)(?:$|\?)/;

const postfixRE = /[?#].*$/s;
export function cleanUrl(url: string): string {
	return url.replace(postfixRE, '');
}

export const specialQueriesRE = /(?:\?|&)(?:url|raw|direct)(?:&|$)/;
export function hasSpecialQueries(id: string): boolean {
	return specialQueriesRE.test(id);
}

export function viteID(filePath: URL): string {
	return slash(fileURLToPath(filePath) + filePath.search);
}

export const VALID_ID_PREFIX = `/@id/`;
const NULL_BYTE_PLACEHOLDER = `__x00__`;

export function unwrapId(id: string): string {
	return id.startsWith(VALID_ID_PREFIX)
		? id.slice(VALID_ID_PREFIX.length).replace(NULL_BYTE_PLACEHOLDER, '\0')
		: id;
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

export function normalizeFilename(filename: string, root: URL) {
	if (filename.startsWith('/@fs')) {
		filename = filename.slice('/@fs'.length);
	} else if (filename.startsWith('.')) {
		const url = new URL(filename, root);
		filename = viteID(url);
	} else if (filename.startsWith('/') && !isPathInRoot(filename, fileURLToPath(root))) {
		const url = new URL('.' + filename, root);
		filename = viteID(url);
	}
	return removeLeadingForwardSlashWindows(filename);
}

function isPathInRoot(filename: string, rootPath: string) {
	if (commonAncestorPath(filename, rootPath)) {
		return true;
	}
	return commonAncestorPath(filename.toLowerCase(), rootPath.toLowerCase()) !== '';
}
