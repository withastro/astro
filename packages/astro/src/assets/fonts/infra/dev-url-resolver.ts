import { joinPaths, prependForwardSlash } from '../../../core/path.js';
import { createPlaceholderURL, stringifyPlaceholderURL } from '../../utils/url.js';
import type { UrlResolver } from '../definitions.js';

export class DevUrlResolver implements UrlResolver {
	readonly #urls = new Set<string>();
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

	resolve(id: string): string {
		this.#resolved ||= true;
		const urlPath = prependForwardSlash(joinPaths(this.#base, id));
		const url = createPlaceholderURL(urlPath);

		// Append searchParams if available (for adapter-level tracking like skew protection)
		this.#searchParams.forEach((value, key) => {
			url.searchParams.set(key, value);
		});

		const result = stringifyPlaceholderURL(url);
		this.#urls.add(result);
		return result;
	}

	get cspResources(): Array<string> {
		return this.#resolved ? ["'self'"] : [];
	}

	get urls(): Array<string> {
		return Array.from(this.#urls);
	}
}
