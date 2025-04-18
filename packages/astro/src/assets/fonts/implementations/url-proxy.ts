import type * as unifont from 'unifont';
import type { DataCollector, Hasher, UrlProxy, UrlProxyContentResolver } from '../definitions.js';
import { extractFontType } from '../utils.js';

export class RealUrlProxy implements UrlProxy {
	constructor(
		private base: string,
		private contentResolver: UrlProxyContentResolver,
		private hasher: Hasher,
		private dataCollector: DataCollector,
	) {}

	proxy({
		url: originalUrl,
		data,
		collectPreload,
	}: {
		url: string;
		data: Partial<unifont.FontFaceData>;
		collectPreload: boolean;
	}): string {
		const type = extractFontType(originalUrl);
		const hash = `${this.hasher.hashString(this.contentResolver.resolve(originalUrl))}.${type}`;
		const url = this.base + hash;

		this.dataCollector.collect({
			originalUrl,
			hash,
			preload: collectPreload ? { url, type } : null,
			data,
		});

		return url;
	}
}
