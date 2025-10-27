import { fileExtension, joinPaths, prependForwardSlash } from '../../../core/path.js';
import type { AssetsPrefix } from '../../../types/public/index.js';
import { getAssetsPrefix } from '../../utils/getAssetsPrefix.js';
import type { UrlResolver } from '../definitions.js';

export function createDevUrlResolver({
	base,
	assetQueryParams,
}: {
	base: string;
	assetQueryParams?: URLSearchParams;
}): UrlResolver {
	let resolved = false;
	return {
		resolve(hash) {
			resolved ||= true;
			let url = prependForwardSlash(joinPaths(base, hash));

			// Append assetQueryParams if available (for adapter-level tracking like skew protection)
			if (assetQueryParams) {
				const assetQueryString = assetQueryParams.toString();
				if (assetQueryString) {
					url += '?' + assetQueryString;
				}
			}

			return url;
		},
		getCspResources() {
			return resolved ? ["'self'"] : [];
		},
	};
}

export function createBuildUrlResolver({
	base,
	assetsPrefix,
	assetQueryParams,
}: {
	base: string;
	assetsPrefix: AssetsPrefix;
	assetQueryParams?: URLSearchParams;
}): UrlResolver {
	const resources = new Set<string>();
	return {
		resolve(hash) {
			const prefix = assetsPrefix ? getAssetsPrefix(fileExtension(hash), assetsPrefix) : undefined;
			let url: string;
			if (prefix) {
				resources.add(prefix);
				url = joinPaths(prefix, base, hash);
			} else {
				resources.add("'self'");
				url = prependForwardSlash(joinPaths(base, hash));
			}

			// Append assetQueryParams if available (for adapter-level tracking like skew protection)
			if (assetQueryParams) {
				const assetQueryString = assetQueryParams.toString();
				if (assetQueryString) {
					url += '?' + assetQueryString;
				}
			}

			return url;
		},
		getCspResources() {
			return Array.from(resources);
		},
	};
}
