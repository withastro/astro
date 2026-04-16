import type { AddressInfo } from 'node:net';
import type { RuntimeFontFetcher } from '../definitions.js';

/**
 * In development, font files are served through a Vite middleware.
 * During prerendering, a temporary Node HTTP server is started to
 * serve font files.
 *
 * We send request to the provided server address. `requestUrl` on
 * `fetch` is not implemented because we have the information from
 * within the Vite plugin already.
 */
export class RemoteRuntimeFontFetcher implements RuntimeFontFetcher {
	#urls: Set<string>;
	#address: AddressInfo | null;
	#fetch: typeof globalThis.fetch;

	constructor({
		urls,
		address,
		fetch,
	}: {
		urls: Set<string>;
		address: AddressInfo | null;
		fetch: typeof globalThis.fetch;
	}) {
		this.#urls = urls;
		this.#address = address;
		this.#fetch = fetch;
	}

	async fetch(url: string): Promise<ArrayBuffer | null> {
		if (!this.#urls.has(url)) {
			return null;
		}
		if (!this.#address) {
			throw new Error('Server address unavailable, this should not happen. Open an issue.');
		}
		// assetsPrefix
		if (!url.startsWith('/')) {
			url = new URL(url).pathname;
		}
		const host =
			this.#address.family === 'IPv6' ? `[${this.#address.address}]` : this.#address.address;
		return this.#fetch(`http://${host}:${this.#address.port}${url}`).then((res) =>
			res.arrayBuffer(),
		);
	}
}
