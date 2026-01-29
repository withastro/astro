import { removeTrailingForwardSlash } from '../../../core/path.js';
import type { RuntimeFontFetcher } from '../definitions.js';

export class SsrRuntimeFontFetcher implements RuntimeFontFetcher {
	#ids: Set<string>;
	#site: string | null;
	#base: string;
	#fetch: typeof globalThis.fetch;

	constructor({
		ids,
		site,
		base,
		fetch,
	}: {
		ids: Set<string>;
		site: string | null;
		base: string;
		fetch: typeof globalThis.fetch;
	}) {
		this.#ids = ids;
		this.#site = site;
		this.#base = base;
		this.#fetch = fetch;
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
		return this.#fetch(`http://${removeTrailingForwardSlash(this.#site)}${this.#base}${id}`).then(
			(res) => res.arrayBuffer(),
		);
	}
}
