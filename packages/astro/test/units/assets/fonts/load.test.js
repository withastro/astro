// @ts-check
import { it } from 'node:test';
import assert from 'node:assert/strict';
import { loadFonts } from '../../../../dist/assets/fonts/load.js';
import { resolveProvider } from '../../../../dist/assets/fonts/providers/utils.js';
import { google } from '../../../../dist/assets/fonts/providers/google.js';

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
		base,
		families: [
			{
				name: 'Roboto',
				nameWithHash: 'Roboto-xxx',
				provider: await resolveProvider({
					root,
					resolveMod: (id) => import(id),
					provider: google(),
				}),
				fallbacks: ['sans-serif'],
				cssVariable: '--custom',
				display: 'block',
			},
		],
		storage,
		hashToUrlMap,
		resolvedMap,
		hashString: (v) => Buffer.from(v).toString('base64'),
		getMetricsForFamily: async () => ({
			ascent: 0,
			descent: 0,
			lineGap: 0,
			unitsPerEm: 0,
			xWidthAvg: 0,
		}),
		generateFallbackFontFace: () => '',
		log: (message) => {
			logs.push(message);
		},
	});

	assert.equal(
		Array.from(store.keys()).every((key) => key.startsWith('google:')),
		true,
	);
	assert.equal(Array.from(hashToUrlMap.keys()).length > 0, true);
	assert.deepStrictEqual(Array.from(resolvedMap.keys()), ['--custom']);
	assert.deepStrictEqual(logs, ['Fonts initialized']);
	const css = resolvedMap.get('--custom').css;
	assert.equal(
		css.includes(':root { --custom: Roboto-xxx, "Roboto-xxx fallback: Arial", sans-serif; }'),
		true,
	);
	assert.equal(css.includes('font-display: block'), true);
});
