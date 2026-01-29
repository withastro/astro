import type { RuntimeFontFetcher } from '../definitions.js';

// TODO: assets prefix

export class SsrRuntimeFontFetcher implements RuntimeFontFetcher {
	#ids: Set<string>;
	#site: string | null;
	#base: string;

	constructor({ ids, site, base }: { ids: Set<string>; site: string | null; base: string }) {
		this.#ids = ids;
		this.#site = site;
		this.#base = base;
	}

	async fetch(url: string): Promise<ArrayBuffer | null> {
		const id = url.split('/').pop() ?? '';
		if (!this.#ids.has(id)) {
			return null;
		}
		if (id.startsWith('http')) {
			return fetch(url).then((res) => res.arrayBuffer());
		}
		if (!this.#site) {
			throw new Error('no site!!');
		}
		// TODO: check site trailing slash
		return fetch(`http://${this.#site}${this.#base}${id}`).then((res) => res.arrayBuffer());
	}
}
