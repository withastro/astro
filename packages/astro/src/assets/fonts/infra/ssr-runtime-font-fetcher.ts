import type { RuntimeFontFetcher } from '../definitions.js';

export class SsrRuntimeFontFetcher implements RuntimeFontFetcher {
	#ids: Set<string>;
	#site: string | null;
	#base: string;

	constructor({ ids, site, base }: { ids: Set<string>; site: string | null; base: string }) {
		this.#ids = ids;
		this.#site = site;
		this.#base = base;
	}

	async fetch(id: string): Promise<ArrayBuffer | null> {
		if (!this.#ids.has(id)) {
			return null;
		}
		if (id.startsWith('http')) {
			return fetch(id).then((res) => res.arrayBuffer());
		}
		if (!this.#site) {
			throw new Error('no site!!');
		}
		// TODO: check trailing slash
		return fetch(`http://${this.#site}${this.#base}${id}`).then((res) => res.arrayBuffer());
	}
}
