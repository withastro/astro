import type { RuntimeFontFetcher } from '../definitions.js';

export class BuildRuntimeFontFetcher implements RuntimeFontFetcher {
	#ids: Set<string>;
	#port: number;

	constructor({ ids, port }: { ids: Set<string>; port: number }) {
		this.#ids = ids;
		this.#port = port;
	}

	async fetch(url: string): Promise<ArrayBuffer | null> {
		const id = url.split('/').pop() ?? '';
		if (!this.#ids.has(id)) {
			return null;
		}
		return fetch(`http://localhost:${this.#port}/${id}`).then((res) => res.arrayBuffer());
	}
}
