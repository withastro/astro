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
import { createNodeLoggerFromFlags } from '../../../../dist/core/logger/impls/node.js';
import type { FontFamily } from '../../../../dist/assets/fonts/types.js';

async function run({ fonts: _fonts }: { fonts: Array<FontFamily> }) {
	const hasher = await XxhashHasher.create();
	const resolvedFamilies = _fonts.map((family) => resolveFamily({ family, hasher }));
	const defaults = DEFAULTS;
	const { bold } = colors;
	const logger = createNodeLoggerFromFlags({ logLevel: 'silent' });
	const stringMatcher = new LevenshteinStringMatcher();
	const base = new URL('./data/cache/', import.meta.url);
	// Clear cache
	await rm(base, { recursive: true, force: true });
	const storage = new UnstorageFsStorage({ base });
	const root = new URL('./data/fonts/', import.meta.url);
	const contentResolver = new FsFontFileContentResolver({
		readFileSync: (path: string) => readFileSync(path, 'utf-8'),
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

// These tests hit the live Fontsource API, so they only assert on the structure of the result.
// Exact output (CSS, hashes, metrics) is covered by the unit tests in core.test.ts.
type Result = Awaited<ReturnType<typeof run>>;

const FONTSOURCE_URL = /^https:\/\/cdn\.jsdelivr\.net\/fontsource\/fonts\/roboto@/;

function assertRobotoFaces(result: Result, faces: Array<{ weight: string; style: string }>) {
	const fontData = result.fontDataByCssVariable['--font-roboto'];
	assert.deepStrictEqual(
		fontData.map(({ weight, style, subset }) => ({ weight, style, subset })),
		faces.map((face) => ({ ...face, subset: 'latin' })),
	);
	for (const { weight, style, src } of fontData) {
		const id = src[0].url.slice(1);
		assert.match(id, new RegExp(`^font-roboto-${weight}-${style}-latin-.+\\.woff2$`));
		assert.match(result.fontFileById.get(id)!.url, FONTSOURCE_URL);
	}

	const { css, preloads } = result.componentDataByCssVariable.get('--font-roboto')!;
	// Faces that are merged into the same CSS variable share a single font family name
	assert.equal(new Set(css.match(/font-family:Roboto-\w+;/g)).size, 1);
	assert.match(css, /:root\{--font-roboto:Roboto-\w+,.*sans-serif;\}/);
	assert.deepStrictEqual(
		preloads.map(({ url }) => url),
		fontData.map(({ src }) => src[0].url),
	);
}

function assertLocalFont(result: Result) {
	const localId =
		Array.from(result.fontFileById.keys()).find((e) => e.startsWith('font-test-400-normal-')) ?? '';
	assert.equal(
		result.fontFileById.get(localId)?.url,
		fileURLToPath(new URL('./data/fonts/test.woff2', import.meta.url)),
	);
	assert.deepStrictEqual(result.fontDataByCssVariable['--font-test'], [
		{
			src: [{ format: 'woff2', tech: undefined, url: `/${localId}` }],
			style: 'normal',
			subset: undefined,
			weight: '400',
		},
	]);
	assert.ok(result.componentDataByCssVariable.get('--font-test')!.css.includes(`/${localId}`));
}

const localFamily = {
	name: 'Test',
	cssVariable: '--font-test',
	provider: fontProviders.local(),
	options: {
		variants: [{ src: ['./test.woff2'], weight: '400', style: 'normal' }],
	} as any,
} satisfies FontFamily;

describe('Fonts E2E', () => {
	it('works', async () => {
		const result = await run({
			fonts: [
				{
					name: 'Roboto',
					cssVariable: '--font-roboto',
					provider: fontProviders.fontsource(),
					weights: ['700'],
				},
				localFamily,
			],
		});
		assert.equal(result.fontFileById.size, 3);
		assertRobotoFaces(result, [
			{ weight: '700', style: 'normal' },
			{ weight: '700', style: 'italic' },
		]);
		assertLocalFont(result);
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
				localFamily,
			],
		});
		assert.equal(result.fontFileById.size, 3);
		assertRobotoFaces(result, [
			{ weight: '500', style: 'normal' },
			{ weight: '700', style: 'italic' },
		]);
		assertLocalFont(result);
	});

	it('resolves fontsource fonts with "Variable" suffix (#18143)', async () => {
		const result = await run({
			fonts: [
				{
					name: 'Inter Variable',
					cssVariable: '--font-inter',
					provider: fontProviders.fontsource(),
					weights: ['100 900'],
					styles: ['normal'],
					subsets: ['latin'],
				},
			],
		});

		const fontEntries = Array.from(result.fontFileById.entries());
		assert.equal(fontEntries.length, 1, 'Expected one font file');
		const [fontId, fontFile] = fontEntries[0]!;
		assert.match(fontId, /^font-inter/, 'Font ID should reference Inter');
		assert.match(
			fontFile.url,
			/fontsource\/fonts\/inter:vf@/,
			'URL should reference the variable font',
		);

		const fontData = result.fontDataByCssVariable['--font-inter'];
		assert.ok(fontData, 'Font data should exist for --font-inter');
		assert.equal(fontData.length, 1, 'Expected one font face');
		assert.equal(fontData[0]!.weight, '100 900', 'Weight should be a variable range');
		assert.equal(fontData[0]!.style, 'normal');
	});
});
