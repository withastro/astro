import type { Layer } from './layer';
import { createLoader } from './core.js';

const env = (import.meta as any).env || {};
const isDev = !!env.DEV;

class FetchCacheLayer<K = string | null> implements Layer<K> {
	#cache = new Map<string, Response>();
	get(url: K) {
		if(isDev || url == null) {
			return;
		}

		let key = url.toString();
		// Note that this is probably not right for SSR
		if(this.#cache.has(key)) {
			let response = this.#cache.get(key)!;
			return response.clone();
		}
	}
	cache(key: K, value: Response) {
		if(typeof key === 'string' && value.ok) {
			this.#cache.set(key, value.clone());
		}
	}
}

const _fetch = globalThis.fetch;
type FetchArgs = Parameters<typeof _fetch>;

export const fetch = createLoader({
	key(input: FetchArgs[0]) {
		if(input instanceof URL || typeof input === 'string') {
			return input.toString();
		}
	},
	async load(input: FetchArgs[0], init?: FetchArgs[1]) {
		debugger;
		let res = await _fetch(input, init);
		return res;
	},
	layers: [new FetchCacheLayer()]
});
