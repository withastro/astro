import { DEFAULTS, LOCAL_PROVIDER_NAME } from './constants.js';
import { resolveFamilies } from './logic/resolve-families.js';
import { resolveLocalFont } from './providers/local.js';
import type { FontFamily, PreloadData } from './types.js';
import * as unifont from 'unifont';
import { pickFontFaceProperty, type GetMetricsForFamilyFont } from './utils.js';
import type { RealDataCollector } from './implementations/data-collector.js';
import { extractUnifontProviders } from './logic/extract-unifont-providers.js';
import { normalizeRemoteFontFaces } from './logic/normalize-remote-font-faces.js';
import { optimizeFallbacks } from './logic/optimize-fallbacks.js';
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
}: {
	families: Array<FontFamily>;
	hasher: Hasher;
	remoteFontProviderResolver: RemoteFontProviderResolver;
	localProviderUrlResolver: LocalProviderUrlResolver;
	storage: Storage;
	cssRenderer: CssRenderer;
	systemFallbacksProvider: SystemFallbacksProvider;
	fontMetricsResolver: FontMetricsResolver;
	createUrlProxy: (
		local: boolean,
		...collectorArgs: ConstructorParameters<typeof RealDataCollector>
	) => UrlProxy;
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

	// TODO: might be optimized?
	const hashToUrlMap = new Map<string, string>();
	const resolvedMap = new Map<string, { preloadData: PreloadData; css: string }>();

	for (const family of resolvedFamilies) {
		// TODO: might be refactored
		const preloadData: PreloadData = [];
		let css = '';
		const fallbackFontData: Array<GetMetricsForFamilyFont> = [];
		const fallbacks = family.fallbacks ?? DEFAULTS.fallbacks;

		// Must be cleaned to less rely on internal structures
		const urlProxy = createUrlProxy(
			family.provider === LOCAL_PROVIDER_NAME,
			hashToUrlMap,
			preloadData,
			fallbackFontData,
			fallbacks,
		);

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
				// TODO: defaults should be customizable
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
			fonts = normalizeRemoteFontFaces({ fonts: result.fonts, urlProxy });
		}

		for (const data of fonts) {
			css += cssRenderer.generateFontFace(family.nameWithHash, {
				src: data.src,
				weight: data.weight,
				style: data.style,
				// User settings override the generated font settings
				display: pickFontFaceProperty('display', { data, family }),
				unicodeRange: pickFontFaceProperty('unicodeRange', { data, family }),
				stretch: pickFontFaceProperty('stretch', { data, family }),
				featureSettings: pickFontFaceProperty('featureSettings', { data, family }),
				variationSettings: pickFontFaceProperty('variationSettings', { data, family }),
			});
		}

		const cssVarValues = [family.nameWithHash];
		const optimizeFallbacksResult = await optimizeFallbacks({
			family,
			fallbacks,
			fontData: fallbackFontData,
			enabled: family.optimizedFallbacks ?? DEFAULTS.optimizedFallbacks,
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
