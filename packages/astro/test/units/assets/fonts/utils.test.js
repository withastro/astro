// @ts-check
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
	isFontType,
	extractFontType,
	createCache,
	proxyURL,
	isGenericFontFamily,
	generateFallbacksCSS,
} from '../../../../dist/assets/fonts/utils.js';

function createSpyCache() {
	/** @type {Map<string, Buffer>} */
	const store = new Map();

	const storage = {
		/**
		 * @param {string} key
		 * @returns {Promise<Buffer | null>}
		 */
		getItemRaw: async (key) => {
			return store.get(key) ?? null;
		},
		/**
		 * @param {string} key
		 * @param {Buffer} value
		 * @returns {Promise<void>}
		 */
		setItemRaw: async (key, value) => {
			store.set(key, value);
		},
	};
	const cache = createCache(
		// @ts-expect-error we only mock the required hooks
		storage,
	);

	return { cache, getKeys: () => Array.from(store.keys()) };
}

/**
 *
 * @param {string} id
 * @param {string} value
 */
function proxyURLSpy(id, value) {
	/** @type {Parameters<import('../../../../dist/assets/fonts/utils.js').ProxyURLOptions['collect']>[0]} */
	let collected = /** @type {any} */ (undefined);
	const url = proxyURL({
		value,
		hashString: () => id,
		collect: (data) => {
			collected = data;
			return 'base/' + data.hash;
		},
	});

	return {
		url,
		collected,
	};
}

describe('fonts utils', () => {
	it('isFontType()', () => {
		assert.equal(isFontType('woff2'), true);
		assert.equal(isFontType('woff'), true);
		assert.equal(isFontType('otf'), true);
		assert.equal(isFontType('ttf'), true);
		assert.equal(isFontType('eot'), true);
		assert.equal(isFontType(''), false);
	});

	it('extractFontType', () => {
		/** @type {Array<[string, false | string]>} */
		const data = [
			['', false],
			['.', false],
			['test.', false],
			['https://foo.bar/file', false],
			[
				'https://fonts.gstatic.com/s/roboto/v47/KFO5CnqEu92Fr1Mu53ZEC9_Vu3r1gIhOszmkC3kaSTbQWt4N.woff2',
				'woff2',
			],
			['/home/documents/project/font.ttf', 'ttf'],
		];

		for (const [input, check] of data) {
			try {
				const res = extractFontType(input);
				if (check) {
					assert.equal(res, check);
				} else {
					assert.fail(`String ${JSON.stringify(input)} should not be valid`);
				}
			} catch (e) {
				if (check) {
					assert.fail(`String ${JSON.stringify(input)} should be valid`);
				} else {
					assert.equal(e instanceof Error, true);
					assert.equal(e.message, "Can't extract font type");
				}
			}
		}
	});

	it('createCache()', async () => {
		const { cache, getKeys } = createSpyCache();

		assert.deepStrictEqual(getKeys(), []);

		let buffer = Buffer.from('foo');
		let res = await cache('foo', async () => buffer);
		assert.equal(res.cached, false);
		assert.equal(res.data, buffer);

		assert.deepStrictEqual(getKeys(), ['foo']);

		res = await cache('foo', async () => buffer);
		assert.equal(res.cached, true);
		assert.equal(res.data, buffer);

		assert.deepStrictEqual(getKeys(), ['foo']);
	});

	it('proxyURL()', () => {
		let { url, collected } = proxyURLSpy(
			'foo',
			'https://fonts.gstatic.com/s/roboto/v47/KFO5CnqEu92Fr1Mu53ZEC9_Vu3r1gIhOszmkC3kaSTbQWt4N.woff2',
		);
		assert.equal(url, 'base/foo.woff2');
		assert.deepStrictEqual(collected, {
			hash: 'foo.woff2',
			type: 'woff2',
			value:
				'https://fonts.gstatic.com/s/roboto/v47/KFO5CnqEu92Fr1Mu53ZEC9_Vu3r1gIhOszmkC3kaSTbQWt4N.woff2',
		});

		({ url, collected } = proxyURLSpy('bar', '/home/documents/project/font.ttf'));
		assert.equal(url, 'base/bar.ttf');
		assert.deepStrictEqual(collected, {
			hash: 'bar.ttf',
			type: 'ttf',
			value: '/home/documents/project/font.ttf',
		});
	});

	it('isGenericFontFamily()', () => {
		assert.equal(isGenericFontFamily('serif'), true);
		assert.equal(isGenericFontFamily('sans-serif'), true);
		assert.equal(isGenericFontFamily('monospace'), true);
		assert.equal(isGenericFontFamily('cursive'), true);
		assert.equal(isGenericFontFamily('fantasy'), true);
		assert.equal(isGenericFontFamily('system-ui'), true);
		assert.equal(isGenericFontFamily('ui-serif'), true);
		assert.equal(isGenericFontFamily('ui-sans-serif'), true);
		assert.equal(isGenericFontFamily('ui-monospace'), true);
		assert.equal(isGenericFontFamily('ui-rounded'), true);
		assert.equal(isGenericFontFamily('emoji'), true);
		assert.equal(isGenericFontFamily('math'), true);
		assert.equal(isGenericFontFamily('fangsong'), true);
		assert.equal(isGenericFontFamily(''), false);
	});

	describe('generateFallbacksCSS()', () => {
		it('should return null if there are no fallbacks', async () => {
			assert.equal(
				await generateFallbacksCSS({
					family: 'Roboto',
					fallbacks: [],
					fontURL: null,
					getMetricsForFamily: async () => null,
					generateFontFace: () => '',
				}),
				null,
			);
		});

		it('should return fallbacks if there are no metrics', async () => {
			assert.deepStrictEqual(
				await generateFallbacksCSS({
					family: 'Roboto',
					fallbacks: ['foo'],
					fontURL: null,
					getMetricsForFamily: async () => null,
					generateFontFace: () => '',
				}),
				{
					css: '',
					fallbacks: ['foo'],
				},
			);
		});

		it('should return fallbacks if there are metrics but no generic font family', async () => {
			assert.deepStrictEqual(
				await generateFallbacksCSS({
					family: 'Roboto',
					fallbacks: ['foo'],
					fontURL: null,
					getMetricsForFamily: async () => ({
						ascent: 0,
						descent: 0,
						lineGap: 0,
						unitsPerEm: 0,
						xWidthAvg: 0,
					}),
					generateFontFace: () => '',
				}),
				{
					css: '',
					fallbacks: ['foo'],
				},
			);
		});

		it('shold return fallbacks if the generic font family does not have fonts associated', async () => {
			assert.deepStrictEqual(
				await generateFallbacksCSS({
					family: 'Roboto',
					fallbacks: ['emoji'],
					fontURL: null,
					getMetricsForFamily: async () => ({
						ascent: 0,
						descent: 0,
						lineGap: 0,
						unitsPerEm: 0,
						xWidthAvg: 0,
					}),
					generateFontFace: () => '',
				}),
				{
					css: '',
					fallbacks: ['emoji'],
				},
			);
		});

		it('resolves fallbacks correctly', async () => {
			assert.deepStrictEqual(
				await generateFallbacksCSS({
					family: 'Roboto',
					fallbacks: ['foo', 'bar'],
					fontURL: null,
					getMetricsForFamily: async () => ({
						ascent: 0,
						descent: 0,
						lineGap: 0,
						unitsPerEm: 0,
						xWidthAvg: 0,
					}),
					generateFontFace: (_metrics, fallback) => `[${fallback.font},${fallback.name}]`,
				}),
				{
					css: '',
					fallbacks: ['foo', 'bar'],
				},
			);
			assert.deepStrictEqual(
				await generateFallbacksCSS({
					family: 'Roboto',
					fallbacks: ['sans-serif', 'foo'],
					fontURL: null,
					getMetricsForFamily: async () => ({
						ascent: 0,
						descent: 0,
						lineGap: 0,
						unitsPerEm: 0,
						xWidthAvg: 0,
					}),
					generateFontFace: (_metrics, fallback) => `[${fallback.font},${fallback.name}]`,
				}),
				{
					css: '',
					fallbacks: ['sans-serif', 'foo'],
				},
			);
			assert.deepStrictEqual(
				await generateFallbacksCSS({
					family: 'Roboto',
					fallbacks: ['foo', 'sans-serif'],
					fontURL: null,
					getMetricsForFamily: async () => ({
						ascent: 0,
						descent: 0,
						lineGap: 0,
						unitsPerEm: 0,
						xWidthAvg: 0,
					}),
					generateFontFace: (_metrics, fallback) => `[${fallback.font},${fallback.name}]`,
				}),
				{
					css: `[Arial,Roboto fallback: Arial]`,
					fallbacks: ['Arial', 'foo', 'sans-serif'],
				},
			);
		});
	});
});
