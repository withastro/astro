import { fileExtension, joinPaths, prependForwardSlash } from '../../../core/path.js';
import type { AssetsPrefix } from '../../../types/public/index.js';
import { getAssetsPrefix } from '../../utils/getAssetsPrefix.js';
import type { UrlResolver } from '../definitions.js';

export function createDevUrlResolver({
	base,
	searchParams,
}: {
	base: string;
	searchParams: URLSearchParams;
}): UrlResolver {
	let resolved = false;
	return {
		resolve(hash) {
			resolved ||= true;
			const urlPath = prependForwardSlash(joinPaths(base, hash));
			const url = new URL(urlPath, 'http://localhost');

			// Append searchParams if available (for adapter-level tracking like skew protection)
			searchParams.forEach((value, key) => {
				url.searchParams.set(key, value);
			});

			return url.href.replace('http://localhost', '');
		},
		getCspResources() {
			return resolved ? ["'self'"] : [];
		},
	};
}

export function createBuildUrlResolver({
	base,
	assetsPrefix,
	searchParams,
}: {
	base: string;
	assetsPrefix: AssetsPrefix;
	searchParams: URLSearchParams;
}): UrlResolver {
	const resources = new Set<string>();
	return {
		resolve(hash) {
			const prefix = assetsPrefix ? getAssetsPrefix(fileExtension(hash), assetsPrefix) : undefined;
			let urlPath: string;
			if (prefix) {
				resources.add(prefix);
				urlPath = joinPaths(prefix, base, hash);
			} else {
				resources.add("'self'");
				urlPath = prependForwardSlash(joinPaths(base, hash));
			}

			// Create URL object and append searchParams if available (for adapter-level tracking like skew protection)
			const url = new URL(urlPath, 'http://localhost');
			searchParams.forEach((value, key) => {
				url.searchParams.set(key, value);
			});

			return url.href.replace('http://localhost', '');
		},
		getCspResources() {
			return Array.from(resources);
		},
	};
}
