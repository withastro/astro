import type { DataCollector, Hasher, UrlProxy, UrlProxyContentResolver } from '../definitions.js';

export function createUrlProxy({
	contentResolver,
	hasher,
	dataCollector,
	getUrl,
}: {
	contentResolver: UrlProxyContentResolver;
	hasher: Hasher;
	dataCollector: DataCollector;
	getUrl: (hash: string) => string;
}): UrlProxy {
	return {
		proxy({ url: originalUrl, type, data, collectPreload, init }) {
			const hash = `${hasher.hashString(contentResolver.resolve(originalUrl))}.${type}`;
			const url = getUrl(hash);

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
