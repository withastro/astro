// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { defineFontProvider } from 'unifont';
import { DEFAULTS } from '../../../../dist/assets/fonts/constants.js';
import { createMinifiableCssRenderer } from '../../../../dist/assets/fonts/implementations/css-renderer.js';
import { createDataCollector } from '../../../../dist/assets/fonts/implementations/data-collector.js';
import { createFontTypeExtractor } from '../../../../dist/assets/fonts/implementations/font-type-extractor.js';
import { createRequireLocalProviderUrlResolver } from '../../../../dist/assets/fonts/implementations/local-provider-url-resolver.js';
import { createBuildRemoteFontProviderModResolver } from '../../../../dist/assets/fonts/implementations/remote-font-provider-mod-resolver.js';
import { createRemoteFontProviderResolver } from '../../../../dist/assets/fonts/implementations/remote-font-provider-resolver.js';
import { createSystemFallbacksProvider } from '../../../../dist/assets/fonts/implementations/system-fallbacks-provider.js';
import { createRemoteUrlProxyContentResolver } from '../../../../dist/assets/fonts/implementations/url-proxy-content-resolver.js';
import { createUrlProxy } from '../../../../dist/assets/fonts/implementations/url-proxy.js';
import { orchestrate } from '../../../../dist/assets/fonts/orchestrate.js';
import { defineAstroFontProvider } from '../../../../dist/assets/fonts/providers/index.js';
import {
	createSpyStorage,
	fakeFontMetricsResolver,
	fakeHasher,
	simpleErrorHandler,
} from './utils.js';

describe('fonts orchestrate()', () => {
	it('works with local fonts', async () => {
		const root = new URL(import.meta.url);
		const { storage } = createSpyStorage();
		const errorHandler = simpleErrorHandler;
		const fontTypeExtractor = createFontTypeExtractor({ errorHandler });
		const hasher = fakeHasher;
		const { hashToUrlMap, resolvedMap } = await orchestrate({
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
			createUrlProxy: ({ local, ...params }) => {
				const dataCollector = createDataCollector(params);
				const contentResolver = createRemoteUrlProxyContentResolver();
				return createUrlProxy({
					base: '/test',
					contentResolver,
					hasher,
					dataCollector,
					fontTypeExtractor,
				});
			},
			defaults: DEFAULTS,
		});
		assert.deepStrictEqual(
			[...hashToUrlMap.entries()],
			[
				[
					fileURLToPath(new URL('my-font.woff2.woff2', root)),
					fileURLToPath(new URL('my-font.woff2', root)),
				],
				[
					fileURLToPath(new URL('my-font.woff.woff', root)),
					fileURLToPath(new URL('my-font.woff', root)),
				],
			],
		);
		assert.deepStrictEqual([...resolvedMap.keys()], ['--test']);
		const entry = resolvedMap.get('--test');
		assert.deepStrictEqual(entry?.preloadData, [
			{
				url: '/test' + fileURLToPath(new URL('my-font.woff2.woff2', root)),
				type: 'woff2',
			},
		]);
		// Uses the hash
		assert.equal(entry?.css.includes('font-family:Test-'), true);
		// CSS var
		assert.equal(entry?.css.includes(':root{--test:Test-'), true);
		// Fallback
		assert.equal(entry?.css.includes('fallback: Arial"'), true);
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
		const { hashToUrlMap, resolvedMap } = await orchestrate({
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
			createUrlProxy: ({ local, ...params }) => {
				const dataCollector = createDataCollector(params);
				const contentResolver = createRemoteUrlProxyContentResolver();
				return createUrlProxy({
					base: '',
					contentResolver,
					hasher,
					dataCollector,
					fontTypeExtractor,
				});
			},
			defaults: DEFAULTS,
		});

		assert.deepStrictEqual(
			[...hashToUrlMap.entries()],
			[
				['https://example.com/foo.woff2.woff2', 'https://example.com/foo.woff2'],
				['https://example.com/foo.woff.woff', 'https://example.com/foo.woff'],
			],
		);
		assert.deepStrictEqual([...resolvedMap.keys()], ['--test']);
		const entry = resolvedMap.get('--test');
		assert.deepStrictEqual(entry?.preloadData, [
			{ url: 'https://example.com/foo.woff2.woff2', type: 'woff2' },
		]);
		// Uses the hash
		assert.equal(entry?.css.includes('font-family:Test-'), true);
		// CSS var
		assert.equal(entry?.css.includes(':root{--test:Test-'), true);
		// Fallback
		assert.equal(entry?.css.includes('fallback: Times New Roman"'), true);
	});
});
