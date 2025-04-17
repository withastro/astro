import type { DataCollector, Hasher, UrlProxy, UrlProxyContentResolver } from '../definitions.js';
import { extractFontType } from '../utils.js';

export class RealUrlProxy implements UrlProxy {
	proxy({
		url: originalUrl,
		collectPreload,
		contentResolver,
		hasher,
		base,
		dataCollector,
	}: {
		url: string;
		collectPreload: boolean;
		contentResolver: UrlProxyContentResolver;
		hasher: Hasher;
		base: string;
		dataCollector: DataCollector;
	}): string {
		const type = extractFontType(originalUrl);
		const hash = `${hasher.hashString(contentResolver.resolve(originalUrl))}.${type}`;
		const url = base + hash;

		dataCollector.collect({
			originalUrl,
			hash,
			preload: collectPreload ? { url, type } : null,
		});

		return url;
	}
}
