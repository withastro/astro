import type {
	DataCollector,
	ProxyData,
	UrlProxy,
	UrlProxyHashResolver,
	UrlResolver,
} from '../definitions.js';
import type { FontFileData, FontType } from '../types.js';
import { renderFontWeight } from '../utils.js';

// TODO: find a better name
export class RealUrlProxy implements UrlProxy {
	readonly #hashResolver: UrlProxyHashResolver;
	readonly #dataCollector: DataCollector;
	readonly #urlResolver: UrlResolver;
	readonly #cssVariable: string;

	constructor({
		hashResolver,
		dataCollector,
		urlResolver,
		cssVariable,
	}: {
		hashResolver: UrlProxyHashResolver;
		dataCollector: DataCollector;
		urlResolver: UrlResolver;
		cssVariable: string;
	}) {
		this.#hashResolver = hashResolver;
		this.#dataCollector = dataCollector;
		this.#urlResolver = urlResolver;
		this.#cssVariable = cssVariable;
	}

	proxy({
		url: originalUrl,
		type,
		data,
		collectPreload,
		init,
	}: Pick<FontFileData, 'url' | 'init'> & {
		type: FontType;
		collectPreload: boolean;
		data: ProxyData;
	}): string {
		const hash = this.#hashResolver.resolve({
			cssVariable: this.#cssVariable,
			data,
			originalUrl,
			type,
		});
		const url = this.#urlResolver.resolve(hash);

		this.#dataCollector.collect({
			url: originalUrl,
			hash,
			preload: collectPreload
				? {
						url,
						type,
						weight: renderFontWeight(data.weight),
						style: data.style,
						subset: data.subset,
					}
				: null,
			data,
			init,
		});

		return url;
	}
}
