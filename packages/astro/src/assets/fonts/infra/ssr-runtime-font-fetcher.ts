import type { RuntimeFontFetcher } from '../definitions.js';
import { MissingGetFontBufferRequestUrl } from '../../../core/errors/errors-data.js';
import { AstroError } from '../../../core/errors/errors.js';

/**
 * During SSR, we don't know ahead of time where the server is located.
 * We rely on `requestUrl` (provided by the user) to construct the URL.
 */
export class SsrRuntimeFontFetcher implements RuntimeFontFetcher {
	#urls: Set<string>;
	#fetch: typeof globalThis.fetch;

	constructor({
		urls,
		fetch,
	}: {
		urls: Set<string>;
		fetch: typeof globalThis.fetch;
	}) {
		this.#urls = urls;
		this.#fetch = fetch;
	}

	async fetch(url: string, requestUrl: URL | undefined): Promise<ArrayBuffer | null> {
		if (!this.#urls.has(url)) {
			return null;
		}
		// assetsPrefix
		if (!url.startsWith('/')) {
			return this.#fetch(url).then((res) => res.arrayBuffer());
		}
		// We need the request URL to call the current server
		if (!requestUrl) {
			throw new AstroError(MissingGetFontBufferRequestUrl);
		}
		return this.#fetch(`${requestUrl.origin}${url}`).then((res) => res.arrayBuffer());
	}
}
