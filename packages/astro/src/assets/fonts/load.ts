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
		const fallbacks = family.fallbacks ?? DEFAULTS.fallbacks;
		const fallbackFontData: Array<GetMetricsForFamilyFont> = [];

		// When going through the urls/filepaths returned by providers,
		// We save the hash and the associated original value so we can use
		// it in the vite middleware during development
		const collect: (
			parameters: Parameters<ProxyURLOptions['collect']>[0] & {
				data: Partial<unifont.FontFaceData>;
			},
			collectPreload: boolean,
		) => ReturnType<ProxyURLOptions['collect']> = ({ hash, type, value, data }, collectPreload) => {
			const url = base + hash;
			if (!hashToUrlMap.has(hash)) {
				hashToUrlMap.set(hash, value);
				if (collectPreload) {
					preloadData.push({ url, type });
				}
			}
			// If a family has fallbacks, we store the first url we get that may
			// be used for the fallback generation, if capsize doesn't have this
			// family in its built-in collection
			if (
				fallbacks &&
				fallbacks.length > 0 &&
				// If the same data has already been sent for this family, we don't want to have duplicate fallbacks
				// Such scenario can occur with unicode ranges
				!fallbackFontData.some((f) => JSON.stringify(f.data) === JSON.stringify(data))
			) {
				fallbackFontData.push({
					hash,
					url: value,
					data,
				});
			}
			return url;
		};

		let fonts: Array<unifont.FontFaceData>;

		if (family.provider === LOCAL_PROVIDER_NAME) {
			const result = resolveLocalFont({
				family,
				proxyURL: ({ value, data }) => {
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
						collect: (input) => collect({ ...input, data }, true),
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
				.map((font) => {
					// The index keeps track of encountered URLs. We can't use the index on font.src.map
					// below because it may contain sources without urls, which would prevent preloading completely
					let index = 0;
					return {
						...font,
						src: font.src.map((source) => {
							if ('name' in source) {
								return source;
							}
							const proxied = {
								...source,
								originalURL: source.url,
								url: proxyURL({
									value: source.url,
									// We only use the url for hashing since the service returns urls with a hash already
									hashString,
									// We only collect the first URL to avoid preloading fallback sources (eg. we only
									// preload woff2 if woff is available)
									collect: (data) =>
										collect(
											{
												...data,
												data: {
													weight: font.weight,
													style: font.style,
												},
											},
											index === 0,
										),
								}),
							};
							index++;
							return proxied;
						}),
					};
				});
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
			fallbacks,
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
			if (fallbackData.css) {
				css += fallbackData.css;
			}
			cssVarValues.push(...fallbackData.fallbacks);
		}

		css += `:root { ${family.cssVariable}: ${cssVarValues.join(', ')}; }`;

		resolvedMap.set(family.cssVariable, { preloadData, css });
	}
	log('Fonts initialized');
}
