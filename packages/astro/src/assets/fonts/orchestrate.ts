import * as unifont from 'unifont';
import type { Storage } from 'unstorage';
import { LOCAL_PROVIDER_NAME } from './constants.js';
import type {
	CssRenderer,
	FontMetricsResolver,
	FontTypeExtractor,
	Hasher,
	LocalProviderUrlResolver,
	RemoteFontProviderResolver,
	SystemFallbacksProvider,
	UrlProxy,
} from './definitions.js';
import { extractUnifontProviders } from './logic/extract-unifont-providers.js';
import { normalizeRemoteFontFaces } from './logic/normalize-remote-font-faces.js';
import { type CollectedFontForMetrics, optimizeFallbacks } from './logic/optimize-fallbacks.js';
import { resolveFamilies } from './logic/resolve-families.js';
import { resolveLocalFont } from './providers/local.js';
import type { CreateUrlProxyParams, Defaults, FontFamily, PreloadData } from './types.js';
import { pickFontFaceProperty, unifontFontFaceDataToProperties } from './utils.js';

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
	createUrlProxy,
	defaults,
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
	createUrlProxy: (params: CreateUrlProxyParams) => UrlProxy;
	defaults: Defaults;
}) {
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

	const { resolveFont } = await unifont.createUnifont(unifontProviders, {
		storage,
	});

	/**
	 * Holds associations of hash and original font file URLs, so they can be
	 * downloaded whenever the hash is requested.
	 */
	const hashToUrlMap = new Map<string, string>();
	/**
	 * Holds associations of CSS variables and preloadData/css to be passed to the virtual module.
	 */
	const resolvedMap = new Map<string, { preloadData: Array<PreloadData>; css: string }>();

	for (const family of resolvedFamilies) {
		const preloadData: Array<PreloadData> = [];
		let css = '';

		/**
		 * Holds a list of font files to be used for optimized fallbacks generation
		 */
		const collectedFonts: Array<CollectedFontForMetrics> = [];
		const fallbacks = family.fallbacks ?? defaults.fallbacks ?? [];

		/**
		 * Allows collecting and transforming original URLs from providers, so the Vite
		 * plugin has control over URLs.
		 */
		const urlProxy = createUrlProxy({
			local: family.provider === LOCAL_PROVIDER_NAME,
			hasUrl: (hash) => hashToUrlMap.has(hash),
			saveUrl: (hash, url) => {
				hashToUrlMap.set(hash, url);
			},
			savePreload: (preload) => {
				preloadData.push(preload);
			},
			saveFontData: (collected) => {
				if (
					fallbacks &&
					fallbacks.length > 0 &&
					// If the same data has already been sent for this family, we don't want to have
					// duplicated fallbacks. Such scenario can occur with unicode ranges.
					!collectedFonts.some((f) => JSON.stringify(f.data) === JSON.stringify(collected.data))
				) {
					// If a family has fallbacks, we store the first url we get that may
					// be used for the fallback generation.
					collectedFonts.push(collected);
				}
			},
		});

		let fonts: Array<unifont.FontFaceData>;

		if (family.provider === LOCAL_PROVIDER_NAME) {
			const result = resolveLocalFont({
				family,
				urlProxy,
				fontTypeExtractor,
			});
			// URLs are already proxied at this point so no further processing is required
			fonts = result.fonts;
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
			// The data returned by the remote provider contains original URLs. We proxy them.
			fonts = normalizeRemoteFontFaces({ fonts: result.fonts, urlProxy });
		}

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

		resolvedMap.set(family.cssVariable, { preloadData, css });
	}

	return { hashToUrlMap, resolvedMap };
}
