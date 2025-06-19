import type {
	DataCollector,
	Hasher,
	UrlProxy,
	UrlProxyContentResolver,
	UrlResolver,
} from '../definitions.js';

export function createUrlProxy({
	contentResolver,
	hasher,
	dataCollector,
	urlResolver,
}: {
	contentResolver: UrlProxyContentResolver;
	hasher: Hasher;
	dataCollector: DataCollector;
	urlResolver: UrlResolver;
}): UrlProxy {
	return {
		proxy({ url: originalUrl, type, data, collectPreload, init }) {
			const hash = `${hasher.hashString(contentResolver.resolve(originalUrl))}.${type}`;
			const url = urlResolver.resolve(hash);

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
