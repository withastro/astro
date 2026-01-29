import type { RuntimeFontFetcher } from '../definitions.js';

export class DevRuntimeFontFetcher implements RuntimeFontFetcher {
	#ids: Set<string>;
	#port: number;
	#base: string;

	constructor({ ids, port, base }: { ids: Set<string>; port: number; base: string }) {
		this.#ids = ids;
		this.#port = port;
		this.#base = base;
	}

	async fetch(id: string): Promise<ArrayBuffer | null> {
		if (!this.#ids.has(id)) {
			return null;
		}
		return fetch(`http://localhost:${this.#port}${this.#base}${id}`).then((res) =>
			res.arrayBuffer(),
		);
	}
}
