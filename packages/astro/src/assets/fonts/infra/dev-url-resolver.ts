import { joinPaths, prependForwardSlash } from '../../../core/path.js';
import { createPlaceholderURL, stringifyPlaceholderURL } from '../../utils/url.js';
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
			const url = createPlaceholderURL(urlPath);

			// Append searchParams if available (for adapter-level tracking like skew protection)
			searchParams.forEach((value, key) => {
				url.searchParams.set(key, value);
			});

			return stringifyPlaceholderURL(url);
		},
		getCspResources() {
			return resolved ? ["'self'"] : [];
		},
	};
}
