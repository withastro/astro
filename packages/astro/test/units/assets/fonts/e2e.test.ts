// @ts-check
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readFile, rm } from 'node:fs/promises';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import colors from 'piccolore';
import { DEFAULTS } from '../../../../dist/assets/fonts/constants.js';
import { collectComponentData } from '../../../../dist/assets/fonts/core/collect-component-data.js';
import { collectFontAssetsFromFaces } from '../../../../dist/assets/fonts/core/collect-font-assets-from-faces.js';
import { collectFontData } from '../../../../dist/assets/fonts/core/collect-font-data.js';
import { computeFontFamiliesAssets } from '../../../../dist/assets/fonts/core/compute-font-families-assets.js';
import { filterAndTransformFontFaces } from '../../../../dist/assets/fonts/core/filter-and-transform-font-faces.js';
import { getOrCreateFontFamilyAssets } from '../../../../dist/assets/fonts/core/get-or-create-font-family-assets.js';
import { optimizeFallbacks } from '../../../../dist/assets/fonts/core/optimize-fallbacks.js';
import { resolveFamily } from '../../../../dist/assets/fonts/core/resolve-family.js';
import { CachedFontFetcher } from '../../../../dist/assets/fonts/infra/cached-font-fetcher.js';
import { CapsizeFontMetricsResolver } from '../../../../dist/assets/fonts/infra/capsize-font-metrics-resolver.js';
import { DevFontFileIdGenerator } from '../../../../dist/assets/fonts/infra/dev-font-file-id-generator.js';
import { DevUrlResolver } from '../../../../dist/assets/fonts/infra/dev-url-resolver.js';
import { FsFontFileContentResolver } from '../../../../dist/assets/fonts/infra/fs-font-file-content-resolver.js';
import { LevenshteinStringMatcher } from '../../../../dist/assets/fonts/infra/levenshtein-string-matcher.js';
import { MinifiableCssRenderer } from '../../../../dist/assets/fonts/infra/minifiable-css-renderer.js';
import { NodeFontTypeExtractor } from '../../../../dist/assets/fonts/infra/node-font-type-extractor.js';
import { RealSystemFallbacksProvider } from '../../../../dist/assets/fonts/infra/system-fallbacks-provider.js';
import { UnifontFontResolver } from '../../../../dist/assets/fonts/infra/unifont-font-resolver.js';
import { UnstorageFsStorage } from '../../../../dist/assets/fonts/infra/unstorage-fs-storage.js';
import { XxhashHasher } from '../../../../dist/assets/fonts/infra/xxhash-hasher.js';
import { fontProviders } from '../../../../dist/assets/fonts/providers/index.js';
import { Logger } from '../../../../dist/core/logger/core.js';
import { nodeLogDestination } from '../../../../dist/core/logger/node.js';

/**
 * @param {{ fonts: Array<import('../../../../dist/assets/fonts/types.js').FontFamily> }} param0
 */
async function run({ fonts: _fonts }) {
	const hasher = await XxhashHasher.create();
	const resolvedFamilies = _fonts.map((family) => resolveFamily({ family, hasher }));
	const defaults = DEFAULTS;
	const { bold } = colors;
	const logger = new Logger({
		level: 'silent',
		dest: nodeLogDestination,
	});
	const stringMatcher = new LevenshteinStringMatcher();
	const base = new URL('./data/cache/', import.meta.url);
	// Clear cache
	await rm(base, { recursive: true, force: true });
	const storage = new UnstorageFsStorage({ base });
	const root = new URL('./data/fonts/', import.meta.url);
	const contentResolver = new FsFontFileContentResolver({
		readFileSync: (path) => readFileSync(path, 'utf-8'),
	});
	const fontFileIdGenerator = new DevFontFileIdGenerator({ contentResolver, hasher });
	const fontTypeExtractor = new NodeFontTypeExtractor();
	const urlResolver = new DevUrlResolver({ base: '/', searchParams: new URLSearchParams() });
	const cssRenderer = new MinifiableCssRenderer({ minify: true });
	const fontFetcher = new CachedFontFetcher({ fetch, readFile, storage });
	const fontMetricsResolver = new CapsizeFontMetricsResolver({
		cssRenderer,
		fontFetcher,
	});
	const systemFallbacksProvider = new RealSystemFallbacksProvider();

	const { fontFamilyAssets, fontFileById } = await computeFontFamiliesAssets({
		resolvedFamilies,
		defaults,
		bold,
		logger,
		stringMatcher,
		fontResolver: await UnifontFontResolver.create({
			families: resolvedFamilies,
			hasher,
			storage,
			root,
		}),
		getOrCreateFontFamilyAssets: ({ family, fontFamilyAssetsByUniqueKey }) =>
			getOrCreateFontFamilyAssets({
				family,
				fontFamilyAssetsByUniqueKey,
				bold,
				logger,
			}),
		filterAndTransformFontFaces: ({ family, fonts }) =>
			filterAndTransformFontFaces({
				family,
				fonts,
				fontFileIdGenerator,
				fontTypeExtractor,
				urlResolver,
			}),
		collectFontAssetsFromFaces: ({ collectedFontsIds, family, fontFilesIds, fonts }) =>
			collectFontAssetsFromFaces({
				collectedFontsIds,
				family,
				fontFilesIds,
				fonts,
				fontFileIdGenerator,
				hasher,
				defaults,
			}),
	});
	const fontDataByCssVariable = collectFontData(fontFamilyAssets);
	const componentDataByCssVariable = await collectComponentData({
		cssRenderer,
		defaults,
		fontFamilyAssets,
		optimizeFallbacks: ({ collectedFonts, fallbacks, family }) =>
			optimizeFallbacks({
				collectedFonts,
				fallbacks,
				family,
				fontMetricsResolver,
				systemFallbacksProvider,
			}),
	});

	return { fontFileById, fontDataByCssVariable, componentDataByCssVariable };
}

describe('Fonts E2E', () => {
	it('works', async () => {
		const result = await run({
			fonts: [
				{
					name: 'Roboto',
					cssVariable: '--font-roboto',
					provider: fontProviders.fontsource(),
				},
				{
					name: 'Test',
					cssVariable: '--font-test',
					provider: fontProviders.local(),
					options: /** @type {any} */ (
						/** @type {import('../../../../dist/assets/fonts/providers/local.js').LocalFamilyOptions} */ ({
							variants: [{ src: ['./test.woff2'], weight: '400', style: 'normal' }],
						})
					),
				},
			],
		});
		const localOriginalUrl = fileURLToPath(new URL('./data/fonts/test.woff2', import.meta.url));
		const localUrl =
			Array.from(result.fontFileById.keys()).find((e) => e.startsWith('font-test-400-normal-')) ??
			'';
		assert.deepStrictEqual(result, {
			fontFileById: new Map([
				[
					'font-roboto-400-italic-latin-e473890ddd4ee723.woff2',
					{
						init: undefined,
						url: 'https://cdn.jsdelivr.net/fontsource/fonts/roboto@latest/latin-400-italic.woff2',
					},
				],
				[
					'font-roboto-400-normal-latin-4be39bb0bc16cc61.woff2',
					{
						init: undefined,
						url: 'https://cdn.jsdelivr.net/fontsource/fonts/roboto@latest/latin-400-normal.woff2',
					},
				],
				[
					localUrl,
					{
						init: undefined,
						url: localOriginalUrl,
					},
				],
			]),
			fontDataByCssVariable: {
				'--font-roboto': [
					{
						src: [
							{
								format: 'woff2',
								tech: undefined,
								url: '/font-roboto-400-normal-latin-4be39bb0bc16cc61.woff2',
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
								url: '/font-roboto-400-italic-latin-e473890ddd4ee723.woff2',
							},
						],
						style: 'italic',
						weight: '400',
					},
				],
				'--font-test': [
					{
						src: [
							{
								format: 'woff2',
								tech: undefined,
								url: `/${localUrl}`,
							},
						],
						style: 'normal',
						weight: '400',
					},
				],
			},
			componentDataByCssVariable: new Map([
				[
					'--font-roboto',
					{
						css: '@font-face{font-family:Roboto-3dec13cc6120e65b;src:url("/font-roboto-400-normal-latin-4be39bb0bc16cc61.woff2") format("woff2");font-display:swap;unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD;font-weight:400;font-style:normal;}@font-face{font-family:Roboto-3dec13cc6120e65b;src:url("/font-roboto-400-italic-latin-e473890ddd4ee723.woff2") format("woff2");font-display:swap;unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD;font-weight:400;font-style:italic;}@font-face{font-family:"Roboto-3dec13cc6120e65b fallback: Arial";src:local("Arial");font-display:swap;font-weight:400;font-style:normal;size-adjust:99.7809%;ascent-override:92.9771%;descent-override:24.4677%;line-gap-override:0%;}@font-face{font-family:"Roboto-3dec13cc6120e65b fallback: Arial";src:local("Arial");font-display:swap;font-weight:400;font-style:italic;size-adjust:99.7809%;ascent-override:92.9771%;descent-override:24.4677%;line-gap-override:0%;}:root{--font-roboto:Roboto-3dec13cc6120e65b,"Roboto-3dec13cc6120e65b fallback: Arial",sans-serif;}',
						preloads: [
							{
								style: 'normal',
								subset: 'latin',
								type: 'woff2',
								url: '/font-roboto-400-normal-latin-4be39bb0bc16cc61.woff2',
								weight: '400',
							},
							{
								style: 'italic',
								subset: 'latin',
								type: 'woff2',
								url: '/font-roboto-400-italic-latin-e473890ddd4ee723.woff2',
								weight: '400',
							},
						],
					},
				],
				[
					'--font-test',
					{
						css: `@font-face{font-family:Test-83734b6f7f25f14b;src:url("/${localUrl}") format("woff2");font-display:swap;font-weight:400;font-style:normal;}@font-face{font-family:"Test-83734b6f7f25f14b fallback: Arial";src:local("Arial");font-display:swap;font-weight:400;font-style:normal;size-adjust:99.7809%;ascent-override:92.9771%;descent-override:24.4677%;line-gap-override:0%;}:root{--font-test:Test-83734b6f7f25f14b,"Test-83734b6f7f25f14b fallback: Arial",sans-serif;}`,
						preloads: [
							{
								style: 'normal',
								subset: undefined,
								type: 'woff2',
								url: `/${localUrl}`,
								weight: '400',
							},
						],
					},
				],
			]),
		});
	});

	it('merges families when possible', async () => {
		const result = await run({
			fonts: [
				{
					name: 'Roboto',
					cssVariable: '--font-roboto',
					provider: fontProviders.fontsource(),
					weights: [500],
					styles: ['normal'],
				},
				{
					name: 'Roboto',
					cssVariable: '--font-roboto',
					provider: fontProviders.fontsource(),
					weights: [700],
					styles: ['italic'],
				},
				{
					name: 'Test',
					cssVariable: '--font-test',
					provider: fontProviders.local(),
					options: /** @type {any} */ (
						/** @type {import('../../../../dist/assets/fonts/providers/local.js').LocalFamilyOptions} */ ({
							variants: [{ src: ['./test.woff2'], weight: '400', style: 'normal' }],
						})
					),
				},
			],
		});
		const localOriginalUrl = fileURLToPath(new URL('./data/fonts/test.woff2', import.meta.url));
		const localUrl =
			Array.from(result.fontFileById.keys()).find((e) => e.startsWith('font-test-400-normal-')) ??
			'';
		assert.deepStrictEqual(result, {
			fontFileById: new Map([
				[
					'font-roboto-500-normal-latin-0f94d1c6c8982360.woff2',
					{
						init: undefined,
						url: 'https://cdn.jsdelivr.net/fontsource/fonts/roboto@latest/latin-500-normal.woff2',
					},
				],
				[
					'font-roboto-700-italic-latin-f291476ed7fdb908.woff2',
					{
						init: undefined,
						url: 'https://cdn.jsdelivr.net/fontsource/fonts/roboto@latest/latin-700-italic.woff2',
					},
				],
				[
					localUrl,
					{
						init: undefined,
						url: localOriginalUrl,
					},
				],
			]),
			fontDataByCssVariable: {
				'--font-roboto': [
					{
						src: [
							{
								format: 'woff2',
								tech: undefined,
								url: '/font-roboto-500-normal-latin-0f94d1c6c8982360.woff2',
							},
						],
						style: 'normal',
						weight: '500',
					},
					{
						src: [
							{
								format: 'woff2',
								tech: undefined,
								url: '/font-roboto-700-italic-latin-f291476ed7fdb908.woff2',
							},
						],
						style: 'italic',
						weight: '700',
					},
				],
				'--font-test': [
					{
						src: [
							{
								format: 'woff2',
								tech: undefined,
								url: `/${localUrl}`,
							},
						],
						style: 'normal',
						weight: '400',
					},
				],
			},
			componentDataByCssVariable: new Map([
				[
					'--font-roboto',
					{
						css: '@font-face{font-family:Roboto-b114abed7fe44c2b;src:url("/font-roboto-500-normal-latin-0f94d1c6c8982360.woff2") format("woff2");font-display:swap;unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD;font-weight:500;font-style:normal;}@font-face{font-family:Roboto-b114abed7fe44c2b;src:url("/font-roboto-700-italic-latin-f291476ed7fdb908.woff2") format("woff2");font-display:swap;unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD;font-weight:700;font-style:italic;}@font-face{font-family:"Roboto-b114abed7fe44c2b fallback: Arial";src:local("Arial");font-display:swap;font-weight:500;font-style:normal;size-adjust:100.6572%;ascent-override:92.1677%;descent-override:24.2547%;line-gap-override:0%;}@font-face{font-family:"Roboto-b114abed7fe44c2b fallback: Arial";src:local("Arial");font-display:swap;font-weight:700;font-style:italic;size-adjust:100.6572%;ascent-override:92.1677%;descent-override:24.2547%;line-gap-override:0%;}:root{--font-roboto:Roboto-b114abed7fe44c2b,"Roboto-b114abed7fe44c2b fallback: Arial",sans-serif;}',
						preloads: [
							{
								style: 'normal',
								subset: 'latin',
								type: 'woff2',
								url: '/font-roboto-500-normal-latin-0f94d1c6c8982360.woff2',
								weight: '500',
							},
							{
								style: 'italic',
								subset: 'latin',
								type: 'woff2',
								url: '/font-roboto-700-italic-latin-f291476ed7fdb908.woff2',
								weight: '700',
							},
						],
					},
				],
				[
					'--font-test',
					{
						css: `@font-face{font-family:Test-83734b6f7f25f14b;src:url("/${localUrl}") format("woff2");font-display:swap;font-weight:400;font-style:normal;}@font-face{font-family:"Test-83734b6f7f25f14b fallback: Arial";src:local("Arial");font-display:swap;font-weight:400;font-style:normal;size-adjust:99.7809%;ascent-override:92.9771%;descent-override:24.4677%;line-gap-override:0%;}:root{--font-test:Test-83734b6f7f25f14b,"Test-83734b6f7f25f14b fallback: Arial",sans-serif;}`,
						preloads: [
							{
								style: 'normal',
								subset: undefined,
								type: 'woff2',
								url: `/${localUrl}`,
								weight: '400',
							},
						],
					},
				],
			]),
		});
	});
});
