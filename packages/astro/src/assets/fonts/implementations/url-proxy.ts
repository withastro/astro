import type { DataCollector, Hasher, UrlProxy, UrlProxyContentResolver } from '../definitions.js';
import { extractFontType } from '../utils.js';

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
		proxy({ url: originalUrl, data, collectPreload }) {
			const type = extractFontType(originalUrl);
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
