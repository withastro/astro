// @ts-check

import { UnifontFontResolver } from '../../../../dist/assets/fonts/infra/unifont-font-resolver.js';

/**
 * @import { Hasher, UrlProxy, FontMetricsResolver, Storage, FontResolver } from '../../../../dist/assets/fonts/definitions'
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

/** @implements {FontResolver} */
export class PassthroughFontResolver {
	/** @type {Array<import('unifont').Provider>} */
	#providers;

	/**
	 * @param {{ families: Array<import('../../../../dist/assets/fonts/types').ResolvedFontFamily>; hasher: Hasher }} param0
	 */
	constructor({ families, hasher }) {
		this.#providers = UnifontFontResolver.extractUnifontProviders({ families, hasher });
	}

	/**
	 * @param {string} name
	 */
	async #getProvider(name) {
		const providerFactory = this.#providers.find((e) => e._name === name);
		if (!providerFactory) {
			return undefined;
		}
		return await providerFactory({ storage: new SpyStorage() });
	}

	/**
	 * @param {import('../../../../dist/assets/fonts/types').AstroFontProviderResolveFontOptions & { provider: string; }} param0
	 */
	async resolveFont({ familyName, provider: providerName, ...options }) {
		const provider = await this.#getProvider(providerName);
		if (!provider) {
			return [];
		}
		const res = await provider.resolveFont(familyName, {
			weights: options.weights ?? [],
			styles: options.styles ?? [],
			subsets: options.subsets ?? [],
		});
		return res?.fonts ?? [];
	}

	/**
	 * @param {{ provider: string }} param0
	 */
	async listFonts({ provider: providerName }) {
		const provider = await this.#getProvider(providerName);
		if (!provider) {
			return [];
		}
		return await provider.listFonts?.();
	}
}
