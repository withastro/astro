import * as unifont from 'unifont';
import type { Logger } from '../../core/logger/core.js';
import { LOCAL_PROVIDER_NAME } from './constants.js';
import { dedupeFontFaces } from './core/dedupe-font-faces.js';
import { extractUnifontProviders } from './core/extract-unifont-providers.js';
import { normalizeRemoteFontFaces } from './core/normalize-remote-font-faces.js';
import { type CollectedFontForMetrics, optimizeFallbacks } from './core/optimize-fallbacks.js';
import { resolveFamilies } from './core/resolve-families.js';
import type {
	CssRenderer,
	FontFileReader,
	FontMetricsResolver,
	FontTypeExtractor,
	Hasher,
	LocalProviderUrlResolver,
	RemoteFontProviderResolver,
	Storage,
	StringMatcher,
	SystemFallbacksProvider,
	UrlProxy,
} from './definitions.js';
import { resolveLocalFont } from './providers/local.js';
import type {
	ConsumableMap,
	CreateUrlProxyParams,
	Defaults,
	FontData,
	FontFamily,
	FontFileDataMap,
	InternalConsumableMap,
	PreloadData,
	ResolvedFontFamily,
} from './types.js';
import {
	pickFontFaceProperty,
	renderFontWeight,
	unifontFontFaceDataToProperties,
} from './utils.js';

/**
 * Manages how fonts are resolved:
 *
 * - families are resolved
 * - unifont providers are extracted from families
 * - unifont is initialized
 *
 * For each family:
 * - We create a URL proxy
 * - We resolve the font and normalize the result
 *
 * For each resolved font:
 * - We generate the CSS font face
 * - We generate optimized fallbacks if applicable
 * - We generate CSS variables
 *
 * Once that's done, the collected data is returned
 */
export async function orchestrate({
	families,
	hasher,
	remoteFontProviderResolver,
	localProviderUrlResolver,
	storage,
	cssRenderer,
	systemFallbacksProvider,
	fontMetricsResolver,
	fontTypeExtractor,
	fontFileReader,
	logger,
	createUrlProxy,
	defaults,
	bold,
	stringMatcher,
}: {
	families: Array<FontFamily>;
	hasher: Hasher;
	remoteFontProviderResolver: RemoteFontProviderResolver;
	localProviderUrlResolver: LocalProviderUrlResolver;
	storage: Storage;
	cssRenderer: CssRenderer;
	systemFallbacksProvider: SystemFallbacksProvider;
	fontMetricsResolver: FontMetricsResolver;
	fontTypeExtractor: FontTypeExtractor;
	fontFileReader: FontFileReader;
	logger: Logger;
	createUrlProxy: (params: CreateUrlProxyParams) => UrlProxy;
	defaults: Defaults;
	bold: (input: string) => string;
	stringMatcher: StringMatcher;
}): Promise<{
	fontFileDataMap: FontFileDataMap;
	internalConsumableMap: InternalConsumableMap;
	consumableMap: ConsumableMap;
}> {
	let resolvedFamilies = await resolveFamilies({
		families,
		hasher,
		remoteFontProviderResolver,
		localProviderUrlResolver,
	});

	const extractedUnifontProvidersResult = extractUnifontProviders({
		families: resolvedFamilies,
		hasher,
	});
	resolvedFamilies = extractedUnifontProvidersResult.families;
	const unifontProviders = extractedUnifontProvidersResult.providers;

	const { resolveFont, listFonts } = await unifont.createUnifont(unifontProviders, {
		storage,
	});

	/**
	 * Holds associations of hash and original font file URLs, so they can be
	 * downloaded whenever the hash is requested.
	 */
	const fontFileDataMap: FontFileDataMap = new Map();
	/**
	 * Holds associations of CSS variables and preloadData/css to be passed to the internal virtual module.
	 */
	const internalConsumableMap: InternalConsumableMap = new Map();
	/**
	 * Holds associations of CSS variables and font data to be exposed via virtual module.
	 */
	const consumableMap: ConsumableMap = new Map();

	/**
	 * Holds family data by a key, to allow merging families
	 */
	const resolvedFamiliesMap = new Map<
		string,
		{
			family: ResolvedFontFamily;
			fonts: Array<unifont.FontFaceData>;
			fallbacks: Array<string>;
			/**
			 * Holds a list of font files to be used for optimized fallbacks generation
			 */
			collectedFonts: Array<CollectedFontForMetrics>;
			preloadData: Array<PreloadData>;
		}
	>();

	// First loop: we try to merge families. This is useful for advanced cases, where eg. you want
	// 500, 600, 700 as normal but also 500 as italic. That requires 2 families
	for (const family of resolvedFamilies) {
		const key = `${family.cssVariable}:${family.name}:${typeof family.provider === 'string' ? family.provider : family.provider.name!}`;
		let resolvedFamily = resolvedFamiliesMap.get(key);
		if (!resolvedFamily) {
			if (
				Array.from(resolvedFamiliesMap.keys()).find((k) => k.startsWith(`${family.cssVariable}:`))
			) {
				logger.warn(
					'assets',
					`Several font families have been registered for the ${bold(family.cssVariable)} cssVariable but they do not share the same name and provider.`,
				);
				logger.warn(
					'assets',
					'These families will not be merged together. The last occurrence will override previous families for this cssVariable. Review your Astro configuration.',
				);
			}
			resolvedFamily = {
				family,
				fonts: [],
				fallbacks: family.fallbacks ?? defaults.fallbacks ?? [],
				collectedFonts: [],
				preloadData: [],
			};
			resolvedFamiliesMap.set(key, resolvedFamily);
		}

		/**
		 * Allows collecting and transforming original URLs from providers, so the Vite
		 * plugin has control over URLs.
		 */
		const urlProxy = createUrlProxy({
			local: family.provider === LOCAL_PROVIDER_NAME,
			hasUrl: (hash) => fontFileDataMap.has(hash),
			saveUrl: ({ hash, url, init }) => {
				fontFileDataMap.set(hash, { url, init });
			},
			savePreload: (preload) => {
				resolvedFamily.preloadData.push(preload);
			},
			saveFontData: (collected) => {
				if (
					resolvedFamily.fallbacks &&
					resolvedFamily.fallbacks.length > 0 &&
					// If the same data has already been sent for this family, we don't want to have
					// duplicated fallbacks. Such scenario can occur with unicode ranges.
					!resolvedFamily.collectedFonts.some(
						(f) => JSON.stringify(f.data) === JSON.stringify(collected.data),
					)
				) {
					// If a family has fallbacks, we store the first url we get that may
					// be used for the fallback generation.
					resolvedFamily.collectedFonts.push(collected);
				}
			},
			cssVariable: family.cssVariable,
		});

		if (family.provider === LOCAL_PROVIDER_NAME) {
			const result = resolveLocalFont({
				family,
				urlProxy,
				fontTypeExtractor,
				fontFileReader,
			});
			// URLs are already proxied at this point so no further processing is required
			resolvedFamily.fonts.push(...result.fonts);
		} else {
			const result = await resolveFont(
				family.name,
				// We do not merge the defaults, we only provide defaults as a fallback
				{
					weights: family.weights ?? defaults.weights,
					styles: family.styles ?? defaults.styles,
					subsets: family.subsets ?? defaults.subsets,
					fallbacks: family.fallbacks ?? defaults.fallbacks,
				},
				// By default, unifont goes through all providers. We use a different approach where
				// we specify a provider per font. Name has been set while extracting unifont providers
				// from families (inside extractUnifontProviders).
				[family.provider.name!],
			);
			if (result.fonts.length === 0) {
				logger.warn(
					'assets',
					`No data found for font family ${bold(family.name)}. Review your configuration`,
				);
				const availableFamilies = await listFonts([family.provider.name!]);
				if (
					availableFamilies &&
					availableFamilies.length > 0 &&
					!availableFamilies.includes(family.name)
				) {
					logger.warn(
						'assets',
						`${bold(family.name)} font family cannot be retrieved by the provider. Did you mean ${bold(stringMatcher.getClosestMatch(family.name, availableFamilies))}?`,
					);
				}
			}
			// The data returned by the remote provider contains original URLs. We proxy them.
			resolvedFamily.fonts = dedupeFontFaces(
				resolvedFamily.fonts,
				normalizeRemoteFontFaces({ fonts: result.fonts, urlProxy, fontTypeExtractor }),
			);
		}
	}

	// We know about all the families, let's generate css, fallbacks and more
	for (const {
		family,
		fonts,
		fallbacks,
		collectedFonts,
		preloadData,
	} of resolvedFamiliesMap.values()) {
		const consumableMapValue: Array<FontData> = [];
		let css = '';

		for (const data of fonts) {
			css += cssRenderer.generateFontFace(
				family.nameWithHash,
				unifontFontFaceDataToProperties({
					src: data.src,
					weight: data.weight,
					style: data.style,
					// User settings override the generated font settings. We use a helper function
					// because local and remote providers store this data in different places.
					display: pickFontFaceProperty('display', { data, family }),
					unicodeRange: pickFontFaceProperty('unicodeRange', { data, family }),
					stretch: pickFontFaceProperty('stretch', { data, family }),
					featureSettings: pickFontFaceProperty('featureSettings', { data, family }),
					variationSettings: pickFontFaceProperty('variationSettings', { data, family }),
				}),
			);

			consumableMapValue.push({
				weight: renderFontWeight(data.weight),
				style: data.style,
				src: data.src
					.filter((src) => 'url' in src)
					.map((src) => ({
						url: src.url,
						format: src.format,
						tech: src.tech,
					})),
			});
		}

		const cssVarValues = [family.nameWithHash];
		const optimizeFallbacksResult = await optimizeFallbacks({
			family,
			fallbacks,
			collectedFonts,
			enabled: family.optimizedFallbacks ?? defaults.optimizedFallbacks ?? false,
			systemFallbacksProvider,
			fontMetricsResolver,
		});

		if (optimizeFallbacksResult) {
			css += optimizeFallbacksResult.css;
			cssVarValues.push(...optimizeFallbacksResult.fallbacks);
		} else {
			// If there are no optimized fallbacks, we pass the provided fallbacks as is.
			cssVarValues.push(...fallbacks);
		}

		css += cssRenderer.generateCssVariable(family.cssVariable, cssVarValues);

		internalConsumableMap.set(family.cssVariable, { preloadData, css });
		consumableMap.set(family.cssVariable, consumableMapValue);
	}

	return { fontFileDataMap, internalConsumableMap, consumableMap };
}
