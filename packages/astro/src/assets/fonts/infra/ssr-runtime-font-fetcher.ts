import type { RuntimeFontFetcher } from '../definitions.js';
import { MissingGetFontBufferRequestUrl } from '../../../core/errors/errors-data.js';
import { AstroError } from '../../../core/errors/errors.js';

/**
 * During SSR, we don't know ahead of time where the server is located.
 * We rely on `requestUrl` (provided by the user) to construct the URL.
 */
export class SsrRuntimeFontFetcher implements RuntimeFontFetcher {
	#ids: Set<string>;
	#fetch: typeof globalThis.fetch;

	constructor({
		ids,
		fetch,
	}: {
		ids: Set<string>;
		fetch: typeof globalThis.fetch;
	}) {
		this.#ids = ids;
		this.#fetch = fetch;
	}

	async fetch(url: string, requestUrl: URL | undefined): Promise<ArrayBuffer | null> {
		const id = url.split('/').pop() ?? '';
		if (!this.#ids.has(id)) {
			return null;
		}
		if (url.startsWith('http')) {
			return this.#fetch(url).then((res) => res.arrayBuffer());
		}
		if (!requestUrl) {
			throw new AstroError(MissingGetFontBufferRequestUrl);
		}
		return this.#fetch(`${requestUrl.origin}${url}`).then((res) => res.arrayBuffer());
	}
}
