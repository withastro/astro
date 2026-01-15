import type * as unifont from 'unifont';
import type { Logger } from '../../core/logger/core.js';
import { FONT_FORMATS } from './constants.js';
import { type CollectedFontForMetrics, optimizeFallbacks } from './core/optimize-fallbacks.js';
import { resolveFamily } from './core/resolve-family.js';
import type {
	CssRenderer,
	FontFileIdGenerator,
	FontMetricsResolver,
	FontResolver,
	FontTypeExtractor,
	Hasher,
	StringMatcher,
	SystemFallbacksProvider,
	UrlResolver,
} from './definitions.js';
import type {
	ConsumableMap,
	Defaults,
	FontData,
	FontFamily,
	FontFileDataMap,
	InternalConsumableMap,
	PreloadData,
	ResolvedFontFamily,
} from './types.js';
import { renderFontWeight, unifontFontFaceDataToProperties } from './utils.js';

// TODO: split back stuff as needed

/**
 * Manages how fonts are resolved:
 *
 * - families are resolved
 * - font resolver is initialized
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
	cssRenderer,
	systemFallbacksProvider,
	fontMetricsResolver,
	fontTypeExtractor,
	logger,
	defaults,
	bold,
	stringMatcher,
	createFontResolver,
	fontFileIdGenerator,
	urlResolver,
}: {
	families: Array<FontFamily>;
	hasher: Hasher;
	cssRenderer: CssRenderer;
	systemFallbacksProvider: SystemFallbacksProvider;
	fontMetricsResolver: FontMetricsResolver;
	fontTypeExtractor: FontTypeExtractor;
	logger: Logger;
	defaults: Defaults;
	bold: (input: string) => string;
	stringMatcher: StringMatcher;
	createFontResolver: (params: { families: Array<ResolvedFontFamily> }) => Promise<FontResolver>;
	fontFileIdGenerator: FontFileIdGenerator;
	urlResolver: UrlResolver;
}): Promise<{
	fontFileDataMap: FontFileDataMap;
	internalConsumableMap: InternalConsumableMap;
	consumableMap: ConsumableMap;
}> {
	const resolvedFamilies = families.map((family) => resolveFamily({ family, hasher }));

	const fontResolver = await createFontResolver({ families: resolvedFamilies });

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
		const key = `${family.cssVariable}:${family.name}:${typeof family.provider === 'string' ? family.provider : family.provider.name}`;
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

		const fonts = await fontResolver.resolveFont({
			familyName: family.name,
			provider: family.provider.name,
			// We do not merge the defaults, we only provide defaults as a fallback
			weights: family.weights ?? defaults.weights,
			styles: family.styles ?? defaults.styles,
			subsets: family.subsets ?? defaults.subsets,
			formats: family.formats ?? defaults.formats,
			options: family.options,
		});
		if (fonts.length === 0) {
			logger.warn(
				'assets',
				`No data found for font family ${bold(family.name)}. Review your configuration`,
			);
			const availableFamilies = await fontResolver.listFonts({ provider: family.provider.name });
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
			continue;
		}
		// The data returned by the provider contains original URLs. We proxy them.
		resolvedFamily.fonts = fonts
			// Avoid getting too much font files
			.filter((font) => (typeof font.meta?.priority === 'number' ? font.meta.priority <= 1 : true))
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
						// We handle protocol relative URLs here, otherwise they're considered absolute by the font
						// fetcher which will try to read them from the file system
						const originalUrl = source.url.startsWith('//') ? `https:${source.url}` : source.url;
						const format = FONT_FORMATS.find((e) => e.format === source.format);
						const type = format?.type ?? fontTypeExtractor.extract(source.url);
						const init = font.meta?.init ?? null;
						const id = fontFileIdGenerator.generate({
							cssVariable: family.cssVariable,
							font,
							originalUrl,
							type,
						});
						const url = urlResolver.resolve(id);

						if (!fontFileDataMap.has(id)) {
							fontFileDataMap.set(id, { url, init });
							// We only collect the first URL to avoid preloading fallback sources (eg. we only
							// preload woff2 if woff is available)
							if (index === 0) {
								resolvedFamily.preloadData.push({
									url,
									type,
									weight: renderFontWeight(font.weight),
									style: font.style,
									subset: font.meta?.subset,
								});
							}
						}
						const collected = {
							hash: id,
							url,
							data: {
								weight: font.weight,
								style: font.style,
								subset: font.meta?.subset,
							},
							init,
						};
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

						const proxied: unifont.RemoteFontSource = {
							originalURL: originalUrl,
							url,
							format: format?.format,
							tech: source.tech,
						};
						index++;
						return proxied;
					}),
				};
			});
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
				family.uniqueName,
				unifontFontFaceDataToProperties({
					src: data.src,
					weight: data.weight,
					style: data.style,
					// User settings override the generated font settings
					display: data.display ?? family.display,
					unicodeRange: data.unicodeRange ?? family.unicodeRange,
					stretch: data.stretch ?? family.stretch,
					featureSettings: data.featureSettings ?? family.featureSettings,
					variationSettings: data.variationSettings ?? family.variationSettings,
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

		const cssVarValues = [family.uniqueName];
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
