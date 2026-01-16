// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { computeFontFamiliesAssets } from '../../../../dist/assets/fonts/core/compute-font-families-assets.js';
import { filterAndTransformFontFaces } from '../../../../dist/assets/fonts/core/filter-and-transform-font-faces.js';
import { getOrCreateFontFamilyAssets } from '../../../../dist/assets/fonts/core/get-or-create-font-family-assets.js';
import { resolveFamily } from '../../../../dist/assets/fonts/core/resolve-family.js';
import { SpyLogger } from '../../test-utils.js';
import { FakeHasher, FakeStringMatcher, markdownBold, PassthroughFontResolver } from './utils.js';

describe('fonts core', () => {
	describe('resolveFamily()', () => {
		it('removes quotes correctly', () => {
			const hasher = new FakeHasher('xxx');
			let family = resolveFamily({
				family: {
					provider: { name: 'foo', resolveFont: () => undefined },
					name: 'Test',
					cssVariable: '--test',
				},
				hasher,
			});
			assert.equal(family.name, 'Test');
			assert.equal(family.uniqueName, 'Test-xxx');

			family = resolveFamily({
				family: {
					provider: { name: 'foo', resolveFont: () => undefined },
					name: '"Foo bar"',
					cssVariable: '--test',
				},
				hasher,
			});
			assert.equal(family.name, 'Foo bar');
			assert.equal(family.uniqueName, 'Foo bar-xxx');
		});

		it('dedupes properly', () => {
			const family = resolveFamily({
				family: {
					provider: {
						name: 'xxx',
						resolveFont: () => undefined,
					},
					name: '"Foo bar"',
					cssVariable: '--test',
					weights: [400, '400', '500', 'bold'],
					styles: ['normal', 'normal', 'italic'],
					subsets: ['latin', 'latin'],
					fallbacks: ['foo', 'bar', 'foo'],
					unicodeRange: ['abc', 'def', 'abc'],
				},
				hasher: new FakeHasher(),
			});

			assert.deepStrictEqual(family.weights, ['400', '500', 'bold']);
			assert.deepStrictEqual(family.styles, ['normal', 'italic']);
			assert.deepStrictEqual(family.subsets, ['latin']);
			assert.deepStrictEqual(family.fallbacks, ['foo', 'bar']);
			assert.deepStrictEqual(family.unicodeRange, ['abc', 'def']);
		});
	});

	describe('computeFontFamiliesAssets()', () => {
		it('returns input data', async () => {
			const families = [
				{
					name: 'Test',
					uniqueName: 'Test-xxx',
					cssVariable: '--test',
					provider: {
						name: 'local',
						resolveFont: () => ({
							fonts: [
								{
									src: [{ url: 'https://example.com/foo.woff2' }],
								},
							],
						}),
					},
				},
			];
			const hasher = new FakeHasher('xxx');
			const logger = new SpyLogger();
			const stringMatcher = new FakeStringMatcher('Match');
			const { fontFamilyAssets, fontFileById } = await computeFontFamiliesAssets({
				resolvedFamilies: families,
				bold: markdownBold,
				defaults: {
					fallbacks: ['foo'],
					formats: ['woff2'],
					optimizedFallbacks: true,
					styles: ['normal'],
					subsets: ['latin'],
					weights: ['400'],
				},
				fontResolver: await PassthroughFontResolver.create({ families, hasher }),
				logger,
				stringMatcher,
				getOrCreateFontFamilyAssets: ({ family, fontFamilyAssetsByUniqueKey }) => {
					const assets = {
						family,
						collectedFontsForMetricsByUniqueKey: new Map(),
						fonts: [],
						preloads: [],
					};
					fontFamilyAssetsByUniqueKey.set(family.uniqueName, assets);
					return assets;
				},
				filterAndTransformFontFaces: ({ fonts }) => fonts,
				collectFontAssetsFromFaces: () => {
					return {
						collectedFontsForMetricsByUniqueKey: new Map(),
						fontFileById: new Map([['a', { url: 'a', init: undefined }]]),
						preloads: [
							{ style: 'normal', subset: undefined, type: 'woff2', url: 'a', weight: '400' },
						],
					};
				},
			});
			assert.deepStrictEqual(fontFamilyAssets, [
				{
					collectedFontsForMetricsByUniqueKey: new Map(),
					family: families[0],
					fonts: [
						{
							src: [{ url: 'https://example.com/foo.woff2' }],
						},
					],
					preloads: [
						{ style: 'normal', subset: undefined, type: 'woff2', url: 'a', weight: '400' },
					],
				},
			]);
			assert.deepStrictEqual(fontFileById, new Map([['a', { url: 'a', init: undefined }]]));
			assert.deepStrictEqual(logger.logs, []);
		});

		it('transforms fonts', async () => {
			const families = [
				{
					name: 'Test',
					uniqueName: 'Test-xxx',
					cssVariable: '--test',
					provider: {
						name: 'local',
						resolveFont: () => ({
							fonts: [
								{
									src: [{ url: 'https://example.com/foo.woff2' }],
								},
							],
						}),
					},
				},
			];
			const hasher = new FakeHasher('xxx');
			const logger = new SpyLogger();
			const stringMatcher = new FakeStringMatcher('Match');
			const { fontFamilyAssets, fontFileById } = await computeFontFamiliesAssets({
				resolvedFamilies: families,
				bold: markdownBold,
				defaults: {
					fallbacks: ['foo'],
					formats: ['woff2'],
					optimizedFallbacks: true,
					styles: ['normal'],
					subsets: ['latin'],
					weights: ['400'],
				},
				fontResolver: await PassthroughFontResolver.create({ families, hasher }),
				logger,
				stringMatcher,
				getOrCreateFontFamilyAssets: ({ family, fontFamilyAssetsByUniqueKey }) => {
					const assets = {
						family,
						collectedFontsForMetricsByUniqueKey: new Map(),
						fonts: [],
						preloads: [],
					};
					fontFamilyAssetsByUniqueKey.set(family.uniqueName, assets);
					return assets;
				},
				filterAndTransformFontFaces: () => [
					{
						src: [{ url: 'overriden' }],
					},
				],
				collectFontAssetsFromFaces: () => {
					return {
						collectedFontsForMetricsByUniqueKey: new Map(),
						fontFileById: new Map([['a', { url: 'a', init: undefined }]]),
						preloads: [],
					};
				},
			});
			assert.deepStrictEqual(fontFamilyAssets, [
				{
					collectedFontsForMetricsByUniqueKey: new Map(),
					family: families[0],
					fonts: [
						{
							src: [{ url: 'overriden' }],
						},
					],
					preloads: [],
				},
			]);
			assert.deepStrictEqual(fontFileById, new Map([['a', { url: 'a', init: undefined }]]));
			assert.deepStrictEqual(logger.logs, []);
		});

		it('warns if no fonts were found', async () => {
			const families = [
				{
					name: 'Test',
					uniqueName: 'Test-xxx',
					cssVariable: '--test',
					provider: {
						name: 'local',
						resolveFont: () => undefined,
					},
				},
			];
			const hasher = new FakeHasher('xxx');
			const logger = new SpyLogger();
			const stringMatcher = new FakeStringMatcher('Match');
			const { fontFamilyAssets, fontFileById } = await computeFontFamiliesAssets({
				resolvedFamilies: families,
				bold: markdownBold,
				defaults: {
					fallbacks: ['foo'],
					formats: ['woff2'],
					optimizedFallbacks: true,
					styles: ['normal'],
					subsets: ['latin'],
					weights: ['400'],
				},
				fontResolver: await PassthroughFontResolver.create({ families, hasher }),
				logger,
				stringMatcher,
				getOrCreateFontFamilyAssets: ({ family, fontFamilyAssetsByUniqueKey }) => {
					const assets = {
						family,
						collectedFontsForMetricsByUniqueKey: new Map(),
						fonts: [],
						preloads: [],
					};
					fontFamilyAssetsByUniqueKey.set(family.uniqueName, assets);
					return assets;
				},
				filterAndTransformFontFaces: ({ fonts }) => fonts,
				collectFontAssetsFromFaces: () => {
					return {
						collectedFontsForMetricsByUniqueKey: new Map(),
						fontFileById: new Map(),
						preloads: [],
					};
				},
			});
			assert.deepStrictEqual(fontFamilyAssets, [
				{
					collectedFontsForMetricsByUniqueKey: new Map(),
					family: families[0],
					fonts: [],
					preloads: [],
				},
			]);
			assert.deepStrictEqual(fontFileById, new Map());
			assert.deepStrictEqual(logger.logs, [
				{
					label: 'assets',
					message: 'No data found for font family **Test**. Review your configuration',
					type: 'warn',
				},
			]);
		});

		it('warns if no fonts were found and there is a match', async () => {
			const families = [
				{
					name: 'Test',
					uniqueName: 'Test-xxx',
					cssVariable: '--test',
					provider: {
						name: 'local',
						resolveFont: () => undefined,
						listFonts: () => ['a', 'b'],
					},
				},
			];
			const hasher = new FakeHasher('xxx');
			const logger = new SpyLogger();
			const stringMatcher = new FakeStringMatcher('a');
			const { fontFamilyAssets, fontFileById } = await computeFontFamiliesAssets({
				resolvedFamilies: families,
				bold: markdownBold,
				defaults: {
					fallbacks: ['foo'],
					formats: ['woff2'],
					optimizedFallbacks: true,
					styles: ['normal'],
					subsets: ['latin'],
					weights: ['400'],
				},
				fontResolver: await PassthroughFontResolver.create({ families, hasher }),
				logger,
				stringMatcher,
				getOrCreateFontFamilyAssets: ({ family, fontFamilyAssetsByUniqueKey }) => {
					const assets = {
						family,
						collectedFontsForMetricsByUniqueKey: new Map(),
						fonts: [],
						preloads: [],
					};
					fontFamilyAssetsByUniqueKey.set(family.uniqueName, assets);
					return assets;
				},
				filterAndTransformFontFaces: ({ fonts }) => fonts,
				collectFontAssetsFromFaces: () => {
					return {
						collectedFontsForMetricsByUniqueKey: new Map(),
						fontFileById: new Map(),
						preloads: [],
					};
				},
			});
			assert.deepStrictEqual(fontFamilyAssets, [
				{
					collectedFontsForMetricsByUniqueKey: new Map(),
					family: families[0],
					fonts: [],
					preloads: [],
				},
			]);
			assert.deepStrictEqual(fontFileById, new Map());
			assert.deepStrictEqual(logger.logs, [
				{
					label: 'assets',
					message: 'No data found for font family **Test**. Review your configuration',
					type: 'warn',
				},
				{
					label: 'assets',
					message: '**Test** font family cannot be retrieved by the provider. Did you mean **a**?',
					type: 'warn',
				},
			]);
		});

		it('works with several families', async () => {
			const families = [
				{
					name: 'Test',
					uniqueName: 'Test-xxx',
					cssVariable: '--test',
					provider: {
						name: 'local',
						resolveFont: () => ({
							fonts: [
								{
									src: [{ url: 'https://example.com/foo.woff2' }],
								},
							],
						}),
					},
				},
				{
					name: 'Foo',
					uniqueName: 'Foo-xxx',
					cssVariable: '--foo',
					provider: {
						name: 'foo',
						resolveFont: () => ({
							fonts: [
								{
									src: [{ url: 'https://example.com/bar.woff2' }],
								},
							],
						}),
					},
				},
			];
			const hasher = new FakeHasher('xxx');
			const logger = new SpyLogger();
			const stringMatcher = new FakeStringMatcher('Match');
			const { fontFamilyAssets, fontFileById } = await computeFontFamiliesAssets({
				resolvedFamilies: families,
				bold: markdownBold,
				defaults: {
					fallbacks: ['foo'],
					formats: ['woff2'],
					optimizedFallbacks: true,
					styles: ['normal'],
					subsets: ['latin'],
					weights: ['400'],
				},
				fontResolver: await PassthroughFontResolver.create({ families, hasher }),
				logger,
				stringMatcher,
				getOrCreateFontFamilyAssets: ({ family, fontFamilyAssetsByUniqueKey }) => {
					const assets = {
						family,
						collectedFontsForMetricsByUniqueKey: new Map(),
						fonts: [],
						preloads: [],
					};
					fontFamilyAssetsByUniqueKey.set(family.uniqueName, assets);
					return assets;
				},
				filterAndTransformFontFaces: ({ fonts }) => fonts,
				collectFontAssetsFromFaces: () => {
					return {
						collectedFontsForMetricsByUniqueKey: new Map(),
						fontFileById: new Map([['a', { url: 'a', init: undefined }]]),
						preloads: [
							{ style: 'normal', subset: undefined, type: 'woff2', url: 'a', weight: '400' },
						],
					};
				},
			});
			assert.deepStrictEqual(fontFamilyAssets, [
				{
					collectedFontsForMetricsByUniqueKey: new Map(),
					family: families[0],
					fonts: [
						{
							src: [{ url: 'https://example.com/foo.woff2' }],
						},
					],
					preloads: [
						{ style: 'normal', subset: undefined, type: 'woff2', url: 'a', weight: '400' },
					],
				},
				{
					collectedFontsForMetricsByUniqueKey: new Map(),
					family: families[1],
					fonts: [
						{
							src: [{ url: 'https://example.com/bar.woff2' }],
						},
					],
					preloads: [
						{ style: 'normal', subset: undefined, type: 'woff2', url: 'a', weight: '400' },
					],
				},
			]);
			assert.deepStrictEqual(fontFileById, new Map([['a', { url: 'a', init: undefined }]]));
			assert.deepStrictEqual(logger.logs, []);
		});
	});

	it('getOrCreateFontFamilyAssets()', () => {
		/** @type {Array<import('../../../../dist/assets/fonts/types.js').ResolvedFontFamily>} */
		const families = [
			{
				name: 'Foo',
				uniqueName: 'Foo-xxx',
				cssVariable: '--foo',
				provider: {
					name: 'foo',
					resolveFont: () => undefined,
				},
				weights: ['400'],
			},
			{
				name: 'Foo',
				uniqueName: 'Foo-yyy',
				cssVariable: '--foo',
				provider: {
					name: 'foo',
					resolveFont: () => undefined,
				},
				styles: ['italic'],
			},
			{
				name: 'Bar',
				uniqueName: 'Bar-xxx',
				cssVariable: '--bar',
				provider: {
					name: 'bar',
					resolveFont: () => undefined,
				},
			},
		];

		/** @type {import('../../../../dist/assets/fonts/types.js').FontFamilyAssetsByUniqueKey} */
		const fontFamilyAssetsByUniqueKey = new Map();
		const logger = new SpyLogger();

		assert.deepStrictEqual(
			getOrCreateFontFamilyAssets({
				fontFamilyAssetsByUniqueKey,
				family: families[0],
				logger,
				bold: markdownBold,
			}),
			{
				collectedFontsForMetricsByUniqueKey: new Map(),
				family: families[0],
				fonts: [],
				preloads: [],
			},
		);
		assert.deepStrictEqual(
			getOrCreateFontFamilyAssets({
				fontFamilyAssetsByUniqueKey,
				family: families[1],
				logger,
				bold: markdownBold,
			}),
			{
				collectedFontsForMetricsByUniqueKey: new Map(),
				family: families[0],
				fonts: [],
				preloads: [],
			},
		);
		assert.deepStrictEqual(
			getOrCreateFontFamilyAssets({
				fontFamilyAssetsByUniqueKey,
				family: families[2],
				logger,
				bold: markdownBold,
			}),
			{
				collectedFontsForMetricsByUniqueKey: new Map(),
				family: families[2],
				fonts: [],
				preloads: [],
			},
		);
		assert.equal(fontFamilyAssetsByUniqueKey.size, 2);
	});

	describe('filterAndTransformFontFaces()', () => {
		it('filters font data based on priority', () => {
			assert.equal(
				filterAndTransformFontFaces({
					family: { cssVariable: '--foo' },
					fonts: [],
					fontFileIdGenerator: {
						generate: () => '',
					},
					fontTypeExtractor: {
						extract: () => 'woff2',
					},
					urlResolver: {
						resolve: () => '',
						cspResources: [],
					},
				}).length,
				0,
			);
			assert.equal(
				filterAndTransformFontFaces({
					family: { cssVariable: '--foo' },
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
					fontFileIdGenerator: {
						generate: () => '',
					},
					fontTypeExtractor: {
						extract: () => 'woff2',
					},
					urlResolver: {
						resolve: () => '',
						cspResources: [],
					},
				}).length,
				5,
			);
		});

		it('computes type and format correctly', () => {
			assert.deepStrictEqual(
				filterAndTransformFontFaces({
					family: { cssVariable: '--foo' },
					fonts: [
						{
							weight: '400',
							style: 'normal',
							src: [{ name: 'Arial' }, { url: '/', format: 'woff2' }, { url: '/ignored.eot' }],
						},
						{
							weight: '500',
							style: 'normal',
							src: [{ url: '/2', format: 'woff2' }, { name: 'Foo' }, { url: '/also-ignored.ttf' }],
						},
					],
					fontFileIdGenerator: {
						generate: ({ originalUrl }) => originalUrl,
					},
					fontTypeExtractor: {
						extract: (url) => /** @type {any} */ (url.split('.').at(-1)) ?? 'woff',
					},
					urlResolver: {
						resolve: (url) => 'resolved:' + url,
						cspResources: [],
					},
				}),
				[
					{
						src: [
							{
								name: 'Arial',
							},
							{
								format: 'woff2',
								originalURL: '/',
								url: 'resolved:/',
								tech: undefined,
							},
							{
								format: 'embedded-opentype',
								originalURL: '/ignored.eot',
								url: 'resolved:/ignored.eot',
								tech: undefined,
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
								url: 'resolved:/2',
								tech: undefined,
							},
							{
								name: 'Foo',
							},
							{
								format: 'truetype',
								originalURL: '/also-ignored.ttf',
								url: 'resolved:/also-ignored.ttf',
								tech: undefined,
							},
						],
						style: 'normal',
						weight: '500',
					},
				],
			);
		});

		it('turns relative protocols into https', () => {
			assert.deepStrictEqual(
				filterAndTransformFontFaces({
					family: { cssVariable: '--foo' },
					fonts: [
						{
							weight: '400',
							style: 'normal',
							src: [{ url: '//example.com/font.woff2' }, { url: 'http://example.com/font.woff' }],
						},
					],
					fontFileIdGenerator: {
						generate: ({ originalUrl }) => originalUrl,
					},
					fontTypeExtractor: {
						extract: (url) => /** @type {any} */ (url.split('.').at(-1)) ?? 'woff',
					},
					urlResolver: {
						resolve: (url) => 'resolved:' + url,
						cspResources: [],
					},
				}),
				[
					{
						src: [
							{
								format: 'woff2',
								originalURL: 'https://example.com/font.woff2',
								url: 'resolved:https://example.com/font.woff2',
								tech: undefined,
							},
							{
								format: 'woff',
								originalURL: 'http://example.com/font.woff',
								url: 'resolved:http://example.com/font.woff',
								tech: undefined,
							},
						],
						style: 'normal',
						weight: '400',
					},
				],
			);
		});
	});

	describe('collectFontAssetsFromFaces()', () => {
		// TODO:
	});

	describe('collectFontData()', () => {
		// TODO:
		// 	it('proxies URLs correctly', () => {
		// 		const urlProxy = new SpyUrlProxy();
		// 		normalizeRemoteFontFaces({
		// 			urlProxy,
		// 			fonts: [
		// 				{
		// 					weight: '400',
		// 					style: 'normal',
		// 					src: [
		// 						{ url: '/', format: 'woff2' },
		// 						{ url: '/ignored', format: 'woff2' },
		// 					],
		// 				},
		// 				{
		// 					weight: '500',
		// 					style: 'normal',
		// 					src: [{ url: '/2', format: 'woff2' }],
		// 				},
		// 			],
		// 			fontTypeExtractor: new RealFontTypeExtractor(),
		// 		});
		// 		assert.deepStrictEqual(urlProxy.collected, [
		// 			{
		// 				url: '/',
		// 				type: 'woff2',
		// 				collectPreload: true,
		// 				data: { weight: '400', style: 'normal', subset: undefined },
		// 				init: null,
		// 			},
		// 			{
		// 				url: '/ignored',
		// 				type: 'woff2',
		// 				collectPreload: false,
		// 				data: { weight: '400', style: 'normal', subset: undefined },
		// 				init: null,
		// 			},
		// 			{
		// 				url: '/2',
		// 				type: 'woff2',
		// 				collectPreload: true,
		// 				data: { weight: '500', style: 'normal', subset: undefined },
		// 				init: null,
		// 			},
		// 		]);
		// 	});
		// 	it('collects preloads correctly', () => {
		// 		const urlProxy = new SpyUrlProxy();
		// 		normalizeRemoteFontFaces({
		// 			urlProxy,
		// 			fonts: [
		// 				{
		// 					weight: '400',
		// 					style: 'normal',
		// 					src: [
		// 						{ name: 'Arial' },
		// 						{ url: '/', format: 'woff2' },
		// 						{ url: '/ignored', format: 'woff2' },
		// 					],
		// 				},
		// 				{
		// 					weight: '500',
		// 					style: 'normal',
		// 					src: [
		// 						{ url: '/2', format: 'woff2' },
		// 						{ name: 'Foo' },
		// 						{ url: '/also-ignored', format: 'woff2' },
		// 					],
		// 				},
		// 			],
		// 			fontTypeExtractor: new RealFontTypeExtractor(),
		// 		});
		// 		assert.deepStrictEqual(urlProxy.collected, [
		// 			{
		// 				url: '/',
		// 				type: 'woff2',
		// 				collectPreload: true,
		// 				data: { weight: '400', style: 'normal', subset: undefined },
		// 				init: null,
		// 			},
		// 			{
		// 				url: '/ignored',
		// 				type: 'woff2',
		// 				collectPreload: false,
		// 				data: { weight: '400', style: 'normal', subset: undefined },
		// 				init: null,
		// 			},
		// 			{
		// 				url: '/2',
		// 				type: 'woff2',
		// 				collectPreload: true,
		// 				data: { weight: '500', style: 'normal', subset: undefined },
		// 				init: null,
		// 			},
		// 			{
		// 				url: '/also-ignored',
		// 				type: 'woff2',
		// 				collectPreload: false,
		// 				data: { weight: '500', style: 'normal', subset: undefined },
		// 				init: null,
		// 			},
		// 		]);
		// 	});
	});

	describe('collectComponentData()', () => {
		// TODO:
	});

	describe('optimizeFallbacks()', () => {
		// TODO:
	});

	// describe('optimizeFallbacks()', () => {
	// 	const family = {
	// 		name: 'Test',
	// 		nameWithHash: 'Test-xxx',
	// 	};
	// 	const systemFallbacksProvider = new RealSystemFallbacksProvider();
	// 	const fontMetricsResolver = new FakeFontMetricsResolver();

	// 	it('skips if there are no fallbacks', async () => {
	// 		assert.equal(
	// 			await optimizeFallbacks({
	// 				family,
	// 				fallbacks: [],
	// 				collectedFonts: [{ url: '', hash: '', data: {}, init: null }],
	// 				enabled: true,
	// 				systemFallbacksProvider,
	// 				fontMetricsResolver,
	// 			}),
	// 			null,
	// 		);
	// 	});

	// 	it('skips if it is not enabled', async () => {
	// 		assert.equal(
	// 			await optimizeFallbacks({
	// 				family,
	// 				fallbacks: ['foo'],
	// 				collectedFonts: [{ url: '', hash: '', data: {}, init: null }],
	// 				enabled: false,
	// 				systemFallbacksProvider,
	// 				fontMetricsResolver,
	// 			}),
	// 			null,
	// 		);
	// 	});

	// 	it('skips if there are no collected fonts', async () => {
	// 		assert.equal(
	// 			await optimizeFallbacks({
	// 				family,
	// 				fallbacks: ['foo'],
	// 				collectedFonts: [],
	// 				enabled: true,
	// 				systemFallbacksProvider,
	// 				fontMetricsResolver,
	// 			}),
	// 			null,
	// 		);
	// 	});

	// 	it('skips if the last fallback is not a generic font family', async () => {
	// 		assert.equal(
	// 			await optimizeFallbacks({
	// 				family,
	// 				fallbacks: ['foo'],
	// 				collectedFonts: [{ url: '', hash: '', data: {}, init: null }],
	// 				enabled: true,
	// 				systemFallbacksProvider,
	// 				fontMetricsResolver,
	// 			}),
	// 			null,
	// 		);
	// 	});

	// 	it('skips if the last fallback does not have local fonts associated', async () => {
	// 		assert.equal(
	// 			await optimizeFallbacks({
	// 				family,
	// 				fallbacks: ['cursive'],
	// 				collectedFonts: [{ url: '', hash: '', data: {}, init: null }],
	// 				enabled: true,
	// 				systemFallbacksProvider,
	// 				fontMetricsResolver,
	// 			}),
	// 			null,
	// 		);
	// 	});

	// 	it('skips if the last fallback does not have local fonts associated', async () => {
	// 		assert.equal(
	// 			await optimizeFallbacks({
	// 				family: {
	// 					name: 'Arial',
	// 					nameWithHash: 'Arial-xxx',
	// 				},
	// 				fallbacks: ['sans-serif'],
	// 				collectedFonts: [{ url: '', hash: '', data: {}, init: null }],
	// 				enabled: true,
	// 				systemFallbacksProvider,
	// 				fontMetricsResolver,
	// 			}),
	// 			null,
	// 		);
	// 	});

	// 	it('places optimized fallbacks at the start', async () => {
	// 		const result = await optimizeFallbacks({
	// 			family,
	// 			fallbacks: ['foo', 'sans-serif'],
	// 			collectedFonts: [{ url: '', hash: '', data: {}, init: null }],
	// 			enabled: true,
	// 			systemFallbacksProvider,
	// 			fontMetricsResolver,
	// 		});
	// 		assert.deepStrictEqual(result?.fallbacks, ['Test-xxx fallback: Arial', 'foo', 'sans-serif']);
	// 	});

	// 	it('outputs correct css', async () => {
	// 		const result = await optimizeFallbacks({
	// 			family,
	// 			fallbacks: ['foo', 'sans-serif'],
	// 			collectedFonts: [
	// 				{ url: '', hash: '', data: { weight: '400' }, init: null },
	// 				{ url: '', hash: '', data: { weight: '500' }, init: null },
	// 			],
	// 			enabled: true,
	// 			systemFallbacksProvider,
	// 			fontMetricsResolver,
	// 		});
	// 		assert.notEqual(result, null);
	// 		assert.deepStrictEqual(JSON.parse(`[${result?.css.slice(0, -1)}]`), [
	// 			{
	// 				fallbackMetrics: {
	// 					ascent: 1854,
	// 					descent: -434,
	// 					lineGap: 67,
	// 					unitsPerEm: 2048,
	// 					xWidthAvg: 913,
	// 				},
	// 				font: 'Arial',
	// 				metrics: {
	// 					ascent: 0,
	// 					descent: 0,
	// 					lineGap: 0,
	// 					unitsPerEm: 0,
	// 					xWidthAvg: 0,
	// 				},
	// 				name: 'Test-xxx fallback: Arial',
	// 				properties: {
	// 					'font-display': 'swap',
	// 					'font-weight': '400',
	// 				},
	// 			},
	// 			{
	// 				fallbackMetrics: {
	// 					ascent: 1854,
	// 					descent: -434,
	// 					lineGap: 67,
	// 					unitsPerEm: 2048,
	// 					xWidthAvg: 913,
	// 				},
	// 				font: 'Arial',
	// 				metrics: {
	// 					ascent: 0,
	// 					descent: 0,
	// 					lineGap: 0,
	// 					unitsPerEm: 0,
	// 					xWidthAvg: 0,
	// 				},
	// 				name: 'Test-xxx fallback: Arial',
	// 				properties: {
	// 					'font-display': 'swap',
	// 					'font-weight': '500',
	// 				},
	// 			},
	// 		]);
	// 	});
	// });
});
