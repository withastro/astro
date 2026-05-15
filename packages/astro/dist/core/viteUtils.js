import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { prependForwardSlash, slash } from '../core/path.js';
import { resolveJsToTs, unwrapId, VALID_ID_PREFIX, viteID } from './util.js';
const isWindows = typeof process !== 'undefined' && process.platform === 'win32';
function normalizePath(id) {
	return path.posix.normalize(isWindows ? slash(id) : id);
}
function resolvePath(specifier, importer) {
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
			} catch {}
		}
		return specifier;
	} else {
		return specifier;
	}
}
function rootRelativePath(root, idOrUrl, shouldPrependForwardSlash = true) {
	let id;
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
async function resolveIdToUrl(loader, id, root) {
	let resultId = await loader.resolveId(id, void 0);
	if (!resultId && id.endsWith('.jsx')) {
		resultId = await loader.resolveId(id.slice(0, -4), void 0);
	}
	if (!resultId) {
		return VALID_ID_PREFIX + id;
	}
	if (path.isAbsolute(resultId)) {
		const normalizedRoot = root && normalizePath(fileURLToPath(root));
		if (normalizedRoot && resultId.startsWith(normalizedRoot)) {
			return resultId.slice(normalizedRoot.length - 1);
		} else {
			return '/@fs' + prependForwardSlash(resultId);
		}
	}
	return VALID_ID_PREFIX + resultId;
}
const CSS_LANGS_RE = /\.(css|less|sass|scss|styl|stylus|pcss|postcss|sss)(?:$|\?)/;
export { CSS_LANGS_RE, normalizePath, resolveIdToUrl, resolvePath, rootRelativePath };
