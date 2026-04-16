import type { AddressInfo } from 'node:net';
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
	#address: AddressInfo | null;
	#fetch: typeof globalThis.fetch;

	constructor({
		ids,
		address,
		fetch,
	}: {
		ids: Set<string>;
		address: AddressInfo | null;
		fetch: typeof globalThis.fetch;
	}) {
		this.#ids = ids;
		this.#address = address;
		this.#fetch = fetch;
	}

	async fetch(url: string): Promise<ArrayBuffer | null> {
		const id = url.split('/').pop() ?? '';
		if (!this.#ids.has(id)) {
			return null;
		}
		if (!this.#address) {
			throw new Error('Server address unavailable, this should not happen. Open an issue.');
		}
		const host =
			this.#address.family === 'IPv6' ? `[${this.#address.address}]` : this.#address.address;
		return this.#fetch(`http://${host}:${this.#address.port}/${id}`).then((res) =>
			res.arrayBuffer(),
		);
	}
}
