import type { Layer } from '../layer';

const env = (import.meta as any).env || {};
const isDev = !!env.DEV;

export class ForeverInBuildCache<K extends string | null = string | null> implements Layer<K> {
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
