import { LOCAL_PROVIDER_NAME } from '../constants.js';
import type {
	Hasher,
	LocalProviderUrlResolver,
	RemoteFontProviderResolver,
} from '../definitions.js';
import type {
	FontFamily,
	LocalFontFamily,
	ResolvedFontFamily,
	ResolvedLocalFontFamily,
} from '../types.js';
import { dedupe, withoutQuotes } from '../utils.js';

function resolveVariants({
	variants,
	localProviderUrlResolver,
}: {
	variants: LocalFontFamily['variants'];
	localProviderUrlResolver: LocalProviderUrlResolver;
}): ResolvedLocalFontFamily['variants'] {
	return variants.map((variant) => ({
		...variant,
		weight: variant.weight?.toString(),
		src: variant.src.map((value) => {
			// A src can be a string or an object, we extract the value accordingly.
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

/**
 * Dedupes properties if applicable and resolves entrypoints.
 */
export async function resolveFamily({
	family,
	hasher,
	remoteFontProviderResolver,
	localProviderUrlResolver,
}: {
	family: FontFamily;
	hasher: Hasher;
	remoteFontProviderResolver: RemoteFontProviderResolver;
	localProviderUrlResolver: LocalProviderUrlResolver;
}): Promise<ResolvedFontFamily> {
	// We remove quotes from the name so they can be properly resolved by providers.
	const name = withoutQuotes(family.name);
	// This will be used in CSS font faces. Quotes are added by the CSS renderer if
	// this value contains a space.
	const nameWithHash = `${name}-${hasher.hashObject(family)}`;

	if (family.provider === LOCAL_PROVIDER_NAME) {
		return {
			...family,
			name,
			nameWithHash,
			variants: resolveVariants({ variants: family.variants, localProviderUrlResolver }),
			fallbacks: family.fallbacks ? dedupe(family.fallbacks) : undefined,
		};
	}

	return {
		...family,
		name,
		nameWithHash,
		weights: family.weights ? dedupe(family.weights.map((weight) => weight.toString())) : undefined,
		styles: family.styles ? dedupe(family.styles) : undefined,
		subsets: family.subsets ? dedupe(family.subsets) : undefined,
		fallbacks: family.fallbacks ? dedupe(family.fallbacks) : undefined,
		unicodeRange: family.unicodeRange ? dedupe(family.unicodeRange) : undefined,
		// This will be Astro specific eventually
		provider: await remoteFontProviderResolver.resolve(family.provider),
	};
}

/**
 * A function for convenience. The actual logic lives in resolveFamily
 */
export async function resolveFamilies({
	families,
	...dependencies
}: { families: Array<FontFamily> } & Omit<Parameters<typeof resolveFamily>[0], 'family'>): Promise<
	Array<ResolvedFontFamily>
> {
	return await Promise.all(
		families.map((family) =>
			resolveFamily({
				family,
				...dependencies,
			}),
		),
	);
}
