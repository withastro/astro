import type { RuntimeFontFetcher } from '../definitions.js';

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
