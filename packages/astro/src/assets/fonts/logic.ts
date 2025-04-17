import { LOCAL_PROVIDER_NAME } from './constants.js';
import type {
	RemoteFontProviderResolver,
	Hasher,
	LocalProviderUrlResolver,
} from './definitions.js';
import type {
	FontFamily,
	LocalFontFamily,
	ResolvedFontFamily,
	ResolvedLocalFontFamily,
} from './types.js';
import { sortObjectByKey, withoutQuotes } from './utils.js';

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
	localProviderUrlResolver,
}: {
	family: FontFamily;
	hasher: Hasher;
	remoteFontProviderResolver: RemoteFontProviderResolver;
	localProviderUrlResolver: LocalProviderUrlResolver;
}): Promise<ResolvedFontFamily> {
	// TODO: handle spaces
	// TODO: recursive sort, may need to be a dependency
	const nameWithHash = `${withoutQuotes(family.name)}-${hasher.hash(JSON.stringify(sortObjectByKey(family)))}`;

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
		provider: await remoteFontProviderResolver.resolve(family.provider),
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
