import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { slash } from '@astrojs/internal-helpers/path';

const isWindows = typeof process !== 'undefined' && process.platform === 'win32';

/**
 * Re-implementation of Vite's normalizePath that can be used without Vite
 */
export function normalizePath(id: string) {
	return path.posix.normalize(isWindows ? slash(id) : id);
}

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

// https://github.com/vitejs/vite/blob/2f9428d1ffd988e30cb253d5bb84844fb1654e86/packages/vite/src/node/constants.ts#L108
// Used by isCSSRequest() under the hood
export const CSS_LANGS_RE = /\.(css|less|sass|scss|styl|stylus|pcss|postcss|sss)(?:$|\?)/;
