import { fileExtension, joinPaths, prependForwardSlash } from '../../../core/path.js';
import type { AssetsPrefix } from '../../../types/public/index.js';
import { getAssetsPrefix } from '../../utils/getAssetsPrefix.js';
import { createPlaceholderURL, stringifyPlaceholderURL } from '../../utils/url.js';
import type { UrlResolver } from '../definitions.js';

export class BuildUrlResolver implements UrlResolver {
	readonly #resources = new Set<string>();
	readonly #base: string;
	readonly #assetsPrefix: AssetsPrefix;
	readonly #searchParams: URLSearchParams;

	constructor({
		base,
		assetsPrefix,
		searchParams,
	}: {
		base: string;
		assetsPrefix: AssetsPrefix;
		searchParams: URLSearchParams;
	}) {
		this.#base = base;
		this.#assetsPrefix = assetsPrefix;
		this.#searchParams = searchParams;
	}

	resolve(id: string): string {
		const prefix = this.#assetsPrefix
			? getAssetsPrefix(fileExtension(id), this.#assetsPrefix)
			: undefined;
		let urlPath: string;
		if (prefix) {
			this.#resources.add(prefix);
			urlPath = joinPaths(prefix, this.#base, id);
		} else {
			this.#resources.add("'self'");
			urlPath = prependForwardSlash(joinPaths(this.#base, id));
		}

		// Create URL object and append searchParams if available (for adapter-level tracking like skew protection)
		const url = createPlaceholderURL(urlPath);
		this.#searchParams.forEach((value, key) => {
			url.searchParams.set(key, value);
		});

		return stringifyPlaceholderURL(url);
	}

	get cspResources(): Array<string> {
		return Array.from(this.#resources);
	}
}
