import { LOCAL_PROVIDER_NAME } from './constants.js';
import { resolveFamilies } from './logic/resolve-families.js';
import { resolveLocalFont } from './providers/local.js';
import type { CreateUrlProxyParams, Defaults, FontFamily, PreloadData } from './types.js';
import * as unifont from 'unifont';
import { pickFontFaceProperty, unifontFontFaceDataToProperties } from './utils.js';
import { extractUnifontProviders } from './logic/extract-unifont-providers.js';
import { normalizeRemoteFontFaces } from './logic/normalize-remote-font-faces.js';
import { optimizeFallbacks, type CollectedFontForMetrics } from './logic/optimize-fallbacks.js';
import type {
	CssRenderer,
	FontMetricsResolver,
	Hasher,
	LocalProviderUrlResolver,
	RemoteFontProviderResolver,
	SystemFallbacksProvider,
	UrlProxy,
} from './definitions.js';
import type { Storage } from 'unstorage';

// TODO: comment/document everything everywhere

// TODO: logs everywhere!
export async function orchestrate({
	families,
	hasher,
	remoteFontProviderResolver,
	localProviderUrlResolver,
	storage,
	cssRenderer,
	systemFallbacksProvider,
	fontMetricsResolver,
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

	const hashToUrlMap = new Map<string, string>();
	const resolvedMap = new Map<string, { preloadData: PreloadData; css: string }>();

	for (const family of resolvedFamilies) {
		const preloadData: PreloadData = [];
		let css = '';

		const collectedFonts: Array<CollectedFontForMetrics> = [];
		const fallbacks = family.fallbacks ?? defaults.fallbacks ?? [];

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
					// If the same data has already been sent for this family, we don't want to have duplicate fallbacks
					// Such scenario can occur with unicode ranges
					!collectedFonts.some((f) => JSON.stringify(f.data) === JSON.stringify(collected.data))
				) {
					// If a family has fallbacks, we store the first url we get that may
					// be used for the fallback generation
					collectedFonts.push(collected);
				}
			},
		});

		let fonts: Array<unifont.FontFaceData>;

		if (family.provider === LOCAL_PROVIDER_NAME) {
			const result = resolveLocalFont({
				family,
				urlProxy,
			});
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
				// By default, unifont goes through all providers. We use a different approach
				// where we specify a provider per font.
				// Name has been set while extracting unifont providers from families (inside familiesToUnifontProviders)
				[family.provider.name!],
			);
			fonts = normalizeRemoteFontFaces({ fonts: result.fonts, urlProxy });
		}

		for (const data of fonts) {
			css += cssRenderer.generateFontFace(
				family.nameWithHash,
				unifontFontFaceDataToProperties({
					src: data.src,
					weight: data.weight,
					style: data.style,
					// User settings override the generated font settings
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
			// Nothing to optimize, pass as is
			cssVarValues.push(...fallbacks);
		}

		css += cssRenderer.generateCssVariable(family.cssVariable, cssVarValues);

		resolvedMap.set(family.cssVariable, { preloadData, css });
	}

	return { hashToUrlMap, resolvedMap };
}
