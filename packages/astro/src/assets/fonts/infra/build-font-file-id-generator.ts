import type { FontFileIdGenerator, Hasher, UrlProxyContentResolver } from '../definitions.js';
import type { FontType } from '../types.js';

export class BuildFontFileIdGenerator implements FontFileIdGenerator {
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

	generate({ originalUrl, type }: { originalUrl: string; type: FontType }): string {
		return `${this.#hasher.hashString(this.#contentResolver.resolve(originalUrl))}.${type}`;
	}
}
