// @ts-check
import { it } from 'node:test';
import assert from 'node:assert/strict';
import { loadFonts } from '../../../../dist/assets/fonts/load.js';

it('loadFonts()', async () => {
	const root = new URL(import.meta.url);
	const base = '/test';
	/** @type {Map<string, any>} */
	const store = new Map();
	/** @type {import('unstorage').Storage} */
	// @ts-expect-error
	const storage = {
		/**
		 * @param {string} key
		 * @returns {Promise<any | null>}
		 */
		getItem: async (key) => {
			return store.get(key) ?? null;
		},
		/**
		 * @param {string} key
		 * @returns {Promise<any | null>}
		 */
		getItemRaw: async (key) => {
			return store.get(key) ?? null;
		},
		/**
		 * @param {string} key
		 * @param {any} value
		 * @returns {Promise<void>}
		 */
		setItemRaw: async (key, value) => {
			store.set(key, value);
		},
		/**
		 * @param {string} key
		 * @param {any} value
		 * @returns {Promise<void>}
		 */
		setItem: async (key, value) => {
			store.set(key, value);
		},
	};
	const hashToUrlMap = new Map();
	const resolvedMap = new Map();
	/** @type {Array<string>} */
	const logs = [];

	await loadFonts({
		root,
		base,
		providers: [],
		families: [
			{
				name: 'Roboto',
				// we do weird typings internally for "reasons" (provider is typed as "local" | "custom") but this is valid
				provider: /** @type {any} */ ('google'),
				fallbacks: ['sans-serif'],
			},
		],
		storage,
		hashToUrlMap,
		resolvedMap,
		resolveMod: async (id) => {
			if (id === '/CUSTOM') {
				return { provider: () => {} };
			}
			return await import(id);
		},
		hashString: (v) => Buffer.from(v).toString('base64'),
		getMetricsForFamily: async () => ({
			ascent: 0,
			descent: 0,
			lineGap: 0,
			unitsPerEm: 0,
			xWidthAvg: 0,
		}),
		generateFontFace: () => '',
		log: (message) => {
			logs.push(message);
		},
		generateCSSVariableName: (name) => name,
	});

	assert.equal(
		Array.from(store.keys()).every((key) => key.startsWith('google:')),
		true,
	);
	assert.equal(Array.from(hashToUrlMap.keys()).length > 0, true);
	assert.deepStrictEqual(Array.from(resolvedMap.keys()), ['Roboto']);
	assert.deepStrictEqual(logs, ['Fonts initialized']);
	assert.equal(
		resolvedMap
			.get('Roboto')
			.css.includes(':root { --astro-font-Roboto: Roboto, "Roboto fallback: Arial", sans-serif; }'),
		true,
	);
});
