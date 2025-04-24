import type {
	DataCollector,
	FontTypeExtractor,
	Hasher,
	UrlProxy,
	UrlProxyContentResolver,
} from '../definitions.js';

export function createUrlProxy({
	base,
	contentResolver,
	hasher,
	dataCollector,
	fontTypeExtractor,
}: {
	base: string;
	contentResolver: UrlProxyContentResolver;
	hasher: Hasher;
	dataCollector: DataCollector;
	fontTypeExtractor: FontTypeExtractor;
}): UrlProxy {
	return {
		proxy({ url: originalUrl, data, collectPreload }) {
			const type = fontTypeExtractor.extract(originalUrl);
			const hash = `${hasher.hashString(contentResolver.resolve(originalUrl))}.${type}`;
			const url = base + hash;

			dataCollector.collect({
				originalUrl,
				hash,
				preload: collectPreload ? { url, type } : null,
				data,
			});

			return url;
		},
	};
}
