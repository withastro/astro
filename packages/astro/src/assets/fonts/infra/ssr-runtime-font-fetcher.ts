import type { RuntimeFontFetcher } from '../definitions.js';

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
		if (id.startsWith('http')) {
			return fetch(url).then((res) => res.arrayBuffer());
		}
		if (!requestUrl) {
			// TODO: error
			throw new Error('in ssr, pass the request url');
		}
		return this.#fetch(`${requestUrl.origin}${url}`).then(
			(res) => res.arrayBuffer(),
		);
	}
}
