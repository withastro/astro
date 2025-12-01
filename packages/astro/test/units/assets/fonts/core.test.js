// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { dedupeFontFaces } from '../../../../dist/assets/fonts/core/dedupe-font-faces.js';
import { extractUnifontProviders } from '../../../../dist/assets/fonts/core/extract-unifont-providers.js';
import { normalizeRemoteFontFaces } from '../../../../dist/assets/fonts/core/normalize-remote-font-faces.js';
import { optimizeFallbacks } from '../../../../dist/assets/fonts/core/optimize-fallbacks.js';
import { resolveFamily } from '../../../../dist/assets/fonts/core/resolve-families.js';
import { RealFontTypeExtractor } from '../../../../dist/assets/fonts/infra/font-type-extractor.js';
import { RealSystemFallbacksProvider } from '../../../../dist/assets/fonts/infra/system-fallbacks-provider.js';
import { FakeFontMetricsResolver, FakeHasher, SpyUrlProxy } from './utils.js';

describe('fonts core', () => {
	describe('resolveFamily()', () => {
		it('removes quotes correctly', async () => {
			const hasher = new FakeHasher('xxx');
			let family = await resolveFamily({
				family: {
					provider: 'local',
					name: 'Test',
					cssVariable: '--test',
					variants: [
						{
							weight: '400',
							style: 'normal',
							src: ['/'],
						},
					],
				},
				hasher,
				localProviderUrlResolver: {
					resolve: (url) => url,
				},
				remoteFontProviderResolver: {
					// @ts-expect-error
					resolve: async () => ({}),
				},
			});
			assert.equal(family.name, 'Test');
			assert.equal(family.nameWithHash, 'Test-xxx');

			family = await resolveFamily({
				family: {
					provider: 'local',
					name: '"Foo bar"',
					cssVariable: '--test',
					variants: [
						{
							weight: '400',
							style: 'normal',
							src: ['/'],
						},
					],
				},
				hasher,
				localProviderUrlResolver: {
					resolve: (url) => url,
				},
				remoteFontProviderResolver: {
					// @ts-expect-error
					resolve: async () => ({}),
				},
			});
			assert.equal(family.name, 'Foo bar');
			assert.equal(family.nameWithHash, 'Foo bar-xxx');
		});

		it('resolves local variant correctly', async () => {
			const family = await resolveFamily({
				family: {
					provider: 'local',
					name: 'Test',
					cssVariable: '--test',
					variants: [
						{
							weight: '400',
							style: 'normal',
							src: ['/'],
						},
					],
				},
				hasher: new FakeHasher(),
				localProviderUrlResolver: {
					resolve: (url) => url + url,
				},
				remoteFontProviderResolver: {
					// @ts-expect-error
					resolve: async () => ({}),
				},
			});
			if (family.provider === 'local') {
				assert.deepStrictEqual(
					family.variants.map((variant) => variant.src),
					[[{ url: '//', tech: undefined }]],
				);
			} else {
				assert.fail('Should be a local provider');
			}
		});

		it('resolves remote providers', async () => {
			const provider = () => {};
			const family = await resolveFamily({
				family: {
					provider: {
						entrypoint: '',
					},
					name: 'Test',
					cssVariable: '--test',
				},
				hasher: new FakeHasher(),
				localProviderUrlResolver: {
					resolve: (url) => url,
				},
				remoteFontProviderResolver: {
					// @ts-expect-error
					resolve: async () => ({
						provider,
					}),
				},
			});
			if (family.provider === 'local') {
				assert.fail('Should be a remote provider');
			} else {
				assert.deepStrictEqual(family.provider, { provider });
			}
		});

		it('dedupes properly', async () => {
			let family = await resolveFamily({
				family: {
					provider: 'local',
					name: '"Foo bar"',
					cssVariable: '--test',
					variants: [
						{
							weight: '400',
							style: 'normal',
							src: ['/'],
						},
					],
					fallbacks: ['foo', 'bar', 'foo'],
				},
				hasher: new FakeHasher(),
				localProviderUrlResolver: {
					resolve: (url) => url,
				},
				remoteFontProviderResolver: {
					// @ts-expect-error
					resolve: async () => ({}),
				},
			});
			assert.deepStrictEqual(family.fallbacks, ['foo', 'bar']);

			family = await resolveFamily({
				family: {
					provider: { entrypoint: '' },
					name: '"Foo bar"',
					cssVariable: '--test',
					weights: [400, '400', '500', 'bold'],
					styles: ['normal', 'normal', 'italic'],
					subsets: ['latin', 'latin'],
					fallbacks: ['foo', 'bar', 'foo'],
					unicodeRange: ['abc', 'def', 'abc'],
				},
				hasher: new FakeHasher(),
				localProviderUrlResolver: {
					resolve: (url) => url,
				},
				remoteFontProviderResolver: {
					// @ts-expect-error
					resolve: async () => ({}),
				},
			});

			if (family.provider === 'local') {
				assert.fail('Should be a remote provider');
			} else {
				assert.deepStrictEqual(family.weights, ['400', '500', 'bold']);
				assert.deepStrictEqual(family.styles, ['normal', 'italic']);
				assert.deepStrictEqual(family.subsets, ['latin']);
				assert.deepStrictEqual(family.fallbacks, ['foo', 'bar']);
				assert.deepStrictEqual(family.unicodeRange, ['abc', 'def']);
			}
		});
	});

	describe('extractUnifontProviders()', () => {
		const createProvider = (/** @type {string} */ name) => () =>
			Object.assign(() => undefined, { _name: name });

		/** @param {Array<import('../../../../dist/assets/fonts/types.js').ResolvedFontFamily>} families */
		function createFixture(families) {
			const result = extractUnifontProviders({
				families,
				hasher: new FakeHasher(),
			});
			return {
				/**
				 * @param {number} length
				 */
				assertProvidersLength: (length) => {
					assert.equal(result.providers.length, length);
				},
				/**
				 * @param {Array<string>} names
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
			fixture.assertProvidersNames(['test-{"name":"test"}', 'test-{"name":"test"}']);
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
			fixture.assertProvidersNames([
				'test-{"name":"test","x":"y"}',
				'test-{"name":"test","x":"y"}',
			]);
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

	describe('normalizeRemoteFontFaces()', () => {
		it('filters font data based on priority', () => {
			const urlProxy = new SpyUrlProxy();
			assert.equal(
				normalizeRemoteFontFaces({
					fonts: [],
					urlProxy,
					fontTypeExtractor: new RealFontTypeExtractor(),
				}).length,
				0,
			);
			assert.equal(
				normalizeRemoteFontFaces({
					fonts: [
						{
							src: [],
						},
						{
							src: [],
							meta: {},
						},
						{
							src: [],
							meta: { priority: undefined },
						},
						{
							src: [],
							meta: { priority: 0 },
						},
						{
							src: [],
							meta: { priority: 1 },
						},
						// Will be ignored
						{
							src: [],
							meta: { priority: 2 },
						},
					],
					urlProxy,
					fontTypeExtractor: new RealFontTypeExtractor(),
				}).length,
				5,
			);
		});

		it('proxies URLs correctly', () => {
			const urlProxy = new SpyUrlProxy();
			normalizeRemoteFontFaces({
				urlProxy,
				fonts: [
					{
						weight: '400',
						style: 'normal',
						src: [
							{ url: '/', format: 'woff2' },
							{ url: '/ignored', format: 'woff2' },
						],
					},
					{
						weight: '500',
						style: 'normal',
						src: [{ url: '/2', format: 'woff2' }],
					},
				],
				fontTypeExtractor: new RealFontTypeExtractor(),
			});
			assert.deepStrictEqual(urlProxy.collected, [
				{
					url: '/',
					type: 'woff2',
					collectPreload: true,
					data: { weight: '400', style: 'normal', subset: undefined },
					init: null,
				},
				{
					url: '/ignored',
					type: 'woff2',
					collectPreload: false,
					data: { weight: '400', style: 'normal', subset: undefined },
					init: null,
				},
				{
					url: '/2',
					type: 'woff2',
					collectPreload: true,
					data: { weight: '500', style: 'normal', subset: undefined },
					init: null,
				},
			]);
		});

		it('collects preloads correctly', () => {
			const urlProxy = new SpyUrlProxy();
			normalizeRemoteFontFaces({
				urlProxy,
				fonts: [
					{
						weight: '400',
						style: 'normal',
						src: [
							{ name: 'Arial' },
							{ url: '/', format: 'woff2' },
							{ url: '/ignored', format: 'woff2' },
						],
					},
					{
						weight: '500',
						style: 'normal',
						src: [
							{ url: '/2', format: 'woff2' },
							{ name: 'Foo' },
							{ url: '/also-ignored', format: 'woff2' },
						],
					},
				],
				fontTypeExtractor: new RealFontTypeExtractor(),
			});
			assert.deepStrictEqual(urlProxy.collected, [
				{
					url: '/',
					type: 'woff2',
					collectPreload: true,
					data: { weight: '400', style: 'normal', subset: undefined },
					init: null,
				},
				{
					url: '/ignored',
					type: 'woff2',
					collectPreload: false,
					data: { weight: '400', style: 'normal', subset: undefined },
					init: null,
				},
				{
					url: '/2',
					type: 'woff2',
					collectPreload: true,
					data: { weight: '500', style: 'normal', subset: undefined },
					init: null,
				},
				{
					url: '/also-ignored',
					type: 'woff2',
					collectPreload: false,
					data: { weight: '500', style: 'normal', subset: undefined },
					init: null,
				},
			]);
		});

		it('computes type and format correctly', () => {
			const urlProxy = new SpyUrlProxy();
			const fonts = normalizeRemoteFontFaces({
				urlProxy,
				fonts: [
					{
						weight: '400',
						style: 'normal',
						src: [{ name: 'Arial' }, { url: '/', format: 'woff2' }, { url: '/ignored.ttf' }],
					},
					{
						weight: '500',
						style: 'normal',
						src: [{ url: '/2', format: 'woff2' }, { name: 'Foo' }, { url: '/also-ignored.ttf' }],
					},
				],
				fontTypeExtractor: new RealFontTypeExtractor(),
			});
			assert.deepStrictEqual(fonts, [
				{
					src: [
						{
							name: 'Arial',
						},
						{
							format: 'woff2',
							originalURL: '/',
							url: '/',
						},
						{
							originalURL: '/ignored.ttf',
							url: '/ignored.ttf',
						},
					],
					style: 'normal',
					weight: '400',
				},
				{
					src: [
						{
							format: 'woff2',
							originalURL: '/2',
							url: '/2',
						},
						{
							name: 'Foo',
						},
						{
							originalURL: '/also-ignored.ttf',
							url: '/also-ignored.ttf',
						},
					],
					style: 'normal',
					weight: '500',
				},
			]);
			assert.deepStrictEqual(urlProxy.collected, [
				{
					url: '/',
					type: 'woff2',
					collectPreload: true,
					data: { weight: '400', style: 'normal', subset: undefined },
					init: null,
				},
				{
					url: '/ignored.ttf',
					type: 'ttf',
					collectPreload: false,
					data: { weight: '400', style: 'normal', subset: undefined },
					init: null,
				},
				{
					url: '/2',
					type: 'woff2',
					collectPreload: true,
					data: { weight: '500', style: 'normal', subset: undefined },
					init: null,
				},
				{
					url: '/also-ignored.ttf',
					type: 'ttf',
					collectPreload: false,
					data: { weight: '500', style: 'normal', subset: undefined },
					init: null,
				},
			]);
		});

		it('turns relative protocols into https', () => {
			const urlProxy = new SpyUrlProxy();
			const fonts = normalizeRemoteFontFaces({
				urlProxy,
				fonts: [
					{
						weight: '400',
						style: 'normal',
						src: [{ url: '//example.com/font.woff2' }, { url: 'http://example.com/font.woff' }],
					},
				],
				fontTypeExtractor: new RealFontTypeExtractor(),
			});

			assert.deepStrictEqual(fonts, [
				{
					src: [
						{
							originalURL: 'https://example.com/font.woff2',
							url: 'https://example.com/font.woff2',
						},
						{
							originalURL: 'http://example.com/font.woff',
							url: 'http://example.com/font.woff',
						},
					],
					style: 'normal',
					weight: '400',
				},
			]);
			assert.deepStrictEqual(urlProxy.collected, [
				{
					url: 'https://example.com/font.woff2',
					collectPreload: true,
					type: 'woff2',
					data: { weight: '400', style: 'normal', subset: undefined },
					init: null,
				},
				{
					url: 'http://example.com/font.woff',
					collectPreload: false,
					type: 'woff',
					data: { weight: '400', style: 'normal', subset: undefined },
					init: null,
				},
			]);
		});
	});

	describe('optimizeFallbacks()', () => {
		const family = {
			name: 'Test',
			nameWithHash: 'Test-xxx',
		};
		const systemFallbacksProvider = new RealSystemFallbacksProvider();
		const fontMetricsResolver = new FakeFontMetricsResolver();

		it('skips if there are no fallbacks', async () => {
			assert.equal(
				await optimizeFallbacks({
					family,
					fallbacks: [],
					collectedFonts: [{ url: '', hash: '', data: {}, init: null }],
					enabled: true,
					systemFallbacksProvider,
					fontMetricsResolver,
				}),
				null,
			);
		});

		it('skips if it is not enabled', async () => {
			assert.equal(
				await optimizeFallbacks({
					family,
					fallbacks: ['foo'],
					collectedFonts: [{ url: '', hash: '', data: {}, init: null }],
					enabled: false,
					systemFallbacksProvider,
					fontMetricsResolver,
				}),
				null,
			);
		});

		it('skips if there are no collected fonts', async () => {
			assert.equal(
				await optimizeFallbacks({
					family,
					fallbacks: ['foo'],
					collectedFonts: [],
					enabled: true,
					systemFallbacksProvider,
					fontMetricsResolver,
				}),
				null,
			);
		});

		it('skips if the last fallback is not a generic font family', async () => {
			assert.equal(
				await optimizeFallbacks({
					family,
					fallbacks: ['foo'],
					collectedFonts: [{ url: '', hash: '', data: {}, init: null }],
					enabled: true,
					systemFallbacksProvider,
					fontMetricsResolver,
				}),
				null,
			);
		});

		it('skips if the last fallback does not have local fonts associated', async () => {
			assert.equal(
				await optimizeFallbacks({
					family,
					fallbacks: ['cursive'],
					collectedFonts: [{ url: '', hash: '', data: {}, init: null }],
					enabled: true,
					systemFallbacksProvider,
					fontMetricsResolver,
				}),
				null,
			);
		});

		it('skips if the last fallback does not have local fonts associated', async () => {
			assert.equal(
				await optimizeFallbacks({
					family: {
						name: 'Arial',
						nameWithHash: 'Arial-xxx',
					},
					fallbacks: ['sans-serif'],
					collectedFonts: [{ url: '', hash: '', data: {}, init: null }],
					enabled: true,
					systemFallbacksProvider,
					fontMetricsResolver,
				}),
				null,
			);
		});

		it('places optimized fallbacks at the start', async () => {
			const result = await optimizeFallbacks({
				family,
				fallbacks: ['foo', 'sans-serif'],
				collectedFonts: [{ url: '', hash: '', data: {}, init: null }],
				enabled: true,
				systemFallbacksProvider,
				fontMetricsResolver,
			});
			assert.deepStrictEqual(result?.fallbacks, ['Test-xxx fallback: Arial', 'foo', 'sans-serif']);
		});

		it('outputs correct css', async () => {
			const result = await optimizeFallbacks({
				family,
				fallbacks: ['foo', 'sans-serif'],
				collectedFonts: [
					{ url: '', hash: '', data: { weight: '400' }, init: null },
					{ url: '', hash: '', data: { weight: '500' }, init: null },
				],
				enabled: true,
				systemFallbacksProvider,
				fontMetricsResolver,
			});
			assert.notEqual(result, null);
			assert.deepStrictEqual(JSON.parse(`[${result?.css.slice(0, -1)}]`), [
				{
					fallbackMetrics: {
						ascent: 1854,
						descent: -434,
						lineGap: 67,
						unitsPerEm: 2048,
						xWidthAvg: 913,
					},
					font: 'Arial',
					metrics: {
						ascent: 0,
						descent: 0,
						lineGap: 0,
						unitsPerEm: 0,
						xWidthAvg: 0,
					},
					name: 'Test-xxx fallback: Arial',
					properties: {
						'font-display': 'swap',
						'font-weight': '400',
					},
				},
				{
					fallbackMetrics: {
						ascent: 1854,
						descent: -434,
						lineGap: 67,
						unitsPerEm: 2048,
						xWidthAvg: 913,
					},
					font: 'Arial',
					metrics: {
						ascent: 0,
						descent: 0,
						lineGap: 0,
						unitsPerEm: 0,
						xWidthAvg: 0,
					},
					name: 'Test-xxx fallback: Arial',
					properties: {
						'font-display': 'swap',
						'font-weight': '500',
					},
				},
			]);
		});
	});

	describe('dedupeFontFaces()', () => {
		it('returns current if incoming is empty', () => {
			assert.deepStrictEqual(
				dedupeFontFaces(
					[
						{
							src: [],
							display: 'swap',
						},
					],
					[],
				),
				[
					{
						src: [],
						display: 'swap',
					},
				],
			);
		});

		it('returns incoming if current is empty', () => {
			assert.deepStrictEqual(
				dedupeFontFaces(
					[],
					[
						{
							src: [],
							display: 'swap',
						},
					],
				),
				[
					{
						src: [],
						display: 'swap',
					},
				],
			);
		});

		it('appends incoming if there is no match with current', () => {
			assert.deepStrictEqual(
				dedupeFontFaces(
					[
						{
							src: [
								{
									name: 'Foo',
								},
							],
							weight: 400,
						},
					],
					[
						{
							src: [
								{
									name: 'Bar',
								},
							],
							weight: 500,
						},
					],
				),
				[
					{
						src: [
							{
								name: 'Foo',
							},
						],
						weight: 400,
					},
					{
						src: [
							{
								name: 'Bar',
							},
						],
						weight: 500,
					},
				],
			);
		});

		it('merges incoming sources into current if there is a match', () => {
			assert.deepStrictEqual(
				dedupeFontFaces(
					[
						{
							src: [
								{
									name: 'Foo',
								},
							],
							weight: 300,
						},
					],
					[
						{
							src: [
								{
									name: 'Bar',
								},
							],
							weight: 300,
						},
					],
				),
				[
					{
						src: [
							{
								name: 'Foo',
							},
							{
								name: 'Bar',
							},
						],
						weight: 300,
					},
				],
			);
		});

		it('dedupes local sources', () => {
			assert.deepStrictEqual(
				dedupeFontFaces(
					[
						{
							src: [
								{
									name: 'Foo',
								},
							],
							weight: 300,
						},
					],
					[
						{
							src: [
								{
									name: 'Foo',
								},
								{
									name: 'Bar',
								},
							],
							weight: 300,
						},
					],
				),
				[
					{
						src: [
							{
								name: 'Foo',
							},
							{
								name: 'Bar',
							},
						],
						weight: 300,
					},
				],
			);
		});

		it('dedupes remote sources', () => {
			assert.deepStrictEqual(
				dedupeFontFaces(
					[
						{
							src: [
								{
									url: 'https://example.com/foo.woff2',
								},
							],
							weight: 300,
						},
					],
					[
						{
							src: [
								{
									url: 'https://example.com/foo.woff2',
								},
								{
									url: 'https://example.com/bar.woff2',
								},
							],
							weight: 300,
						},
					],
				),
				[
					{
						src: [
							{
								url: 'https://example.com/foo.woff2',
							},
							{
								url: 'https://example.com/bar.woff2',
							},
						],
						weight: 300,
					},
				],
			);
		});
	});
});
