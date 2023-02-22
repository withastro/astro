import type { Layer } from './layer';
import { createLoader } from './core.js';
import { ForeverInBuildCache } from './layers/dev.js';

const _fetch = globalThis.fetch;
type FetchArgs = Parameters<typeof _fetch>;

export function createFetch(...layers: Layer<any>[]) {
	const fetch = createLoader({
		key(input: FetchArgs[0]) {
			if(input instanceof URL || typeof input === 'string') {
				return input.toString();
			}
		},
		async load(input: FetchArgs[0], init?: FetchArgs[1]) {
			let res = await _fetch(input, init);
			return res;
		},
		layers
	});

	return fetch;
}

export const fetch = createFetch(new ForeverInBuildCache());
