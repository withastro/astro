// @ts-check

/**
 * @import { Hasher, UrlProxy, FontMetricsResolver, Storage } from '../../../../dist/assets/fonts/definitions'
 */

/** @implements {Storage} */
export class SpyStorage {
	/** @type {Map<string, any>} */
	#store = new Map();

	get store() {
		return this.#store;
	}

	/**
	 * @param {string} key
	 * @returns {Promise<any | null>}
	 */
	async getItem(key) {
		return this.#store.get(key) ?? null;
	}

	/**
	 * @param {string} key
	 * @returns {Promise<any | null>}
	 */
	async getItemRaw(key) {
		return this.#store.get(key) ?? null;
	}

	/**
	 * @param {string} key
	 * @param {any} value
	 * @returns {Promise<void>}
	 */
	async setItemRaw(key, value) {
		this.#store.set(key, value);
	}

	/**
	 * @param {string} key
	 * @param {any} value
	 * @returns {Promise<void>}
	 */
	async setItem(key, value) {
		this.#store.set(key, value);
	}
}

/** @implements {Hasher} */
export class FakeHasher {
	/** @type {string | undefined} */
	#value;

	/**
	 * @param {string | undefined} [value=undefined]
	 */
	constructor(value = undefined) {
		this.#value = value;
	}

	/**
	 * @param {string} input
	 */
	hashString(input) {
		return this.#value ?? input;
	}

	/**
	 * @param {any} input
	 */
	hashObject(input) {
		return this.#value ?? JSON.stringify(input);
	}
}

/** @implements {UrlProxy} */
export class SpyUrlProxy {
	/** @type {Array<Parameters<import('../../../../dist/assets/fonts/definitions').UrlProxy['proxy']>[0]>} */
	#collected = [];

	get collected() {
		return this.#collected;
	}

	/**
	 * @param {Parameters<import('../../../../dist/assets/fonts/definitions').UrlProxy['proxy']>[0]} input
	 */
	proxy(input) {
		input;
		this.#collected.push(input);
		return input.url;
	}
}

/** @implements {FontMetricsResolver} */
export class FakeFontMetricsResolver {
	async getMetrics() {
		return {
			ascent: 0,
			descent: 0,
			lineGap: 0,
			unitsPerEm: 0,
			xWidthAvg: 0,
		};
	}

	/**
	 * @param {Parameters<import('../../../../dist/assets/fonts/definitions').FontMetricsResolver['generateFontFace']>[0]} input
	 */
	generateFontFace(input) {
		return JSON.stringify(input, null, 2) + `,`;
	}
}

/**
 * @param {string} input
 */
export function markdownBold(input) {
	return `**${input}**`;
}
