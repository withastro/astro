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
	#ids: Set<string>;
	#address: AddressInfo | null;
	#base: string;
	#fetch: typeof globalThis.fetch;

	constructor({
		ids,
		address,
		base,
		fetch,
	}: {
		ids: Set<string>;
		address: AddressInfo | null;
		base: string;
		fetch: typeof globalThis.fetch;
	}) {
		this.#ids = ids;
		this.#address = address;
		this.#base = base;
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
		return this.#fetch(`http://${host}:${this.#address.port}${this.#base}${id}`).then((res) =>
			res.arrayBuffer(),
		);
	}
}
