import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { collectComponentData } from '../../../../dist/assets/fonts/core/collect-component-data.js';
import { collectFontAssetsFromFaces } from '../../../../dist/assets/fonts/core/collect-font-assets-from-faces.js';
import { collectFontData } from '../../../../dist/assets/fonts/core/collect-font-data.js';
import { computeFontFamiliesAssets } from '../../../../dist/assets/fonts/core/compute-font-families-assets.js';
import { createGetFontFileURL } from '../../../../dist/assets/fonts/core/create-get-font-file-url.js';
import { filterAndTransformFontFaces } from '../../../../dist/assets/fonts/core/filter-and-transform-font-faces.js';
import { filterPreloads } from '../../../../dist/assets/fonts/core/filter-preloads.js';
import { getOrCreateFontFamilyAssets } from '../../../../dist/assets/fonts/core/get-or-create-font-family-assets.js';
import { optimizeFallbacks } from '../../../../dist/assets/fonts/core/optimize-fallbacks.js';
import { resolveFamily } from '../../../../dist/assets/fonts/core/resolve-family.js';
import { fontFileMiddleware } from '../../../../dist/assets/fonts/core/font-file-middleware.js';
import type { SystemFallbacksProvider } from '../../../../dist/assets/fonts/definitions.js';
import type {
	FontFamilyAssetsByUniqueKey,
	ResolvedFontFamily,
} from '../../../../dist/assets/fonts/types.js';
import { SpyLogger } from '../../test-utils.ts';
import {
	FakeFontMetricsResolver,
	FakeHasher,
	FakeStringMatcher,
	markdownBold,
	PassthroughFontResolver,
} from './utils.ts';

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
						src: [{ url: 'overridden' }],
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
							src: [{ url: 'overridden' }],
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
					level: 'warn',
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
					level: 'warn',
				},
				{
					label: 'assets',
					message: '**Test** font family cannot be retrieved by the provider. Did you mean **a**?',
					level: 'warn',
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

	describe('getOrCreateFontFamilyAssets()', () => {
		it('reuses the same object as needed', () => {
			const families: Array<ResolvedFontFamily> = [
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

			const fontFamilyAssetsByUniqueKey: FontFamilyAssetsByUniqueKey = new Map();
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

		it('logs warnings for conflicting css variables', () => {
			const fontFamilyAssetsByUniqueKey: FontFamilyAssetsByUniqueKey = new Map();
			const logger = new SpyLogger();

			getOrCreateFontFamilyAssets({
				fontFamilyAssetsByUniqueKey,
				family: {
					name: 'Foo',
					uniqueName: 'Foo-xxx',
					cssVariable: '--foo',
					provider: {
						name: 'foo',
						resolveFont: () => undefined,
					},
				},
				logger,
				bold: markdownBold,
			});
			getOrCreateFontFamilyAssets({
				fontFamilyAssetsByUniqueKey,
				family: {
					name: 'Bar',
					uniqueName: 'Bar-xxx',
					cssVariable: '--foo',
					provider: {
						name: 'foo',
						resolveFont: () => undefined,
					},
				},
				logger,
				bold: markdownBold,
			});
			assert.deepStrictEqual(
				logger.logs.map((e) => e.level),
				['warn', 'warn'],
			);
		});
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
						urls: [],
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
						urls: [],
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
						extract: (url) => (url.split('.').at(-1) as any) ?? 'woff',
					},
					urlResolver: {
						resolve: (url) => 'resolved:' + url,
						cspResources: [],
						urls: [],
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
						extract: (url) => (url.split('.').at(-1) as any) ?? 'woff',
					},
					urlResolver: {
						resolve: (url) => 'resolved:' + url,
						cspResources: [],
						urls: [],
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
		it('saves font files ids', () => {
			const hasher = new FakeHasher('xxx');
			assert.deepStrictEqual(
				collectFontAssetsFromFaces({
					collectedFontsIds: new Set(),
					hasher,
					fontFileIdGenerator: {
						generate: ({ originalUrl }) => originalUrl,
					},
					fontFilesIds: new Set(['skip']),
					family: { cssVariable: '--foo', fallbacks: undefined },
					fonts: [
						{
							src: [
								{
									format: 'woff2',
									originalURL: 'https://example.com/font.woff2',
									url: 'resolved:https://example.com/font.woff2',
									tech: undefined,
								},
								{
									format: 'woff2',
									originalURL: 'skip',
									url: 'resolved:https://example.com/font.woff2',
									tech: undefined,
								},
								{
									name: 'whatever',
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
					defaults: {
						fallbacks: [],
					},
				}),
				{
					collectedFontsForMetricsByUniqueKey: new Map(),
					fontFileById: new Map([
						[
							'http://example.com/font.woff',
							{
								init: undefined,
								url: 'http://example.com/font.woff',
							},
						],
						[
							'https://example.com/font.woff2',
							{
								init: undefined,
								url: 'https://example.com/font.woff2',
							},
						],
					]),
					preloads: [
						{
							style: 'normal',
							subset: undefined,
							type: 'woff2',
							url: 'resolved:https://example.com/font.woff2',
							weight: '400',
						},
					],
				},
			);
		});

		it('preloads the first remote source of each font', () => {
			const hasher = new FakeHasher('xxx');
			assert.deepStrictEqual(
				collectFontAssetsFromFaces({
					collectedFontsIds: new Set(),
					hasher,
					fontFileIdGenerator: {
						generate: ({ originalUrl }) => originalUrl,
					},
					fontFilesIds: new Set(['skip']),
					family: { cssVariable: '--foo', fallbacks: undefined },
					fonts: [
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
						{
							src: [
								{
									format: 'woff',
									originalURL: 'https://example2.com/font.woff',
									url: 'resolved:https://example2.com/font.woff',
									tech: undefined,
								},
								{
									format: 'woff2',
									originalURL: 'https://example2.com/font.woff2',
									url: 'resolved:https://example2.com/font.woff2',
									tech: undefined,
								},
							],
							style: 'normal',
							weight: '400',
						},
					],
					defaults: {
						fallbacks: [],
					},
				}),
				{
					collectedFontsForMetricsByUniqueKey: new Map(),
					fontFileById: new Map([
						[
							'http://example.com/font.woff',
							{
								init: undefined,
								url: 'http://example.com/font.woff',
							},
						],
						[
							'https://example.com/font.woff2',
							{
								init: undefined,
								url: 'https://example.com/font.woff2',
							},
						],
						[
							'https://example2.com/font.woff',
							{
								init: undefined,
								url: 'https://example2.com/font.woff',
							},
						],
						[
							'https://example2.com/font.woff2',
							{
								init: undefined,
								url: 'https://example2.com/font.woff2',
							},
						],
					]),
					preloads: [
						{
							style: 'normal',
							subset: undefined,
							type: 'woff2',
							url: 'resolved:https://example.com/font.woff2',
							weight: '400',
						},
						{
							style: 'normal',
							subset: undefined,
							type: 'woff',
							url: 'resolved:https://example2.com/font.woff',
							weight: '400',
						},
					],
				},
			);
		});

		it('saves fonts for fallbacks', () => {
			const hasher = new FakeHasher('xxx');
			assert.deepStrictEqual(
				collectFontAssetsFromFaces({
					collectedFontsIds: new Set(),
					hasher,
					fontFileIdGenerator: {
						generate: ({ originalUrl }) => originalUrl,
					},
					fontFilesIds: new Set(),
					family: { cssVariable: '--foo', fallbacks: undefined },
					fonts: [
						{
							src: [
								{
									format: 'woff2',
									originalURL: 'https://example.com/font.woff2',
									url: 'resolved:https://example.com/font.woff2',
									tech: undefined,
								},
							],
							style: 'normal',
							weight: '400',
						},
					],
					defaults: {
						fallbacks: [],
					},
				}).collectedFontsForMetricsByUniqueKey,
				new Map(),
			);

			assert.deepStrictEqual(
				collectFontAssetsFromFaces({
					collectedFontsIds: new Set(),
					hasher,
					fontFileIdGenerator: {
						generate: ({ originalUrl }) => originalUrl,
					},
					fontFilesIds: new Set(),
					family: { cssVariable: '--foo', fallbacks: [] },
					fonts: [
						{
							src: [
								{
									format: 'woff2',
									originalURL: 'https://example.com/font.woff2',
									url: 'resolved:https://example.com/font.woff2',
									tech: undefined,
								},
							],
							style: 'normal',
							weight: '400',
						},
					],
					defaults: {
						fallbacks: [],
					},
				}).collectedFontsForMetricsByUniqueKey,
				new Map(),
			);

			assert.deepStrictEqual(
				collectFontAssetsFromFaces({
					collectedFontsIds: new Set(['xxx']),
					hasher,
					fontFileIdGenerator: {
						generate: ({ originalUrl }) => originalUrl,
					},
					fontFilesIds: new Set(),
					family: { cssVariable: '--foo', fallbacks: ['abc'] },
					fonts: [
						{
							src: [
								{
									format: 'woff2',
									originalURL: 'https://example.com/font.woff2',
									url: 'resolved:https://example.com/font.woff2',
									tech: undefined,
								},
							],
							style: 'normal',
							weight: '400',
						},
					],
					defaults: {
						fallbacks: [],
					},
				}).collectedFontsForMetricsByUniqueKey,
				new Map(),
			);

			assert.deepStrictEqual(
				collectFontAssetsFromFaces({
					collectedFontsIds: new Set(),
					hasher,
					fontFileIdGenerator: {
						generate: ({ originalUrl }) => originalUrl,
					},
					fontFilesIds: new Set(),
					family: { cssVariable: '--foo', fallbacks: ['abc'] },
					fonts: [
						{
							src: [
								{
									format: 'woff2',
									originalURL: 'https://example.com/font.woff2',
									url: 'resolved:https://example.com/font.woff2',
									tech: undefined,
								},
							],
							style: 'normal',
							weight: '400',
						},
					],
					defaults: {
						fallbacks: [],
					},
				}).collectedFontsForMetricsByUniqueKey,
				new Map([
					[
						'xxx',
						{
							data: {
								meta: {
									subset: undefined,
								},
								style: 'normal',
								weight: '400',
							},
							id: 'https://example.com/font.woff2',
							init: undefined,
							url: 'https://example.com/font.woff2',
						},
					],
				]),
			);

			assert.deepStrictEqual(
				collectFontAssetsFromFaces({
					collectedFontsIds: new Set(),
					hasher,
					fontFileIdGenerator: {
						generate: ({ originalUrl }) => originalUrl,
					},
					fontFilesIds: new Set(),
					family: { cssVariable: '--foo', fallbacks: undefined },
					fonts: [
						{
							src: [
								{
									format: 'woff2',
									originalURL: 'https://example.com/font.woff2',
									url: 'resolved:https://example.com/font.woff2',
									tech: undefined,
								},
							],
							style: 'normal',
							weight: '400',
						},
					],
					defaults: {
						fallbacks: ['abc'],
					},
				}).collectedFontsForMetricsByUniqueKey,
				new Map([
					[
						'xxx',
						{
							data: {
								meta: {
									subset: undefined,
								},
								style: 'normal',
								weight: '400',
							},
							id: 'https://example.com/font.woff2',
							init: undefined,
							url: 'https://example.com/font.woff2',
						},
					],
				]),
			);
		});
	});

	it('collectFontData()', () => {
		assert.deepStrictEqual(
			collectFontData([
				{
					family: { cssVariable: '--foo' },
					fonts: [
						{
							weight: '400',
							style: 'normal',
							src: [{ url: 'a.woff2', format: 'woff2' }, { name: 'b' }],
						},
						{
							weight: '500',
							style: 'italic',
							src: [{ url: 'c.woff2', format: 'woff2' }],
						},
					],
				},
				{
					family: { cssVariable: '--bar' },
					fonts: [
						{
							weight: '400',
							style: 'normal',
							src: [{ url: 'd.woff2', format: 'woff2' }],
						},
					],
				},
			]),
			{
				'--foo': [
					{
						src: [
							{
								format: 'woff2',
								tech: undefined,
								url: 'a.woff2',
							},
						],
						style: 'normal',
						weight: '400',
					},
					{
						src: [
							{
								format: 'woff2',
								tech: undefined,
								url: 'c.woff2',
							},
						],
						style: 'italic',
						weight: '500',
					},
				],
				'--bar': [
					{
						src: [
							{
								format: 'woff2',
								tech: undefined,
								url: 'd.woff2',
							},
						],
						style: 'normal',
						weight: '400',
					},
				],
			},
		);
	});

	describe('collectComponentData()', () => {
		it('generates css for each font face', async () => {
			assert.deepStrictEqual(
				await collectComponentData({
					defaults: {
						fallbacks: [],
						optimizedFallbacks: false,
					},
					fontFamilyAssets: [
						{
							family: {
								name: 'Test',
								uniqueName: 'Test-xxx',
								cssVariable: '--test',
								provider: { name: 'test', resolveFont: () => undefined },
							},
							collectedFontsForMetricsByUniqueKey: new Map(),
							fonts: [
								{
									weight: '400',
									src: [{ name: 'Test' }],
								},
								{
									weight: '500',
									src: [{ name: 'Test' }],
								},
							],
							preloads: [
								{ style: 'normal', subset: undefined, type: 'woff2', url: 'a', weight: undefined },
							],
						},
					],
					optimizeFallbacks: async () => null,
					cssRenderer: {
						generateFontFace: (family, properties) => JSON.stringify({ family, properties }),
						generateCssVariable: (key, values) => `${key}:${values.join(',')}`,
					},
				}),
				new Map([
					[
						'--test',
						{
							css: '{"family":"Test-xxx","properties":{"src":"local(\\"Test\\")","font-display":"swap","font-weight":"400"}}{"family":"Test-xxx","properties":{"src":"local(\\"Test\\")","font-display":"swap","font-weight":"500"}}--test:Test-xxx',
							preloads: [
								{ style: 'normal', subset: undefined, type: 'woff2', url: 'a', weight: undefined },
							],
						},
					],
				]),
			);
		});

		it('skips fallbacks if needed', async () => {
			assert.deepStrictEqual(
				await collectComponentData({
					defaults: {
						fallbacks: ['foo'],
						optimizedFallbacks: false,
					},
					fontFamilyAssets: [
						{
							family: {
								name: 'Test',
								uniqueName: 'Test-xxx',
								cssVariable: '--test',
								provider: { name: 'test', resolveFont: () => undefined },
							},
							collectedFontsForMetricsByUniqueKey: new Map(),
							fonts: [
								{
									weight: '400',
									src: [{ name: 'Test' }],
								},
								{
									weight: '500',
									src: [{ name: 'Test' }],
								},
							],
							preloads: [
								{ style: 'normal', subset: undefined, type: 'woff2', url: 'a', weight: undefined },
							],
						},
					],
					optimizeFallbacks: async () => null,
					cssRenderer: {
						generateFontFace: (family, properties) => JSON.stringify({ family, properties }),
						generateCssVariable: (key, values) => `${key}:${values.join(',')}`,
					},
				}),
				new Map([
					[
						'--test',
						{
							css: '{"family":"Test-xxx","properties":{"src":"local(\\"Test\\")","font-display":"swap","font-weight":"400"}}{"family":"Test-xxx","properties":{"src":"local(\\"Test\\")","font-display":"swap","font-weight":"500"}}--test:Test-xxx,foo',
							preloads: [
								{ style: 'normal', subset: undefined, type: 'woff2', url: 'a', weight: undefined },
							],
						},
					],
				]),
			);

			assert.deepStrictEqual(
				await collectComponentData({
					defaults: {
						fallbacks: ['foo'],
						optimizedFallbacks: true,
					},
					fontFamilyAssets: [
						{
							family: {
								name: 'Test',
								uniqueName: 'Test-xxx',
								cssVariable: '--test',
								provider: { name: 'test', resolveFont: () => undefined },
							},
							collectedFontsForMetricsByUniqueKey: new Map(),
							fonts: [
								{
									weight: '400',
									src: [{ name: 'Test' }],
								},
								{
									weight: '500',
									src: [{ name: 'Test' }],
								},
							],
							preloads: [
								{ style: 'normal', subset: undefined, type: 'woff2', url: 'a', weight: undefined },
							],
						},
					],
					optimizeFallbacks: async () => null,
					cssRenderer: {
						generateFontFace: (family, properties) => JSON.stringify({ family, properties }),
						generateCssVariable: (key, values) => `${key}:${values.join(',')}`,
					},
				}),
				new Map([
					[
						'--test',
						{
							css: '{"family":"Test-xxx","properties":{"src":"local(\\"Test\\")","font-display":"swap","font-weight":"400"}}{"family":"Test-xxx","properties":{"src":"local(\\"Test\\")","font-display":"swap","font-weight":"500"}}--test:Test-xxx,foo',
							preloads: [
								{ style: 'normal', subset: undefined, type: 'woff2', url: 'a', weight: undefined },
							],
						},
					],
				]),
			);
		});

		it('handles fallbacks', async () => {
			assert.deepStrictEqual(
				await collectComponentData({
					defaults: {
						fallbacks: ['foo'],
						optimizedFallbacks: true,
					},
					fontFamilyAssets: [
						{
							family: {
								name: 'Test',
								uniqueName: 'Test-xxx',
								cssVariable: '--test',
								provider: { name: 'test', resolveFont: () => undefined },
							},
							collectedFontsForMetricsByUniqueKey: new Map(),
							fonts: [
								{
									weight: '400',
									src: [{ name: 'Test' }],
								},
								{
									weight: '500',
									src: [{ name: 'Test' }],
								},
							],
							preloads: [
								{
									style: 'normal',
									subset: undefined,
									type: 'woff2',
									url: 'a',
									weight: undefined,
								},
							],
						},
					],
					optimizeFallbacks: async () => ({ css: 'FALLBACK', fallbacks: ['bar'] }),
					cssRenderer: {
						generateFontFace: (family, properties) => JSON.stringify({ family, properties }),
						generateCssVariable: (key, values) => `${key}:${values.join(',')}`,
					},
				}),
				new Map([
					[
						'--test',
						{
							css: '{"family":"Test-xxx","properties":{"src":"local(\\"Test\\")","font-display":"swap","font-weight":"400"}}{"family":"Test-xxx","properties":{"src":"local(\\"Test\\")","font-display":"swap","font-weight":"500"}}FALLBACK--test:Test-xxx,bar',
							preloads: [
								{
									style: 'normal',
									subset: undefined,
									type: 'woff2',
									url: 'a',
									weight: undefined,
								},
							],
						},
					],
				]),
			);
		});
	});

	describe('optimizeFallbacks()', () => {
		const family = {
			name: 'Test',
			uniqueName: 'Test-xxx',
		};
		const systemFallbacksProvider: SystemFallbacksProvider = {
			getLocalFonts: () => ['Arial'],
			getMetricsForLocalFont: () => ({
				ascent: 1854,
				descent: -434,
				lineGap: 67,
				unitsPerEm: 2048,
				xWidthAvg: 913,
			}),
		};
		const fontMetricsResolver = new FakeFontMetricsResolver();

		it('skips if there are no fallbacks', async () => {
			assert.equal(
				await optimizeFallbacks({
					family,
					fallbacks: [],
					collectedFonts: [{ url: '', id: '', data: {}, init: undefined }],
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
					collectedFonts: [{ url: '', id: '', data: {}, init: undefined }],
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
					collectedFonts: [{ url: '', id: '', data: {}, init: undefined }],
					systemFallbacksProvider: {
						getLocalFonts: () => [],
						getMetricsForLocalFont: systemFallbacksProvider.getMetricsForLocalFont,
					},
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
						uniqueName: 'Arial-xxx',
					},
					fallbacks: ['sans-serif'],
					collectedFonts: [{ url: '', id: '', data: {}, init: undefined }],
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
				collectedFonts: [{ url: '', id: '', data: {}, init: undefined }],
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
					{ url: '', id: '', data: { weight: '400' }, init: undefined },
					{ url: '', id: '', data: { weight: '500' }, init: undefined },
				],
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

	describe('filterPreloads()', () => {
		it('returns null if it should not preload', () => {
			assert.equal(filterPreloads([], false), null);
		});

		it('returns everything if it should preload all', () => {
			assert.deepStrictEqual(
				filterPreloads(
					[
						{
							style: 'normal',
							subset: undefined,
							type: 'woff2',
							url: 'foo',
							weight: undefined,
						},
						{
							style: 'italic',
							subset: 'latin',
							type: 'otf',
							url: 'bar',
							weight: undefined,
						},
					],
					true,
				),
				[
					{
						style: 'normal',
						subset: undefined,
						type: 'woff2',
						url: 'foo',
						weight: undefined,
					},
					{
						style: 'italic',
						subset: 'latin',
						type: 'otf',
						url: 'bar',
						weight: undefined,
					},
				],
			);
		});

		it('returns filtered data', () => {
			assert.deepStrictEqual(
				filterPreloads(
					[
						{
							style: 'normal',
							subset: undefined,
							type: 'woff2',
							url: 'foo',
							weight: undefined,
						},
						{
							style: 'italic',
							subset: 'latin',
							type: 'otf',
							url: 'bar',
							weight: undefined,
						},
					],
					[
						{
							style: 'normal',
						},
					],
				),
				[
					{
						style: 'normal',
						subset: undefined,
						type: 'woff2',
						url: 'foo',
						weight: undefined,
					},
				],
			);
		});

		it('returns variable weight', () => {
			assert.deepStrictEqual(
				filterPreloads(
					[
						{
							style: 'normal',
							subset: undefined,
							type: 'woff2',
							url: 'foo',
							weight: '500 900',
						},
						{
							style: 'italic',
							subset: 'latin',
							type: 'otf',
							url: 'bar',
							weight: '100 900',
						},
					],
					[
						{
							weight: '400',
						},
					],
				),
				[
					{
						style: 'italic',
						subset: 'latin',
						type: 'otf',
						url: 'bar',
						weight: '100 900',
					},
				],
			);

			assert.deepStrictEqual(
				filterPreloads(
					[
						{
							style: 'normal',
							subset: undefined,
							type: 'woff2',
							url: 'foo',
							weight: '500 900',
						},
						{
							style: 'italic',
							subset: 'latin',
							type: 'otf',
							url: 'bar',
							weight: '100 900',
						},
					],
					[
						{
							weight: ' 100 900',
						},
					],
				),
				[
					{
						style: 'italic',
						subset: 'latin',
						type: 'otf',
						url: 'bar',
						weight: '100 900',
					},
				],
			);
		});
	});

	describe('createGetFontFileURL()', () => {
		it('throws if runtimeFontFetcher throws', async () => {
			assert.throws(() =>
				createGetFontFileURL({
					resolve: () => {
						throw new Error('test');
					},
				})('foo'),
			);
		});

		it('throws if there is no buffer', async () => {
			assert.throws(() =>
				createGetFontFileURL({
					resolve: () => null,
				})('foo'),
			);
		});

		it('works', async () => {
			assert.equal(
				createGetFontFileURL({
					resolve: () => 'bar',
				})('foo'),
				'bar',
			);
		});
	});

	describe('fontFileMiddleware()', () => {
		it('skips if deps are missing', async () => {
			const logger = new SpyLogger();
			let called = false;

			await fontFileMiddleware({
				fontFetcher: null,
				fontTypeExtractor: null,
				fontFileById: null,
				logger,
				next: () => {
					called = true;
				},
				response: {
					end: () => {},
					setHeader: () => {},
					setStatusCode: () => {},
				},
				url: undefined,
			});

			assert.ok(called);
			assert.deepStrictEqual(logger.logs, []);
		});

		it('skips if url is missing', async () => {
			const logger = new SpyLogger();
			let called = false;

			await fontFileMiddleware({
				fontFetcher: {
					fetch: () => {
						throw new Error('Not implemented');
					},
				},
				fontTypeExtractor: {
					extract: () => {
						throw new Error('Not implemented');
					},
				},
				fontFileById: new Map(),
				logger,
				next: () => {
					called = true;
				},
				response: {
					end: () => {},
					setHeader: () => {},
					setStatusCode: () => {},
				},
				url: undefined,
			});

			assert.ok(called);
			assert.deepStrictEqual(logger.logs, []);
		});

		it('skips if id cannot be found', async () => {
			const logger = new SpyLogger();
			let called = false;

			await fontFileMiddleware({
				fontFetcher: {
					fetch: () => {
						throw new Error('Not implemented');
					},
				},
				fontTypeExtractor: {
					extract: () => {
						throw new Error('Not implemented');
					},
				},
				fontFileById: new Map(),
				logger,
				next: () => {
					called = true;
				},
				response: {
					end: () => {},
					setHeader: () => {},
					setStatusCode: () => {},
				},
				url: '/foo.woff2',
			});

			assert.ok(called);
			assert.deepStrictEqual(logger.logs, []);
		});

		it('works', async () => {
			const logger = new SpyLogger();
			let buffer: Buffer | undefined = undefined;
			const headers: Record<string, string> = {};
			let statusCode: number | null = null;

			await fontFileMiddleware({
				fontFetcher: {
					fetch: async () => Buffer.alloc(4),
				},
				fontTypeExtractor: {
					extract: () => 'woff2',
				},
				fontFileById: new Map([
					[
						'foo.woff2',
						{
							url: 'test',
							init: undefined,
						},
					],
				]),
				logger,
				next: () => {},
				response: {
					end: (_buffer) => {
						buffer = _buffer;
					},
					setHeader: (name, value) => {
						headers[name] = value;
					},
					setStatusCode: (_statusCode) => {
						statusCode = _statusCode;
					},
				},
				url: '/foo.woff2',
			});

			assert.deepStrictEqual(logger.logs, []);
			// @ts-expect-error not sure what's going on here
			assert.equal(buffer?.byteLength, 4);
			assert.equal(statusCode, 200);
			assert.deepStrictEqual(headers, {
				'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
				Pragma: 'no-cache',
				Expires: '0',
				'Content-Length': '4',
				'Content-Type': 'font/woff2',
			});
		});

		it('works with URLs with search params', async () => {
			const logger = new SpyLogger();
			let buffer: Buffer | undefined = undefined;
			const headers: Record<string, string> = {};
			let statusCode: number | null = null;

			await fontFileMiddleware({
				fontFetcher: {
					fetch: async () => Buffer.alloc(4),
				},
				fontTypeExtractor: {
					extract: () => 'woff2',
				},
				fontFileById: new Map([
					[
						'foo.woff2',
						{
							url: 'test',
							init: undefined,
						},
					],
				]),
				logger,
				next: () => {},
				response: {
					end: (_buffer) => {
						buffer = _buffer;
					},
					setHeader: (name, value) => {
						headers[name] = value;
					},
					setStatusCode: (_statusCode) => {
						statusCode = _statusCode;
					},
				},
				url: '/foo.woff2?x=y#z',
			});

			assert.deepStrictEqual(logger.logs, []);
			// @ts-expect-error not sure what's going on here
			assert.equal(buffer?.byteLength, 4);
			assert.equal(statusCode, 200);
			assert.deepStrictEqual(headers, {
				'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
				Pragma: 'no-cache',
				Expires: '0',
				'Content-Length': '4',
				'Content-Type': 'font/woff2',
			});
		});

		it('handles errors', async () => {
			const logger = new SpyLogger();
			let buffer: Buffer | undefined = undefined;
			const headers: Record<string, string> = {};
			let statusCode: number | null = null;

			await fontFileMiddleware({
				fontFetcher: {
					fetch: () => {
						throw new Error('Not implemented');
					},
				},
				fontTypeExtractor: {
					extract: () => {
						throw new Error('Not implemented');
					},
				},
				fontFileById: new Map([
					[
						'foo.woff2',
						{
							url: 'test',
							init: undefined,
						},
					],
				]),
				logger,
				next: () => {},
				response: {
					end: (_buffer) => {
						buffer = _buffer;
					},
					setHeader: (name, value) => {
						headers[name] = value;
					},
					setStatusCode: (_statusCode) => {
						statusCode = _statusCode;
					},
				},
				url: '/foo.woff2',
			});

			assert.deepStrictEqual(logger.logs, [
				{
					label: 'assets',
					message: 'Cannot download font file',
					level: 'error',
				},
			]);
			assert.equal(buffer, undefined);
			assert.equal(statusCode, 500);
			assert.deepStrictEqual(headers, {
				'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
				Pragma: 'no-cache',
				Expires: '0',
			});
		});
	});
});
