import type { RuntimeFontFetcher } from '../definitions.js';

export class BuildRuntimeFontFetcher implements RuntimeFontFetcher {
	#ids: Set<string>;
	#port: number;

	constructor({ ids, port }: { ids: Set<string>; port: number }) {
		this.#ids = ids;
		this.#port = port;
	}

	async fetch(id: string): Promise<ArrayBuffer | null> {
		if (!this.#ids.has(id)) {
			return null;
		}
		return fetch(`http://localhost:${this.#port}/${id}`).then((res) => res.arrayBuffer());
	}
}
