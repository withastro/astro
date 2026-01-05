import type {
	Hasher,
	ProxyData,
	UrlProxyContentResolver,
	UrlProxyHashResolver,
} from '../definitions.js';
import type { FontType } from '../types.js';

export class BuildUrlProxyHashResolver implements UrlProxyHashResolver {
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

	resolve({
		originalUrl,
		type,
	}: {
		originalUrl: string;
		type: FontType;
		cssVariable: string;
		data: ProxyData;
	}): string {
		return `${this.#hasher.hashString(this.#contentResolver.resolve(originalUrl))}.${type}`;
	}
}
