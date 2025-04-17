import { LOCAL_PROVIDER_NAME } from './constants.js';
import type {
	RemoteFontProviderResolver,
	Hasher,
	LocalProviderUrlResolver,
	RemoteFontProviderModResolver,
} from './definitions.js';
import type {
	FontFamily,
	LocalFontFamily,
	ResolvedFontFamily,
	ResolvedLocalFontFamily,
} from './types.js';
import { withoutQuotes } from './utils.js';
import type * as unifont from 'unifont';

function dedupe<const T extends Array<any>>(arr: T): T {
	return [...new Set(arr)] as T;
}

function resolveVariants({
	variants,
	localProviderUrlResolver,
}: {
	variants: LocalFontFamily['variants'];
	localProviderUrlResolver: LocalProviderUrlResolver;
}): ResolvedLocalFontFamily['variants'] {
	return variants.map((variant) => ({
		...variant,
		weight: variant.weight.toString(),
		src: variant.src.map((value) => {
			const isValue = typeof value === 'string' || value instanceof URL;
			const url = (isValue ? value : value.url).toString();
			const tech = isValue ? undefined : value.tech;
			return {
				url: localProviderUrlResolver.resolve(url),
				tech,
			};
		}),
	}));
}

export async function resolveFamily({
	family,
	hasher,
	remoteFontProviderResolver,
	modResolver,
	localProviderUrlResolver,
}: {
	family: FontFamily;
	hasher: Hasher;
	remoteFontProviderResolver: RemoteFontProviderResolver;
	modResolver: RemoteFontProviderModResolver;
	localProviderUrlResolver: LocalProviderUrlResolver;
}): Promise<ResolvedFontFamily> {
	// TODO: handle spaces
	const nameWithHash = `${withoutQuotes(family.name)}-${hasher.hashObject(family)}`;

	if (family.provider === LOCAL_PROVIDER_NAME) {
		return {
			...family,
			nameWithHash,
			variants: resolveVariants({ variants: family.variants, localProviderUrlResolver }),
			fallbacks: family.fallbacks ? dedupe(family.fallbacks) : undefined,
		};
	}

	return {
		...family,
		nameWithHash,
		provider: await remoteFontProviderResolver.resolve({
			provider: family.provider,
			modResolver,
		}),
		weights: family.weights ? dedupe(family.weights.map((weight) => weight.toString())) : undefined,
		styles: family.styles ? dedupe(family.styles) : undefined,
		subsets: family.subsets ? dedupe(family.subsets) : undefined,
		fallbacks: family.fallbacks ? dedupe(family.fallbacks) : undefined,
		unicodeRange: family.unicodeRange ? dedupe(family.unicodeRange) : undefined,
	};
}

export async function resolveFamilies({
	families,
	...dependencies
}: { families: Array<FontFamily> } & Omit<Parameters<typeof resolveFamily>[0], 'family'>): Promise<
	Array<ResolvedFontFamily>
> {
	const resolvedFamilies: Array<ResolvedFontFamily> = [];

	for (const family of families) {
		resolvedFamilies.push(
			await resolveFamily({
				family,
				...dependencies,
			}),
		);
	}

	return resolvedFamilies;
}

export function extractUnifontProviders({
	families,
	hasher,
}: {
	families: Array<ResolvedFontFamily>;
	hasher: Hasher;
}): {
	families: Array<ResolvedFontFamily>;
	providers: Array<unifont.Provider>;
} {
	const hashes = new Set<string>();
	const providers: Array<unifont.Provider> = [];

	for (const { provider } of families) {
		if (provider === LOCAL_PROVIDER_NAME) {
			continue;
		}

		const unifontProvider = provider.provider(provider.config);
		const hash = hasher.hashObject({
			name: unifontProvider._name,
			...provider.config,
		});
		// Makes sure every font uses the right instance of a given provider
		// if this provider is provided several times with different options
		// We have to mutate the unifont provider name because unifont deduplicates
		// based on the name.
		unifontProvider._name += `-${hash}`;
		// We set the provider name so we can tell unifont what provider to use when
		// resolving font faces
		provider.name = unifontProvider._name;

		if (!hashes.has(hash)) {
			hashes.add(hash);
			providers.push(unifontProvider);
		}
	}

	return { families, providers };
}

export function normalizeRemoteFontFaces(
	fonts: Array<unifont.FontFaceData>,
): Array<unifont.FontFaceData> {
	return (
		fonts
			// Avoid getting too much font files
			.filter((font) => (typeof font.meta?.priority === 'number' ? font.meta.priority === 0 : true))
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
								collect: (data) => collect(data, index === 0),
							}),
						};
						index++;
						return proxied;
					}),
				};
			})
	);
}
