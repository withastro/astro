import type { DataCollector, UrlProxy, UrlProxyHashResolver, UrlResolver } from '../definitions.js';

export function createUrlProxy({
	hashResolver,
	dataCollector,
	urlResolver,
	cssVariable,
}: {
	hashResolver: UrlProxyHashResolver;
	dataCollector: DataCollector;
	urlResolver: UrlResolver;
	cssVariable: string;
}): UrlProxy {
	return {
		proxy({ url: originalUrl, type, data, collectPreload, init }) {
			const hash = hashResolver.resolve({ cssVariable, data, originalUrl, type });
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
