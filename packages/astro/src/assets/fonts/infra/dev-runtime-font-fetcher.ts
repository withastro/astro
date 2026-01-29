import type { RuntimeFontFetcher } from '../definitions.js';

export class DevRuntimeFontFetcher implements RuntimeFontFetcher {
	#ids: Set<string>;
	#port: number;
	#base: string;
	#fetch: typeof globalThis.fetch;

	constructor({
		ids,
		port,
		base,
		fetch,
	}: {
		ids: Set<string>;
		port: number;
		base: string;
		fetch: typeof globalThis.fetch;
	}) {
		this.#ids = ids;
		this.#port = port;
		this.#base = base;
		this.#fetch = fetch;
	}

	async fetch(url: string): Promise<ArrayBuffer | null> {
		const id = url.split('/').pop() ?? '';
		if (!this.#ids.has(id)) {
			return null;
		}
		return this.#fetch(`http://localhost:${this.#port}${this.#base}${id}`).then((res) =>
			res.arrayBuffer(),
		);
	}
}
