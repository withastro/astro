import type * as unifont from 'unifont';
import type { FontFileContentResolver, FontFileIdGenerator, Hasher } from '../definitions.js';
import type { FontType } from '../types.js';

export class DevFontFileIdGenerator implements FontFileIdGenerator {
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

	#formatWeight(weight: unifont.FontFaceData['weight']): string | undefined {
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
		originalUrl,
		type,
		font,
	}: {
		originalUrl: string;
		type: FontType;
		cssVariable: string;
		font: unifont.FontFaceData;
	}): string {
		return [
			cssVariable.slice(2),
			this.#formatWeight(font.weight),
			font.style,
			font.meta?.subset,
			`${this.#hasher.hashString(this.#contentResolver.resolve(originalUrl))}.${type}`,
		]
			.filter(Boolean)
			.join('-');
	}
}
