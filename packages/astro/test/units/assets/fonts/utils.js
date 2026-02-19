// @ts-check

/**
 * @import { Hasher, FontMetricsResolver, Storage, FontResolver, StringMatcher } from '../../../../dist/assets/fonts/definitions'
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
	/** @type {Map<string, import('../../../../dist/index.js').FontProvider<Record<string, any>>>} */
	#providers;

	/**
	 * @private
	 * @param {Map<string, import('../../../../dist/index.js').FontProvider<Record<string, any>>>} providers
	 */
	constructor(providers) {
		this.#providers = providers;
	}

	/**
	 * @param {{ families: Array<import('../../../../dist/assets/fonts/types').ResolvedFontFamily>; hasher: Hasher }} param0
	 */
	static async create({ families, hasher }) {
		/** @type {Map<string, import('../../../../dist/index.js').FontProvider<Record<string, any>>>} */
		const providers = new Map();
		for (const { provider } of families) {
			provider.name = `${provider.name}-${hasher.hashObject(provider.config ?? {})}`;
			providers.set(provider.name, /** @type {any} */ (provider));
		}
		const storage = new SpyStorage();
		await Promise.all(
			Array.from(providers.values()).map(async (provider) => {
				await provider.init?.({ storage, root: new URL(import.meta.url) });
			}),
		);
		return new PassthroughFontResolver(providers);
	}

	/**
	 * @param {import('../../../../dist/assets/fonts/types.js').ResolveFontOptions<Record<string, any>> & { provider: import('../../../../dist/index.js').FontProvider; }} param0
	 */
	async resolveFont({ provider, ...rest }) {
		const res = await this.#providers.get(provider.name)?.resolveFont(rest);
		return res?.fonts ?? [];
	}

	/**
	 * @param {{ provider: import('../../../../dist/index.js').FontProvider }} param0
	 */
	async listFonts({ provider }) {
		return await this.#providers.get(provider.name)?.listFonts?.();
	}
}

/** @implements {StringMatcher} */
export class FakeStringMatcher {
	/** @type {string} */
	#match;

	/** @param {string} match */
	constructor(match) {
		this.#match = match;
	}

	getClosestMatch() {
		return this.#match;
	}
}
