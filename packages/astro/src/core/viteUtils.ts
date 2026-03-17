import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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
 * Resolve Node.js subpath imports (`#...` specifiers) by reading the nearest
 * `package.json` `imports` field. Returns the resolved absolute path, or `null`
 * if no matching pattern is found.
 */
function resolveSubpathImport(specifier: string, importer: string): string | null {
	let dir = path.dirname(importer);
	while (true) {
		const pkgPath = path.join(dir, 'package.json');
		try {
			const content = fs.readFileSync(pkgPath, 'utf-8');
			const pkg = JSON.parse(content);
			if (pkg.imports) {
				const resolved = matchImportsPattern(specifier, pkg.imports, dir);
				if (resolved) return resolved;
				// Found package.json with imports but no match — stop searching
				return null;
			}
		} catch {
			// No package.json here, keep searching
		}
		const parent = path.dirname(dir);
		if (parent === dir) return null;
		dir = parent;
	}
}

/**
 * Resolve the target string from an `imports` field entry, handling condition
 * objects (e.g. `{ "import": "./src/*", "default": "./src/*" }`).
 */
function resolveImportTarget(target: unknown): string | null {
	if (typeof target === 'string') return target;
	if (target && typeof target === 'object' && !Array.isArray(target)) {
		// Try common conditions in priority order
		for (const condition of ['import', 'default', 'node']) {
			const val = (target as Record<string, unknown>)[condition];
			if (typeof val === 'string') return val;
		}
		// Fallback: use the first string value
		for (const val of Object.values(target as Record<string, unknown>)) {
			const resolved = resolveImportTarget(val);
			if (resolved) return resolved;
		}
	}
	if (Array.isArray(target)) {
		for (const item of target) {
			const resolved = resolveImportTarget(item);
			if (resolved) return resolved;
		}
	}
	return null;
}

function matchImportsPattern(
	specifier: string,
	imports: Record<string, unknown>,
	pkgDir: string,
): string | null {
	// First try exact match
	if (specifier in imports) {
		const target = resolveImportTarget(imports[specifier]);
		if (target) return path.resolve(pkgDir, target);
	}
	// Then try wildcard patterns
	for (const [pattern, rawTarget] of Object.entries(imports)) {
		if (!pattern.includes('*')) continue;
		const target = resolveImportTarget(rawTarget);
		if (!target) continue;
		const starIndex = pattern.indexOf('*');
		const prefix = pattern.slice(0, starIndex);
		const suffix = pattern.slice(starIndex + 1);
		if (
			specifier.startsWith(prefix) &&
			(suffix === '' || specifier.endsWith(suffix)) &&
			specifier.length >= prefix.length + suffix.length
		) {
			const match = suffix
				? specifier.slice(prefix.length, -suffix.length)
				: specifier.slice(prefix.length);
			const resolvedTarget = target.replace('*', match);
			return path.resolve(pkgDir, resolvedTarget);
		}
	}
	return null;
}

/**
 * Resolve the hydration paths so that it can be imported in the client
 */
export function resolvePath(specifier: string, importer: string) {
	if (specifier.startsWith('.')) {
		const absoluteSpecifier = path.resolve(path.dirname(importer), specifier);
		return resolveJsToTs(normalizePath(absoluteSpecifier));
	} else if (specifier.startsWith('#')) {
		// Resolve Node.js subpath imports at compile time so that all pipelines
		// (including NonRunnablePipeline used by the Cloudflare adapter) receive
		// an absolute path they can serve directly.
		const resolved = resolveSubpathImport(specifier, importer);
		if (resolved) {
			return resolveJsToTs(normalizePath(resolved));
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
