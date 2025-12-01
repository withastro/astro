// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { defineFontProvider } from 'unifont';
import { joinPaths } from '../../../../../internal-helpers/dist/path.js';
import { DEFAULTS } from '../../../../dist/assets/fonts/constants.js';
import { createBuildRemoteFontProviderModResolver } from '../../../../dist/assets/fonts/infra/build-remote-font-provider-mod-resolver.js';
import { createBuildUrlProxyHashResolver } from '../../../../dist/assets/fonts/infra/build-url-proxy-hash-resolver.js';
import { createDataCollector } from '../../../../dist/assets/fonts/infra/data-collector.js';
import { createDevUrlResolver } from '../../../../dist/assets/fonts/infra/dev-url-resolver.js';
import { createFontTypeExtractor } from '../../../../dist/assets/fonts/infra/font-type-extractor.js';
import { createFontaceFontFileReader } from '../../../../dist/assets/fonts/infra/fontace-font-file-reader.js';
import { createLevenshteinStringMatcher } from '../../../../dist/assets/fonts/infra/levenshtein-string-matcher.js';
import { createMinifiableCssRenderer } from '../../../../dist/assets/fonts/infra/minifiable-css-renderer.js';
import { createRemoteFontProviderResolver } from '../../../../dist/assets/fonts/infra/remote-font-provider-resolver.js';
import { createRequireLocalProviderUrlResolver } from '../../../../dist/assets/fonts/infra/require-local-provider-url-resolver.js';
import { createSystemFallbacksProvider } from '../../../../dist/assets/fonts/infra/system-fallbacks-provider.js';
import { createUrlProxy } from '../../../../dist/assets/fonts/infra/url-proxy.js';
import { createRemoteUrlProxyContentResolver } from '../../../../dist/assets/fonts/infra/url-proxy-content-resolver.js';
import { orchestrate } from '../../../../dist/assets/fonts/orchestrate.js';
import { defineAstroFontProvider } from '../../../../dist/assets/fonts/providers/index.js';
import { defaultLogger, SpyLogger } from '../../test-utils.js';
import { createSpyStorage, fakeFontMetricsResolver, fakeHasher, markdownBold } from './utils.js';

describe('fonts orchestrate()', () => {
	it('works with local fonts', async () => {
		const root = new URL(import.meta.url);
		const { storage } = createSpyStorage();
		const fontTypeExtractor = createFontTypeExtractor();
		const hasher = fakeHasher;
		const { fontFileDataMap, internalConsumableMap, consumableMap } = await orchestrate({
			families: [
				{
					name: 'Test',
					cssVariable: '--test',
					provider: 'local',
					variants: [
						{
							weight: '400',
							style: 'normal',
							src: ['./my-font.woff2', './my-font.woff'],
						},
					],
				},
			],
			hasher,
			remoteFontProviderResolver: createRemoteFontProviderResolver({
				root,
				modResolver: createBuildRemoteFontProviderModResolver(),
			}),
			localProviderUrlResolver: createRequireLocalProviderUrlResolver({ root }),
			storage,
			cssRenderer: createMinifiableCssRenderer({ minify: true }),
			systemFallbacksProvider: createSystemFallbacksProvider(),
			fontMetricsResolver: fakeFontMetricsResolver,
			fontTypeExtractor,
			fontFileReader: createFontaceFontFileReader(),
			logger: defaultLogger,
			createUrlProxy: ({ local, cssVariable, ...params }) => {
				const dataCollector = createDataCollector(params);
				const contentResolver = createRemoteUrlProxyContentResolver();
				return createUrlProxy({
					urlResolver: createDevUrlResolver({ base: 'test', searchParams: new URLSearchParams() }),
					cssVariable,
					hashResolver: createBuildUrlProxyHashResolver({ contentResolver, hasher }),
					dataCollector,
				});
			},
			defaults: DEFAULTS,
			bold: markdownBold,
			stringMatcher: createLevenshteinStringMatcher(),
		});
		assert.deepStrictEqual(
			[...fontFileDataMap.entries()],
			[
				[
					fileURLToPath(new URL('my-font.woff2.woff2', root)),
					{ url: fileURLToPath(new URL('my-font.woff2', root)), init: null },
				],
				[
					fileURLToPath(new URL('my-font.woff.woff', root)),
					{ url: fileURLToPath(new URL('my-font.woff', root)), init: null },
				],
			],
		);
		assert.deepStrictEqual([...internalConsumableMap.keys()], ['--test']);
		const entry = internalConsumableMap.get('--test');
		assert.deepStrictEqual(entry?.preloadData, [
			{
				url: joinPaths('/test', fileURLToPath(new URL('my-font.woff2.woff2', root))),
				type: 'woff2',
				weight: '400',
				style: 'normal',
				subset: undefined,
			},
		]);
		// Uses the hash
		assert.equal(entry?.css.includes('font-family:Test-'), true);
		// CSS var
		assert.equal(entry?.css.includes(':root{--test:Test-'), true);
		// Fallback
		assert.equal(entry?.css.includes('fallback: Arial"'), true);

		assert.deepStrictEqual(
			[...consumableMap.entries()],
			[
				[
					'--test',
					[
						{
							weight: '400',
							style: 'normal',
							src: [
								{
									url: joinPaths('/test', fileURLToPath(new URL('my-font.woff2.woff2', root))),
									format: 'woff2',
									tech: undefined,
								},
								{
									url: joinPaths('/test', fileURLToPath(new URL('my-font.woff.woff', root))),
									format: 'woff',
									tech: undefined,
								},
							],
						},
					],
				],
			],
		);
	});

	it('works with a remote provider', async () => {
		const fakeUnifontProvider = defineFontProvider('test', () => {
			return {
				resolveFont: () => {
					return {
						fonts: [
							{
								src: [
									{ url: 'https://example.com/foo.woff2' },
									{ url: 'https://example.com/foo.woff' },
								],
								weight: '400',
								style: 'normal',
								meta: {
									init: {
										method: 'POST',
									},
								},
							},
						],
					};
				},
			};
		});
		const fakeAstroProvider = defineAstroFontProvider({
			entrypoint: 'test',
		});

		const root = new URL(import.meta.url);
		const { storage } = createSpyStorage();
		const fontTypeExtractor = createFontTypeExtractor();
		const hasher = fakeHasher;
		const { fontFileDataMap, internalConsumableMap, consumableMap } = await orchestrate({
			families: [
				{
					name: 'Test',
					cssVariable: '--test',
					provider: fakeAstroProvider,
					fallbacks: ['serif'],
				},
			],
			hasher,
			remoteFontProviderResolver: createRemoteFontProviderResolver({
				root,
				modResolver: {
					resolve: async () => ({
						provider: fakeUnifontProvider,
					}),
				},
			}),
			localProviderUrlResolver: createRequireLocalProviderUrlResolver({ root }),
			storage,
			cssRenderer: createMinifiableCssRenderer({ minify: true }),
			systemFallbacksProvider: createSystemFallbacksProvider(),
			fontMetricsResolver: fakeFontMetricsResolver,
			fontTypeExtractor,
			fontFileReader: createFontaceFontFileReader(),
			logger: defaultLogger,
			createUrlProxy: ({ local, cssVariable, ...params }) => {
				const dataCollector = createDataCollector(params);
				const contentResolver = createRemoteUrlProxyContentResolver();
				return createUrlProxy({
					urlResolver: {
						resolve: (hash) => hash,
						getCspResources: () => [],
					},
					cssVariable,
					hashResolver: createBuildUrlProxyHashResolver({ contentResolver, hasher }),
					dataCollector,
				});
			},
			defaults: DEFAULTS,
			bold: markdownBold,
			stringMatcher: createLevenshteinStringMatcher(),
		});

		assert.deepStrictEqual(
			[...fontFileDataMap.entries()],
			[
				[
					'https://example.com/foo.woff2.woff2',
					{ url: 'https://example.com/foo.woff2', init: { method: 'POST' } },
				],
				[
					'https://example.com/foo.woff.woff',
					{ url: 'https://example.com/foo.woff', init: { method: 'POST' } },
				],
			],
		);
		assert.deepStrictEqual([...internalConsumableMap.keys()], ['--test']);
		const entry = internalConsumableMap.get('--test');
		assert.deepStrictEqual(entry?.preloadData, [
			{
				url: 'https://example.com/foo.woff2.woff2',
				type: 'woff2',
				weight: '400',
				style: 'normal',
				subset: undefined,
			},
		]);
		// Uses the hash
		assert.equal(entry?.css.includes('font-family:Test-'), true);
		// CSS var
		assert.equal(entry?.css.includes(':root{--test:Test-'), true);
		// Fallback
		assert.equal(entry?.css.includes('fallback: Times New Roman"'), true);

		assert.deepStrictEqual(
			[...consumableMap.entries()],
			[
				[
					'--test',
					[
						{
							weight: '400',
							style: 'normal',
							src: [
								{
									url: 'https://example.com/foo.woff2.woff2',
									format: undefined,
									tech: undefined,
								},
								{
									url: 'https://example.com/foo.woff.woff',
									format: undefined,
									tech: undefined,
								},
							],
						},
					],
				],
			],
		);
	});

	it('warns if remote provider does not return any font data', async () => {
		const fakeUnifontProvider = defineFontProvider('test', () => {
			return {
				resolveFont: () => {
					return undefined;
				},
			};
		});
		const fakeAstroProvider = defineAstroFontProvider({
			entrypoint: 'test',
		});

		const root = new URL(import.meta.url);
		const { storage } = createSpyStorage();
		const fontTypeExtractor = createFontTypeExtractor();
		const hasher = fakeHasher;
		const logger = new SpyLogger();

		await orchestrate({
			families: [
				{
					name: 'Test',
					cssVariable: '--test',
					provider: fakeAstroProvider,
					fallbacks: ['serif'],
				},
			],
			hasher,
			remoteFontProviderResolver: createRemoteFontProviderResolver({
				root,
				modResolver: {
					resolve: async () => ({
						provider: fakeUnifontProvider,
					}),
				},
			}),
			localProviderUrlResolver: createRequireLocalProviderUrlResolver({ root }),
			storage,
			cssRenderer: createMinifiableCssRenderer({ minify: true }),
			systemFallbacksProvider: createSystemFallbacksProvider(),
			fontMetricsResolver: fakeFontMetricsResolver,
			fontTypeExtractor,
			fontFileReader: createFontaceFontFileReader(),
			logger,
			createUrlProxy: ({ local, cssVariable, ...params }) => {
				const dataCollector = createDataCollector(params);
				const contentResolver = createRemoteUrlProxyContentResolver();
				return createUrlProxy({
					urlResolver: {
						resolve: (hash) => hash,
						getCspResources: () => [],
					},
					cssVariable,
					hashResolver: createBuildUrlProxyHashResolver({ contentResolver, hasher }),
					dataCollector,
				});
			},
			defaults: DEFAULTS,
			bold: markdownBold,
			stringMatcher: createLevenshteinStringMatcher(),
		});

		assert.deepStrictEqual(logger.logs, [
			{
				type: 'warn',
				label: 'assets',
				message: 'No data found for font family **Test**. Review your configuration',
			},
		]);
	});

	it('warns if remote provider does not support given font family name', async () => {
		const fakeUnifontProvider = defineFontProvider('test', () => {
			return {
				resolveFont: () => {
					return undefined;
				},
				listFonts: async () => ['Testi', 'XYZ'],
			};
		});
		const fakeAstroProvider = defineAstroFontProvider({
			entrypoint: 'test',
		});

		const root = new URL(import.meta.url);
		const { storage } = createSpyStorage();
		const fontTypeExtractor = createFontTypeExtractor();
		const hasher = fakeHasher;
		const logger = new SpyLogger();

		await orchestrate({
			families: [
				{
					name: 'Test',
					cssVariable: '--test',
					provider: fakeAstroProvider,
					fallbacks: ['serif'],
				},
			],
			hasher,
			remoteFontProviderResolver: createRemoteFontProviderResolver({
				root,
				modResolver: {
					resolve: async () => ({
						provider: fakeUnifontProvider,
					}),
				},
			}),
			localProviderUrlResolver: createRequireLocalProviderUrlResolver({ root }),
			storage,
			cssRenderer: createMinifiableCssRenderer({ minify: true }),
			systemFallbacksProvider: createSystemFallbacksProvider(),
			fontMetricsResolver: fakeFontMetricsResolver,
			fontTypeExtractor,
			fontFileReader: createFontaceFontFileReader(),
			logger,
			createUrlProxy: ({ local, cssVariable, ...params }) => {
				const dataCollector = createDataCollector(params);
				const contentResolver = createRemoteUrlProxyContentResolver();
				return createUrlProxy({
					urlResolver: {
						resolve: (hash) => hash,
						getCspResources: () => [],
					},
					cssVariable,
					hashResolver: createBuildUrlProxyHashResolver({ contentResolver, hasher }),
					dataCollector,
				});
			},
			defaults: DEFAULTS,
			bold: markdownBold,
			stringMatcher: createLevenshteinStringMatcher(),
		});

		assert.deepStrictEqual(logger.logs, [
			{
				type: 'warn',
				label: 'assets',
				message: 'No data found for font family **Test**. Review your configuration',
			},
			{
				type: 'warn',
				label: 'assets',
				message:
					'**Test** font family cannot be retrieved by the provider. Did you mean **Testi**?',
			},
		]);
	});

	it('warns if conflicting unmergeable families exist', async () => {
		const fakeUnifontProvider = defineFontProvider('test', () => {
			return {
				resolveFont: () => {
					return {
						fonts: [
							{
								src: [
									{ url: 'https://example.com/foo.woff2' },
									{ url: 'https://example.com/foo.woff' },
								],
							},
						],
					};
				},
			};
		});
		const fakeAstroProvider = defineAstroFontProvider({
			entrypoint: 'test',
		});

		const root = new URL(import.meta.url);
		const { storage } = createSpyStorage();
		const fontTypeExtractor = createFontTypeExtractor();
		const hasher = fakeHasher;
		const logger = new SpyLogger();

		await orchestrate({
			families: [
				{
					name: 'Test',
					cssVariable: '--test',
					provider: fakeAstroProvider,
					fallbacks: ['serif'],
				},
				{
					name: 'Foo',
					cssVariable: '--test',
					provider: fakeAstroProvider,
					fallbacks: ['serif'],
				},
			],
			hasher,
			remoteFontProviderResolver: createRemoteFontProviderResolver({
				root,
				modResolver: {
					resolve: async () => ({
						provider: fakeUnifontProvider,
					}),
				},
			}),
			localProviderUrlResolver: createRequireLocalProviderUrlResolver({ root }),
			storage,
			cssRenderer: createMinifiableCssRenderer({ minify: true }),
			systemFallbacksProvider: createSystemFallbacksProvider(),
			fontMetricsResolver: fakeFontMetricsResolver,
			fontTypeExtractor,
			fontFileReader: createFontaceFontFileReader(),
			logger,
			createUrlProxy: ({ local, cssVariable, ...params }) => {
				const dataCollector = createDataCollector(params);
				const contentResolver = createRemoteUrlProxyContentResolver();
				return createUrlProxy({
					urlResolver: {
						resolve: (hash) => hash,
						getCspResources: () => [],
					},
					cssVariable,
					hashResolver: createBuildUrlProxyHashResolver({ contentResolver, hasher }),
					dataCollector,
				});
			},
			defaults: DEFAULTS,
			bold: markdownBold,
			stringMatcher: createLevenshteinStringMatcher(),
		});

		assert.deepStrictEqual(logger.logs, [
			{
				label: 'assets',
				message:
					'Several font families have been registered for the **--test** cssVariable but they do not share the same name and provider.',
				type: 'warn',
			},
			{
				label: 'assets',
				message:
					'These families will not be merged together. The last occurrence will override previous families for this cssVariable. Review your Astro configuration.',
				type: 'warn',
			},
		]);
	});

	it('does not if mergeable families exist', async () => {
		const fakeUnifontProvider = defineFontProvider('test', () => {
			return {
				resolveFont: () => {
					return {
						fonts: [
							{
								src: [
									{ url: 'https://example.com/foo.woff2' },
									{ url: 'https://example.com/foo.woff' },
								],
							},
						],
					};
				},
			};
		});
		const fakeAstroProvider = defineAstroFontProvider({
			entrypoint: 'test',
		});

		const root = new URL(import.meta.url);
		const { storage } = createSpyStorage();
		const fontTypeExtractor = createFontTypeExtractor();
		const hasher = fakeHasher;
		const logger = new SpyLogger();

		await orchestrate({
			families: [
				{
					name: 'Test',
					cssVariable: '--test',
					provider: fakeAstroProvider,
					fallbacks: ['serif'],
				},
				{
					name: 'Test',
					cssVariable: '--test',
					provider: fakeAstroProvider,
					fallbacks: ['serif'],
				},
			],
			hasher,
			remoteFontProviderResolver: createRemoteFontProviderResolver({
				root,
				modResolver: {
					resolve: async () => ({
						provider: fakeUnifontProvider,
					}),
				},
			}),
			localProviderUrlResolver: createRequireLocalProviderUrlResolver({ root }),
			storage,
			cssRenderer: createMinifiableCssRenderer({ minify: true }),
			systemFallbacksProvider: createSystemFallbacksProvider(),
			fontMetricsResolver: fakeFontMetricsResolver,
			fontTypeExtractor,
			fontFileReader: createFontaceFontFileReader(),
			logger,
			createUrlProxy: ({ local, cssVariable, ...params }) => {
				const dataCollector = createDataCollector(params);
				const contentResolver = createRemoteUrlProxyContentResolver();
				return createUrlProxy({
					urlResolver: {
						resolve: (hash) => hash,
						getCspResources: () => [],
					},
					cssVariable,
					hashResolver: createBuildUrlProxyHashResolver({ contentResolver, hasher }),
					dataCollector,
				});
			},
			defaults: DEFAULTS,
			bold: markdownBold,
			stringMatcher: createLevenshteinStringMatcher(),
		});

		assert.deepStrictEqual(logger.logs, []);
	});
});
