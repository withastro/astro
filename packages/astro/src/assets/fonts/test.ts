import { DEFAULTS, LOCAL_PROVIDER_NAME } from './constants.js';
import { AstroErrorHandler } from './implementations/error-handler.js';
import { XxHasher } from './implementations/hasher.js';
import { RequireLocalProviderUrlResolver } from './implementations/local-provider-url-resolver.js';
import { RealRemoteFontProviderResolver } from './implementations/remote-font-provider-resolver.js';
import { FsStorage } from './implementations/storage.js';
import { resolveFamilies } from './logic/resolve-families.js';
import { resolveLocalFont } from './providers/local.js';
import type { FontFamily, PreloadData } from './types.js';
import * as unifont from 'unifont';
import { pickFontFaceProperty, type GetMetricsForFamilyFont } from './utils.js';
import { BuildRemoteFontProviderModResolver } from './implementations/remote-font-provider-mod-resolver.js';
import { RealUrlProxy } from './implementations/url-proxy.js';
import { RealDataCollector } from './implementations/data-collector.js';
import {
	LocalUrlProxyContentResolver,
	RemoteUrlProxyContentResolver,
} from './implementations/url-proxy-content-resolver.js';
import { extractUnifontProviders } from './logic/extract-unifont-providers.js';
import { normalizeRemoteFontFaces } from './logic/normalize-remote-font-faces.js';
import { PrettyCssRenderer } from './implementations/css-renderer.js';

// TODO: logs everywhere!
export async function main({
	families,
	root,
	cacheDir,
	base,
}: {
	families: Array<FontFamily>;
	root: URL;
	cacheDir: URL;
	base: string;
}) {
	// TODO: dependencies will have to be args
	// Dependencies
	const hasher = await XxHasher.create();
	const errorHandler = new AstroErrorHandler();
	const modResolver = new BuildRemoteFontProviderModResolver();
	const remoteFontProviderResolver = new RealRemoteFontProviderResolver(
		root,
		modResolver,
		errorHandler,
	);
	const localProviderUrlResolver = new RequireLocalProviderUrlResolver(root);
	const storage = FsStorage.create(cacheDir);
	const cssRenderer = new PrettyCssRenderer();

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

	// Probably not worth making a dependency
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
		const fallbackFontData: { value: GetMetricsForFamilyFont | null } = { value: null };
		const fallbacks = family.fallbacks ?? DEFAULTS.fallbacks;

		const dataCollector = new RealDataCollector(
			hashToUrlMap,
			preloadData,
			fallbackFontData,
			fallbacks,
		);
		const contentResolver =
			family.provider === LOCAL_PROVIDER_NAME
				? new LocalUrlProxyContentResolver(errorHandler)
				: new RemoteUrlProxyContentResolver();
		const urlProxy = new RealUrlProxy(base, contentResolver, hasher, dataCollector);

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

		// TODO: generate fallback css
		// TODO: generate CSS variables
		// TODO: add data to internal data structures
	}
	// TODO: return data
}
