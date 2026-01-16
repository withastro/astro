import type {
	Hasher,
	ProxyData,
	UrlProxyContentResolver,
	UrlProxyHashResolver,
} from '../definitions.js';
import type { FontType } from '../types.js';

export class DevUrlProxyHashResolver implements UrlProxyHashResolver {
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

	#formatWeight(
		weight: Parameters<UrlProxyHashResolver['resolve']>[0]['data']['weight'],
	): string | undefined {
		if (Array.isArray(weight)) {
			return weight.join('-');
		}
		if (typeof weight === 'number') {
			return weight.toString();
		}
		return weight?.replace(/\s+/g, '-');
	}

	resolve({
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
