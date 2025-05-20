import type {
	DataCollector,
	Hasher,
	UrlProxy,
	UrlProxyContentResolver,
	UrlResolver,
} from '../definitions.js';
import type { Style } from '../types.js';
import { renderFontWeight } from '../utils.js';

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
				preload: collectPreload
					? {
							url,
							type,
							weight: renderFontWeight(data.weight) ?? null,
							style: (data.style as Style) ?? null,
						}
					: null,
				data,
				init,
			});

			return url;
		},
	};
}
