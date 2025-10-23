// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { defineFontProvider } from 'unifont';
import { joinPaths } from '../../../../../internal-helpers/dist/path.js';
import { DEFAULTS } from '../../../../dist/assets/fonts/constants.js';
import { createMinifiableCssRenderer } from '../../../../dist/assets/fonts/implementations/css-renderer.js';
import { createDataCollector } from '../../../../dist/assets/fonts/implementations/data-collector.js';
import { createFontaceFontFileReader } from '../../../../dist/assets/fonts/implementations/font-file-reader.js';
import { createFontTypeExtractor } from '../../../../dist/assets/fonts/implementations/font-type-extractor.js';
import { createLevenshteinStringMatcher } from '../../../../dist/assets/fonts/implementations/levenshtein-string-matcher.js';
import { createRequireLocalProviderUrlResolver } from '../../../../dist/assets/fonts/implementations/local-provider-url-resolver.js';
import { createBuildRemoteFontProviderModResolver } from '../../../../dist/assets/fonts/implementations/remote-font-provider-mod-resolver.js';
import { createRemoteFontProviderResolver } from '../../../../dist/assets/fonts/implementations/remote-font-provider-resolver.js';
import { createSystemFallbacksProvider } from '../../../../dist/assets/fonts/implementations/system-fallbacks-provider.js';
import { createUrlProxy } from '../../../../dist/assets/fonts/implementations/url-proxy.js';
import { createRemoteUrlProxyContentResolver } from '../../../../dist/assets/fonts/implementations/url-proxy-content-resolver.js';
import { createBuildUrlProxyHashResolver } from '../../../../dist/assets/fonts/implementations/url-proxy-hash-resolver.js';
import { createDevUrlResolver } from '../../../../dist/assets/fonts/implementations/url-resolver.js';
import { orchestrate } from '../../../../dist/assets/fonts/orchestrate.js';
import { defineAstroFontProvider } from '../../../../dist/assets/fonts/providers/index.js';
import { createSpyLogger, defaultLogger } from '../../test-utils.js';
import {
	createSpyStorage,
	fakeFontMetricsResolver,
	fakeHasher,
	markdownBold,
	simpleErrorHandler,
} from './utils.js';

describe('fonts orchestrate()', () => {
	it('works with local fonts', async () => {
		const root = new URL(import.meta.url);
		const { storage } = createSpyStorage();
		const errorHandler = simpleErrorHandler;
		const fontTypeExtractor = createFontTypeExtractor({ errorHandler });
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
				errorHandler,
				modResolver: createBuildRemoteFontProviderModResolver(),
			}),
			localProviderUrlResolver: createRequireLocalProviderUrlResolver({ root }),
			storage,
			cssRenderer: createMinifiableCssRenderer({ minify: true }),
			systemFallbacksProvider: createSystemFallbacksProvider(),
			fontMetricsResolver: fakeFontMetricsResolver,
			fontTypeExtractor,
			fontFileReader: createFontaceFontFileReader({ errorHandler }),
			logger: defaultLogger,
			createUrlProxy: ({ local, cssVariable, ...params }) => {
				const dataCollector = createDataCollector(params);
				const contentResolver = createRemoteUrlProxyContentResolver();
				return createUrlProxy({
					urlResolver: createDevUrlResolver({ base: 'test' }),
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
		const errorHandler = simpleErrorHandler;
		const fontTypeExtractor = createFontTypeExtractor({ errorHandler });
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
				errorHandler,
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
			fontFileReader: createFontaceFontFileReader({ errorHandler }),
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
		const errorHandler = simpleErrorHandler;
		const fontTypeExtractor = createFontTypeExtractor({ errorHandler });
		const hasher = fakeHasher;
		const { logs, logger } = createSpyLogger();

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
				errorHandler,
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
			fontFileReader: createFontaceFontFileReader({ errorHandler }),
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

		assert.deepStrictEqual(logs, [
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
		const errorHandler = simpleErrorHandler;
		const fontTypeExtractor = createFontTypeExtractor({ errorHandler });
		const hasher = fakeHasher;
		const { logs, logger } = createSpyLogger();

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
				errorHandler,
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
			fontFileReader: createFontaceFontFileReader({ errorHandler }),
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

		assert.deepStrictEqual(logs, [
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
});
