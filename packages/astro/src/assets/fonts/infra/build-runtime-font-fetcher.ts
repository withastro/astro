import type { RuntimeFontFetcher } from '../definitions.js';

/**
 * During prerendering, a temporary Node HTTP server is started to
 * serve font files. It will always be on localhost so we just need
 * the port to construct the request. `requestUrl` on `fetch` is not
 * implemented/used because this temporary Node HTTP server is different
 * from the actual prerendering server, if any.
 */
export class BuildRuntimeFontFetcher implements RuntimeFontFetcher {
	#ids: Set<string>;
	#port: number;
	#fetch: typeof globalThis.fetch;

	constructor({
		ids,
		port,
		fetch,
	}: {
		ids: Set<string>;
		port: number;
		fetch: typeof globalThis.fetch;
	}) {
		this.#ids = ids;
		this.#port = port;
		this.#fetch = fetch;
	}

	async fetch(url: string): Promise<ArrayBuffer | null> {
		const id = url.split('/').pop() ?? '';
		if (!this.#ids.has(id)) {
			return null;
		}
		return this.#fetch(`http://localhost:${this.#port}/${id}`).then((res) => res.arrayBuffer());
	}
}
