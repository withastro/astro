import type { DataCollector, Hasher, UrlProxy, UrlProxyContentResolver } from '../definitions.js';

export function createUrlProxy({
	base,
	contentResolver,
	hasher,
	dataCollector,
}: {
	base: string;
	contentResolver: UrlProxyContentResolver;
	hasher: Hasher;
	dataCollector: DataCollector;
}): UrlProxy {
	return {
		proxy({ url: originalUrl, type, data, collectPreload, init }) {
			const hash = `${hasher.hashString(contentResolver.resolve(originalUrl))}.${type}`;
			const url = base + hash;

			dataCollector.collect({
				url: originalUrl,
				hash,
				preload: collectPreload ? { url, type } : null,
				data,
				init,
			});

			return url;
		},
	};
}
