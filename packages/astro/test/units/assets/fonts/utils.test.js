import assert from 'node:assert/strict';
// @ts-check
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { fontProviders } from '../../../../dist/assets/fonts/providers/index.js';
import {
	extractFontType,
	familiesToUnifontProviders,
	generateFallbacksCSS,
	cache as internalCache,
	isFontType,
	isGenericFontFamily,
	proxyURL,
	resolveFontFamily,
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

	return {
		/**
		 *
		 * @param {Parameters<typeof internalCache>[1]} key
		 * @param {Parameters<typeof internalCache>[2]} cb
		 * @returns
		 */
		cache: (key, cb) =>
			internalCache(
				// @ts-expect-error we only mock the required hooks
				storage,
				key,
				cb,
			),
		getKeys: () => Array.from(store.keys()),
	};
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
					assert.equal(e.title, 'Cannot extract the font type from the given URL.');
				}
			}
		}
	});

	it('cache()', async () => {
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
					family: { name: 'Roboto', nameWithHash: 'Roboto-xxx' },
					fallbacks: [],
					font: null,
					metrics: {
						getMetricsForFamily: async () => null,
						generateFontFace: () => '',
					},
				}),
				null,
			);
		});

		it('should return fallbacks even without automatic fallbacks generation', async () => {
			assert.deepStrictEqual(
				await generateFallbacksCSS({
					family: { name: 'Roboto', nameWithHash: 'Roboto-xxx' },
					fallbacks: ['foo'],
					font: null,
					metrics: null,
				}),
				{
					css: '',
					fallbacks: ['foo'],
				},
			);
		});

		it('should return fallbacks if there are no metrics', async () => {
			assert.deepStrictEqual(
				await generateFallbacksCSS({
					family: { name: 'Roboto', nameWithHash: 'Roboto-xxx' },
					fallbacks: ['foo'],
					font: null,
					metrics: {
						getMetricsForFamily: async () => null,
						generateFontFace: () => '',
					},
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
					family: { name: 'Roboto', nameWithHash: 'Roboto-xxx' },
					fallbacks: ['foo'],
					font: null,
					metrics: {
						getMetricsForFamily: async () => ({
							ascent: 0,
							descent: 0,
							lineGap: 0,
							unitsPerEm: 0,
							xWidthAvg: 0,
						}),
						generateFontFace: () => '',
					},
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
					family: { name: 'Roboto', nameWithHash: 'Roboto-xxx' },
					fallbacks: ['emoji'],
					font: null,
					metrics: {
						getMetricsForFamily: async () => ({
							ascent: 0,
							descent: 0,
							lineGap: 0,
							unitsPerEm: 0,
							xWidthAvg: 0,
						}),
						generateFontFace: () => '',
					},
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
					family: { name: 'Roboto', nameWithHash: 'Roboto-xxx' },
					fallbacks: ['foo', 'bar'],
					font: null,
					metrics: {
						getMetricsForFamily: async () => ({
							ascent: 0,
							descent: 0,
							lineGap: 0,
							unitsPerEm: 0,
							xWidthAvg: 0,
						}),
						generateFontFace: (_metrics, fallback) => `[${fallback.font},${fallback.name}]`,
					},
				}),
				{
					css: '',
					fallbacks: ['foo', 'bar'],
				},
			);
			assert.deepStrictEqual(
				await generateFallbacksCSS({
					family: { name: 'Roboto', nameWithHash: 'Roboto-xxx' },
					fallbacks: ['sans-serif', 'foo'],
					font: null,
					metrics: {
						getMetricsForFamily: async () => ({
							ascent: 0,
							descent: 0,
							lineGap: 0,
							unitsPerEm: 0,
							xWidthAvg: 0,
						}),
						generateFontFace: (_metrics, fallback) => `[${fallback.font},${fallback.name}]`,
					},
				}),
				{
					css: '',
					fallbacks: ['sans-serif', 'foo'],
				},
			);
		});
	});

	describe('resolveFontFamily()', () => {
		const root = new URL(import.meta.url);

		it('handles the local provider correctly', async () => {
			assert.deepStrictEqual(
				await resolveFontFamily({
					family: {
						name: 'Custom',
						cssVariable: '--custom',
						provider: 'local',
						variants: [
							{
								src: ['a'],
								weight: 400,
								style: 'normal',
							},
						],
					},
					resolveMod: async () => ({ provider: () => {} }),
					generateNameWithHash: (family) => `${family.name}-x`,
					root,
				}),
				{
					name: 'Custom',
					nameWithHash: 'Custom-x',
					cssVariable: '--custom',
					provider: 'local',
					fallbacks: undefined,
					variants: [
						{
							src: [{ url: fileURLToPath(new URL('a', root)), tech: undefined }],
							weight: '400',
							style: 'normal',
						},
					],
				},
			);
			assert.deepStrictEqual(
				await resolveFontFamily({
					family: {
						name: 'Custom',
						cssVariable: '--custom',
						provider: 'local',
						variants: [
							{
								src: ['a'],
								weight: 400,
								style: 'normal',
							},
						],
					},
					resolveMod: async () => ({ provider: () => {} }),
					generateNameWithHash: (family) => `${family.name}-x`,
					root,
				}),
				{
					name: 'Custom',
					nameWithHash: 'Custom-x',
					cssVariable: '--custom',
					provider: 'local',
					fallbacks: undefined,
					variants: [
						{
							src: [{ url: fileURLToPath(new URL('a', root)), tech: undefined }],
							weight: '400',
							style: 'normal',
						},
					],
				},
			);
		});

		it('handles the google provider correctly', async () => {
			let res = await resolveFontFamily({
				family: {
					name: 'Custom',
					cssVariable: '--custom',
					provider: fontProviders.google(),
				},
				resolveMod: (id) => import(id),
				generateNameWithHash: (family) => `${family.name}-x`,
				root,
			});
			assert.equal(res.name, 'Custom');
			// Required to make TS happy
			if (res.provider !== 'local') {
				const provider = res.provider.provider(res.provider.config);
				assert.equal(provider._name, 'google');
			}

			res = await resolveFontFamily({
				family: {
					name: 'Custom',
					cssVariable: '--custom',
					provider: fontProviders.google(),
				},
				resolveMod: (id) => import(id),
				generateNameWithHash: (family) => `${family.name}-x`,
				root,
			});
			assert.equal(res.name, 'Custom');
			// Required to make TS happy
			if (res.provider !== 'local') {
				const provider = res.provider.provider(res.provider.config);
				assert.equal(provider._name, 'google');
			}
		});

		it('handles custom providers correctly', async () => {
			const res = await resolveFontFamily({
				family: {
					name: 'Custom',
					cssVariable: '--custom',
					provider: {
						entrypoint: '',
					},
				},
				resolveMod: async () => ({ provider: () => Object.assign(() => {}, { _name: 'test' }) }),
				generateNameWithHash: (family) => `${family.name}-x`,
				root,
			});
			assert.equal(res.name, 'Custom');
			if (res.provider !== 'local') {
				// Required to make TS happy
				const provider = res.provider.provider(res.provider.config);
				assert.equal(provider._name, 'test');
			}
		});
	});

	describe('familiesToUnifontProviders()', () => {
		const createProvider = (/** @type {string} */ name) => () =>
			Object.assign(() => undefined, { _name: name });

		/** @param {Array<import('../../../../dist/assets/fonts/types.js').ResolvedFontFamily>} families */
		function createFixture(families) {
			const result = familiesToUnifontProviders({
				hashString: (v) => v,
				families,
			});
			return {
				/**
				 * @param {number} length
				 */
				assertProvidersLength: (length) => {
					assert.equal(result.providers.length, length);
				},
				/**
				 * @param {Array<string | undefined>} names
				 */
				assertProvidersNames: (names) => {
					assert.deepStrictEqual(
						result.families.map((f) =>
							typeof f.provider === 'string' ? f.provider : f.provider.name,
						),
						names,
					);
				},
			};
		}

		it('skips local fonts', () => {
			const fixture = createFixture([
				{
					name: 'Custom',
					nameWithHash: 'Custom-xxx',
					cssVariable: '--custom',
					provider: 'local',
					variants: [
						{
							src: [{ url: 'a' }],
							weight: '400',
							style: 'normal',
						},
					],
				},
			]);
			fixture.assertProvidersLength(0);
			fixture.assertProvidersNames(['local']);
		});

		it('appends a hash to the provider name', () => {
			const fixture = createFixture([
				{
					name: 'Custom',
					nameWithHash: 'Custom-xxx',
					cssVariable: '--custom',
					provider: {
						provider: createProvider('test'),
					},
				},
			]);
			fixture.assertProvidersLength(1);
			fixture.assertProvidersNames(['test-{"name":"test"}']);
		});

		it('deduplicates providers with no config', () => {
			const fixture = createFixture([
				{
					name: 'Foo',
					nameWithHash: 'Foo-xxx',
					cssVariable: '--custom',
					provider: {
						provider: createProvider('test'),
					},
				},
				{
					name: 'Bar',
					nameWithHash: 'Bar-xxx',
					cssVariable: '--custom',
					provider: {
						provider: createProvider('test'),
					},
				},
			]);
			fixture.assertProvidersLength(1);
			fixture.assertProvidersNames(['test-{"name":"test"}', undefined]);
		});

		it('deduplicates providers with the same config', () => {
			const fixture = createFixture([
				{
					name: 'Foo',
					nameWithHash: 'Foo-xxx',
					cssVariable: '--custom',
					provider: {
						provider: createProvider('test'),
						config: { x: 'y' },
					},
				},
				{
					name: 'Bar',
					nameWithHash: 'Bar-xxx',
					cssVariable: '--custom',
					provider: {
						provider: createProvider('test'),
						config: { x: 'y' },
					},
				},
			]);
			fixture.assertProvidersLength(1);
			fixture.assertProvidersNames(['test-{"name":"test","x":"y"}', undefined]);
		});

		it('does not deduplicate providers with different configs', () => {
			const fixture = createFixture([
				{
					name: 'Foo',
					nameWithHash: 'Foo-xxx',
					cssVariable: '--custom',
					provider: {
						provider: createProvider('test'),
						config: {
							x: 'foo',
						},
					},
				},
				{
					name: 'Bar',
					nameWithHash: 'Bar-xxx',
					cssVariable: '--custom',
					provider: {
						provider: createProvider('test'),
						config: {
							x: 'bar',
						},
					},
				},
			]);
			fixture.assertProvidersLength(2);
			fixture.assertProvidersNames([
				'test-{"name":"test","x":"foo"}',
				'test-{"name":"test","x":"bar"}',
			]);
		});
	});
});
