import { withCache } from 'ultrafetch';
import { fileURLToPath } from 'url';
import Keyv from 'keyv';
import { KeyvFile } from 'keyv-file';

export interface FetchWithCacheOptions {
	root: URL;
	fetch: typeof fetch;
}
export function createFetchWithCache(options: FetchWithCacheOptions) {
	const store = new KeyvFile({
		filename: fileURLToPath(new URL('./node_modules/.astro/fetch/cache.json', options.root)),
		expiredCheckDelay: 24 * 3600 * 1000,
		writeDelay: 100,
	});
	store.clearExpire();
	const cache = new Keyv({
		store
	}) as unknown as Map<string, string>;
	return withCache(options.fetch, { cache });
}
