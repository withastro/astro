import type {
	FontFileIdGenerator,
	Hasher,
	ProxyData,
	UrlProxyContentResolver,
} from '../definitions.js';
import type { FontType } from '../types.js';

export class DevFontFileIdGenerator implements FontFileIdGenerator {
	readonly #hasher: Hasher;
	readonly #contentResolver: UrlProxyContentResolver;

	constructor({
		hasher,
		contentResolver,
	}: {
		hasher: Hasher;
		contentResolver: UrlProxyContentResolver;
	}) {
		this.#hasher = hasher;
		this.#contentResolver = contentResolver;
	}

	#formatWeight(weight: ProxyData['weight']): string | undefined {
		if (Array.isArray(weight)) {
			return weight.join('-');
		}
		if (typeof weight === 'number') {
			return weight.toString();
		}
		return weight?.replace(/\s+/g, '-');
	}

	generate({
		cssVariable,
		data,
		originalUrl,
		type,
	}: {
		originalUrl: string;
		type: FontType;
		cssVariable: string;
		data: ProxyData;
	}): string {
		return [
			cssVariable.slice(2),
			this.#formatWeight(data.weight),
			data.style,
			data.subset,
			`${this.#hasher.hashString(this.#contentResolver.resolve(originalUrl))}.${type}`,
		]
			.filter(Boolean)
			.join('-');
	}
}
