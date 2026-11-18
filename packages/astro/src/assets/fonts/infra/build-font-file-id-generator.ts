import type { FontFileContentResolver, FontFileIdGenerator, Hasher } from '../definitions.js';
import type { FontType } from '../types.js';

export class BuildFontFileIdGenerator implements FontFileIdGenerator {
	readonly #hasher: Hasher;
	readonly #contentResolver: FontFileContentResolver;

	constructor({
		hasher,
		contentResolver,
	}: {
		hasher: Hasher;
		contentResolver: FontFileContentResolver;
	}) {
		this.#hasher = hasher;
		this.#contentResolver = contentResolver;
	}

	generate({ originalUrl, type }: { originalUrl: string; type: FontType }): string {
		return `${this.#hasher.hashString(this.#contentResolver.resolve(originalUrl))}.${type}`;
	}
}
