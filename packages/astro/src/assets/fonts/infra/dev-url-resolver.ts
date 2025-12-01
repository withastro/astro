import { joinPaths, prependForwardSlash } from '../../../core/path.js';
import { createPlaceholderURL, stringifyPlaceholderURL } from '../../utils/url.js';
import type { UrlResolver } from '../definitions.js';

export class DevUrlResolver implements UrlResolver {
	#resolved = false;
	readonly #base: string;
	readonly #searchParams: URLSearchParams;

	constructor({
		base,
		searchParams,
	}: {
		base: string;
		searchParams: URLSearchParams;
	}) {
		this.#base = base;
		this.#searchParams = searchParams;
	}

	resolve(hash: string): string {
		this.#resolved ||= true;
		const urlPath = prependForwardSlash(joinPaths(this.#base, hash));
		const url = createPlaceholderURL(urlPath);

		// Append searchParams if available (for adapter-level tracking like skew protection)
		this.#searchParams.forEach((value, key) => {
			url.searchParams.set(key, value);
		});

		return stringifyPlaceholderURL(url);
	}

	get cspResources(): Array<string> {
		return this.#resolved ? ["'self'"] : [];
	}
}
