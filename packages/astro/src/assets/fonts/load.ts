import { readFileSync } from 'node:fs';
import { resolveLocalFont } from './providers/local.js';
import {
	generateFallbacksCSS,
	generateFontFace,
	getFamilyName,
	proxyURL,
	type GetMetricsForFamily,
	type GetMetricsForFamilyFont,
	type ProxyURLOptions,
} from './utils.js';
import * as unifont from 'unifont';
import { AstroError, AstroErrorData } from '../../core/errors/index.js';
import { DEFAULTS, LOCAL_PROVIDER_NAME } from './constants.js';
import type { PreloadData, ResolvedFontFamily } from './types.js';
import type { Storage } from 'unstorage';
import type { generateFallbackFontFace } from './metrics.js';

interface Options {
	root: URL;
	base: string;
	families: Array<ResolvedFontFamily>;
	storage: Storage;
	hashToUrlMap: Map<string, string>;
	resolvedMap: Map<string, { preloadData: PreloadData; css: string }>;
	hashString: (value: string) => string;
	log: (message: string) => void;
	generateCSSVariableName: (name: string) => string;
	generateFallbackFontFace: typeof generateFallbackFontFace;
	getMetricsForFamily: GetMetricsForFamily;
}

export async function loadFonts({
	root,
	base,
	families,
	storage,
	hashToUrlMap,
	resolvedMap,
	hashString,
	generateFallbackFontFace,
	getMetricsForFamily,
	log,
	generateCSSVariableName,
}: Options): Promise<void> {
	const { resolveFont } = await unifont.createUnifont(
		// TODO: avoid initializing same providers several times
		// TODO: handle same providers with different options
		families
			.filter((family) => family.provider !== LOCAL_PROVIDER_NAME)
			.map((family) => family.provider.provider(family.provider.config)),
		{ storage },
	);

	for (const family of families) {
		const preloadData: PreloadData = [];
		let css = '';
		let fallbackFontData: GetMetricsForFamilyFont = null;

		// When going through the urls/filepaths returned by providers,
		// We save the hash and the associated original value so we can use
		// it in the vite middleware during development
		const collect: ProxyURLOptions['collect'] = ({ hash, type, value }) => {
			const url = base + hash;
			if (!hashToUrlMap.has(hash)) {
				hashToUrlMap.set(hash, value);
				preloadData.push({ url, type });
			}
			// If a family has fallbacks, we store the first url we get that may
			// be used for the fallback generation, if capsize doesn't have this
			// family in its built-in collection
			if (family.fallbacks && family.fallbacks.length > 0) {
				fallbackFontData ??= {
					hash,
					url: value,
				};
			}
			return url;
		};

		let fonts: Array<unifont.FontFaceData>;

		if (family.provider === LOCAL_PROVIDER_NAME) {
			const result = resolveLocalFont(family, {
				proxyURL: (value) => {
					return proxyURL({
						value,
						// We hash based on the filepath and the contents, since the user could replace
						// a given font file with completely different contents.
						hashString: (v) => {
							let content: string;
							try {
								content = readFileSync(value, 'utf-8');
							} catch (e) {
								throw new AstroError(AstroErrorData.UnknownFilesystemError, { cause: e });
							}
							return hashString(v + content);
						},
						collect,
					});
				},
				root,
			});
			fonts = result.fonts;
		} else {
			const result = await resolveFont(
				family.name,
				// We do not merge the defaults, we only provide defaults as a fallback
				{
					weights: family.weights ?? DEFAULTS.weights,
					styles: family.styles ?? DEFAULTS.styles,
					subsets: family.subsets ?? DEFAULTS.subsets,
					// No default fallback to be used here
					fallbacks: family.fallbacks,
				},
				// By default, unifont goes through all providers. We use a different approach
				// where we specify a provider per font
				[family.provider.name],
			);

			fonts = result.fonts.map((font) => ({
				...font,
				src: font.src.map((source) =>
					'name' in source
						? source
						: {
								...source,
								originalURL: source.url,
								url: proxyURL({
									value: source.url,
									// We only use the url for hashing since the service returns urls with a hash already
									hashString,
									collect,
								}),
							},
				),
			}));
		}

		for (const data of fonts) {
			// User settings override the generated font settings
			css += generateFontFace(getFamilyName(family), {
				src: data.src,
				display: data.display ?? family.display,
				unicodeRange: data.unicodeRange ?? family.unicodeRange,
				weight: data.weight,
				style: data.style,
				stretch: data.stretch ?? family.stretch,
				featureSettings: data.featureSettings ?? family.featureSettings,
				variationSettings: data.variationSettings ?? family.variationSettings,
			});
		}

		const fallbackData = await generateFallbacksCSS({
			family,
			font: fallbackFontData,
			fallbacks: family.fallbacks ?? [],
			metrics:
				(family.automaticFallback ?? DEFAULTS.automaticFallback)
					? {
							getMetricsForFamily,
							generateFontFace: generateFallbackFontFace,
						}
					: null,
		});

		const cssVarValues = [getFamilyName(family)];

		if (fallbackData) {
			css += fallbackData.css;
			cssVarValues.push(...fallbackData.fallbacks);
		}

		css += `:root { --astro-font-${generateCSSVariableName(getFamilyName(family))}: ${cssVarValues.join(', ')}; }`;

		resolvedMap.set(getFamilyName(family), { preloadData, css });
	}
	log('Fonts initialized');
}
