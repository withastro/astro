import { readFileSync } from 'node:fs';
import * as unifont from 'unifont';
import type { Storage } from 'unstorage';
import { AstroError, AstroErrorData } from '../../core/errors/index.js';
import { DEFAULTS, LOCAL_PROVIDER_NAME } from './constants.js';
import type { generateFallbackFontFace } from './metrics.js';
import { resolveLocalFont } from './providers/local.js';
import type { PreloadData, ResolvedFontFamily } from './types.js';
import {
	type GetMetricsForFamily,
	type GetMetricsForFamilyFont,
	type ProxyURLOptions,
	familiesToUnifontProviders,
	generateFallbacksCSS,
	generateFontFace,
	proxyURL,
} from './utils.js';

interface Options {
	base: string;
	families: Array<ResolvedFontFamily>;
	storage: Storage;
	hashToUrlMap: Map<string, string>;
	resolvedMap: Map<string, { preloadData: PreloadData; css: string }>;
	hashString: (value: string) => string;
	log: (message: string) => void;
	generateFallbackFontFace: typeof generateFallbackFontFace;
	getMetricsForFamily: GetMetricsForFamily;
}

export async function loadFonts({
	base,
	families,
	storage,
	hashToUrlMap,
	resolvedMap,
	hashString,
	generateFallbackFontFace,
	getMetricsForFamily,
	log,
}: Options): Promise<void> {
	const extractedProvidersResult = familiesToUnifontProviders({ families, hashString });
	families = extractedProvidersResult.families;
	const { resolveFont } = await unifont.createUnifont(extractedProvidersResult.providers, {
		storage,
	});

	for (const family of families) {
		const preloadData: PreloadData = [];
		let css = '';
		let fallbackFontData: GetMetricsForFamilyFont | null = null;

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
			const result = resolveLocalFont({
				family,
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
					fallbacks: family.fallbacks ?? DEFAULTS.fallbacks,
				},
				// By default, unifont goes through all providers. We use a different approach
				// where we specify a provider per font.
				// Name has been set while extracting unifont providers from families (inside familiesToUnifontProviders)
				[family.provider.name!],
			);

			fonts = result.fonts
				// Avoid getting too much font files
				.filter((font) =>
					typeof font.meta?.priority === 'number' ? font.meta.priority === 0 : true,
				)
				// Collect URLs
				.map((font) => ({
					...font,
					src: font.src
						// Limit src to 1 file (eg. if woff2 and woff are present, will only take woff2) to avoid
						// downloading too many files
						.slice(0, 1)
						.map((source) =>
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
			css += generateFontFace(family.nameWithHash, {
				src: data.src,
				display:
					(data.display ?? family.provider === LOCAL_PROVIDER_NAME) ? undefined : family.display,
				unicodeRange:
					(data.unicodeRange ?? family.provider === LOCAL_PROVIDER_NAME)
						? undefined
						: family.unicodeRange,
				weight: data.weight,
				style: data.style,
				stretch:
					(data.stretch ?? family.provider === LOCAL_PROVIDER_NAME) ? undefined : family.stretch,
				featureSettings:
					(data.featureSettings ?? family.provider === LOCAL_PROVIDER_NAME)
						? undefined
						: family.featureSettings,
				variationSettings:
					(data.variationSettings ?? family.provider === LOCAL_PROVIDER_NAME)
						? undefined
						: family.variationSettings,
			});
		}

		const fallbackData = await generateFallbacksCSS({
			family,
			font: fallbackFontData,
			fallbacks: family.fallbacks ?? DEFAULTS.fallbacks,
			metrics:
				(family.optimizedFallbacks ?? DEFAULTS.optimizedFallbacks)
					? {
							getMetricsForFamily,
							generateFontFace: generateFallbackFontFace,
						}
					: null,
		});

		const cssVarValues = [family.nameWithHash];

		if (fallbackData) {
			css += fallbackData.css;
			cssVarValues.push(...fallbackData.fallbacks);
		}

		css += `:root { ${family.cssVariable}: ${cssVarValues.join(', ')}; }`;

		resolvedMap.set(family.cssVariable, { preloadData, css });
	}
	log('Fonts initialized');
}
