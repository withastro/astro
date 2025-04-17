import { DEFAULTS, LOCAL_PROVIDER_NAME } from './constants.js';
import { AstroErrorHandler } from './implementations/error-handler.js';
import { XxHasher } from './implementations/hasher.js';
import { RequireLocalProviderUrlResolver } from './implementations/local-provider-url-resolver.js';
import { BuildRemoteFontProviderResolver } from './implementations/remote-font-provider-resolver.js';
import { FsStorage } from './implementations/storage.js';
import { extractUnifontProviders, resolveFamilies } from './logic.js';
import { resolveLocalFont } from './providers/local.js';
import type { FontFamily, PreloadData } from './types.js';
import * as unifont from 'unifont';
import { extractFontType, hashWithExtension, type GetMetricsForFamilyFont } from './utils.js';

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
	// Dependencies
	const hasher = await XxHasher.create();
	const errorHandler = new AstroErrorHandler();
	const remoteFontProviderResolver = new BuildRemoteFontProviderResolver(root, errorHandler);
	const localProviderUrlResolver = new RequireLocalProviderUrlResolver(root);
	const storage = FsStorage.create(cacheDir);

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
		let fallbackFontData: GetMetricsForFamilyFont | null = null;

		let fonts: Array<unifont.FontFaceData>;

		if (family.provider === LOCAL_PROVIDER_NAME) {
			const result = resolveLocalFont({
				family,
				proxyURL: ({ originalUrl, collectPreload }) => {
					const type = extractFontType(originalUrl);
					const hash = hashWithExtension({ hash: hasher.hashString(originalUrl), type });
					const url = base + hash;

					if (!hashToUrlMap.has(hash)) {
						hashToUrlMap.set(hash, originalUrl);
						if (collectPreload) {
							preloadData.push({ url, type });
						}
					}

					// If a family has fallbacks, we store the first url we get that may
					// be used for the fallback generation, if capsize doesn't have this
					// family in its built-in collection
					if (family.fallbacks && family.fallbacks.length > 0) {
						fallbackFontData ??= {
							hash,
							url: originalUrl,
						};
					}

					return url;
				},
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
			fonts = normalizeRemoteFontFaces(result.fonts);
		}

		// TODO: generate CSS font faces
		// TODO: generate fallback css
		// TODO: generate CSS variables
		// TODO: add data to internal data structures
	}
	// TODO: return data
}
