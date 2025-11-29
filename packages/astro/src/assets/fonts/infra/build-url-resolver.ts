import { fileExtension, joinPaths, prependForwardSlash } from '../../../core/path.js';
import type { AssetsPrefix } from '../../../types/public/index.js';
import { getAssetsPrefix } from '../../utils/getAssetsPrefix.js';
import { createPlaceholderURL, stringifyPlaceholderURL } from '../../utils/url.js';
import type { UrlResolver } from '../definitions.js';

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
			const url = createPlaceholderURL(urlPath);
			searchParams.forEach((value, key) => {
				url.searchParams.set(key, value);
			});

			return stringifyPlaceholderURL(url);
		},
		getCspResources() {
			return Array.from(resources);
		},
	};
}
